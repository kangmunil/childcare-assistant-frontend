import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const PostEditPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const { id } = useParams();
    const passedSlug = location.state?.boardSlug;
    const queryClient = useQueryClient();

    const [boards, setBoards] = useState([]);
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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

            // 본인 게시글이 아니면 접근 차단 (백엔드 isAuthor 또는 ID 비교)
            const isAuthor = post.isAuthor || (user?.id && post.regId && user.id === post.regId);
            if (!isAuthor) {
                alert('수정 권한이 없습니다.');
                navigate(-1);
            }
        }
    }, [post, navigate, user, authLoading]);

    // 게시글 수정 mutation
    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/boards/${post?.boardSlug || 'community'}/items/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community', 'detail', id] });
            queryClient.invalidateQueries({ queryKey: ['community'] });
            navigate(`/community/${id}`);
        },
        onError: (error) => {
            setErrorMessage(error?.message || '게시글 수정에 실패했습니다.');
            setIsSubmitting(false);
        }
    });

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

        setIsSubmitting(true);
        setErrorMessage('');

        updateMutation.mutate({
            title: title.trim(),
            content: content.trim(),
            category
        });
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
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {boards.map((board) => (
                            <button
                                key={board.code}
                                onClick={() => setCategory(board.code)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${category === board.code
                                    ? 'bg-stone-800 text-white shadow-md dark:bg-amber-500 dark:text-gray-900'
                                    : 'bg-stone-50 text-stone-400 border border-stone-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                    }`}
                            >
                                {board.title}
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
                </div>
            </div>
        </div>
    );
};

export default PostEditPage;
