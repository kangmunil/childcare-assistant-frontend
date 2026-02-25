import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Search, MapPin, Loader2 } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';

const PlaceSearchModal = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [isEnd, setIsEnd] = useState(true);
    const { user } = useStore();
    const observerRef = useRef();

    const searchPlaces = async (searchQuery, pageNum = 1, append = false) => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setError('');

        try {
            // Use user's current location as center preference if available
            const params = new URLSearchParams({ query: searchQuery.trim(), page: pageNum });
            if (user?.lat && user?.lng) {
                params.set('lat', user.lat);
                params.set('lng', user.lng);
                params.set('radius', 5000); // 5km radius preference
            }

            const response = await api.get(`/geo/search?${params.toString()}`);
            const data = response?.data || response;
            const documents = data?.documents || [];
            const meta = data?.meta || { is_end: true };

            if (append) {
                setPlaces(prev => [...prev, ...documents]);
            } else {
                setPlaces(documents);
            }
            setIsEnd(meta.is_end);
            setPage(pageNum);
        } catch (err) {
            console.error(err);
            setError('장소를 검색하는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        searchPlaces(query, 1, false);
    };

    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading && !isEnd) {
            searchPlaces(query, page + 1, true);
        }
    }, [isLoading, isEnd, query, page]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, { rootMargin: '20px' });
        if (observerRef.current) observer.observe(observerRef.current);
        return () => {
            if (observerRef.current) observer.unobserve(observerRef.current);
        };
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
                            placeholder="병원, 약국 등 장소명 입력"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-700 rounded-2xl py-3 pl-4 pr-12 text-sm text-stone-800 dark:text-gray-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-400"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-amber-500"
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

                    {!error && places.length === 0 && !isLoading && query && (
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
