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
  printf '[community-quote-e2e] %s\n' "$*"
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

load_original_member_data() {
  local response
  response=$(curl -sS -m 10 "${API_BASE_URL}/api/members/me" \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}")

  ORIGINAL_MEMBER_DATA=$(printf '%s' "$response" | node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success' || !body.data) {
  console.error(raw);
  process.exit(1);
}
process.stdout.write(JSON.stringify(body.data));
")
}

update_member_location() {
  local region_name="$1"
  local region_code="$2"
  local postcode="$3"
  local payload
  payload=$(node -e "
const regionName = process.argv[1] ?? '';
const regionCode = process.argv[2] ?? '';
const postcode = process.argv[3] ?? '';
process.stdout.write(JSON.stringify({ regionName, regionCode, postcode }));
" "$region_name" "$region_code" "$postcode")

  local response
  response=$(curl -sS -m 10 -X PUT "${API_BASE_URL}/api/members/me" \
    -H "Authorization: Bearer ${DEV_BYPASS_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$payload")

  printf '%s' "$response" | node -e "
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf8');
const body = JSON.parse(raw);
if (body.status !== 'success' || !body.data) {
  console.error(raw);
  process.exit(1);
}
"
}

restore_member_location_if_needed() {
  if [[ "$MEMBER_RESTORE_REQUIRED" -ne 1 || -z "$ORIGINAL_MEMBER_DATA" ]]; then
    return 0
  fi

  local original_region_name
  local original_region_code
  local original_postcode
  original_region_name=$(printf '%s' "$ORIGINAL_MEMBER_DATA" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(String(d.regionName ?? ''));")
  original_region_code=$(printf '%s' "$ORIGINAL_MEMBER_DATA" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(String(d.regionCode ?? ''));")
  original_postcode=$(printf '%s' "$ORIGINAL_MEMBER_DATA" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(String(d.postcode ?? ''));")

  log "restore member location to original profile"
  update_member_location "$original_region_name" "$original_region_code" "$original_postcode"
  MEMBER_RESTORE_REQUIRED=0
}

SEED_POST_IDS=()
ORIGINAL_MEMBER_DATA=""
MEMBER_RESTORE_REQUIRED=0

register_seed_post() {
  local post_id="$1"
  if [[ -n "$post_id" ]]; then
    SEED_POST_IDS+=("$post_id")
  fi
}

unregister_seed_post() {
  local post_id="$1"
  if [[ -z "$post_id" || "${#SEED_POST_IDS[@]}" -eq 0 ]]; then
    return 0
  fi

  local next=()
  for id in "${SEED_POST_IDS[@]}"; do
    if [[ "$id" != "$post_id" ]]; then
      next+=("$id")
    fi
  done
  SEED_POST_IDS=("${next[@]}")
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
  restore_member_location_if_needed || status=1
  cleanup_seed_posts "$status"
  exit $?
}

trap on_exit EXIT

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

WITH_LOCATION='{"state":{"isLoggedIn":true,"user":{"id":"00000000-0000-0000-0000-000000000001","name":"개발 테스트 사용자","regionName":"서울시 강남구 역삼동","regionCode":"1168010100","postcode":"06236"},"token":"__TOKEN__","isDarkMode":false,"children":[],"activeChildId":null,"events":[]},"version":0}'
WITH_LOCATION="${WITH_LOCATION/__TOKEN__/$DEV_BYPASS_TOKEN}"

RUN_TAG="${RUN_TAG:-$(date +%s)}"
SOURCE_TITLE="[E2E] quote source ${RUN_TAG}"
QUOTE_TITLE="[E2E] quote child ${RUN_TAG}"

log "wait for frontend/api readiness"
wait_for_front_ready
wait_for_api_ready
load_original_member_data

log "seed source post"
SOURCE_POST_ID=$(create_post "{\"title\":\"${SOURCE_TITLE}\",\"content\":\"quote source content\",\"category\":\"daily\",\"postScope\":\"all\"}")
register_seed_post "$SOURCE_POST_ID"
log "seed quote post (source=${SOURCE_POST_ID})"
QUOTE_POST_ID=$(create_post "{\"title\":\"${QUOTE_TITLE}\",\"content\":\"quote child content\",\"category\":\"daily\",\"postScope\":\"all\",\"quoteOfItemId\":${SOURCE_POST_ID}}")
register_seed_post "$QUOTE_POST_ID"

log "open browser"
pw close-all || true
pw open "${FRONT_URL}/community?locationScope=all&sort=latest" --headed
pw localstorage-set bebehelper-storage "${WITH_LOCATION}"
pw reload

log "scenario 1: feed card click keeps quote detail, preview click opens source detail"
run_js "async (page) => {
  const quoteTitle = '${QUOTE_TITLE}';
  const quotePostId = '${QUOTE_POST_ID}';
  const sourcePostId = '${SOURCE_POST_ID}';
  await page.waitForFunction((title) => document.body.innerText.includes(title), quoteTitle);

  const card = page.locator('article').filter({ has: page.getByRole('heading', { name: quoteTitle }) }).first();
  if (await card.count() === 0) throw new Error('quote card not found in feed');
  await card.scrollIntoViewIfNeeded();

  const cardHeading = card.getByRole('heading', { name: quoteTitle });
  await cardHeading.click();
  await page.waitForURL((url) => url.pathname === '/community/' + quotePostId, { timeout: 10000 });
  await page.goto('${FRONT_URL}/community?locationScope=all&sort=latest');
  await page.waitForFunction((title) => document.body.innerText.includes(title), quoteTitle);

  const refreshedCard = page.locator('article').filter({ has: page.getByRole('heading', { name: quoteTitle }) }).first();
  if (await refreshedCard.count() === 0) throw new Error('quote card not found after reload');
  await refreshedCard.scrollIntoViewIfNeeded();

  const previewButton = refreshedCard.getByRole('button', { name: '인용 원문 상세 보기' });
  if (await previewButton.count() === 0) throw new Error('quote preview button not found in feed card');

  await previewButton.click();
  await page.waitForURL((url) => url.pathname === '/community/' + sourcePostId, { timeout: 10000 });
}"

log "scenario 2: detail quote preview keyboard opens source detail"
pw goto "${FRONT_URL}/community/${QUOTE_POST_ID}"
run_js "async (page) => {
  const sourcePostId = '${SOURCE_POST_ID}';
  const previewButton = page.getByRole('button', { name: '인용 원문 상세 보기' });
  if (await previewButton.count() === 0) throw new Error('quote preview button not found in detail page');

  await previewButton.focus();
  await previewButton.press('Enter');
  await page.waitForURL((url) => url.pathname === '/community/' + sourcePostId, { timeout: 10000 });
}"

log "scenario 3: write quote source preview opens source detail"
pw goto "${FRONT_URL}/community/write?quoteOf=${SOURCE_POST_ID}&locationScope=all"
run_js "async (page) => {
  const sourcePostId = '${SOURCE_POST_ID}';
  const previewButton = page.getByRole('button', { name: '인용 원문 상세 보기' });
  if (await previewButton.count() === 0) throw new Error('quote source preview button not found in write page');

  await previewButton.click();
  await page.waitForURL((url) => url.pathname === '/community/' + sourcePostId, { timeout: 10000 });
}"

log "scenario 4: source deleted -> quote preview unavailable and non-clickable"
delete_post "${SOURCE_POST_ID}"
unregister_seed_post "${SOURCE_POST_ID}"
pw goto "${FRONT_URL}/community/${QUOTE_POST_ID}"
run_js "async (page) => {
  await page.waitForFunction(() => document.body.innerText.includes('원문을 볼 수 없어요.'));
  const previewButton = page.getByRole('button', { name: '인용 원문 상세 보기' });
  if (await previewButton.count() !== 0) {
    throw new Error('unavailable quote preview should not expose clickable button');
  }
}"

log "scenario 5: neighbor source unavailable when viewer location mismatches"
NEIGHBOR_SOURCE_ID=$(create_post "{\"title\":\"[E2E] quote neighbor source ${RUN_TAG}\",\"content\":\"neighbor source content\",\"category\":\"local_info\",\"postScope\":\"neighbor\"}")
register_seed_post "$NEIGHBOR_SOURCE_ID"
NEIGHBOR_QUOTE_ID=$(create_post "{\"title\":\"[E2E] quote neighbor child ${RUN_TAG}\",\"content\":\"neighbor quote content\",\"category\":\"daily\",\"postScope\":\"all\",\"quoteOfItemId\":${NEIGHBOR_SOURCE_ID}}")
register_seed_post "$NEIGHBOR_QUOTE_ID"

ORIGINAL_REGION_CODE=$(printf '%s' "$ORIGINAL_MEMBER_DATA" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(String(d.regionCode ?? ''));")
if [[ "$ORIGINAL_REGION_CODE" == "2635011100" ]]; then
  update_member_location "서울시 강남구 역삼동" "1168010100" "06236"
else
  update_member_location "부산시 해운대구 우동" "2635011100" "48095"
fi
MEMBER_RESTORE_REQUIRED=1

pw goto "${FRONT_URL}/community/${NEIGHBOR_QUOTE_ID}"
run_js "async (page) => {
  await page.waitForFunction(() =>
    document.body.innerText.includes('원문을 볼 수 없어요.')
    || document.body.innerText.includes('접근 권한이 없어 이 글을 볼 수 없어요.')
    || document.body.innerText.includes('삭제되었거나 존재하지 않는 글입니다.')
  );
  const previewButton = page.getByRole('button', { name: '인용 원문 상세 보기' });
  if (await previewButton.count() !== 0) {
    throw new Error('neighbor access denied quote preview should not expose clickable button');
  }
}"

restore_member_location_if_needed

log "all scenarios passed"
