import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PenLine, MessageSquare, Heart, User } from 'lucide-react';
import api from '../lib/api';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const containerRef = useRef(null);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    let scrollContainer = root.parentElement;
    while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto')) {
      scrollContainer = scrollContainer.parentElement;
    }

    if (!scrollContainer) return undefined;

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
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const categoryLabels = {
    qna: '질문',
    daily: '일상공유',
    tip: '육아꿀팁'
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const params = new URLSearchParams();
        if (activeTab !== 'all') {
          params.set('category', activeTab);
        }
        const query = params.toString();
        const response = await api.get(`/boards/community/items${query ? `?${query}` : ''}`);
        const data = response?.data || response || {};
        setPopularPosts(data.popularItems || []);
        setPosts(data.items || []);
      } catch (error) {
        setErrorMessage(error?.message || '게시글을 불러오지 못했습니다.');
        setPopularPosts([]);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab]);

  return (
    <div ref={containerRef} className="min-h-screen pb-24 md:pb-0 relative">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto xl:grid xl:grid-cols-[minmax(520px,1fr)_280px] xl:gap-6">
          <div>
            {/* 1. 헤더 & 검색 */}
            <div className={`sticky top-0 z-20 py-4 border-b transition-all duration-200 ${
              isHeaderVisible
                ? 'translate-y-0 opacity-100 bg-[#F9F8F6]/95 dark:bg-gray-900/95 border-stone-200 dark:border-gray-800 shadow-sm backdrop-blur-sm'
                : '-translate-y-full opacity-0 bg-[#F9F8F6]/95 dark:bg-gray-900/95 border-transparent shadow-none backdrop-blur-sm'
            }`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-4">
                <h1 className="text-3xl sm:text-[32px] lg:text-4xl font-serif-kr font-bold text-stone-900 dark:text-white">Community</h1>
                <p className="text-xs sm:text-sm text-stone-400 dark:text-gray-400 font-medium">육아 동지들과 함께해요</p>
              </div>

              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="궁금한 내용을 검색해보세요 (예: 태열, 이유식)"
                  className="w-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-stone-800 dark:text-gray-100 placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                {['all', 'qna', 'daily', 'tip'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? 'bg-stone-800 text-white dark:bg-amber-500 dark:text-gray-900'
                        : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab === 'all' ? '전체' : tab === 'qna' ? '질문&답변' : tab === 'daily' ? '육아일상' : '꿀팁공유'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 게시글 리스트 */}
            <div className="py-5">
              {isLoading ? (
                <div className="py-16 text-center text-stone-400 dark:text-gray-500">
                  <p>게시글을 불러오는 중이에요...</p>
                </div>
              ) : errorMessage ? (
                <div className="py-16 text-center text-rose-500">
                  <p>{errorMessage}</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4 lg:space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/community/${post.id}`)}
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
                        {post.category && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            post.category === 'qna' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-300' :
                            post.category === 'daily' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                          }`}>
                            {categoryLabels[post.category] || post.category}
                          </span>
                        )}
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
                        <div className="flex items-center gap-1 text-stone-400 dark:text-gray-400 text-xs font-medium">
                          <Heart className="w-4 h-4" /> {post.likeCount ?? 0}
                        </div>
                        <div className="flex items-center gap-1 text-stone-400 dark:text-gray-400 text-xs font-medium">
                          <MessageSquare className="w-4 h-4" /> {post.commentCount ?? 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-stone-400 dark:text-gray-500">
                  <p>아직 등록된 게시글이 없어요 🥲</p>
                  <p className="text-xs mt-1">가장 먼저 글을 작성해보세요!</p>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden xl:block relative transition-all duration-500 ease-in-out xl:w-[280px] xl:opacity-100 xl:translate-x-0">
            {popularPosts.length > 0 && (
              <div className="sticky top-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-stone-100 dark:border-gray-700 p-5">
                  <h3 className="text-sm font-bold text-stone-800 dark:text-gray-100 mb-3">인기글</h3>
                  <div className="space-y-3">
                    {popularPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => navigate(`/community/${post.id}`)}
                        className="w-full text-left text-sm text-stone-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                      >
                        <span className="line-clamp-2">{post.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* 3. 글쓰기 버튼 (Floating) */}
      <button
        onClick={() => navigate('/community/write')}
        className="fixed bottom-24 left-6 md:left-auto md:bottom-28 md:right-10 bg-stone-900 text-white dark:bg-amber-500 dark:text-gray-900 w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
      >
        <PenLine className="w-6 h-6" />
      </button>
    </div>
  );
};

export default CommunityPage;
