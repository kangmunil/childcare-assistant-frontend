import React, { useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import useStore from '../store/useStore';

const CommunityShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const { user } = useStore();

  const hasUserLocation = Boolean(
    (typeof user?.regionCode === 'string' && user.regionCode.trim())
    || (typeof user?.postcode === 'string' && user.postcode.trim())
  );
  const locationScope = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('locationScope');
    if (raw === 'neighbor' || raw === 'all') return raw;
    return hasUserLocation ? 'neighbor' : 'all';
  }, [location.search, hasUserLocation]);
  const isNeighborScopeBlocked = locationScope === 'neighbor' && !hasUserLocation;

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

  const {
    data: popularPosts = [],
    isFetching
  } = useQuery({
    queryKey: ['community', 'highlights', locationScope],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: '0',
        size: '1',
        includeHighlights: 'true',
        locationScope
      });
      const response = await api.get(`/boards/community/items?${params.toString()}`, { signal });
      const data = response?.data || response || {};
      return Array.isArray(data.popularItems) ? data.popularItems : [];
    },
    enabled: !isNeighborScopeBlocked,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10
  });
  const isPopularLoading = isFetching;

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
