import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Image as ImageIcon, X, MapPin, AlertCircle, HelpCircle, Coffee, Sparkles, Building2, Globe, ShoppingBag, BookOpen, Map, Zap, Gift } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';
import LocationSettingModal from '../components/LocationSettingModal';
import PlaceSearchModal from '../components/PlaceSearchModal';
import { getRegionLabels } from '../utils/regionLabel';

const MAX_IMAGE_COUNT = 5;

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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });

const PostWritePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, updateUserInfo } = useStore();
  const viewLocationScope = searchParams.get('locationScope') === 'neighbor' ? 'neighbor' : 'all';
  const legacyBoardParam = searchParams.get('board') || '';
  const hasUserLocation = Boolean(
    (typeof user?.regionCode === 'string' && user.regionCode.trim())
    || (typeof user?.postcode === 'string' && user.postcode.trim())
  );
  const initialPostScope = viewLocationScope === 'neighbor' && hasUserLocation ? 'neighbor' : 'all';
  const userRegionLabels = getRegionLabels(user?.regionName);
  const [category, setCategory] = useState(() => (
    (initialPostScope === 'neighbor' ? CATEGORIES.neighbor : CATEGORIES.all).includes(legacyBoardParam)
      ? legacyBoardParam
      : ''
  ));
  const [images, setImages] = useState([]); // [{ file, preview }]
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postScope, setPostScope] = useState(initialPostScope);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [placeSearchModalOpen, setPlaceSearchModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null); // { placeName, placeAddress, placeLat, placeLng }
  const [locationSubmitError, setLocationSubmitError] = useState(false);
  const [pendingNeighborPostScope, setPendingNeighborPostScope] = useState(false);

  const handleImageUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const remaining = MAX_IMAGE_COUNT - images.length;
    if (remaining <= 0) {
      setErrorMessage('이미지는 최대 5장까지 첨부할 수 있어요.');
      e.target.value = '';
      return;
    }

    const filesToAdd = selectedFiles.slice(0, remaining);

    try {
      const previews = await Promise.all(filesToAdd.map((file) => readFileAsDataUrl(file)));
      const nextImages = filesToAdd.map((file, index) => ({
        file,
        preview: previews[index]
      }));
      setImages((prev) => [...prev, ...nextImages]);
      if (selectedFiles.length > remaining) {
        setErrorMessage('이미지는 최대 5장까지 첨부할 수 있어요.');
      } else {
        setErrorMessage('');
      }
    } catch (error) {
      setErrorMessage(error?.message || '이미지 처리에 실패했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSelectPostScope = (nextScope) => {
    if (nextScope === 'neighbor' && !hasUserLocation) {
      setPendingNeighborPostScope(true);
      setPostScope('all');
      setLocationSubmitError(true);
      setErrorMessage('우리 동네 커뮤니티에 글을 올리려면 동네 설정이 필요해요.');
      setLocationModalOpen(true);
      return;
    }

    setPendingNeighborPostScope(false);
    setPostScope(nextScope === 'neighbor' ? 'neighbor' : 'all');
    if (locationSubmitError) {
      setLocationSubmitError(false);
    }
    if (errorMessage === '우리 동네 커뮤니티에 글을 올리려면 동네 설정이 필요해요.') {
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (postScope === 'neighbor' && !hasUserLocation) {
      setLocationSubmitError(true);
      setErrorMessage('우리 동네 커뮤니티에 글을 올리려면 동네 설정이 필요해요.');
      setLocationModalOpen(true);
      return;
    }
    if (!category) {
      setLocationSubmitError(false);
      setErrorMessage('카테고리를 선택해주세요.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setLocationSubmitError(false);
      setErrorMessage('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setLocationSubmitError(false);

    try {
      const createResponse = await api.post('/boards/community/items', {
        title: title.trim(),
        content: content.trim(),
        category,
        postScope,
        placeName: selectedPlace?.placeName || null,
        placeAddress: selectedPlace?.placeAddress || null,
        placeLat: selectedPlace?.placeLat || null,
        placeLng: selectedPlace?.placeLng || null
      });

      const createdItem = createResponse?.data || createResponse || null;

      if (images.length > 0) {
        const boardId = createdItem?.boardId;
        const itemId = createdItem?.id;

        if (!boardId || !itemId) {
          throw new Error('게시글은 등록되었지만 이미지 업로드를 위한 게시글 정보를 찾지 못했습니다.');
        }

        const formData = new FormData();
        images.forEach(({ file }) => {
          formData.append('files', file);
        });

        await api.post(`/boards/${boardId}/items/${itemId}/files`, formData);
      }

      await queryClient.invalidateQueries({ queryKey: ['community'] });
      await queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] });
      navigate(`/community?locationScope=${postScope}`);
    } catch (error) {
      if (error?.code === 'BOARD_013') {
        setLocationSubmitError(true);
        setErrorMessage('동네 인증 정보가 필요해요. 다시 동네를 설정해주세요.');
        setLocationModalOpen(true);
      } else {
        setLocationSubmitError(false);
        setErrorMessage(error?.message || '글 작성에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto w-full bg-white dark:bg-gray-900 rounded-3xl border border-stone-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* 1. 헤더 */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-stone-800 dark:text-gray-100">
            커뮤니티 글쓰기
          </h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`text-sm font-bold ${isSubmitting
              ? 'text-stone-300 dark:text-gray-600'
              : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
              }`}
          >
            {isSubmitting ? '등록 중...' : '완료'}
          </button>
        </div>

        <div className="p-6 space-y-6 md:space-y-8">
          <div className="flex flex-col gap-4">
            <div className={`flex flex-col gap-3 rounded-2xl p-4 border ${hasUserLocation
              ? 'bg-stone-50 border-stone-200 dark:bg-gray-800/50 dark:border-gray-700'
              : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
              }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-[15px] font-extrabold text-stone-800 dark:text-gray-100 tracking-tight">
                  {hasUserLocation ? (
                    <>
                      <MapPin className="w-4 h-4 text-amber-500" strokeWidth={2.5} />
                      {userRegionLabels.guDongLabel || userRegionLabels.raw || '인증 필요'}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-500" strokeWidth={2.5} />
                      <span className="text-rose-700 dark:text-rose-300">내 동네 설정이 필요해요</span>
                    </>
                  )}
                </div>
                {(locationSubmitError || !hasUserLocation) && (
                  <button
                    type="button"
                    onClick={() => setLocationModalOpen(true)}
                    className="text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-4 decoration-stone-300 dark:decoration-gray-600"
                  >
                    동네 설정하기
                  </button>
                )}
              </div>

              <div className="flex rounded-xl bg-white dark:bg-gray-900 p-1 border border-stone-200 dark:border-gray-700 mt-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPostScope('all');
                    if (!CATEGORIES.all.includes(category)) setCategory('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] font-bold transition-all duration-200 ${postScope === 'all'
                    ? 'bg-stone-800 text-white shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                    }`}
                >
                  <Globe className={`w-4 h-4 ${postScope === 'all' ? 'text-stone-300 dark:text-gray-300' : ''}`} />
                  육아광장
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPostScope('neighbor');
                    if (!CATEGORIES.neighbor.includes(category)) setCategory('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] font-bold transition-all duration-200 ${postScope === 'neighbor'
                    ? 'bg-amber-400 text-stone-900 shadow-sm dark:bg-amber-500'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                    }`}
                >
                  <MapPin className={`w-4 h-4 ${postScope === 'neighbor' ? 'text-amber-900' : ''}`} />
                  동네생활
                </button>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-gray-400 ml-1">
                {postScope === 'neighbor'
                  ? '문학동 이웃들에게만 보이는 실시간 정보와 소통 공간입니다.'
                  : '전국의 모든 BebeHelper 부모님들과 지식과 고민을 나눕니다.'}
              </p>
            </div>
          </div>

          {/* 2. 카테고리 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-stone-800 dark:text-gray-200 ml-1">어떤 이야기를 나누고 싶으신가요?</label>
            <div className="flex gap-2 flex-wrap">
              {(postScope === 'neighbor' ? CATEGORIES.neighbor : CATEGORIES.all).map((cat) => {
                const isSelected = category === cat;
                const { label, icon: Icon, color } = categoryMeta[cat] || { label: cat, icon: Coffee, color: 'stone' };

                const colorStyles = {
                  rose: isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200 dark:shadow-none'
                    : 'bg-white border-stone-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
                  orange: isSelected
                    ? 'bg-stone-800 text-amber-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-amber-500 dark:text-gray-900 dark:border-amber-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  emerald: isSelected
                    ? 'bg-stone-800 text-emerald-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-emerald-500 dark:text-gray-900 dark:border-emerald-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  indigo: isSelected
                    ? 'bg-stone-800 text-indigo-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-indigo-500 dark:text-gray-900 dark:border-indigo-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  teal: isSelected
                    ? 'bg-stone-800 text-teal-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-teal-500 dark:text-gray-900 dark:border-teal-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  sky: isSelected
                    ? 'bg-stone-800 text-sky-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-sky-500 dark:text-gray-900 dark:border-sky-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  yellow: isSelected
                    ? 'bg-stone-800 text-yellow-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-yellow-500 dark:text-gray-900 dark:border-yellow-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  violet: isSelected
                    ? 'bg-stone-800 text-violet-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-violet-500 dark:text-gray-900 dark:border-violet-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  pink: isSelected
                    ? 'bg-stone-800 text-pink-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-pink-500 dark:text-gray-900 dark:border-pink-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                  cyan: isSelected
                    ? 'bg-stone-800 text-cyan-400 border-stone-800 shadow-md shadow-stone-200 dark:shadow-none dark:bg-cyan-500 dark:text-gray-900 dark:border-cyan-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700',
                };

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      if (cat !== 'local_review') setSelectedPlace(null);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-bold border transition-all duration-200 ${colorStyles[color || 'orange']}`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected && cat === 'urgent' ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                    {label}
                  </button>
                );
              })}
            </div>
            {errorMessage === '카테고리를 선택해주세요.' && (
              <p className="text-[13px] text-rose-500 ml-1 animate-pulse font-medium">{errorMessage}</p>
            )}
          </div>

          {/* 3. 장소 검색 (병원/기관 카테고리 선택 시) */}
          {category === 'local_review' && (
            <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
                  어느 곳에 대한 후기인가요?
                </p>
                <button
                  onClick={() => setPlaceSearchModalOpen(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-full transition-colors"
                >
                  장소 찾기
                </button>
              </div>

              {selectedPlace && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-teal-200 dark:border-teal-800 flex items-start gap-3 relative">
                  <MapPin className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 pr-8">
                    <p className="font-bold text-stone-800 dark:text-gray-100 truncate">{selectedPlace.placeName}</p>
                    <p className="text-xs text-stone-500 dark:text-gray-400 truncate mt-0.5">{selectedPlace.placeAddress}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="absolute top-2 right-2 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. 입력 폼 */}
          <div className="flex flex-col gap-0 border border-stone-200 dark:border-gray-700 rounded-3xl overflow-hidden focus-within:border-amber-400 dark:focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-50 dark:focus-within:ring-amber-500/10 transition-all duration-300 bg-white dark:bg-gray-800 shadow-sm">
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 text-lg md:text-xl font-bold text-stone-900 dark:text-gray-100 placeholder:text-stone-300 dark:placeholder:text-gray-500 bg-transparent focus:outline-none border-b border-stone-100 dark:border-gray-700/50"
            />
            <textarea
              placeholder="내용을 편하게 작성해주세요. (육아 고민, 자랑, 꿀팁 등)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[280px] p-5 text-[15px] md:text-base text-stone-700 dark:text-gray-200 placeholder:text-stone-300 dark:placeholder:text-gray-500 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
          </div>
          {errorMessage && errorMessage !== '카테고리를 선택해주세요.' && (
            <div className="flex flex-wrap items-center gap-1.5 ml-1 mt-1">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <p className="text-[13px] font-bold text-rose-500">{errorMessage}</p>
              {locationSubmitError && (
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="text-xs font-bold text-stone-600 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-4 decoration-stone-300 dark:decoration-gray-600 ml-2"
                >
                  동네 설정하기
                </button>
              )}
            </div>
          )}

          {/* 5. 이미지 첨부 영역 */}
          <div>
            <div className="flex items-center gap-2 mb-3 ml-1 mt-2">
              <label className="text-[13px] font-bold text-stone-800 dark:text-gray-200">사진 첨부</label>
              <span className="text-[11px] font-bold text-stone-500 dark:text-gray-400 bg-stone-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">최대 5장</span>
            </div>
            <div className="flex gap-3 overflow-x-auto py-1 no-scrollbar">
              {/* 사진 추가 버튼 */}
              <label className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all shrink-0 border ${images.length >= MAX_IMAGE_COUNT ? 'bg-stone-50 border-stone-200 opacity-50 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700' : 'bg-stone-50 border-dashed border-stone-300 cursor-pointer hover:bg-stone-100 hover:border-stone-400 dark:bg-gray-800/80 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500'}`}>
                <div className={`p-1.5 rounded-full mt-1 ${images.length >= MAX_IMAGE_COUNT ? 'bg-stone-200 text-stone-400 dark:bg-gray-700 dark:text-gray-500' : 'bg-white text-stone-400 shadow-sm border border-stone-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-stone-400 dark:text-gray-500 font-medium">
                  <span className={images.length > 0 ? 'text-amber-500 font-bold' : ''}>{images.length}</span> / {MAX_IMAGE_COUNT}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={images.length >= MAX_IMAGE_COUNT}
                />
              </label>

              {/* 미리보기 이미지들 */}
              {images.map((image, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 dark:border-gray-700 shrink-0 group shadow-sm">
                  <img src={image.preview} alt={`preview-${idx}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-md rounded-full p-1 text-white hover:bg-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-1">
                      <p className="text-[9px] text-center font-bold text-white pt-2">대표사진</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LocationSettingModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={async (locationData) => {
          const result = await updateUserInfo(locationData);
          if (result?.success !== false) {
            setLocationSubmitError(false);
            setErrorMessage('');
            if (pendingNeighborPostScope) {
              setPostScope('neighbor');
              setPendingNeighborPostScope(false);
            }
            await queryClient.invalidateQueries({ queryKey: ['community'] });
            await queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] });
          }
          return result;
        }}
        currentRegionName={user?.regionName}
      />

      <PlaceSearchModal
        isOpen={placeSearchModalOpen}
        onClose={() => setPlaceSearchModalOpen(false)}
        onSelect={(place) => setSelectedPlace(place)}
      />
    </div>
  );
};

export default PostWritePage;
