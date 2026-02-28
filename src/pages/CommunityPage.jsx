import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useNavigationType } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, PenLine, MessageSquare, Heart, User, MapPin, ChevronDown, Crown, AlertCircle, Sparkles, HelpCircle, ShoppingBag, Coffee, BookOpen, Map, Building2, Zap, Gift, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { getLocalLikeMap, setLocalLike } from '../lib/likeStorage';
import useStore from '../store/useStore';
import LocationSettingModal from '../components/LocationSettingModal';
import { getRegionLabels } from '../utils/regionLabel';

const categoryMeta = {
  // 육아광장 (All)
  tip: { label: '육아꿀팁', icon: Sparkles, color: 'indigo' },
  qna: { label: '고민상담', icon: HelpCircle, color: 'orange' },
  item_review: { label: '육아템리뷰', icon: ShoppingBag, color: 'pink' },
  daily: { label: '자유게시판', icon: Coffee, color: 'emerald' },
  info_share: { label: '정보공유', icon: BookOpen, color: 'cyan' },
  // 동네생활 (Neighbor)
  urgent: { label: '긴급/SOS', icon: AlertCircle, color: 'rose' },
  local_info: { label: '동네정보', icon: Map, color: 'sky' },
  local_review: { label: '동네후기', icon: Building2, color: 'teal' },
  local_gathering: { label: '동네번개', icon: Zap, color: 'yellow' },
  local_share: { label: '동네나눔', icon: Gift, color: 'violet' }
};

const CATEGORIES = {
  all: ['tip', 'qna', 'item_review', 'daily', 'info_share'],
  neighbor: ['urgent', 'local_info', 'local_review', 'local_gathering', 'local_share']
};

const getPostScopeBadgeMeta = (postScope) => {
  if (String(postScope || '').toLowerCase() === 'neighbor') {
    return {
      label: '동네생활',
      Icon: MapPin,
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    };
  }

  return {
    label: '육아광장',
    Icon: Globe,
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
  };
};

const CommunityPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const sizeParam = Math.max(1, Number(searchParams.get('size')) || 20);
  const activeTab = searchParams.get('tab') || 'all';
  const queryParam = searchParams.get('query') || '';
  const sortParamRaw = searchParams.get('sort');
  const searchParamsKey = searchParams.toString();

  const [searchInput, setSearchInput] = useState(queryParam);
  const [likeCounts, setLikeCounts] = useState({});
  const [likedMap, setLikedMap] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [imageLoadErrorMap, setImageLoadErrorMap] = useState({});
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const containerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const scrollFrameRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pendingRestoreRef = useRef(null);
  const navigationType = useNavigationType();
  const debounceTimerRef = useRef(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const { user, updateUserInfo } = useStore();
  const searchParamsRef = useRef(searchParams);
  const hasUserLocation = Boolean(
    (typeof user?.regionCode === 'string' && user.regionCode.trim())
    || (typeof user?.postcode === 'string' && user.postcode.trim())
  );
  const locationScopeParam = searchParams.get('locationScope');
  const locationScope = locationScopeParam === 'neighbor' || locationScopeParam === 'all'
    ? locationScopeParam
    : (hasUserLocation ? 'neighbor' : 'all');
  const sort = locationScope === 'all' && sortParamRaw === 'popular' ? 'popular' : 'latest';
  const userRegionLabels = useMemo(() => getRegionLabels(user?.regionName), [user?.regionName]);
  const isNeighborScopeBlocked = locationScope === 'neighbor' && !hasUserLocation;

  const queryKey = ['community', 'list', locationScope, sort, activeTab, queryParam.trim(), pageParam, sizeParam];

  const {
    data,
    isFetching,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.set('category', activeTab);
      }
      params.set('locationScope', locationScope);
      if (locationScope === 'all') {
        params.set('sort', sort);
      }
      params.set('page', String(pageParam - 1));
      params.set('size', String(sizeParam));
      params.set('includeHighlights', 'false');
      if (queryParam.trim()) {
        params.set('searchType', 'titleContent');
        params.set('keyword', queryParam.trim());
      }
      const response = await api.get(`/boards/community/items?${params.toString()}`, { signal });
      return response?.data || response || {};
    },
    enabled: !isNeighborScopeBlocked,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData
  });

  const showUrgentSlot = locationScope === 'neighbor' && activeTab === 'all' && !queryParam.trim();
  const { data: urgentSlotData } = useQuery({
    queryKey: ['community', 'urgent-slot', locationScope],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      params.set('locationScope', 'neighbor');
      params.set('category', 'urgent');
      params.set('page', '0');
      params.set('size', '1');
      params.set('includeHighlights', 'false');
      params.set('urgentSlot', 'true');
      const response = await api.get(`/boards/community/items?${params.toString()}`, { signal });
      return response?.data || response || {};
    },
    enabled: showUrgentSlot && !isNeighborScopeBlocked,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });

  const posts = useMemo(() => (Array.isArray(data?.items) ? data.items : []), [data?.items]);
  const urgentSlotPosts = useMemo(
    () => (Array.isArray(urgentSlotData?.items) ? urgentSlotData.items : []),
    [urgentSlotData?.items]
  );
  const visiblePosts = useMemo(() => {
    if (!showUrgentSlot || urgentSlotPosts.length === 0) return posts;
    const urgentIds = new Set(urgentSlotPosts.map((post) => String(post.id)));
    return posts.filter((post) => !urgentIds.has(String(post.id)));
  }, [posts, showUrgentSlot, urgentSlotPosts]);
  const hasUrgentSlot = showUrgentSlot && urgentSlotPosts.length > 0;
  const hasVisiblePosts = visiblePosts.length > 0;
  const pagination = useMemo(() => ({
    totalPages: data?.totalPages ?? 0,
    currentPage: data?.currentPage ?? 0,
    size: data?.size ?? sizeParam,
    totalElements: data?.totalElements ?? 0
  }), [data?.totalPages, data?.currentPage, data?.size, data?.totalElements, sizeParam]);
  const errorCode = error?.code || '';
  const errorMessage = isNeighborScopeBlocked ? '' : (error?.message || '');

  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const applyLocationScope = useCallback((nextScope, { replace = true } = {}) => {
    const normalizedScope = nextScope === 'neighbor' ? 'neighbor' : 'all';
    const nextParams = new URLSearchParams(searchParamsRef.current);
    nextParams.set('locationScope', normalizedScope);
    if (normalizedScope === 'neighbor') {
      nextParams.delete('sort');
    } else if (!nextParams.get('sort')) {
      nextParams.set('sort', 'latest');
    }
    nextParams.delete('page');
    setSearchParams(nextParams, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    if (locationScopeParam === locationScope) return;
    applyLocationScope(locationScope, { replace: true });
  }, [locationScope, locationScopeParam, applyLocationScope]);

  useEffect(() => {
    const currentSort = searchParamsRef.current.get('sort');
    if (locationScope !== 'all') {
      if (currentSort != null) {
        const nextParams = new URLSearchParams(searchParamsRef.current);
        nextParams.delete('sort');
        setSearchParams(nextParams, { replace: true });
      }
      return;
    }

    if (currentSort !== 'latest' && currentSort !== 'popular') {
      const nextParams = new URLSearchParams(searchParamsRef.current);
      nextParams.set('sort', 'latest');
      setSearchParams(nextParams, { replace: true });
    }
  }, [locationScope, setSearchParams]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let scrollContainer = root.parentElement;
    while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto')) {
      scrollContainer = scrollContainer.parentElement;
    }

    scrollContainerRef.current = scrollContainer || null;
  }, []);

  const applySearchParams = useCallback((nextQuery, { replace }) => {
    const nextParams = new URLSearchParams(searchParamsRef.current);
    const trimmed = nextQuery.trim();
    if (trimmed) {
      nextParams.set('query', trimmed);
    } else {
      nextParams.delete('query');
    }
    nextParams.delete('page');
    setSearchParams(nextParams, { replace });
  }, [setSearchParams]);

  const runImmediateSearch = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    applySearchParams(searchInput, { replace: false });
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      if (searchInput.trim() === queryParam.trim()) return;
      applySearchParams(searchInput, { replace: true });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [searchInput, queryParam, applySearchParams]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return undefined;

    const scrollKey = `communityScroll:${searchParamsKey || 'default'}`;
    const shouldRestore = navigationType === 'POP';
    if (shouldRestore) {
      const storedScrollTop = Number(window.sessionStorage.getItem(scrollKey));
      if (Number.isFinite(storedScrollTop)) {
        pendingRestoreRef.current = storedScrollTop;
      }
    } else {
      scrollContainer.scrollTop = 0;
      lastScrollTopRef.current = 0;
      pendingRestoreRef.current = null;
      window.sessionStorage.setItem(scrollKey, '0');
    }

    const handleScroll = () => {
      const currentTop = scrollContainer.scrollTop;
      const lastTop = lastScrollTopRef.current;
      const isNearTop = currentTop <= 8;

      if (isNearTop || currentTop < lastTop) {
        setIsHeaderVisible(true);
      } else if (currentTop > lastTop) {
        setIsHeaderVisible(false);
      }

      lastScrollTopRef.current = currentTop;

      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        window.sessionStorage.setItem(scrollKey, String(scrollContainer.scrollTop));
        scrollFrameRef.current = null;
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.sessionStorage.setItem(scrollKey, String(scrollContainer.scrollTop));
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [searchParamsKey, navigationType]);

  useEffect(() => {
    if (isFetching || !data) return;
    const pending = pendingRestoreRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (pending == null || !scrollContainer) return;

    pendingRestoreRef.current = null;
    window.requestAnimationFrame(() => {
      scrollContainer.scrollTop = pending;
      lastScrollTopRef.current = pending;
    });
  }, [isFetching, data]);

  useEffect(() => {
    const localLikeMap = getLocalLikeMap(user?.id);
    const nextLikeCounts = {};
    const nextLikedMap = {};

    posts.forEach((item) => {
      nextLikeCounts[item.id] = item.likeCount ?? 0;
      nextLikedMap[item.id] = item.liked ?? localLikeMap[item.id] ?? false;
    });

    setLikeCounts(nextLikeCounts);
    setLikedMap(nextLikedMap);
    setImageLoadErrorMap((prev) => {
      const next = {};
      posts.forEach((item) => {
        const key = String(item.id);
        if (prev[key]) {
          next[key] = true;
        }
      });
      return next;
    });
  }, [posts, user?.id]);

  const categoryLabels = {
    qna: '질문',
    daily: '일상공유',
    tip: '육아꿀팁',
    urgent: '지금급해요',
    hospital: '병원/기관'
  };

  const formatRelativeTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMin < 1 && diffMs >= 0) return '방금 전';
    if (diffMin < 60 && diffMs >= 0) return `${diffMin}분 전`;
    if (diffHour < 24 && diffMs >= 0) return `${diffHour}시간 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleToggleLike = async (postId) => {
    if (likeLoading[postId]) return;

    const targetPost = posts.find((item) => String(item.id) === String(postId));
    const boardSlug = targetPost?.boardSlug || 'community';
    const wasLiked = !!likedMap[postId];
    const previousCount = likeCounts[postId] ?? 0;
    const nextCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));

    setLikeLoading((prev) => ({ ...prev, [postId]: true }));
    setLikedMap((prev) => ({ ...prev, [postId]: !wasLiked }));
    setLikeCounts((prev) => ({ ...prev, [postId]: nextCount }));
    setLocalLike(user?.id, postId, !wasLiked);

    try {
      if (wasLiked) {
        await api.delete(`/boards/${boardSlug}/items/${postId}/like`);
      } else {
        await api.post(`/boards/${boardSlug}/items/${postId}/like`);
      }
      await queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] });
    } catch {
      setLikedMap((prev) => ({ ...prev, [postId]: wasLiked }));
      setLikeCounts((prev) => ({ ...prev, [postId]: previousCount }));
      setLocalLike(user?.id, postId, wasLiked);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleOpenPost = (postId, postBoardSlug) => {
    navigate(
      `/community/${postId}${searchParamsKey ? `?${searchParamsKey}` : ''}`,
      postBoardSlug ? { state: { boardSlug: postBoardSlug } } : undefined
    );
  };

  const handleSelectLocationScope = (nextScope) => {
    if (nextScope === 'neighbor' && !hasUserLocation) {
      setLocationModalOpen(true);
      applyLocationScope('all', { replace: true });
      return;
    }
    applyLocationScope(nextScope, { replace: true });
  };

  const handleSelectSort = (nextSort) => {
    if (locationScope !== 'all') return;
    const normalizedSort = nextSort === 'popular' ? 'popular' : 'latest';
    if (sort === normalizedSort) return;

    const nextParams = new URLSearchParams(searchParamsRef.current);
    nextParams.set('sort', normalizedSort);
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div ref={containerRef} className="min-h-screen pb-24 md:pb-0 relative">
      {/* 1. 헤더 & 검색 */}
      <div className={`sticky top-0 z-20 py-4 border-b transition-all duration-200 ${isHeaderVisible
        ? 'translate-y-0 opacity-100 bg-[#F9F8F6]/95 dark:bg-gray-900/95 border-stone-200 dark:border-gray-800 shadow-sm backdrop-blur-sm'
        : '-translate-y-full opacity-0 bg-[#F9F8F6]/95 dark:bg-gray-900/95 border-transparent shadow-none backdrop-blur-sm'
        }`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative inline-flex max-w-full">
              <select
                aria-label="커뮤니티 보기 범위 선택"
                value={locationScope}
                onChange={(event) => handleSelectLocationScope(event.target.value)}
                className="appearance-none cursor-pointer max-w-full rounded-2xl border border-stone-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 pl-3 pr-10 py-1.5 sm:py-2 text-lg sm:text-xl lg:text-2xl font-serif-kr font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500 transition-all hover:bg-white dark:hover:bg-gray-800"
              >
                <option value="all">육아광장</option>
                <option value="neighbor">동네생활</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-stone-500 dark:text-gray-400" />
            </div>

            <p className="text-sm text-stone-500 dark:text-gray-400 font-medium hidden sm:block">
              {locationScope === 'neighbor' && userRegionLabels.dongLabel
                ? `${userRegionLabels.dongLabel} 육아 동지들과 함께해요`
                : '육아 동지들과 함께해요'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${user?.regionName
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60'
              : 'bg-stone-100 text-stone-500 dark:bg-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-gray-600'
              }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{userRegionLabels.guDongLabel || '내 동네 설정'}</span>
            {!userRegionLabels.guDongLabel && <span className="xs:hidden">동네설정</span>}
            {userRegionLabels.guDongLabel && <span className="xs:hidden">{userRegionLabels.dongLabel || '인증됨'}</span>}
          </button>
        </div>

        <div className="relative w-full">
          <button
            type="button"
            onClick={runImmediateSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-gray-500"
          >
            <Search className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder="궁금한 내용을 검색해보세요 (예: 태열, 이유식)"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                runImmediateSearch();
              }
            }}
            className="w-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-stone-800 dark:text-gray-100 placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>
        <div className="relative h-1 mt-2 mb-1 overflow-hidden">
          <AnimatePresence>
            {isFetching && !isLoading && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent dark:via-amber-500 opacity-60"
              />
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {['all', ...(locationScope === 'neighbor' ? CATEGORIES.neighbor : CATEGORIES.all)].map((tab) => {
            const isSelected = activeTab === tab;
            const meta = categoryMeta[tab];
            const Icon = meta?.icon || (tab === 'all' ? Globe : Coffee);
            const label = tab === 'all' ? '전체' : (meta?.label || tab);

            return (
              <button
                key={tab}
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  if (tab === 'all') {
                    nextParams.delete('tab');
                  } else {
                    nextParams.set('tab', tab);
                  }
                  nextParams.delete('page');
                  setSearchParams(nextParams, { replace: true });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${isSelected
                  ? (tab === 'urgent' ? 'bg-rose-500 text-white dark:bg-rose-600' : 'bg-stone-800 text-white dark:bg-amber-500 dark:text-gray-900')
                  : (tab === 'urgent' ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-gray-800 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/30' : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700')
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected && tab === 'urgent' ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                {label}
              </button>
            )
          })}
        </div>
        {locationScope === 'all' && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-gray-400">정렬</span>
            <button
              type="button"
              onClick={() => handleSelectSort('latest')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${sort === 'latest'
                ? 'bg-stone-800 text-white border-stone-800 dark:bg-amber-500 dark:text-gray-900 dark:border-amber-500'
                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => handleSelectSort('popular')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${sort === 'popular'
                ? 'bg-stone-800 text-white border-stone-800 dark:bg-amber-500 dark:text-gray-900 dark:border-amber-500'
                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
            >
              인기순
            </button>
          </div>
        )}
      </div>

      {/* 2. 게시글 리스트 */}
      <div className="py-5 relative">
        <div className="space-y-4 lg:space-y-6">
          {isNeighborScopeBlocked ? (
            <div className="py-16 text-center text-stone-500 dark:text-gray-400">
              <p className="mb-2 font-medium">내 동네 보기를 사용하려면 동네 설정이 필요해요.</p>
              <p className="text-xs mb-4">위치 인증 후 같은 동네 글을 먼저 볼 수 있어요.</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold bg-amber-500 text-gray-900 hover:bg-amber-600"
                >
                  동네 설정하기
                </button>
                <button
                  type="button"
                  onClick={() => applyLocationScope('all', { replace: true })}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  전체 보기
                </button>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="py-16 text-center text-rose-500">
              <p className="mb-4">{errorMessage}</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold bg-amber-500 text-gray-900 hover:bg-amber-600"
                >
                  다시 시도
                </button>
                {errorCode === 'BOARD_013' && (
                  <button
                    type="button"
                    onClick={() => setLocationModalOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                  >
                    동네 설정
                  </button>
                )}
                {errorCode === 'BOARD_014' && (
                  <button
                    type="button"
                    onClick={() => applyLocationScope('all', { replace: true })}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
                  >
                    전체 보기
                  </button>
                )}
              </div>
            </div>
          ) : isLoading && !data ? (
            <div className="py-16 text-center text-stone-400 dark:text-gray-500">
              <span className="inline-block h-4 w-4 border-2 border-stone-300 dark:border-gray-500 border-t-transparent rounded-full animate-spin mr-2 align-[-2px]" />
              게시글을 불러오는 중이에요...
            </div>
          ) : hasVisiblePosts || hasUrgentSlot ? (
            <>
              {hasUrgentSlot && (
                <section className="rounded-3xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/10 p-4 lg:p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-rose-700 dark:text-rose-300">긴급/SOS (최근 2시간)</h3>
                  </div>
                  <div className="space-y-2">
                    {urgentSlotPosts.map((post) => {
                      const postRegionDongLabel = post.regUserRegionDongLabel || getRegionLabels(post.regUserRegionName).dongLabel;
                      return (
                        <button
                          key={`urgent-slot-${post.id}`}
                          type="button"
                          onClick={() => handleOpenPost(post.id, post.boardSlug)}
                          className="w-full text-left rounded-2xl border border-rose-200/80 dark:border-rose-800/40 bg-white/90 dark:bg-gray-800/70 px-3 py-2.5 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <p className="text-sm font-bold text-stone-900 dark:text-gray-100 line-clamp-1">{post.title}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-gray-400">
                            <span>{formatRelativeTime(post.regDate)}</span>
                            {postRegionDongLabel && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-400 dark:text-rose-500" />
                                  {postRegionDongLabel}
                                </span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

            {visiblePosts.map((post) => {
              const imageError = imageLoadErrorMap[String(post.id)];
              const hasThumbnail = Boolean(post.thumbnailUrl) && !imageError;
              const hasThumbnailVariants = Boolean(
                post.thumbnailAvifUrl || post.thumbnailWebpUrl || post.thumbnailJpegUrl || post.thumbnailPngUrl
              );
              const postRegionDongLabel = post.regUserRegionDongLabel || getRegionLabels(post.regUserRegionName).dongLabel;
              const postScopeBadge = getPostScopeBadgeMeta(post.postScope);

              return (
                <article
                  key={post.id}
                  className={`bg-white dark:bg-gray-800 p-5 lg:p-6 rounded-3xl border shadow-sm hover:shadow-lg dark:shadow-none transition-shadow flex flex-col gap-4 ${post.category === 'urgent'
                    ? 'border-rose-400 dark:border-rose-600 shadow-rose-100/50'
                    : 'border-stone-100 dark:border-gray-700'
                    }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`게시글 상세 보기: ${post.title || '제목 없음'}`}
                    onClick={() => handleOpenPost(post.id, post.boardSlug)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleOpenPost(post.id, post.boardSlug);
                      }
                    }}
                    className="cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:focus-visible:ring-amber-500 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-gray-700 flex items-center justify-center border border-stone-200 dark:border-gray-600">
                          <User className="w-4 h-4 text-stone-400 dark:text-gray-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-stone-800 dark:text-gray-100">{post.regUserName || '알 수 없음'}</span>
                            {post.sameNeighborhood && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-stone-900 dark:bg-amber-500 dark:text-gray-900 shadow-sm">
                                <MapPin className="w-3 h-3" />
                                인증이웃
                              </span>
                            )}
                            {post.regUserHonorNeighbor && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-200 to-yellow-400 text-stone-900 shadow-sm">
                                <Crown className="w-3 h-3 text-amber-700" />
                                육아고수
                              </span>
                            )}
                            {post.regUserParentingStage && (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${post.regUserParentingStage === '신생아' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' :
                                post.regUserParentingStage === '영아' || post.regUserParentingStage === '유아' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                                }`}>
                                {post.regUserParentingStage}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-400 dark:text-gray-400 font-normal mt-0.5">
                            <span>{formatRelativeTime(post.regDate)}</span>
                            {postRegionDongLabel && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-stone-300 dark:text-gray-500" />
                                  {postRegionDongLabel}
                                </span>
                              </>
                            )}
                            {post.category === 'hospital' && post.placeName && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded-full">
                                  🏥 {post.placeName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap shrink-0">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${postScopeBadge.className}`}>
                          <postScopeBadge.Icon className="w-3 h-3" strokeWidth={2.5} />
                          {postScopeBadge.label}
                        </span>
                        {post.category && (() => {
                          const meta = categoryMeta[post.category];
                          const Icon = meta?.icon || (post.category === 'hospital' ? Building2 : Coffee);
                          const label = meta?.label || (post.category === 'hospital' ? '병원/기관' : post.category);

                          if (post.category === 'urgent') {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                                <AlertCircle className="w-3 h-3" />
                                긴급/SOS
                              </span>
                            );
                          }

                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${['qna', 'local_gathering'].includes(post.category) ? 'bg-orange-400 text-white dark:bg-orange-500' :
                              ['daily', 'local_review', 'hospital'].includes(post.category) ? 'bg-emerald-400 text-white dark:bg-emerald-500' :
                                ['tip', 'info_share', 'local_info'].includes(post.category) ? 'bg-indigo-400 text-white dark:bg-indigo-500' :
                                  ['item_review', 'local_share'].includes(post.category) ? 'bg-pink-400 text-white dark:bg-pink-500' :
                                    'bg-stone-100 text-stone-600 dark:bg-gray-700 border border-stone-200 dark:text-gray-300'
                              }`}>
                              <Icon className="w-3 h-3" strokeWidth={2.5} />
                              {label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg lg:text-xl font-extrabold text-stone-900 dark:text-gray-100 mb-1.5 line-clamp-2 leading-snug tracking-tight">{post.title}</h3>
                        {post.content && (
                          <p className="text-sm md:text-[15px] lg:text-base text-stone-500 dark:text-gray-400 font-light line-clamp-3 leading-relaxed">{post.content}</p>
                        )}
                      </div>
                      {hasThumbnail && (
                        <div className="w-full aspect-square rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700">
                          {hasThumbnailVariants ? (
                            <picture>
                              {post.thumbnailAvifUrl && <source type="image/avif" srcSet={post.thumbnailAvifUrl} />}
                              {post.thumbnailWebpUrl && <source type="image/webp" srcSet={post.thumbnailWebpUrl} />}
                              {post.thumbnailJpegUrl && <source type="image/jpeg" srcSet={post.thumbnailJpegUrl} />}
                              {post.thumbnailPngUrl && <source type="image/png" srcSet={post.thumbnailPngUrl} />}
                              <img
                                src={post.thumbnailUrl}
                                alt={`${post.title || '게시글'} 첨부 이미지`}
                                width={post.thumbnailWidth || undefined}
                                height={post.thumbnailHeight || undefined}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={() => {
                                  setImageLoadErrorMap((prev) => ({ ...prev, [String(post.id)]: true }));
                                }}
                              />
                            </picture>
                          ) : (
                            <img
                              src={post.thumbnailUrl}
                              alt={`${post.title || '게시글'} 첨부 이미지`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={() => {
                                setImageLoadErrorMap((prev) => ({ ...prev, [String(post.id)]: true }));
                              }}
                            />
                          )}
                        </div>
                      )}
                      {!hasThumbnail && post.hasFile && (
                        <p className="text-xs text-stone-400 dark:text-gray-500">
                          {imageError ? '첨부 이미지를 불러오지 못했어요.' : '첨부파일이 포함된 게시글입니다.'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-stone-50 dark:border-gray-700/50 pt-3 text-stone-400 dark:text-gray-400/80">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      disabled={Boolean(likeLoading[post.id])}
                      aria-busy={Boolean(likeLoading[post.id])}
                      aria-label={`${likedMap[post.id] ? '공감 취소' : '공감'}: ${post.title || '게시글'}`}
                      className={`flex items-center gap-1.5 text-sm font-normal transition-colors disabled:opacity-60 ${likedMap[post.id] ? 'text-rose-500 dark:text-rose-400' : 'hover:text-stone-500 dark:hover:text-gray-300'
                        }`}
                    >
                      <Heart className={`w-[18px] h-[18px] ${likedMap[post.id] ? 'fill-rose-500 dark:fill-rose-400' : ''}`} strokeWidth={1.5} />
                      {likeCounts[post.id] ?? post.likeCount ?? 0}
                    </button>
                    <div className="flex items-center gap-1.5 text-sm font-normal">
                      <MessageSquare className="w-[18px] h-[18px]" strokeWidth={1.5} /> {post.commentCount ?? 0}
                    </div>
                  </div>
                </article>
              );
            })}
            </>
          ) : queryParam.trim() ? (
            <div className="py-20 text-center text-stone-400 dark:text-gray-500">
              <p className="mb-2">
                <span className="font-bold">'{queryParam.trim()}'</span>에 대한 검색 결과가 없어요.
              </p>
              <p className="text-xs mb-4">다른 키워드로 검색해 볼까요?</p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  applySearchParams('', { replace: false });
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold bg-amber-500 text-gray-900 hover:bg-amber-600"
              >
                검색 초기화
              </button>
            </div>
          ) : (
            <div className="py-20 text-center text-stone-400 dark:text-gray-500">
              <p>아직 등록된 게시글이 없어요 🥲</p>
              <p className="text-xs mt-1">가장 먼저 글을 작성해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-10">
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.max(1, pageParam - 1);
              const nextParams = new URLSearchParams(searchParams);
              if (nextPage === 1) {
                nextParams.delete('page');
              } else {
                nextParams.set('page', String(nextPage));
              }
              setSearchParams(nextParams, { replace: false });
            }}
            disabled={pageParam <= 1}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 text-stone-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            이전
          </button>
          <span className="text-xs text-stone-400 dark:text-gray-400">
            {Math.min(pagination.currentPage + 1, pagination.totalPages)} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => {
              const nextPage = Math.min(pagination.totalPages, pageParam + 1);
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('page', String(nextPage));
              setSearchParams(nextParams, { replace: false });
            }}
            disabled={pageParam >= pagination.totalPages}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 text-stone-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            다음
          </button>
        </div>
      )}

      {/* 3. 글쓰기 버튼 (Floating) */}
      <button
        onClick={() => navigate(`/community/write?locationScope=${locationScope}`)}
        className="fixed bottom-44 right-8 md:bottom-32 md:right-12 bg-stone-900 text-white dark:bg-amber-500 dark:text-gray-900 w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <PenLine className="w-5 h-5" />
      </button>

      {/* 동네 설정 모달 */}
      <LocationSettingModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={async (locationData) => {
          const result = await updateUserInfo(locationData);
          if (result?.success !== false) {
            await queryClient.invalidateQueries({ queryKey: ['community'] });
            await queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] });
            applyLocationScope('neighbor', { replace: true });
          }
          return result;
        }}
        currentRegionName={user?.regionName}
      />
    </div>
  );
};

export default CommunityPage;
