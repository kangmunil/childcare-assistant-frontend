export const DEFAULT_REGION_NAME = 'Seoul Gangnam Yeoksam';
export const DEFAULT_REGION_CODE = '1168010100';
export const DEFAULT_POSTCODE = '06236';
export const DEFAULT_MEMBER_NAME = 'Contract Test User';
export const DEFAULT_MEMBER_ID = '00000000-0000-0000-0000-000000000001';

export const COMMUNITY_QUOTE_CONTRACT = Object.freeze({
  memberSelf: { method: 'GET', path: '/api/members/me' },
  memberUpdate: { method: 'PUT', path: '/api/members/me' },
  boardList: { method: 'GET', path: '/api/boards/community/items' },
  boardDetail: { method: 'GET', path: '/api/boards/community/items/:id' },
  boardComments: { method: 'GET', path: '/api/boards/community/items/:id/comments' },
});

const JSON_HEADERS = Object.freeze({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
  'content-type': 'application/json; charset=utf-8',
});

const clone = (value) => structuredClone(value);

const success = (data, status = 200) => ({
  status,
  headers: JSON_HEADERS,
  body: JSON.stringify({ status: 'success', data }),
});

const failure = ({ status = 404, code = 'BOARD_404', message = 'Not found' } = {}) => ({
  status,
  headers: JSON_HEADERS,
  body: JSON.stringify({ status: 'error', code, message }),
});

const normalizePostScope = (value) => (value === 'neighbor' ? 'neighbor' : 'all');
const normalizeText = (value) => String(value || '').trim().toLowerCase();

const parseBodyJson = (request) => {
  const raw = request.postData();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export function createStoragePayload({
  token = 'dev-e2e-token',
  regionName = DEFAULT_REGION_NAME,
  regionCode = DEFAULT_REGION_CODE,
  postcode = DEFAULT_POSTCODE,
  name = DEFAULT_MEMBER_NAME,
  id = DEFAULT_MEMBER_ID,
} = {}) {
  return {
    state: {
      isLoggedIn: true,
      user: {
        id,
        name,
        regionName,
        regionCode,
        postcode,
      },
      token,
      isDarkMode: false,
      children: [],
      activeChildId: null,
      events: [],
    },
    version: 0,
  };
}

export function createCommunityQuoteContractState() {
  let nextId = 1000;
  let nextTimestamp = Date.parse('2026-03-12T00:00:00.000Z');
  let member = {
    id: DEFAULT_MEMBER_ID,
    name: DEFAULT_MEMBER_NAME,
    regionName: DEFAULT_REGION_NAME,
    regionCode: DEFAULT_REGION_CODE,
    postcode: DEFAULT_POSTCODE,
  };
  const posts = new Map();

  const toIsoTimestamp = () => {
    nextTimestamp += 1000;
    return new Date(nextTimestamp).toISOString();
  };

  const canViewNeighborPost = (post, viewer) => {
    if (normalizePostScope(post?.postScope) !== 'neighbor') return true;
    return Boolean(viewer?.regionCode) && viewer.regionCode === post.regUserRegionCode;
  };

  const canViewPost = (post, viewer) => Boolean(post) && !post.deleted && canViewNeighborPost(post, viewer);

  const buildQuotePreview = (post, viewer) => {
    if (!post.quoteOfItemId) return null;

    const source = posts.get(post.quoteOfItemId);
    if (!canViewPost(source, viewer)) {
      return {
        id: post.quoteOfItemId,
        unavailable: true,
      };
    }

    return {
      id: source.id,
      title: source.title,
      content: source.content,
      authorName: source.regUserName,
      unavailable: false,
    };
  };

  const buildPost = (payload = {}) => {
    const id = Number.isInteger(payload.id) ? payload.id : nextId++;
    const postScope = normalizePostScope(payload.postScope);
    const regDate = payload.regDate || toIsoTimestamp();
    const files = Array.isArray(payload.files) ? clone(payload.files) : [];

    return {
      id,
      boardId: 1,
      boardSlug: 'community',
      title: payload.title || `contract-post-${id}`,
      content: payload.content || '',
      category: payload.category || 'daily',
      postScope,
      quoteOfItemId: Number.isInteger(payload.quoteOfItemId) ? payload.quoteOfItemId : null,
      regUserName: payload.regUserName || member.name,
      regDate,
      updateDate: payload.updateDate || regDate,
      regUserRegionName: payload.regUserRegionName || member.regionName,
      regUserRegionCode: payload.regUserRegionCode || member.regionCode,
      regUserRegionDongLabel: payload.regUserRegionDongLabel || null,
      likeCount: payload.likeCount ?? 0,
      liked: payload.liked ?? false,
      repostCount: payload.repostCount ?? 0,
      reposted: payload.reposted ?? false,
      commentCount: payload.commentCount ?? 0,
      files,
      hasFile: files.length > 0,
      sameNeighborhood: payload.sameNeighborhood ?? false,
      regUserHonorNeighbor: payload.regUserHonorNeighbor ?? false,
      regUserParentingStage: payload.regUserParentingStage ?? null,
      urgentResolved: payload.urgentResolved ?? false,
      placeName: payload.placeName ?? null,
      placeAddress: payload.placeAddress ?? null,
      placeLat: payload.placeLat ?? null,
      placeLng: payload.placeLng ?? null,
      deleted: payload.deleted ?? false,
      reported: payload.reported ?? false,
    };
  };

  const sortPosts = (items) => items.sort((left, right) => {
    const dateDiff = Date.parse(right.regDate) - Date.parse(left.regDate);
    if (dateDiff !== 0) return dateDiff;
    return right.id - left.id;
  });

  const buildListItem = (post, viewer) => ({
    id: post.id,
    boardId: post.boardId,
    boardSlug: post.boardSlug,
    title: post.title,
    content: post.content,
    category: post.category,
    postScope: post.postScope,
    quoteOfItemId: post.quoteOfItemId,
    quotePreview: buildQuotePreview(post, viewer),
    regUserName: post.regUserName,
    regDate: post.regDate,
    regUserRegionName: post.regUserRegionName,
    regUserRegionDongLabel: post.regUserRegionDongLabel,
    likeCount: post.likeCount,
    liked: post.liked,
    repostCount: post.repostCount,
    reposted: post.reposted,
    commentCount: post.commentCount,
    sameNeighborhood: post.sameNeighborhood,
    regUserHonorNeighbor: post.regUserHonorNeighbor,
    regUserParentingStage: post.regUserParentingStage,
    thumbnailUrl: null,
    hasFile: post.hasFile,
  });

  const buildDetailItem = (post, viewer) => ({
    ...buildListItem(post, viewer),
    files: clone(post.files),
    updateDate: post.updateDate,
    placeName: post.placeName,
    placeAddress: post.placeAddress,
    placeLat: post.placeLat,
    placeLng: post.placeLng,
    urgentResolved: post.urgentResolved,
    reported: post.reported,
  });

  const listVisiblePosts = ({ locationScope, category, keyword, urgentSlot }, viewer) => {
    const normalizedScope = normalizePostScope(locationScope);
    const normalizedKeyword = normalizeText(keyword);

    let items = Array.from(posts.values()).filter((post) => (
      !post.deleted
      && normalizePostScope(post.postScope) === normalizedScope
      && canViewPost(post, viewer)
    ));

    if (category) {
      items = items.filter((post) => post.category === category);
    }

    if (normalizedKeyword) {
      items = items.filter((post) => {
        const haystack = `${post.title}\n${post.content}`.toLowerCase();
        return haystack.includes(normalizedKeyword);
      });
    }

    if (urgentSlot) {
      items = items.filter((post) => post.category === 'urgent' && !post.urgentResolved);
    }

    return sortPosts(items);
  };

  const listPosts = (searchParams, viewer) => {
    const page = Math.max(0, Number.parseInt(searchParams.get('page') || '0', 10));
    const size = Math.max(1, Number.parseInt(searchParams.get('size') || '20', 10));
    const urgentSlot = searchParams.get('urgentSlot') === 'true';
    const items = listVisiblePosts({
      locationScope: searchParams.get('locationScope'),
      category: searchParams.get('category'),
      keyword: searchParams.get('keyword'),
      urgentSlot,
    }, viewer);

    const pagedItems = urgentSlot
      ? items.slice(0, 1)
      : items.slice(page * size, page * size + size);

    const visibleAll = listVisiblePosts({
      locationScope: searchParams.get('locationScope'),
      category: null,
      keyword: null,
      urgentSlot: false,
    }, viewer);

    const urgentItems = searchParams.get('locationScope') === 'neighbor'
      ? visibleAll.filter((post) => post.category === 'urgent' && !post.urgentResolved).slice(0, 3)
      : [];

    return {
      items: pagedItems.map((post) => buildListItem(post, viewer)),
      totalPages: urgentSlot ? (pagedItems.length > 0 ? 1 : 0) : Math.ceil(items.length / size),
      currentPage: page,
      size,
      totalElements: urgentSlot ? pagedItems.length : items.length,
      popularItems: visibleAll.slice(0, 3).map((post) => ({ id: post.id, title: post.title })),
      urgentItems: urgentItems.map((post) => ({ id: post.id, title: post.title })),
    };
  };

  return {
    getMember() {
      return clone(member);
    },

    updateMember(patch) {
      member = {
        ...member,
        ...patch,
      };
      return this.getMember();
    },

    createPost(payload) {
      const post = buildPost(payload);
      posts.set(post.id, post);
      return post.id;
    },

    deletePost(postId) {
      const post = posts.get(postId);
      if (!post) return false;
      post.deleted = true;
      return true;
    },

    listPosts(searchParams) {
      return listPosts(searchParams, member);
    },

    getPost(postId) {
      const post = posts.get(postId);
      if (!post || post.deleted) {
        return null;
      }
      if (!canViewPost(post, member)) {
        return { error: { status: 403, code: 'BOARD_014', message: 'Location access denied' } };
      }
      return buildDetailItem(post, member);
    },

    getComments() {
      return [];
    },
  };
}

export async function installCommunityQuoteContractRoutes(context, contractState) {
  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;

    if (!pathname.startsWith('/api/')) {
      await route.continue();
      return;
    }

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: JSON_HEADERS, body: '' });
      return;
    }

    if (pathname === '/api/members/me' && request.method() === 'GET') {
      await route.fulfill(success(contractState.getMember()));
      return;
    }

    if (pathname === '/api/members/me' && request.method() === 'PUT') {
      const nextMember = contractState.updateMember(parseBodyJson(request));
      await route.fulfill(success(nextMember));
      return;
    }

    if (pathname === '/api/boards/community/items' && request.method() === 'GET') {
      await route.fulfill(success(contractState.listPosts(searchParams)));
      return;
    }

    if (pathname === '/api/boards/community/items' && request.method() === 'POST') {
      const postId = contractState.createPost(parseBodyJson(request));
      await route.fulfill(success({ id: postId, boardId: 1 }, 200));
      return;
    }

    const commentsMatch = pathname.match(/^\/api\/boards\/community\/items\/(\d+)\/comments$/);
    if (commentsMatch && request.method() === 'GET') {
      await route.fulfill(success(contractState.getComments(Number.parseInt(commentsMatch[1], 10))));
      return;
    }

    const detailMatch = pathname.match(/^\/api\/boards\/community\/items\/(\d+)$/);
    if (detailMatch && request.method() === 'GET') {
      const detail = contractState.getPost(Number.parseInt(detailMatch[1], 10));
      if (detail?.error) {
        await route.fulfill(failure(detail.error));
        return;
      }
      if (!detail) {
        await route.fulfill(failure({ status: 404, code: 'BOARD_404', message: 'Post not found' }));
        return;
      }
      await route.fulfill(success(detail));
      return;
    }

    if (detailMatch && request.method() === 'DELETE') {
      const deleted = contractState.deletePost(Number.parseInt(detailMatch[1], 10));
      if (!deleted) {
        await route.fulfill(failure({ status: 404, code: 'BOARD_404', message: 'Post not found' }));
        return;
      }
      await route.fulfill(success(true));
      return;
    }

    await route.fulfill(failure({
      status: 404,
      code: 'MOCK_404',
      message: `Unhandled contract route: ${request.method()} ${pathname}`,
    }));
  });
}