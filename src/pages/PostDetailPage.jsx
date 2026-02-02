import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Heart, MessageSquare, Share2, User } from 'lucide-react';
import api from '../lib/api';

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    const fetchPost = async () => {
      if (!id) return;
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await api.get(`/boards/community/items/${id}`);
        const data = response?.data || response || null;
        setPost(data);
      } catch (error) {
        setErrorMessage(error?.message || '게시글을 불러오지 못했습니다.');
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-stone-500 dark:text-gray-400">게시글을 불러오는 중이에요...</p>
      </div>
    );
  }

  if (errorMessage || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-stone-500 dark:text-gray-400 mb-4">삭제되었거나 존재하지 않는 글입니다.</p>
        <button onClick={() => navigate(-1)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 md:pb-0 relative max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-4">
          <button className="text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200"><Share2 className="w-5 h-5" /></button>
          <button className="text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="p-6">
        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-800 flex items-center justify-center border border-stone-200 dark:border-gray-700">
            <User className="w-5 h-5 text-stone-400 dark:text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-800 dark:text-gray-100">{post.regUserName || '알 수 없음'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-gray-500">
              <span>{formatDate(post.regDate)}</span>
              {post.category && (
                <>
                  <span>•</span>
                  <span className="font-bold text-amber-500">{categoryLabels[post.category] || post.category}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-stone-900 dark:text-gray-100 mb-4">{post.title}</h1>
          <p className="text-stone-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 border-b border-stone-100 dark:border-gray-800 pb-6 mb-6">
          <button className="flex items-center gap-1.5 text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-xl text-sm">
            <Heart className="w-4 h-4 fill-rose-500" /> {post.likeCount ?? 0}
          </button>
          <button className="flex items-center gap-1.5 text-stone-500 font-bold bg-stone-50 px-4 py-2 rounded-xl text-sm">
            <MessageSquare className="w-4 h-4" /> {post.commentCount ?? 0}
          </button>
        </div>

        {/* 댓글 영역 (추후 연동 예정) */}
        <div className="space-y-6 pb-20">
          <h3 className="font-bold text-stone-800 dark:text-gray-100">댓글</h3>
          <p className="text-sm text-stone-400 dark:text-gray-500">댓글 기능은 준비 중입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
