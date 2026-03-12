import { chromium, devices } from 'playwright';
import {
  DEFAULT_POSTCODE,
  DEFAULT_REGION_CODE,
  DEFAULT_REGION_NAME,
  createCommunityQuoteContractState,
  createStoragePayload,
  installCommunityQuoteContractRoutes,
} from './contracts/communityQuoteContract.mjs';

const FRONT_URL = process.env.FRONT_URL || 'http://127.0.0.1:5174';
const DEV_BYPASS_TOKEN = process.env.DEV_BYPASS_TOKEN || 'dev-e2e-token';
const QUOTE_PREVIEW_SELECTOR = '[role="button"][tabindex="0"][aria-label]';
const DEFAULT_TIMEOUT = 30000;

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function summarizeForLog(value, maxLength = 500) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '(empty)';
  }
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
}

function createStorageFromMember(member) {
  return createStoragePayload({
    token: DEV_BYPASS_TOKEN,
    id: member.id,
    name: member.name,
    regionName: member.regionName || DEFAULT_REGION_NAME,
    regionCode: member.regionCode || DEFAULT_REGION_CODE,
    postcode: member.postcode || DEFAULT_POSTCODE,
  });
}

function createContextStorageState(storagePayload) {
  const origin = new URL(FRONT_URL).origin;
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: 'bebehelper-storage',
            value: JSON.stringify(storagePayload),
          },
        ],
      },
    ],
  };
}

async function createContractContext(browser, contractState, storagePayload, options = {}) {
  const context = await browser.newContext({
    storageState: createContextStorageState(storagePayload),
    ...options,
  });
  await installCommunityQuoteContractRoutes(context, contractState);
  return context;
}

function attachPageDiagnostics(page, label) {
  page.on('pageerror', (error) => {
    console.error(`[quote-contract] ${label} pageerror: ${error?.stack || error?.message || error}`);
  });

  page.on('requestfailed', (request) => {
    const failureText = request.failure()?.errorText || 'unknown';
    console.error(`[quote-contract] ${label} requestfailed: ${request.method()} ${request.url()} (${failureText})`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      console.error(`[quote-contract] ${label} console.${message.type()}: ${message.text()}`);
    }
  });
}

async function dumpPageDiagnostics(page, label) {
  const snapshot = await page.evaluate(() => ({
    href: window.location.href,
    title: document.title,
    readyState: document.readyState,
    bodyText: document.body?.innerText || '',
    bodyHtml: document.body?.innerHTML || '',
  }));

  console.error(`[quote-contract] ${label} url=${snapshot.href}`);
  console.error(`[quote-contract] ${label} title=${summarizeForLog(snapshot.title, 160)}`);
  console.error(`[quote-contract] ${label} readyState=${snapshot.readyState}`);
  console.error(`[quote-contract] ${label} bodyText=${summarizeForLog(snapshot.bodyText)}`);
  console.error(`[quote-contract] ${label} bodyHtml=${summarizeForLog(snapshot.bodyHtml)}`);
}

async function waitForPathname(page, expectedPathname, timeout = DEFAULT_TIMEOUT) {
  await page.waitForURL((url) => url.pathname === expectedPathname, { timeout });
}

async function waitForBodyText(page, expectedText, timeout = DEFAULT_TIMEOUT) {
  try {
    await page.waitForFunction((text) => document.body.innerText.includes(text), expectedText, { timeout });
  } catch (error) {
    await dumpPageDiagnostics(page, `waitForBodyText("${expectedText}")`);
    throw error;
  }
}

async function waitForQuotePreviewAction(page, timeout = DEFAULT_TIMEOUT) {
  const preview = page.locator(QUOTE_PREVIEW_SELECTOR).first();
  await preview.waitFor({ state: 'visible', timeout });
  return preview;
}

async function run() {
  const contractState = createCommunityQuoteContractState();
  const runTag = String(Date.now());
  const sourceTitle = `[contract] quote source ${runTag}`;
  const quoteTitle = `[contract] quote child ${runTag}`;
  const neighborSourceTitle = `[contract] quote neighbor source ${runTag}`;
  const neighborQuoteTitle = `[contract] quote neighbor child ${runTag}`;

  const sourcePostId = contractState.createPost({
    title: sourceTitle,
    content: 'quote source content',
    category: 'daily',
    postScope: 'all',
  });

  const quotePostId = contractState.createPost({
    title: quoteTitle,
    content: 'quote child content',
    category: 'daily',
    postScope: 'all',
    quoteOfItemId: sourcePostId,
  });

  const browser = await chromium.launch({ headless: true });
  let context;
  let mobileContext;
  let mismatchContext;

  try {
    const originalMember = contractState.getMember();
    const originalStoragePayload = createStorageFromMember(originalMember);
    context = await createContractContext(browser, contractState, originalStoragePayload);
    const page = await context.newPage();
    attachPageDiagnostics(page, 'desktop');

    console.log(`[quote-contract] seeded source=${sourcePostId}, quote=${quotePostId}`);

    await page.goto(`${FRONT_URL}/community?locationScope=all&sort=latest`, { waitUntil: 'domcontentloaded' });
    await waitForBodyText(page, quoteTitle);
    const quoteCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: quoteTitle }) })
      .first();
    assertCondition((await quoteCard.count()) > 0, 'quote card not found in feed');
    await quoteCard.scrollIntoViewIfNeeded();

    await quoteCard.getByRole('heading', { name: quoteTitle }).click();
    await waitForPathname(page, `/community/${quotePostId}`);

    await page.goto(`${FRONT_URL}/community?locationScope=all&sort=latest`, {
      waitUntil: 'domcontentloaded',
    });
    await waitForBodyText(page, quoteTitle);
    const refreshedCard = page
      .locator('article')
      .filter({ has: page.getByRole('heading', { name: quoteTitle }) })
      .first();
    assertCondition((await refreshedCard.count()) > 0, 'quote card not found after reload');
    await refreshedCard.scrollIntoViewIfNeeded();

    const feedPreviewButton = refreshedCard.locator(QUOTE_PREVIEW_SELECTOR).first();
    assertCondition((await feedPreviewButton.count()) > 0, 'feed quote preview button not found');
    await feedPreviewButton.click();
    await waitForPathname(page, `/community/${sourcePostId}`);
    console.log('[quote-contract] scenario 1 passed');

    await page.goto(`${FRONT_URL}/community/${quotePostId}`, { waitUntil: 'domcontentloaded' });
    await waitForPathname(page, `/community/${quotePostId}`);
    await waitForBodyText(page, quoteTitle);
    const detailPreviewButton = await waitForQuotePreviewAction(page);
    await detailPreviewButton.focus();
    await detailPreviewButton.press('Enter');
    await waitForPathname(page, `/community/${sourcePostId}`);
    console.log('[quote-contract] scenario 2 passed');

    await page.goto(`${FRONT_URL}/community/write?quoteOf=${sourcePostId}&locationScope=all`, { waitUntil: 'domcontentloaded' });
    const writePreviewButton = await waitForQuotePreviewAction(page);
    await writePreviewButton.click();
    await waitForPathname(page, `/community/${sourcePostId}`);
    console.log('[quote-contract] scenario 3 passed');

    mobileContext = await createContractContext(browser, contractState, originalStoragePayload, {
      ...devices['iPhone 13'],
      locale: 'ko-KR',
    });
    const mobilePage = await mobileContext.newPage();
    attachPageDiagnostics(mobilePage, 'mobile');
    await mobilePage.goto(`${FRONT_URL}/community/${quotePostId}`, { waitUntil: 'domcontentloaded' });
    await waitForBodyText(mobilePage, quoteTitle);
    const mobilePreviewButton = await waitForQuotePreviewAction(mobilePage);
    await mobilePreviewButton.tap();
    await waitForPathname(mobilePage, `/community/${sourcePostId}`);
    console.log('[quote-contract] scenario 4 passed');

    contractState.deletePost(sourcePostId);
    await page.goto(`${FRONT_URL}/community/${quotePostId}`, { waitUntil: 'domcontentloaded' });
    await waitForBodyText(page, quoteTitle);
    assertCondition(
      (await page.locator(QUOTE_PREVIEW_SELECTOR).count()) === 0,
      'deleted source should not expose a clickable quote preview',
    );
    console.log('[quote-contract] scenario 5 passed');

    const neighborSourcePostId = contractState.createPost({
      title: neighborSourceTitle,
      content: 'neighbor source content',
      category: 'local_info',
      postScope: 'neighbor',
    });
    const neighborQuotePostId = contractState.createPost({
      title: neighborQuoteTitle,
      content: 'neighbor quote content',
      category: 'daily',
      postScope: 'all',
      quoteOfItemId: neighborSourcePostId,
    });

    const mismatchLocation =
      originalMember.regionCode === '2635011100'
        ? { regionName: DEFAULT_REGION_NAME, regionCode: DEFAULT_REGION_CODE, postcode: DEFAULT_POSTCODE }
        : { regionName: 'Busan Haeundae U-dong', regionCode: '2635011100', postcode: '48095' };

    const mismatchMember = contractState.updateMember(mismatchLocation);
    const mismatchStoragePayload = createStorageFromMember(mismatchMember);
    mismatchContext = await createContractContext(browser, contractState, mismatchStoragePayload);
    const mismatchPage = await mismatchContext.newPage();
    attachPageDiagnostics(mismatchPage, 'region-mismatch');
    await mismatchPage.goto(`${FRONT_URL}/community/${neighborQuotePostId}`, { waitUntil: 'domcontentloaded' });
    await waitForBodyText(mismatchPage, neighborQuoteTitle);
    assertCondition(
      (await mismatchPage.locator(QUOTE_PREVIEW_SELECTOR).count()) === 0,
      'location mismatch should not expose a clickable quote preview',
    );
    console.log('[quote-contract] scenario 6 passed (source-unavailable)');
  } finally {
    await Promise.all([
      mismatchContext?.close().catch(() => {}),
      mobileContext?.close().catch(() => {}),
      context?.close().catch(() => {}),
    ]);
    await browser.close();
  }
}

await run();
console.log('[quote-contract] all scenarios passed');
