const STORAGE_KEY = 'communityLikes';

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export const getLocalLikeMap = () => {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY), {});
};

export const setLocalLike = (postId, liked) => {
  if (typeof window === 'undefined') return;
  const current = getLocalLikeMap();
  const next = {
    ...current,
    [postId]: !!liked,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};
