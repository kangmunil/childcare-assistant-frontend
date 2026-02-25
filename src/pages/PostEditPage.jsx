import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const MAX_IMAGE_COUNT = 5;
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']);

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
        reader.readAsDataURL(file);
    });

const PostEditPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { id } = useParams();
    const passedSlug = location.state?.boardSlug;
    const queryClient = useQueryClient();

    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [existingImages, setExistingImages] = useState([]);
    const [deletedExistingImageIds, setDeletedExistingImageIds] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 기존 게시글 데이터 조회
    const { data: post, isLoading, error } = useQuery({
        queryKey: ['community', 'detail', id],
        queryFn: async ({ signal }) => {
            const slug = passedSlug || 'community';
            const response = await api.get(`/boards/${slug}/items/${id}`, { signal });
            return response?.data || response || null;
        },
        enabled: Boolean(id),
        staleTime: 0, // 항상 최신 데이터
    });

    // 조회된 데이터로 폼 초기화
    useEffect(() => {
        if (authLoading) return; // 인증 정보 로딩 중이면 대기

        if (post) {
            setCategory(post.category || '');
            setTitle(post.title || '');
            setContent(post.content || '');
            setDeletedExistingImageIds([]);
            setNewImages([]);

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

            // 본인 게시글이 아니면 접근 차단 (백엔드 isAuthor 또는 ID 비교)
            const isAuthor = post.isAuthor || (user?.id && post.regId && user.id === post.regId);
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

        const filesToAdd = selectedFiles.slice(0, remaining);

        try {
            const previews = await Promise.all(filesToAdd.map((file) => readFileAsDataUrl(file)));
            const nextImages = filesToAdd.map((file, index) => ({
                file,
                preview: previews[index],
            }));

            setNewImages((prev) => [...prev, ...nextImages]);

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

    const handleRemoveExistingImage = (fileId) => {
        setExistingImages((prev) => prev.filter((image) => image.id !== fileId));
        setDeletedExistingImageIds((prev) => (
            prev.includes(fileId) ? prev : [...prev, fileId]
        ));
        setErrorMessage((prev) => (prev === '이미지는 최대 5장까지 첨부할 수 있어요.' ? '' : prev));
    };

    const handleRemoveNewImage = (targetIndex) => {
        setNewImages((prev) => prev.filter((_, index) => index !== targetIndex));
        setErrorMessage((prev) => (prev === '이미지는 최대 5장까지 첨부할 수 있어요.' ? '' : prev));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!category) {
            setErrorMessage('카테고리를 선택해주세요.');
            return;
        }
        if (!title.trim() || !content.trim()) {
            setErrorMessage('제목과 내용을 입력해주세요.');
            return;
        }
        if (existingImages.length + newImages.length > MAX_IMAGE_COUNT) {
            setErrorMessage('이미지는 최대 5장까지 첨부할 수 있어요.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        let textUpdated = false;
        const successfullyDeletedImageIds = [];
        const itemBoardSlug = post?.boardSlug || passedSlug || 'community';

        try {
            await api.put(`/boards/${itemBoardSlug}/items/${id}`, {
                title: title.trim(),
                content: content.trim(),
                category
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
                queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] })
            ]);

            navigate(`/community/${id}${location.search || ''}`, { replace: true });
        } catch (error) {
            if (successfullyDeletedImageIds.length > 0) {
                setDeletedExistingImageIds((prev) => (
                    prev.filter((fileId) => !successfullyDeletedImageIds.includes(fileId))
                ));
            }
            if (textUpdated) {
                setErrorMessage('게시글 내용은 수정되었지만 사진 반영 중 오류가 발생했습니다. 다시 시도해주세요.');
            } else {
                setErrorMessage(error?.message || '게시글 수정에 실패했습니다.');
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
                {/* 헤더 */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-stone-800 dark:text-gray-100">글 수정</h1>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`text-sm font-bold ${isSubmitting
                            ? 'text-stone-300 dark:text-gray-600'
                            : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
                            }`}
                    >
                        {isSubmitting ? '수정 중...' : '완료'}
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* 카테고리 선택 */}
                    <div className="flex gap-2">
                        {['qna', 'daily', 'tip'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${category === cat
                                    ? 'bg-stone-800 text-white shadow-md dark:bg-amber-500 dark:text-gray-900'
                                    : 'bg-stone-50 text-stone-400 border border-stone-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                    }`}
                            >
                                {cat === 'qna' ? '질문해요' : cat === 'daily' ? '일상공유' : '육아꿀팁'}
                            </button>
                        ))}
                    </div>
                    {errorMessage === '카테고리를 선택해주세요.' && (
                        <p className="text-sm text-rose-500">{errorMessage}</p>
                    )}

                    {/* 입력 폼 */}
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
                        {errorMessage && errorMessage !== '카테고리를 선택해주세요.' && (
                            <p className="text-sm text-rose-500">{errorMessage}</p>
                        )}
                    </div>

                    {/* 이미지 첨부 영역 */}
                    <div>
                        <div className="flex gap-3 overflow-x-auto py-2">
                            <label className="w-20 h-20 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-stone-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 shrink-0">
                                <ImageIcon className="w-6 h-6 text-stone-400 dark:text-gray-400" />
                                <span className="text-[10px] text-stone-400 dark:text-gray-400 font-bold">
                                    {existingImages.length + newImages.length}/{MAX_IMAGE_COUNT}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={existingImages.length + newImages.length >= MAX_IMAGE_COUNT}
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
        </div>
    );
};

export default PostEditPage;
