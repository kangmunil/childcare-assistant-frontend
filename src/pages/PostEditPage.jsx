import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Image as ImageIcon,
  X,
  MapPin,
  AlertCircle,
  Globe,
  HelpCircle,
  Coffee,
  Sparkles,
  ShoppingBag,
  BookOpen,
  Map,
  Zap,
  Gift,
  Building2,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PlaceSearchModal from '../components/PlaceSearchModal';
import {
  COMMUNITY_UPLOAD_ACCEPT,
  COMMUNITY_LEGACY_DISPLAY_IMAGE_EXTENSIONS,
  prepareCommunityUploadFiles,
  buildCommunityUploadSelectionMessage,
  mapCommunityUploadApiErrorMessage,
} from '../utils/communityImageUpload';

const MAX_IMAGE_COUNT = 5;
const IMAGE_EXTENSIONS = new Set(COMMUNITY_LEGACY_DISPLAY_IMAGE_EXTENSIONS.map((ext) => String(ext).toLowerCase()));

const categoryMeta = {
  tip: { label: '육아꿀팁', icon: Sparkles },
  qna: { label: '고민상담', icon: HelpCircle },
  item_review: { label: '육아템리뷰', icon: ShoppingBag },
  daily: { label: '자유게시판', icon: Coffee },
  info_share: { label: '정보공유', icon: BookOpen },
  urgent: { label: '긴급/SOS', icon: AlertCircle },
  local_info: { label: '동네정보', icon: Map },
  local_review: { label: '동네후기', icon: Building2 },
  local_gathering: { label: '동네번개', icon: Zap },
  local_share: { label: '동네나눔', icon: Gift },
  hospital: { label: '병원/기관(기존)', icon: Building2 },
};

const CATEGORIES = {
  all: ['tip', 'qna', 'item_review', 'daily', 'info_share'],
  neighbor: ['urgent', 'local_info', 'local_review', 'local_gathering', 'local_share'],
};

const CATEGORY_REQUIRED_MESSAGE = '카테고리를 선택해주세요.';
const TITLE_CONTENT_REQUIRED_MESSAGE = '제목과 내용을 입력해주세요.';
const LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE = '동네후기 글에는 장소를 선택해주세요.';
const SCOPE_CATEGORY_INVALID_MESSAGE = '선택한 게시 대상과 카테고리가 맞지 않아요. 카테고리를 다시 선택해주세요.';

const normalizePostScope = (value) => (value === 'neighbor' ? 'neighbor' : 'all');

const getPostScopeLabel = (postScope) => (normalizePostScope(postScope) === 'neighbor' ? '동네생활' : '육아광장');

const getEditCategories = (postScope, currentCategory) => {
  const scope = normalizePostScope(postScope);
  const base = scope === 'neighbor' ? CATEGORIES.neighbor : CATEGORIES.all;
  if (currentCategory === 'hospital' && !base.includes('hospital')) {
    return [...base, 'hospital'];
  }
  return base;
};

const isValidPlaceSelection = (place) => {
  const lat = place?.placeLat;
  const lng = place?.placeLng;
  return Boolean(
    typeof place?.placeName === 'string'
      && place.placeName.trim()
      && typeof place?.placeAddress === 'string'
      && place.placeAddress.trim()
      && Number.isFinite(lat)
      && lat >= -90
      && lat <= 90
      && Number.isFinite(lng)
      && lng >= -180
      && lng <= 180,
  );
};

const PostEditPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const passedSlug = location.state?.boardSlug;
  const queryClient = useQueryClient();

  const [postScope, setPostScope] = useState('all');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [deletedExistingImageIds, setDeletedExistingImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeSearchModalOpen, setPlaceSearchModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [categorySubmitError, setCategorySubmitError] = useState(false);
  const [placeSubmitError, setPlaceSubmitError] = useState(false);

  const visibleCategories = getEditCategories(postScope, category);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['community', 'detail', id],
    queryFn: async ({ signal }) => {
      const slug = passedSlug || 'community';
      const response = await api.get(`/boards/${slug}/items/${id}`, { signal });
      return response?.data || response || null;
    },
    enabled: Boolean(id),
    staleTime: 0,
  });

  useEffect(() => {
    if (authLoading) return;

    if (post) {
      setPostScope(normalizePostScope(post.postScope));
      setCategory(post.category || '');
      setTitle(post.title || '');
      setContent(post.content || '');
      setDeletedExistingImageIds([]);
      setNewImages([]);
      setErrorMessage('');
      setCategorySubmitError(false);
      setPlaceSubmitError(false);

      const placeCandidate = {
        placeName: post.placeName || '',
        placeAddress: post.placeAddress || '',
        placeLat: post.placeLat,
        placeLng: post.placeLng,
      };
      setSelectedPlace(isValidPlaceSelection(placeCandidate) ? placeCandidate : null);

      const normalizedImages = (Array.isArray(post.files) ? post.files : [])
        .filter((file) => IMAGE_EXTENSIONS.has(String(file?.extension || '').toLowerCase()))
        .map((file) => {
          const directPath = typeof file?.filePath === 'string' && /^https?:\/\//.test(file.filePath)
            ? file.filePath
            : null;

          return {
            id: file?.id,
            url: file?.downloadUrl || directPath || file?.filePath || '',
            name: file?.orgFilename || file?.fileName || '첨부 이미지',
          };
        })
        .filter((file) => file.id && file.url);

      setExistingImages(normalizedImages);

      const isAuthor = Boolean(
        post.isAuthor
        || post.author
        || (user?.id && post.regId && user.id === post.regId)
      );
      if (!isAuthor) {
        alert('수정 권한이 없습니다.');
        navigate(-1);
      }
    }
  }, [post, navigate, user, authLoading]);

  const handleImageUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const currentImageCount = existingImages.length + newImages.length;
    const remaining = MAX_IMAGE_COUNT - currentImageCount;

    if (remaining <= 0) {
      setErrorMessage('이미지는 최대 5장까지 첨부할 수 있어요.');
      e.target.value = '';
      return;
    }

    setIsImageProcessing(true);
    try {
      const { accepted, rejected, truncatedCount } = await prepareCommunityUploadFiles(selectedFiles, { remaining });
      if (accepted.length > 0) {
        setNewImages((prev) => [...prev, ...accepted]);
      }
      const nextMessage = buildCommunityUploadSelectionMessage({ rejected, truncatedCount });
      setErrorMessage(nextMessage || '');
    } catch (uploadError) {
      setErrorMessage(uploadError?.message || '이미지 처리에 실패했습니다.');
    } finally {
      setIsImageProcessing(false);
      e.target.value = '';
    }
  };

  const handleRemoveExistingImage = (fileId) => {
    setExistingImages((prev) => prev.filter((image) => image.id !== fileId));
    setDeletedExistingImageIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
    setErrorMessage((prev) => (prev === '이미지는 최대 5장까지 첨부할 수 있어요.' ? '' : prev));
  };

  const handleRemoveNewImage = (targetIndex) => {
    setNewImages((prev) => prev.filter((_, index) => index !== targetIndex));
    setErrorMessage((prev) => (prev === '이미지는 최대 5장까지 첨부할 수 있어요.' ? '' : prev));
  };

  const handleSubmit = async () => {
    if (isSubmitting || isImageProcessing) return;

    if (!category) {
      setCategorySubmitError(true);
      setPlaceSubmitError(false);
      setErrorMessage(CATEGORY_REQUIRED_MESSAGE);
      return;
    }
    if (category === 'local_review' && !isValidPlaceSelection(selectedPlace)) {
      setCategorySubmitError(false);
      setPlaceSubmitError(true);
      setErrorMessage(LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE);
      return;
    }
    if (!title.trim() || !content.trim()) {
      setCategorySubmitError(false);
      setPlaceSubmitError(false);
      setErrorMessage(TITLE_CONTENT_REQUIRED_MESSAGE);
      return;
    }
    if (existingImages.length + newImages.length > MAX_IMAGE_COUNT) {
      setCategorySubmitError(false);
      setPlaceSubmitError(false);
      setErrorMessage('이미지는 최대 5장까지 첨부할 수 있어요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setCategorySubmitError(false);
    setPlaceSubmitError(false);

    let textUpdated = false;
    const successfullyDeletedImageIds = [];
    const itemBoardSlug = post?.boardSlug || passedSlug || 'community';

    try {
      await api.put(`/boards/${itemBoardSlug}/items/${id}`, {
        title: title.trim(),
        content: content.trim(),
        category,
        placeName: selectedPlace?.placeName || null,
        placeAddress: selectedPlace?.placeAddress || null,
        placeLat: selectedPlace?.placeLat || null,
        placeLng: selectedPlace?.placeLng || null,
      });
      textUpdated = true;

      const boardId = post?.boardId;
      const itemId = post?.id || (id ? Number(id) : null);

      if ((deletedExistingImageIds.length > 0 || newImages.length > 0) && (!boardId || !itemId)) {
        throw new Error('게시글은 수정되었지만 사진 반영을 위한 게시글 정보를 찾지 못했습니다.');
      }

      for (const fileId of deletedExistingImageIds) {
        await api.delete(`/boards/${boardId}/items/${itemId}/files/${fileId}`);
        successfullyDeletedImageIds.push(fileId);
      }

      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(({ file }) => {
          formData.append('files', file);
        });
        await api.post(`/boards/${boardId}/items/${itemId}/files`, formData);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community', 'detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['community'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] }),
      ]);

      navigate(`/community/${id}${location.search || ''}`, { replace: true });
    } catch (submitError) {
      if (successfullyDeletedImageIds.length > 0) {
        setDeletedExistingImageIds((prev) => prev.filter((fileId) => !successfullyDeletedImageIds.includes(fileId)));
      }

      if (!textUpdated && submitError?.code === 'BOARD_031') {
        setCategorySubmitError(false);
        setPlaceSubmitError(true);
        setErrorMessage(LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE);
      } else if (!textUpdated && submitError?.code === 'BOARD_032') {
        setCategorySubmitError(true);
        setPlaceSubmitError(false);
        setErrorMessage(SCOPE_CATEGORY_INVALID_MESSAGE);
      } else if (textUpdated) {
        setCategorySubmitError(false);
        setPlaceSubmitError(false);
        setErrorMessage('게시글 내용은 수정되었지만 사진 반영 중 오류가 발생했습니다. 다시 시도해주세요.');
      } else {
        setCategorySubmitError(false);
        setPlaceSubmitError(false);
        setErrorMessage(mapCommunityUploadApiErrorMessage(submitError, '게시글 수정에 실패했습니다.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-stone-500 dark:text-gray-400">게시글을 불러오는 중이에요...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-stone-500 dark:text-gray-400 mb-4">게시글을 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto w-full bg-white dark:bg-gray-900 rounded-3xl border border-stone-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-stone-800 dark:text-gray-100">글 수정</h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isImageProcessing}
            className={`text-sm font-bold ${(isSubmitting || isImageProcessing)
              ? 'text-stone-300 dark:text-gray-600'
              : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
              }`}
          >
            {isImageProcessing ? '이미지 준비 중...' : isSubmitting ? '수정 중...' : '완료'}
          </button>
        </div>

        <div className="p-6 space-y-6 md:space-y-8">
          <div className={`rounded-2xl border p-4 ${postScope === 'neighbor'
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/40'
            : 'bg-stone-50 border-stone-200 dark:bg-gray-800/50 dark:border-gray-700'
            }`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-bold text-stone-700 dark:text-gray-200">게시 대상</p>
              <span className="text-[11px] font-bold text-stone-400 dark:text-gray-500">수정 불가</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-700 text-[13px] font-bold text-stone-800 dark:text-gray-100">
              {postScope === 'neighbor' ? (
                <MapPin className="w-4 h-4 text-amber-500" />
              ) : (
                <Globe className="w-4 h-4 text-stone-500 dark:text-gray-400" />
              )}
              {getPostScopeLabel(postScope)}
            </div>
            <p className="mt-2 text-[11px] text-stone-500 dark:text-gray-400">게시 대상은 글 작성 후 변경할 수 없어요.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-stone-800 dark:text-gray-200 ml-1">카테고리</label>
            <div className={`flex gap-2 flex-wrap rounded-2xl p-2 -m-2 border transition-colors ${categorySubmitError
              ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'
              : 'border-transparent'
              }`}>
              {visibleCategories.map((cat) => {
                const isSelected = category === cat;
                const meta = categoryMeta[cat] || { label: cat, icon: Coffee };
                const Icon = meta.icon;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setCategorySubmitError(false);
                      if (errorMessage === CATEGORY_REQUIRED_MESSAGE || errorMessage === SCOPE_CATEGORY_INVALID_MESSAGE) {
                        setErrorMessage('');
                      }
                      if (cat !== 'local_review') {
                        setSelectedPlace(null);
                        setPlaceSubmitError(false);
                        if (errorMessage === LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE) {
                          setErrorMessage('');
                        }
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-bold border transition-all ${isSelected
                      ? postScope === 'neighbor'
                        ? 'bg-amber-400 text-stone-900 border-amber-400 shadow-sm'
                        : 'bg-stone-800 text-white border-stone-800 shadow-sm dark:bg-gray-700 dark:border-gray-700'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected && cat === 'urgent' ? 'animate-pulse' : ''}`} strokeWidth={2.3} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            {categorySubmitError && errorMessage && (
              <p className="text-[13px] text-rose-500 ml-1 animate-pulse font-medium">{errorMessage}</p>
            )}
          </div>

          {category === 'local_review' && (
            <div className="bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-teal-800 dark:text-teal-300">후기 장소</p>
                <button
                  type="button"
                  onClick={() => setPlaceSearchModalOpen(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-full transition-colors"
                >
                  장소 변경
                </button>
              </div>

              {selectedPlace ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-teal-200 dark:border-teal-800 flex items-start gap-3 relative">
                  <MapPin className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 pr-8">
                    <p className="font-bold text-stone-800 dark:text-gray-100 truncate">{selectedPlace.placeName}</p>
                    <p className="text-xs text-stone-500 dark:text-gray-400 truncate mt-0.5">{selectedPlace.placeAddress}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    className="absolute top-2 right-2 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-teal-200 dark:border-teal-800 px-3 py-3 text-xs text-teal-700 dark:text-teal-300">
                  장소를 선택하면 후기 대상 위치가 함께 저장돼요.
                </div>
              )}

              {placeSubmitError && (
                <div className="flex flex-wrap items-center gap-2 ml-1">
                  <p className="text-[13px] font-bold text-rose-500">{LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE}</p>
                  <button
                    type="button"
                    onClick={() => setPlaceSearchModalOpen(true)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200 underline underline-offset-4"
                  >
                    장소 찾기
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-stone-800 dark:text-gray-100 placeholder:text-stone-300 dark:placeholder:text-gray-500 bg-transparent focus:outline-none"
            />
            <textarea
              placeholder="내용을 입력하세요. (육아 고민, 자랑, 팁 등 자유롭게 나눠요)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 text-base text-stone-600 dark:text-gray-200 placeholder:text-stone-300 dark:placeholder:text-gray-500 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
            {errorMessage && ![CATEGORY_REQUIRED_MESSAGE, LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE, SCOPE_CATEGORY_INVALID_MESSAGE].includes(errorMessage) && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <p className="text-sm text-rose-500">{errorMessage}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 ml-1 mt-2">
              <label className="text-[13px] font-bold text-stone-800 dark:text-gray-200">사진 첨부</label>
              <span className="text-[11px] font-bold text-stone-500 dark:text-gray-400 bg-stone-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">최대 5장</span>
              {isImageProcessing && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">이미지 최적화 중...</span>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto py-2">
              <label className={`w-20 h-20 rounded-2xl border flex flex-col items-center justify-center gap-1.5 shrink-0 ${(existingImages.length + newImages.length >= MAX_IMAGE_COUNT || isImageProcessing)
                ? 'bg-stone-50 border-stone-200 opacity-50 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700'
                : 'bg-stone-50 border-dashed border-stone-300 cursor-pointer hover:bg-stone-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}>
                <ImageIcon className="w-5 h-5 text-stone-400 dark:text-gray-400" />
                <span className="text-[10px] text-stone-400 dark:text-gray-400 font-bold">
                  {existingImages.length + newImages.length}/{MAX_IMAGE_COUNT}
                </span>
                <input
                  type="file"
                  accept={COMMUNITY_UPLOAD_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={existingImages.length + newImages.length >= MAX_IMAGE_COUNT || isImageProcessing}
                />
              </label>

              {existingImages.map((image) => (
                <div
                  key={`existing-${image.id}`}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 shrink-0"
                >
                  <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(image.id)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
                    aria-label="기존 이미지 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {newImages.map((image, index) => (
                <div
                  key={`new-${index}`}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 shrink-0"
                >
                  <img src={image.preview} alt="새 이미지 미리보기" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white"
                    aria-label="새 이미지 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PlaceSearchModal
        isOpen={placeSearchModalOpen}
        onClose={() => setPlaceSearchModalOpen(false)}
        onSelect={(place) => {
          setSelectedPlace(place);
          setPlaceSubmitError(false);
          if (errorMessage === LOCAL_REVIEW_PLACE_REQUIRED_MESSAGE) {
            setErrorMessage('');
          }
        }}
      />
    </div>
  );
};

export default PostEditPage;
