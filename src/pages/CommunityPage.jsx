import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useNavigationType } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, PenLine, MessageSquare, Heart, User, MapPin, Pin } from 'lucide-react';
import api from '../lib/api';
import { getLocalLikeMap, setLocalLike } from '../lib/likeStorage';
import useStore from '../store/useStore';
import LocationSettingModal from '../components/LocationSettingModal';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const sizeParam = Math.max(1, Number(searchParams.get('size')) || 20);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    currentPage: 0,
    size: 20,
    totalElements: 0
  });
  const [likeCounts, setLikeCounts] = useState({});
  const [likedMap, setLikedMap] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const containerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const scrollFrameRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pendingRestoreRef = useRef(null);
  const navigationType = useNavigationType();
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const { user, updateUserInfo } = useStore();

  const boardSlug = activeTab === 'all'
    ? 'community'
    : (boards.find(b => b.code === activeTab)?.slug || activeTab);

  const queryKey = ['community', activeTab, boardSlug, debouncedQuery, pageParam, sizeParam];

  const {
    data,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      const selectedBoard = boards.find(b => b.code === activeTab);
      if (selectedBoard?.category) {
        params.set('category', selectedBoard.category);
      }
      params.set('page', String(pageParam - 1));
      params.set('size', String(sizeParam));
      if (debouncedQuery) {
        params.set('searchType', 'titleContent');
        params.set('keyword', debouncedQuery);
      }
      const query = params.toString();
      const url = activeTab === 'all'
        ? `/boards/items${query ? `?${query}` : ''}`
        : `/boards/${boardSlug}/items${query ? `?${query}` : ''}`;
      const response = await api.get(url, { signal });
      return response?.data || response || {};
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  const errorMessage = error?.message || '';

  useEffect(() => {
    const tab = searchParams.get('tab') || 'all';
    const query = searchParams.get('query') || '';
    setActiveTab(tab);
    setSearchQuery(query);
    setDebouncedQuery(query.trim());
  }, [searchParams]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let scrollContainer = root.parentElement;
    while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto')) {
      scrollContainer = scrollContainer.parentElement;
    }

    scrollContainerRef.current = scrollContainer || null;
  }, []);

  const applySearchParams = (nextQuery, { replace }) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextQuery.trim()) {
      nextParams.set('query', nextQuery);
    } else {
      nextParams.delete('query');
    }
    nextParams.delete('page');
    setSearchParams(nextParams, { replace });
  };

  const runImmediateSearch = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const trimmed = searchQuery.trim();
    setDebouncedQuery(trimmed);
    applySearchParams(trimmed, { replace: false });
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedQuery(trimmed);
      applySearchParams(trimmed, { replace: true });
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [searchQuery, searchParams]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return undefined;

    const scrollKey = `communityScroll:${searchParams.toString() || 'default'}`;
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
  }, [searchParams, navigationType]);

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

  // 게시판 목록 조회 (GET /api/boards)
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await api.get('/boards');
        if (res.status === 'success' && Array.isArray(res.data)) {
          setBoards(res.data);
        }
      } catch (error) {
        console.error('게시판 목록 조회 실패:', error);
      }
    };
    fetchBoards();
  }, []);

  const categoryLabels = boards.reduce((acc, board) => {
    acc[board.code] = board.title;
    return acc;
  }, {});


  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (!data) return;
    const items = data.items || [];
    setPosts(items);
    setPagination({
      totalPages: data.totalPages ?? 0,
      currentPage: data.currentPage ?? 0,
      size: data.size ?? sizeParam,
      totalElements: data.totalElements ?? 0
    });
    const nextLikeCounts = {};
    const localLikeMap = getLocalLikeMap();
    const nextLikedMap = {};
    items.forEach((item) => {
      nextLikeCounts[item.id] = item.likeCount ?? 0;
      nextLikedMap[item.id] = item.liked ?? localLikeMap[item.id] ?? false;
    });
    setLikeCounts(nextLikeCounts);
    setLikedMap(nextLikedMap);
  }, [data, sizeParam]);

  useEffect(() => {
    if (!error) return;
    setPosts([]);
    setPagination({
      totalPages: 0,
      currentPage: 0,
      size: sizeParam,
      totalElements: 0
    });
    setLikeCounts({});
    setLikedMap({});
  }, [error, sizeParam]);

  const handleToggleLike = async (event, postId) => {
    event.stopPropagation();
    if (likeLoading[postId]) return;

    const wasLiked = !!likedMap[postId];
    const previousCount = likeCounts[postId] ?? 0;
    const nextCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));

    setLikeLoading((prev) => ({ ...prev, [postId]: true }));
    setLikedMap((prev) => ({ ...prev, [postId]: !wasLiked }));
    setLikeCounts((prev) => ({ ...prev, [postId]: nextCount }));
    setLocalLike(postId, !wasLiked);

    try {
      if (wasLiked) {
        await api.delete(`/boards/${boardSlug}/items/${postId}/like`);
      } else {
        await api.post(`/boards/${boardSlug}/items/${postId}/like`);
      }
    } catch (error) {
      setLikedMap((prev) => ({ ...prev, [postId]: wasLiked }));
      setLikeCounts((prev) => ({ ...prev, [postId]: previousCount }));
      setLocalLike(postId, wasLiked);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen pb-24 md:pb-0 relative">
      {/* 1. 헤더 & 검색 */}
      <div className={`sticky top-0 z-20 py-4 border-b transition-all duration-200 ${isHeaderVisible
          ? 'translate-y-0 opacity-100 bg-[#F9F8F6]/95 dark:bg-gray-900/95 border-stone-200 dark:border-gray-800 shadow-sm backdrop-blur-sm'
          : '-translate-y-full opacity-0 bg-[#F9F8F6]/95 dark:bg-gray-900/95 border-transparent shadow-none backdrop-blur-sm'
        }`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-4">
          <div>
            <h1 className="text-3xl sm:text-[32px] lg:text-4xl font-serif-kr font-bold text-stone-900 dark:text-white">Community</h1>
            <p className="text-xs sm:text-sm text-stone-400 dark:text-gray-400 font-medium">육아 동지들과 함께해요</p>
          </div>
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${user?.regionName
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60'
              : 'bg-stone-100 text-stone-500 dark:bg-gray-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-gray-600'
              }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {user?.regionName || '내 동네 설정'}
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
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                runImmediateSearch();
              }
            }}
            className="w-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-stone-800 dark:text-gray-100 placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
          {[{ code: 'all', title: '전체' }, ...boards].map(board => (
            <button
              key={board.code}
              onClick={() => {
                const nextParams = new URLSearchParams(searchParams);
                if (board.code === 'all') {
                  nextParams.delete('tab');
                } else {
                  nextParams.set('tab', board.code);
                }
                nextParams.delete('page');
                setSearchParams(nextParams, { replace: true });
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === board.code
                  ? 'bg-stone-800 text-white dark:bg-amber-500 dark:text-gray-900'
                  : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              {board.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 게시글 리스트 */}
      <div className="py-5 relative">
        <div className={`space-y-4 lg:space-y-6 ${isFetching ? 'opacity-50 pointer-events-none' : ''}`}>
          {errorMessage ? (
            <div className="py-16 text-center text-rose-500">
              <p className="mb-4">{errorMessage}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-bold bg-amber-500 text-gray-900 hover:bg-amber-600"
              >
                다시 시도
              </button>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/community/${post.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, { state: { boardSlug: post.boardSlug || boardSlug } })}
                className="bg-white dark:bg-gray-800 p-5 lg:p-6 rounded-3xl border border-stone-100 dark:border-gray-700 shadow-sm hover:shadow-lg dark:shadow-none transition-shadow cursor-pointer active:scale-[0.98] active:bg-stone-50 dark:active:bg-gray-700 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-gray-700 flex items-center justify-center border border-stone-200 dark:border-gray-600">
                      <User className="w-4 h-4 text-stone-400 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-800 dark:text-gray-100">{post.regUserName || '알 수 없음'}</span>
                      </div>
                      <span className="text-xs text-stone-400 dark:text-gray-400">{formatDate(post.regDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                     {post.fixYn === 'Y' && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45" />}
                     {/*post.fixYn === 'Y' && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                        <Pin className="w-3 h-3 rotate-45" />고정
                      </span>
                    )*/}
                    {post.category && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${post.category === 'qna' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-300' :
                          post.category === 'daily' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                        {categoryLabels[post.category] || post.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg lg:text-xl font-bold text-stone-900 dark:text-gray-100 mb-1 line-clamp-2">{post.title}</h3>
                    {post.content && (
                      <p className="text-sm md:text-[15px] lg:text-base text-stone-500 dark:text-gray-300 line-clamp-3 leading-relaxed">{post.content}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-stone-50 dark:border-gray-700 pt-3">
                  <button
                    type="button"
                    onClick={(event) => handleToggleLike(event, post.id)}
                    className={`flex items-center gap-1 text-xs font-medium transition-colors ${likedMap[post.id] ? 'text-rose-500' : 'text-stone-400 dark:text-gray-400'
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${likedMap[post.id] ? 'fill-rose-500' : ''}`} />
                    {likeCounts[post.id] ?? post.likeCount ?? 0}
                  </button>
                  <div className="flex items-center gap-1 text-stone-400 dark:text-gray-400 text-xs font-medium">
                    <MessageSquare className="w-4 h-4" /> {post.commentCount ?? 0}
                  </div>
                </div>
              </div>
            ))
          ) : debouncedQuery ? (
            <div className="py-20 text-center text-stone-400 dark:text-gray-500">
              <p className="mb-2">
                <span className="font-bold">'{debouncedQuery}'</span>에 대한 검색 결과가 없어요.
              </p>
              <p className="text-xs mb-4">다른 키워드로 검색해 볼까요?</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
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

        {isFetching && (
          <div className="absolute inset-0 flex items-start justify-center pt-10">
            <div className="flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 text-xs text-stone-500 dark:text-gray-400">
              <span className="inline-block h-4 w-4 border-2 border-stone-300 dark:border-gray-500 border-t-transparent rounded-full animate-spin" />
              검색 결과를 불러오는 중이에요...
            </div>
          </div>
        )}
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
        onClick={() => navigate(`/community/write${activeTab !== 'all' ? `?board=${activeTab}` : ''}`)}
        className="fixed bottom-24 left-6 md:left-auto md:bottom-28 md:right-10 bg-stone-900 text-white dark:bg-amber-500 dark:text-gray-900 w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <PenLine className="w-6 h-6" />
      </button>

      {/* 동네 설정 모달 */}
      <LocationSettingModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={async (locationData) => {
          await updateUserInfo(locationData);
        }}
        currentRegionName={user?.regionName}
      />
    </div>
  );
};

export default CommunityPage;
