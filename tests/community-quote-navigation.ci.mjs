import { chromium, devices } from 'playwright';

const FRONT_URL = process.env.FRONT_URL || 'http://127.0.0.1:5174';
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8082';
const DEV_BYPASS_TOKEN = process.env.DEV_BYPASS_TOKEN || 'dev-e2e-token';

const DEFAULT_REGION_NAME = '서울시 강남구 역삼동';
const DEFAULT_REGION_CODE = '1168010100';
const DEFAULT_POSTCODE = '06236';

function createStoragePayload({
  regionName = DEFAULT_REGION_NAME,
  regionCode = DEFAULT_REGION_CODE,
  postcode = DEFAULT_POSTCODE,
} = {}) {
  return {
    state: {
      isLoggedIn: true,
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        name: '개발 테스트 사용자',
        regionName,
        regionCode,
        postcode,
      },
      token: DEV_BYPASS_TOKEN,
      isDarkMode: false,
      children: [],
      activeChildId: null,
      events: [],
    },
    version: 0,
  };
}

const seededPostIds = [];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function apiCall(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${DEV_BYPASS_TOKEN}`,
      ...(options.headers || {}),
    },
  });

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`Invalid JSON response (${path}): ${bodyText}`);
  }

  if (!response.ok || body?.status !== 'success') {
    throw new Error(`API failed (${path}): ${bodyText}`);
  }

  return body;
}

async function createPost(payload) {
  const body = await apiCall('/api/boards/community/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const id = body?.data?.id;
  assertCondition(Number.isInteger(id), `createPost returned invalid id: ${JSON.stringify(body)}`);
  seededPostIds.push(id);
  return id;
}

async function deletePost(postId) {
  await apiCall(`/api/boards/community/items/${postId}`, { method: 'DELETE' });
}

async function getMyInfo() {
  const body = await apiCall('/api/members/me');
  return body?.data || {};
}

async function updateMyInfo(payload) {
  await apiCall('/api/members/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function cleanupSeededPosts() {
  const ids = [...seededPostIds].reverse();
  for (const postId of ids) {
    try {
      await deletePost(postId);
    } catch (error) {
      // Keep cleanup best-effort; surface summary at the end if needed.
      console.error(`[quote-ci] cleanup failed for postId=${postId}: ${error.message}`);
    }
  }
}

function unregisterSeededPost(postId) {
  const index = seededPostIds.indexOf(postId);
  if (index >= 0) {
    seededPostIds.splice(index, 1);
  }
}

async function waitForPathname(page, expectedPathname, timeout = 10000) {
  await page.waitForURL((url) => url.pathname === expectedPathname, { timeout });
}

async function applyStorageState(page, storagePayload) {
  await page.evaluate((payload) => {
    localStorage.setItem('bebehelper-storage', JSON.stringify(payload));
  }, storagePayload);
}

async function gotoWithStorage(page, url, storagePayload) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await applyStorageState(page, storagePayload);
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function waitForQuotePreviewAction(page, timeout = 10000) {
  await page.waitForSelector('[aria-label="인용 원문 상세 보기"]', { timeout });
  return page.locator('[aria-label="인용 원문 상세 보기"]').first();
}

async function run() {
  const runTag = String(Date.now());
  const sourceTitle = `[CI-E2E] quote source ${runTag}`;
  const quoteTitle = `[CI-E2E] quote child ${runTag}`;
  const neighborSourceTitle = `[CI-E2E] quote neighbor source ${runTag}`;
  const neighborQuoteTitle = `[CI-E2E] quote neighbor child ${runTag}`;
  const myInfo = await getMyInfo();
  const originalRegionName = myInfo.regionName || DEFAULT_REGION_NAME;
  const originalRegionCode = myInfo.regionCode || DEFAULT_REGION_CODE;
  const originalPostcode = myInfo.postcode || DEFAULT_POSTCODE;
  const originalStoragePayload = createStoragePayload({
    regionName: originalRegionName,
    regionCode: originalRegionCode,
    postcode: originalPostcode,
  });

  const sourcePostId = await createPost({
    title: sourceTitle,
    content: 'quote source content',
    category: 'daily',
    postScope: 'all',
  });

  const quotePostId = await createPost({
    title: quoteTitle,
    content: 'quote child content',
    category: 'daily',
    postScope: 'all',
    quoteOfItemId: sourcePostId,
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let memberLocationChanged = false;

  try {
    console.log(`[quote-ci] seeded source=${sourcePostId}, quote=${quotePostId}`);

    await gotoWithStorage(page, `${FRONT_URL}/community?locationScope=all&sort=latest`, originalStoragePayload);

    // Scenario 1: feed card click -> quote detail, preview click -> source detail
    await page.waitForFunction((title) => document.body.innerText.includes(title), quoteTitle);
    const quoteCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: quoteTitle }) })
      .first();
    assertCondition((await quoteCard.count()) > 0, 'quote card not found in feed');
    await quoteCard.scrollIntoViewIfNeeded();

    const cardHeading = quoteCard.getByRole('heading', { name: quoteTitle });
    await cardHeading.click();
    await waitForPathname(page, `/community/${quotePostId}`);

    await page.goto(`${FRONT_URL}/community?locationScope=all&sort=latest`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForFunction((title) => document.body.innerText.includes(title), quoteTitle);
    const refreshedCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: quoteTitle }) })
      .first();
    assertCondition((await refreshedCard.count()) > 0, 'quote card not found in feed after reload');
    await refreshedCard.scrollIntoViewIfNeeded();

    const feedPreviewButton = refreshedCard.locator('[aria-label="인용 원문 상세 보기"]').first();
    assertCondition((await feedPreviewButton.count()) > 0, 'feed quote preview button not found');
    await feedPreviewButton.click();
    await waitForPathname(page, `/community/${sourcePostId}`);
    console.log('[quote-ci] scenario 1 passed');

    // Scenario 2: detail quote preview Enter -> source detail
    await page.goto(`${FRONT_URL}/community/${quotePostId}`, { waitUntil: 'domcontentloaded' });
    await waitForPathname(page, `/community/${quotePostId}`);
    await page.waitForFunction((title) => document.body.innerText.includes(title), quoteTitle);
    const detailPreviewButton = await waitForQuotePreviewAction(page);
    await detailPreviewButton.focus();
    await detailPreviewButton.press('Enter');
    await waitForPathname(page, `/community/${sourcePostId}`);
    console.log('[quote-ci] scenario 2 passed');

    // Scenario 3: write quote source preview click -> source detail
    await gotoWithStorage(page, `${FRONT_URL}/community/write?quoteOf=${sourcePostId}&locationScope=all`, originalStoragePayload);
    const writePreviewButton = await waitForQuotePreviewAction(page);
    await writePreviewButton.click();
    await waitForPathname(page, `/community/${sourcePostId}`);
    console.log('[quote-ci] scenario 3 passed');

    // Scenario 4: mobile touch on quote preview -> source detail
    const mobileContext = await browser.newContext({
      ...devices['iPhone 13'],
      locale: 'ko-KR',
    });
    const mobilePage = await mobileContext.newPage();
    try {
      await gotoWithStorage(mobilePage, `${FRONT_URL}/community/${quotePostId}`, originalStoragePayload);
      await mobilePage.waitForFunction((title) => document.body.innerText.includes(title), quoteTitle);
      const mobilePreviewButton = await waitForQuotePreviewAction(mobilePage);
      await mobilePreviewButton.tap();
      await waitForPathname(mobilePage, `/community/${sourcePostId}`);
      console.log('[quote-ci] scenario 4 passed');
    } finally {
      await mobileContext.close();
    }

    // Scenario 5: source deleted -> quote preview unavailable and non-clickable
    await deletePost(sourcePostId);
    unregisterSeededPost(sourcePostId);

    await page.goto(`${FRONT_URL}/community/${quotePostId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('원문을 볼 수 없어요.'));
    assertCondition(
      (await page.locator('[aria-label="인용 원문 상세 보기"]').count()) === 0,
      'unavailable quote preview should not expose clickable button',
    );
    console.log('[quote-ci] scenario 5 passed');

    // Scenario 6: neighbor source unavailable when viewer location mismatches
    const neighborSourcePostId = await createPost({
      title: neighborSourceTitle,
      content: 'neighbor source content',
      category: 'local_info',
      postScope: 'neighbor',
    });
    const neighborQuotePostId = await createPost({
      title: neighborQuoteTitle,
      content: 'neighbor quote content',
      category: 'daily',
      postScope: 'all',
      quoteOfItemId: neighborSourcePostId,
    });

    const mismatchLocation =
      originalRegionCode === '2635011100'
        ? { regionName: DEFAULT_REGION_NAME, regionCode: DEFAULT_REGION_CODE, postcode: DEFAULT_POSTCODE }
        : { regionName: '부산시 해운대구 우동', regionCode: '2635011100', postcode: '48095' };

    await updateMyInfo(mismatchLocation);
    memberLocationChanged = true;
    const mismatchStoragePayload = createStoragePayload(mismatchLocation);
    await gotoWithStorage(page, `${FRONT_URL}/community/${neighborQuotePostId}`, mismatchStoragePayload);
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('원문을 볼 수 없어요.')
        || document.body.innerText.includes('접근 권한이 없어 이 글을 볼 수 없어요.')
        || document.body.innerText.includes('삭제되었거나 존재하지 않는 글입니다.'),
    );
    const hasUnavailableSource = (await page.getByText('원문을 볼 수 없어요.').count()) > 0;
    const hasLocationDeniedMessage = (await page.getByText('접근 권한이 없어 이 글을 볼 수 없어요.').count()) > 0;
    const hasQuoteAccessDenied = (await page.getByText('삭제되었거나 존재하지 않는 글입니다.').count()) > 0;
    assertCondition(
      hasUnavailableSource || hasLocationDeniedMessage || hasQuoteAccessDenied,
      'neighbor mismatch should render unavailable source or deny quote access',
    );
    assertCondition(
      (await page.locator('[aria-label="인용 원문 상세 보기"]').count()) === 0,
      'neighbor access denied quote preview should not expose clickable button',
    );
    let scenario6Path = 'quote-access-denied';
    if (hasUnavailableSource) scenario6Path = 'source-unavailable';
    if (hasLocationDeniedMessage) scenario6Path = 'location-access-denied';
    console.log(`[quote-ci] scenario 6 passed (${scenario6Path})`);
  } finally {
    if (memberLocationChanged) {
      try {
        await updateMyInfo({
          regionName: originalRegionName,
          regionCode: originalRegionCode,
          postcode: originalPostcode,
        });
      } catch (error) {
        console.error(`[quote-ci] failed to restore member location: ${error.message}`);
      }
    }
    await context.close();
    await browser.close();
  }
}

try {
  await run();
  console.log('[quote-ci] all scenarios passed');
} finally {
  await cleanupSeededPosts();
}
