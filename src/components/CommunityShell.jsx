import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const CommunityShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const [popularPosts, setPopularPosts] = useState([]);
  const [isPopularLoading, setIsPopularLoading] = useState(false);

  useEffect(() => {
    if (location.pathname === '/community') return;
    const root = containerRef.current;
    if (!root) return;

    let scrollContainer = root.parentElement;
    while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto')) {
      scrollContainer = scrollContainer.parentElement;
    }

    if (scrollContainer) {
      const previousBehavior = scrollContainer.style.scrollBehavior;
      scrollContainer.style.scrollBehavior = 'auto';
      scrollContainer.scrollTop = 0;
      scrollContainer.style.scrollBehavior = previousBehavior;
    }
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const fetchPopularPosts = async () => {
      setIsPopularLoading(true);
      try {
        const response = await api.get('/boards/items');
        const data = response?.data || response || {};
        if (isMounted) {
          setPopularPosts(data.popularItems || []);
        }
      } catch (error) {
        if (isMounted) {
          setPopularPosts([]);
        }
      } finally {
        if (isMounted) {
          setIsPopularLoading(false);
        }
      }
    };

    fetchPopularPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div ref={containerRef} className="px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto xl:grid xl:grid-cols-[minmax(520px,1fr)_280px] xl:gap-6">
        <div className="min-w-0">
          <Outlet />
        </div>

        <aside className="hidden xl:block relative xl:w-[280px]">
          <div className="sticky top-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-stone-100 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-stone-800 dark:text-gray-100 mb-3">인기글</h3>
              {isPopularLoading ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`popular-skeleton-${index}`}
                      className="h-3 w-full rounded-full bg-stone-200/70 dark:bg-gray-700"
                    />
                  ))}
                </div>
              ) : popularPosts.length > 0 ? (
                <div className="space-y-3">
                  {popularPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => navigate(`/community/${post.id}${location.search || ''}`)}
                      className="w-full text-left text-sm text-stone-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                    >
                      <span className="line-clamp-2">{post.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-stone-400 dark:text-gray-500 space-y-2">
                  <p className="font-medium text-stone-500 dark:text-gray-400">아직 인기글이 없어요.</p>
                  <p>첫 글을 작성해서 인기글의 주인공이 되어보세요.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CommunityShell;
