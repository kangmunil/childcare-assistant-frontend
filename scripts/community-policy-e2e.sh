#!/usr/bin/env bash
set -euo pipefail

FRONT_URL="${FRONT_URL:-http://127.0.0.1:5173}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8081}"
DEV_BYPASS_TOKEN="${DEV_BYPASS_TOKEN:-dev-e2e-token}"

CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${PWCLI:-$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required."
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "node is required."
  exit 1
fi
if [[ ! -x "$PWCLI" ]]; then
  echo "playwright wrapper not found: $PWCLI"
  exit 1
fi

log() {
  printf '[community-e2e] %s\n' "$*"
}

pw() {
  "$PWCLI" "$@"
}

wait_for_front_ready() {
  local retries="${FRONT_READY_RETRIES:-30}"
  local delay="${FRONT_READY_DELAY_SEC:-1}"

  for ((i=1; i<=retries; i++)); do
    if curl -sS -m 3 "${FRONT_URL}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay}"
  done

  echo "frontend is not reachable: ${FRONT_URL}"
  echo "start frontend first: npm run dev -- --host 127.0.0.1 --port 5173"
  return 1
}

wait_for_api_ready() {
  local retries="${API_READY_RETRIES:-30}"
  local delay="${API_READY_DELAY_SEC:-1}"

  for ((i=1; i<=retries; i++)); do
    local body=""
    body=$(curl -sS -m 3 -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}" \
      "${API_BASE_URL}/api/members/me" 2>/dev/null || true)

    if [[ "$body" == *"\"status\":\"success\""* ]]; then
      return 0
    fi

    if [[ "$body" == *"\"code\":\"AUTH_009\""* ]]; then
      echo "api is reachable but DEV_BYPASS_TOKEN is invalid for backend."
      echo "expected backend env: AUTH_DEV_BYPASS_TOKEN=${DEV_BYPASS_TOKEN}"
      return 1
    fi

    sleep "${delay}"
  done

  echo "backend api is not reachable: ${API_BASE_URL}"
  echo "start backend with dev bypass token, e.g."
  echo "AUTH_DEV_BYPASS_TOKEN=${DEV_BYPASS_TOKEN} ./gradlew bootRun"
  return 1
}

SEED_POST_IDS=()

register_seed_post() {
  local post_id="$1"
  if [[ -n "$post_id" ]]; then
    SEED_POST_IDS+=("$post_id")
  fi
}

run_js() {
  local output
  if ! output=$(pw run-code "$1" 2>&1); then
    printf '%s\n' "$output"
    return 1
  fi
  printf '%s\n' "$output"
  if printf '%s\n' "$output" | grep -q '^### Error'; then
    return 1
  fi
}

create_post() {
  local payload="$1"
  local response
  response=$(curl -sS -m 10 -X POST "${API_BASE_URL}/api/boards/community/items" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}" \
    --data "${payload}")

  printf '%s' "$response" | node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success' || !body.data || !body.data.id) {
  console.error(raw);
  process.exit(1);
}
process.stdout.write(String(body.data.id));
"
}

delete_post() {
  local post_id="$1"
  local response
  response=$(curl -sS -m 10 -X DELETE "${API_BASE_URL}/api/boards/community/items/${post_id}" \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}")

  printf '%s' "$response" | node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success') {
  console.error(raw);
  process.exit(1);
}
"
}

resolve_post() {
  local post_id="$1"
  local resolved="$2"
  local response
  response=$(curl -sS -m 10 -X PUT "${API_BASE_URL}/api/boards/community/items/${post_id}/urgent-resolve" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}" \
    --data "{\"resolved\": ${resolved}}")

  printf '%s' "$response" | node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success' || !body.data || !body.data.id) {
  console.error(raw);
  process.exit(1);
}
process.stdout.write(String(body.data.id));
"
}

assert_filtered_count() {
  local query="$1"
  local expected="$2"
  local mode="$3"
  local response
  response=$(curl -sS -m 10 -X GET "${API_BASE_URL}/api/boards/community/items?${query}" \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}")

  printf '%s' "$response" | EXPECTED="$expected" MODE="$mode" node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success' || !body.data || !Array.isArray(body.data.items)) {
  console.error(raw);
  process.exit(1);
}
const count = body.data.items.length;
const expected = Number(process.env.EXPECTED || 0);
const mode = process.env.MODE || 'eq';
if (mode === 'eq' && count !== expected) {
  console.error('unexpected count', { count, expected });
  process.exit(1);
}
if (mode === 'gte' && count < expected) {
  console.error('unexpected count', { count, expected, mode });
  process.exit(1);
}
"
}

assert_urgent_slot_first_id() {
  local query="$1"
  local expected_id="$2"
  local response
  response=$(curl -sS -m 10 -X GET "${API_BASE_URL}/api/boards/community/items?${query}" \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}")

  printf '%s' "$response" | EXPECTED_ID="$expected_id" node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success' || !body.data || !Array.isArray(body.data.items)) {
  console.error(raw);
  process.exit(1);
}
const expectedId = String(process.env.EXPECTED_ID || '');
if (!body.data.items.length) {
  console.error('urgent slot items empty');
  process.exit(1);
}
const firstId = String(body.data.items[0]?.id ?? '');
if (firstId !== expectedId) {
  console.error('unexpected urgent slot first id', { firstId, expectedId });
  process.exit(1);
}
"
}

cleanup_seed_posts() {
  local current_status="$1"
  local cleanup_failed=0

  if [[ "${#SEED_POST_IDS[@]}" -gt 0 ]]; then
    log "cleanup seeded posts (${#SEED_POST_IDS[@]})"
    for post_id in "${SEED_POST_IDS[@]}"; do
      if ! delete_post "$post_id"; then
        log "cleanup failed: post_id=${post_id}"
        cleanup_failed=1
      fi
    done
  fi

  if [[ "$cleanup_failed" -ne 0 && "$current_status" -eq 0 ]]; then
    current_status=1
  fi
  return "$current_status"
}

on_exit() {
  local status=$?
  trap - EXIT
  cleanup_seed_posts "$status"
  exit $?
}

trap on_exit EXIT

WITH_LOCATION='{"state":{"isLoggedIn":true,"user":{"id":"00000000-0000-0000-0000-000000000001","name":"개발 테스트 사용자","regionName":"서울시 강남구 역삼동","regionCode":"1168010100","postcode":"06236"},"token":"__TOKEN__","isDarkMode":false,"children":[],"activeChildId":null,"events":[]},"version":0}'
WITHOUT_LOCATION='{"state":{"isLoggedIn":true,"user":{"id":"00000000-0000-0000-0000-000000000001","name":"개발 테스트 사용자","regionName":"","regionCode":"","postcode":""},"token":"__TOKEN__","isDarkMode":false,"children":[],"activeChildId":null,"events":[]},"version":0}'
WITH_LOCATION="${WITH_LOCATION/__TOKEN__/$DEV_BYPASS_TOKEN}"
WITHOUT_LOCATION="${WITHOUT_LOCATION/__TOKEN__/$DEV_BYPASS_TOKEN}"

log "wait for frontend/api readiness"
wait_for_front_ready
wait_for_api_ready

log "seeding editable posts"
ALL_POST_ID=$(create_post '{"title":"[E2E] all edit","content":"all scope edit seed","category":"daily","postScope":"all"}')
register_seed_post "$ALL_POST_ID"
LOCAL_REVIEW_POST_ID=$(create_post '{"title":"[E2E] local_review edit","content":"neighbor local review seed","category":"local_review","postScope":"neighbor","placeName":"테스트 키즈카페","placeAddress":"서울 강남구 테스트길 2","placeLat":37.501,"placeLng":127.031}')
register_seed_post "$LOCAL_REVIEW_POST_ID"
URGENT_OLDER_ID=$(create_post '{"title":"[E2E] urgent slot older","content":"neighbor urgent seed older","category":"urgent","postScope":"neighbor"}')
register_seed_post "$URGENT_OLDER_ID"
sleep 1
URGENT_LATEST_ID=$(create_post '{"title":"[E2E] urgent slot latest","content":"neighbor urgent seed latest","category":"urgent","postScope":"neighbor"}')
register_seed_post "$URGENT_LATEST_ID"
log "seeded posts: all=${ALL_POST_ID}, local_review=${LOCAL_REVIEW_POST_ID}, urgent_old=${URGENT_OLDER_ID}, urgent_latest=${URGENT_LATEST_ID}"

log "open browser"
pw close-all || true
pw open "${FRONT_URL}/community?locationScope=all&sort=latest" --headed
pw localstorage-set bebehelper-storage "${WITH_LOCATION}"
pw reload

log "scenario 1: write page local_review requires place"
pw goto "${FRONT_URL}/community/write?locationScope=all"
run_js "async (page) => { await page.getByRole('button', { name: '동네생활' }).click(); }"
run_js "async (page) => { await page.getByRole('button', { name: '동네후기' }).click(); }"
run_js "async (page) => { await page.getByRole('button', { name: '완료' }).click(); }"
run_js "async (page) => { const text = await page.evaluate(() => document.body.innerText); if (!text.includes('동네후기 글에는 장소를 선택해주세요.')) throw new Error('missing local_review place validation message'); }"

log "scenario 2: write page blocks neighbor posting without location"
pw localstorage-set bebehelper-storage "${WITHOUT_LOCATION}"
pw reload
pw goto "${FRONT_URL}/community/write?locationScope=all"
run_js "async (page) => { await page.getByRole('button', { name: '동네생활' }).click(); }"
run_js "async (page) => { const text = await page.evaluate(() => document.body.innerText); if (!text.includes('우리 동네 커뮤니티에 글을 올리려면 동네 설정이 필요해요.')) throw new Error('missing neighbor location guard message'); }"

log "scenario 3: location auth completes and allows neighbor post without refresh"
run_js "async (page) => {
  await page.route('**/api/geo/reverse?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        documents: [{
          address: { region_3depth_name: '역삼동', address_name: '서울 강남구 역삼동' },
          road_address: { region_3depth_name: '역삼동', address_name: '서울 강남구 테헤란로 1', zone_no: '06236' }
        }],
        preferredRegionName: '역삼동',
        legalRegionName: '역삼동',
        adminRegionName: '역삼동',
        legalRegionCode: '1168010100',
        adminRegionCode: '1168010100',
        fullAddress: '서울 강남구 테헤란로 1'
      })
    });
  });

  await page.route('**/api/members/me', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue();
      return;
    }

    const payload = route.request().postDataJSON() || {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          name: '개발 테스트 사용자',
          regionName: payload.regionName || '역삼동',
          regionCode: payload.regionCode || '1168010100',
          postcode: payload.postcode || '06236'
        }
      })
    });
  });

  let createPayload = null;
  await page.route('**/api/boards/community/items', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    createPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: { id: 999001, boardId: 1 } })
    });
  });

  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 37.501, longitude: 127.031, accuracy: 25 });

  const authButton = page.getByRole('button', { name: '현재 위치로 인증하기' });
  const modalAlreadyOpen = await authButton.isVisible().catch(() => false);
  if (!modalAlreadyOpen) {
    await page.getByRole('button', { name: '동네 설정하기' }).first().click();
  }
  await authButton.click();
  await page.waitForFunction(() => document.body.innerText.includes('이 위치로 동네를 설정할까요?'));
  await page.getByRole('button', { name: '확인', exact: true }).click();

  await page.waitForFunction(() => !document.body.innerText.includes('동네 인증하기'));
  await page.waitForFunction(() => document.body.innerText.includes('문학동 이웃들에게만 보이는'));

  await page.getByRole('button', { name: '긴급/SOS' }).click();
  await page.getByPlaceholder('제목을 입력하세요').fill('[E2E] location auth no-refresh');
  await page.getByPlaceholder('내용을 편하게 작성해주세요. (육아 고민, 자랑, 꿀팁 등)').fill('위치 인증 직후 작성');
  await page.getByRole('button', { name: '완료' }).click();

  await page.waitForURL((url) => url.toString().includes('/community?locationScope=neighbor'));
  if (!createPayload || createPayload.postScope !== 'neighbor') {
    throw new Error('location auth did not keep neighbor postScope without refresh');
  }
}"

log "scenario 4: community sort and scope url sync"
pw localstorage-set bebehelper-storage "${WITH_LOCATION}"
pw reload
run_js "async (page) => {
  await page.goto('${FRONT_URL}/community?locationScope=all&sort=latest');
  await page.getByLabel('커뮤니티 정렬 선택').selectOption(['popular']);
  if (!page.url().includes('sort=popular')) {
    throw new Error('sort=popular not reflected in URL');
  }

  await page.getByLabel('커뮤니티 보기 범위 선택').selectOption(['neighbor']);
  await page.waitForFunction(() => window.location.search.includes('locationScope=neighbor'));

  const currentUrl = page.url();
  if (!currentUrl.includes('locationScope=neighbor')) {
    throw new Error('locationScope did not change to neighbor');
  }
  if (currentUrl.includes('sort=')) {
    throw new Error('sort should be removed in neighbor scope');
  }
}"

log "scenario 5: PostEdit all scope category set"
pw goto "${FRONT_URL}/community/${ALL_POST_ID}/edit?locationScope=all"
run_js "async (page) => { const deadline = Date.now() + 12000; while (Date.now() < deadline) { const text = await page.evaluate(() => document.body.innerText); if (text.includes('카테고리') && text.includes('육아광장')) return; await page.waitForTimeout(250); } throw new Error('all scope badge not shown in edit page'); }"
run_js "async (page) => { if (await page.getByRole('button', { name: '동네후기' }).count() !== 0) throw new Error('neighbor category should not be visible for all-scope edit'); }"

log "scenario 6: PostEdit local_review requires place"
pw goto "${FRONT_URL}/community/${LOCAL_REVIEW_POST_ID}/edit?locationScope=neighbor"
run_js "async (page) => { const deadline = Date.now() + 12000; while (Date.now() < deadline) { const text = await page.evaluate(() => document.body.innerText); if (text.includes('카테고리') && text.includes('동네생활')) return; await page.waitForTimeout(250); } throw new Error('neighbor scope badge not shown in edit page'); }"
run_js "async (page) => { await page.getByRole('button', { name: '동네정보' }).click(); }"
run_js "async (page) => { await page.getByRole('button', { name: '동네후기' }).click(); }"
run_js "async (page) => { await page.getByRole('button', { name: '완료' }).click(); }"
run_js "async (page) => { const text = await page.evaluate(() => document.body.innerText); if (!text.includes('동네후기 글에는 장소를 선택해주세요.')) throw new Error('edit local_review place validation missing'); }"

log "scenario 7: urgent slot uses urgentSlot filter and renders one item"
assert_filtered_count "locationScope=neighbor&category=urgent&searchType=titleContent&keyword=%5BE2E%5D%20urgent%20slot&page=0&size=10&includeHighlights=false" "2" "gte"
assert_filtered_count "locationScope=neighbor&category=urgent&page=0&size=10&includeHighlights=false&urgentSlot=true" "1" "eq"
assert_urgent_slot_first_id "locationScope=neighbor&category=urgent&page=0&size=10&includeHighlights=false&urgentSlot=true" "${URGENT_LATEST_ID}"
pw goto "${FRONT_URL}/community?locationScope=neighbor"
run_js "async (page) => { const text = await page.evaluate(() => document.body.innerText); if (!text.includes('긴급/SOS (최근 2시간)')) throw new Error('urgent slot header not shown'); }"
run_js "async (page) => { const slotCount = await page.evaluate(() => { const headings = Array.from(document.querySelectorAll('h3')); const heading = headings.find((el) => (el.textContent || '').includes('긴급/SOS (최근 2시간)')); if (!heading) return 0; const section = heading.closest('section'); if (!section) return 0; return section.querySelectorAll('button').length; }); if (slotCount !== 1) throw new Error('urgent slot should render exactly one card'); }"
run_js "async (page) => { const slotTitle = await page.evaluate(() => { const headings = Array.from(document.querySelectorAll('h3')); const heading = headings.find((el) => (el.textContent || '').includes('긴급/SOS (최근 2시간)')); if (!heading) return ''; const section = heading.closest('section'); if (!section) return ''; const first = section.querySelector('button p'); return first ? (first.textContent || '').trim() : ''; }); if (!slotTitle || !slotTitle.includes('[E2E] urgent slot latest')) throw new Error('urgent slot did not prioritize latest urgent post'); }"

log "scenario 8: urgent resolve toggles urgent slot candidate"
resolve_post "${URGENT_LATEST_ID}" "true" >/dev/null
assert_filtered_count "locationScope=neighbor&category=urgent&page=0&size=10&includeHighlights=false&urgentSlot=true" "1" "eq"
assert_urgent_slot_first_id "locationScope=neighbor&category=urgent&page=0&size=10&includeHighlights=false&urgentSlot=true" "${URGENT_OLDER_ID}"
resolve_post "${URGENT_LATEST_ID}" "false" >/dev/null
assert_filtered_count "locationScope=neighbor&category=urgent&page=0&size=10&includeHighlights=false&urgentSlot=true" "1" "eq"
assert_urgent_slot_first_id "locationScope=neighbor&category=urgent&page=0&size=10&includeHighlights=false&urgentSlot=true" "${URGENT_LATEST_ID}"

log "all scenarios passed"
