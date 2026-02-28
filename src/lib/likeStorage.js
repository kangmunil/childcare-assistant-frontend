const STORAGE_KEY_PREFIX = 'communityLikes';

const getStorageKey = (userId) => {
  const normalizedUserId = String(userId || 'anonymous').trim() || 'anonymous';
  return `${STORAGE_KEY_PREFIX}:${normalizedUserId}`;
};

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getLocalLikeMap = (userId) => {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem(getStorageKey(userId)), {});
};

export const setLocalLike = (userId, postId, liked) => {
  if (typeof window === 'undefined') return;
  const storageKey = getStorageKey(userId);
  const current = getLocalLikeMap(userId);
  const next = {
    ...current,
    [postId]: !!liked,
  };
  window.localStorage.setItem(storageKey, JSON.stringify(next));
};
