import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Search, MapPin, Loader2 } from 'lucide-react';
import api from '../lib/api';

const dedupePlaces = (baseList, nextList) => {
    const merged = [...baseList];
    const seen = new Set(
        baseList.map((place) => String(place?.id || `${place?.place_name || ''}:${place?.x || ''}:${place?.y || ''}`)),
    );

    nextList.forEach((place) => {
        const key = String(place?.id || `${place?.place_name || ''}:${place?.x || ''}:${place?.y || ''}`);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(place);
    });

    return merged;
};

const PlaceSearchModal = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [isEnd, setIsEnd] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const observerRef = useRef();
    const latestRequestTokenRef = useRef(0);

    const resetSearchState = useCallback(() => {
        setQuery('');
        setPlaces([]);
        setIsLoading(false);
        setError('');
        setPage(1);
        setIsEnd(true);
        setHasSearched(false);
    }, []);

    const searchPlaces = useCallback(async (searchQuery, pageNum = 1, append = false) => {
        const trimmedQuery = String(searchQuery || '').trim();
        if (!trimmedQuery) {
            setPlaces([]);
            setPage(1);
            setIsEnd(true);
            setHasSearched(false);
            setError('검색어를 입력해주세요.');
            return;
        }

        const requestToken = latestRequestTokenRef.current + 1;
        latestRequestTokenRef.current = requestToken;
        setIsLoading(true);
        setError('');
        if (pageNum === 1) {
            setHasSearched(false);
        }

        try {
            // Always search globally.
            // Nearby bias (lat/lng + radius) can over-filter address queries
            // and return empty results for valid distant locations.
            const params = new URLSearchParams({ query: trimmedQuery, page: String(pageNum) });

            const response = await api.get(`/geo/search?${params.toString()}`);
            if (requestToken !== latestRequestTokenRef.current) return;

            const data = response?.data || response;
            const documents = Array.isArray(data?.documents) ? data.documents : [];
            const meta = data?.meta || { is_end: true };

            if (append) {
                setPlaces((prev) => dedupePlaces(prev, documents));
            } else {
                setPlaces(documents);
            }
            setIsEnd(Boolean(meta.is_end));
            setPage(pageNum);
            setHasSearched(true);
        } catch (err) {
            if (requestToken !== latestRequestTokenRef.current) return;
            console.error(err);
            setError('장소를 검색하는 중 오류가 발생했습니다.');
        } finally {
            if (requestToken === latestRequestTokenRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetSearchState();
            return;
        }
        // 모달이 닫힌 뒤 도착하는 이전 요청 응답은 무시한다.
        latestRequestTokenRef.current += 1;
    }, [isOpen, resetSearchState]);

    const handleSearch = (e) => {
        e.preventDefault();
        searchPlaces(query, 1, false);
    };

    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading && !isEnd) {
            searchPlaces(query, page + 1, true);
        }
    }, [isLoading, isEnd, query, page, searchPlaces]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, { rootMargin: '20px' });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [handleObserver]);

    // Handle Enter key in input
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchPlaces(query, 1, false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-900 animate-slide-up sm:p-4 sm:items-center sm:justify-center sm:bg-black/60 sm:backdrop-blur-sm">
            <div className="flex flex-col w-full h-full sm:h-[80vh] sm:max-h-[800px] sm:max-w-md bg-white dark:bg-gray-900 sm:rounded-3xl sm:shadow-2xl sm:overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-stone-800 dark:text-gray-100">장소 찾기</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-stone-100 dark:border-gray-800 bg-stone-50/50 dark:bg-gray-900/50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="어린이집, 놀이터, 병원 등 장소명 입력"
                            value={query}
                            onChange={(e) => {
                                const nextValue = e.target.value;
                                setQuery(nextValue);
                                if (!nextValue.trim()) {
                                    setError('');
                                    setPlaces([]);
                                    setPage(1);
                                    setIsEnd(true);
                                    setHasSearched(false);
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl py-3 pl-4 pr-12 text-sm text-stone-800 dark:text-gray-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-400"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            aria-label="장소 검색"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <div className="p-8 text-center text-rose-500 text-sm">{error}</div>
                    )}

                    {!error && places.length === 0 && !isLoading && hasSearched && (
                        <div className="p-8 text-center text-stone-400 dark:text-gray-500 text-sm">
                            검색 결과가 없습니다.
                        </div>
                    )}

                    <ul className="divide-y divide-stone-100 dark:divide-gray-800">
                        {places.map((place) => (
                            <li key={place.id}>
                                <button
                                    onClick={() => {
                                        onSelect({
                                            placeName: place.place_name,
                                            placeAddress: place.road_address_name || place.address_name,
                                            placeLat: parseFloat(place.y),
                                            placeLng: parseFloat(place.x)
                                        });
                                        onClose();
                                    }}
                                    className="w-full text-left p-4 hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors flex items-start gap-3"
                                >
                                    <MapPin className="w-5 h-5 text-stone-300 dark:text-gray-500 mt-0.5 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-stone-800 dark:text-gray-100 text-base mb-1 truncate">
                                            {place.place_name}
                                        </p>
                                        <p className="text-sm text-stone-500 dark:text-gray-400 truncate">
                                            {place.road_address_name || place.address_name}
                                        </p>
                                        {place.category_name && (
                                            <p className="text-[10px] text-stone-400 dark:text-gray-500 mt-1 truncate">
                                                {place.category_name}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {isLoading && (
                        <div className="py-6 flex justify-center">
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                        </div>
                    )}

                    <div ref={observerRef} className="h-4" />
                </div>

            </div>
        </div>
    );
};

export default PlaceSearchModal;
