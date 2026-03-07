#!/usr/bin/env bash
set -euo pipefail

FRONT_URL="${FRONT_URL:-http://127.0.0.1:5173}"
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
  printf '[location-auth-e2e] %s\n' "$*"
}

pw() {
  "$PWCLI" "$@"
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

WITHOUT_LOCATION='{"state":{"isLoggedIn":true,"user":{"id":"00000000-0000-0000-0000-000000000001","name":"개발 테스트 사용자","regionName":"","regionCode":"","postcode":""},"token":"__TOKEN__","isDarkMode":false,"children":[],"activeChildId":null,"events":[]},"version":0}'
WITHOUT_LOCATION="${WITHOUT_LOCATION/__TOKEN__/$DEV_BYPASS_TOKEN}"

log "wait for frontend readiness"
wait_for_front_ready

log "open write page"
pw close-all || true
pw open "${FRONT_URL}/community/write?locationScope=all" --headed
pw localstorage-set bebehelper-storage "${WITHOUT_LOCATION}"
pw reload

log "run location auth no-refresh scenario"
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
  await page.route('**/api/boards/community/items*', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      createPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', data: { id: 999001, boardId: 1 } })
      });
      return;
    }
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { items: [], totalPages: 0, currentPage: 0, size: 20, totalElements: 0 }
        })
      });
      return;
    }
    await route.continue();
  });

  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 37.501, longitude: 127.031, accuracy: 25 });

  await page.getByRole('button', { name: '동네생활' }).click();
  await page.waitForFunction(() => document.body.innerText.includes('우리 동네 커뮤니티에 글을 올리려면 동네 설정이 필요해요.'));

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

log "scenario passed"
