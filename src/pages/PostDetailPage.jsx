import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreHorizontal, Heart, MessageSquare, Share2, User, Send, Trash2, Edit3, X, Pin, Lock } from 'lucide-react';
import api from '../lib/api';
import { getLocalLikeMap, setLocalLike } from '../lib/likeStorage';
import { supabase } from '../api/supabase';
import { useAuth } from '../contexts/AuthContext';

const PostDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { id } = useParams();
  const passedSlug = location.state?.boardSlug;
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [isReplySecret, setIsReplySecret] = useState(false);
  const commentTextareaRef = useRef(null);
  const replyTextareaRef = useRef(null);
  const queryClient = useQueryClient();

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

  const autoResize = (element, maxRows) => {
    if (!element) return;
    element.style.height = 'auto';
    const styles = window.getComputedStyle(element);
    const lineHeight = parseFloat(styles.lineHeight) || 20;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
  };

  const {
    data: post,
    isLoading: isPostLoading,
    error: postError
  } = useQuery({
    queryKey: ['community', 'detail', id],
    queryFn: async ({ signal }) => {
      const slug = passedSlug || 'community';
      const response = await api.get(`/boards/${slug}/items/${id}`, { signal });
      const data = response?.data || response || null;
      const localLikeMap = getLocalLikeMap();
      if (!data) return null;
      return {
        ...data,
        likeCount: data?.likeCount ?? 0,
        liked: data?.liked ?? localLikeMap[id] ?? false
      };
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  useEffect(() => {
    autoResize(commentTextareaRef.current, 3);
  }, [commentInput]);

  useEffect(() => {
    autoResize(replyTextareaRef.current, 2);
  }, [replyInput, replyTarget]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(Boolean(data?.session));
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const {
    data: commentsData,
    error: commentsError
  } = useQuery({
    queryKey: ['community', 'comments', id],
    queryFn: async ({ signal }) => {
      const slug = post?.boardSlug || 'community';
      const response = await api.get(`/boards/${slug}/items/${id}/comments`, { signal });
      const data = response?.data || response || [];
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  const comments = Array.isArray(commentsData) ? commentsData : [];
  const commentsErrorMessage = commentsError ? '댓글을 불러오지 못했습니다.' : '';

  const groupedComments = useMemo(() => {
    const map = new Map();
    const roots = [];

    comments.forEach((comment) => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach((comment) => {
      const node = map.get(comment.id);
      if (comment.parentSeq) {
        const parent = map.get(comment.parentSeq);
        if (parent) {
          parent.replies.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [comments]);

  const createTempComment = (payload) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    return {
      id: tempId,
      tempId,
      itemId: Number(id),
      parentSeq: payload.parentSeq ?? null,
      depth: payload.parentSeq ? 1 : 0,
      content: payload.content,
      regUserName: '나',
      regDate: new Date().toISOString(),
      likeCount: 0,
      liked: false,
      isAuthor: true,
      isPending: true,
      isError: false,
      retryPayload: payload
    };
  };

  const updateCommentsCache = (updater) => {
    queryClient.setQueryData(['community', 'comments', id], (old) => {
      const next = updater(Array.isArray(old) ? old : []);
      return next;
    });
  };

  const updateCommentCountCache = ({ targetId, increment }) => {
    const safeIncrement = Number.isFinite(increment) ? increment : 0;
    if (!safeIncrement || !targetId) return;

    queryClient.setQueryData(['community', 'detail', String(targetId)], (old) => {
      if (!old || typeof old !== 'object') return old;
      const nextCount = Math.max(0, (old.commentCount ?? 0) + safeIncrement);
      return {
        ...old,
        commentCount: nextCount
      };
    });

    queryClient.setQueriesData({ queryKey: ['community'] }, (old) => {
      if (!old || Array.isArray(old)) return old;
      const hasList = Array.isArray(old.items) || Array.isArray(old.fixedItems) || Array.isArray(old.popularItems);
      if (!hasList) return old;

      const updateItems = (items) => (
        Array.isArray(items)
          ? items.map((item) => {
            if (item.id !== targetId) return item;
            const nextCount = Math.max(0, (item.commentCount ?? 0) + safeIncrement);
            return { ...item, commentCount: nextCount };
          })
          : items
      );

      return {
        ...old,
        items: updateItems(old.items),
        fixedItems: updateItems(old.fixedItems),
        popularItems: updateItems(old.popularItems)
      };
    });
  };

  const replaceTempComment = (tempId, comment) => {
    updateCommentsCache((prev) => prev.map((item) => (item.id === tempId ? comment : item)));
  };

  const markTempFailed = (tempId, payload) => {
    updateCommentsCache((prev) => prev.map((item) => (
      item.id === tempId
        ? { ...item, isPending: false, isError: true, retryPayload: payload }
        : item
    )));
  };

  const removeTempComment = (tempId) => {
    updateCommentsCache((prev) => prev.filter((item) => item.id !== tempId));
  };

  // 권한 확인 (백엔드 isAuthor 또는 프론트엔드 ID 비교)
  const isAuthor = useMemo(() => {
    if (!post) return false;
    if (post.isAuthor) return true;
    return user?.id && post.regId && user.id === post.regId;
  }, [post, user]);

  // 로그인 상태 변경 시 데이터 갱신
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['community', 'detail', id] });
    }
  }, [user, id, queryClient]);

  const commentMutation = useMutation({
    mutationFn: ({ __tempId, ...payload }) => api.post(`/boards/${post?.boardSlug || 'community'}/items/${id}/comments`, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['community', 'comments', id] });
      const previousComments = queryClient.getQueryData(['community', 'comments', id]);
      const isRetry = Boolean(payload.__tempId);

      if (isRetry) {
        updateCommentsCache((prev) => prev.map((item) => (
          item.id === payload.__tempId
            ? { ...item, isPending: true, isError: false }
            : item
        )));
        updateCommentCountCache({ targetId: Number(id), increment: 1 });
        return { previousComments, tempId: payload.__tempId, payload, incremented: true };
      }

      const tempComment = createTempComment(payload);
      updateCommentsCache((prev) => [...prev, tempComment]);
      updateCommentCountCache({ targetId: Number(id), increment: 1 });
      return { previousComments, tempId: tempComment.id, payload, incremented: true };
    },
    onSuccess: (response, payload, context) => {
      const data = response?.data || response || null;
      if (data && context?.tempId) {
        replaceTempComment(context.tempId, data);
      }
    },
    onError: (error, payload, context) => {
      if (context?.incremented) {
        updateCommentCountCache({ targetId: Number(id), increment: -1 });
      }
      if (context?.tempId) {
        markTempFailed(context.tempId, payload);
      }
      setCommentError(error?.message || '댓글 작성에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    }
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => api.put(`/boards/${post?.boardSlug || 'community'}/items/${id}/comments/${commentId}`, { content }),
    onSuccess: () => {
      cancelEditComment();
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    },
    onError: (error) => {
      setCommentError(error?.message || '댓글 수정에 실패했습니다.');
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: () => api.delete(`/boards/${post?.boardSlug || 'community'}/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
      navigate('/community');
    },
    onError: (error) => {
      alert(error?.message || '게시글 삭제에 실패했습니다.');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/boards/${post?.boardSlug || 'community'}/items/${id}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    },
    onError: (error) => {
      setCommentError(error?.message || '댓글 삭제에 실패했습니다.');
    }
  });

  const pinCommentMutation = useMutation({
    mutationFn: ({ commentId, pinned }) => {
      const slug = post?.boardSlug || 'community';
      return pinned
        ? api.delete(`/boards/${slug}/items/${id}/comments/${commentId}/pin`)
        : api.post(`/boards/${slug}/items/${id}/comments/${commentId}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    },
    onError: (error) => {
      setCommentError(error?.message || '댓글 고정에 실패했습니다.');
    }
  });

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      setCommentError('로그인 후 댓글을 작성할 수 있어요.');
      return;
    }
    if (!commentInput.trim() || commentMutation.isPending) return;
    setCommentError('');

    const payload = {
      content: commentInput.trim(),
      parentSeq: null,
      secretYn: isSecret ? 'Y' : 'N'
    };
    setCommentInput('');
    setIsSecret(false);
    commentMutation.mutate(payload);
  };

  const handleSubmitReply = (parent) => {
    if (!isAuthenticated) {
      setCommentError('로그인 후 댓글을 작성할 수 있어요.');
      return;
    }
    if (!replyInput.trim() || commentMutation.isPending) return;
    setCommentError('');

    const payload = {
      content: replyInput.trim(),
      parentSeq: parent.id,
      secretYn: isReplySecret ? 'Y' : 'N'
    };
    setReplyInput('');
    setReplyTarget(null);
    setIsReplySecret(false);
    commentMutation.mutate(payload);
  };

  const retryComment = (comment) => {
    if (!comment?.retryPayload || commentMutation.isPending) return;
    setCommentError('');
    commentMutation.mutate({
      ...comment.retryPayload,
      __tempId: comment.id
    });
  };

  const startEditComment = (comment) => {
    if (!comment?.isAuthor) return;
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const submitEditComment = () => {
    if (!editingCommentId || !editingContent.trim()) return;
    setCommentError('');
    editCommentMutation.mutate({
      commentId: editingCommentId,
      content: editingContent.trim()
    });
  };

  const updateLikeCache = ({ targetId, likeCount, liked }) => {
    queryClient.setQueryData(['community', 'detail', String(targetId)], (old) => {
      if (!old || typeof old !== 'object') return old;
      return {
        ...old,
        likeCount,
        liked
      };
    });

    queryClient.setQueriesData({ queryKey: ['community'] }, (old) => {
      if (!old || Array.isArray(old)) return old;
      const hasList = Array.isArray(old.items) || Array.isArray(old.fixedItems) || Array.isArray(old.popularItems);
      if (!hasList) return old;

      const updateItems = (items) => (
        Array.isArray(items)
          ? items.map((item) => (
            item.id === targetId
              ? { ...item, likeCount, liked }
              : item
          ))
          : items
      );

      return {
        ...old,
        items: updateItems(old.items),
        fixedItems: updateItems(old.fixedItems),
        popularItems: updateItems(old.popularItems)
      };
    });
  };

  const errorMessage = postError?.message || '';

  if (isPostLoading) {
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
    <div className="min-h-screen pb-24 md:pb-0 relative px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto w-full bg-white dark:bg-gray-900 rounded-3xl border border-stone-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-4 items-center">
            <button className="text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200"><Share2 className="w-5 h-5" /></button>
            <div className="relative">
              <button
                onClick={() => setShowPostMenu(!showPostMenu)}
                className="text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showPostMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowPostMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-stone-100 dark:border-gray-700 z-40 overflow-hidden">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            setShowPostMenu(false);
                            navigate(`/community/${id}/edit`, { state: { boardSlug: post?.boardSlug } });
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          수정
                        </button>
                        <button
                          onClick={() => {
                            setShowPostMenu(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </button>
                      </>
                    )}
                    {!isAuthor && (
                      <div className="px-4 py-3 text-sm text-stone-400 dark:text-gray-500">
                        신고하기
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
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
              <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-gray-400">
                <span>{formatDate(post.regDate)}</span>
                {post.updateDate && (
                  <span className="text-stone-400 dark:text-gray-500 ml-1">(수정됨)</span>
                )}
                {post.category && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-amber-500 dark:text-amber-400">{post.boardTitle || post.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-stone-900 dark:text-gray-100 mb-4">{post.title}</h1>
            <p className="text-stone-600 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-4 border-b border-stone-100 dark:border-gray-800 pb-6 mb-6">
            <button
              type="button"
              onClick={async () => {
                if (isLikeLoading) return;
                const wasLiked = !!post.liked;
                const previousCount = post.likeCount ?? 0;
                const nextCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));

                setIsLikeLoading(true);
                updateLikeCache({ targetId: post.id, likeCount: nextCount, liked: !wasLiked });
                setLocalLike(post.id, !wasLiked);

                try {
                  const response = wasLiked
                    ? await api.delete(`/boards/${post.boardSlug || 'community'}/items/${post.id}/like`)
                    : await api.post(`/boards/${post.boardSlug || 'community'}/items/${post.id}/like`);
                  const data = response?.data || response;
                  const finalCount = typeof data === 'number' ? data : nextCount;
                  updateLikeCache({ targetId: post.id, likeCount: finalCount, liked: !wasLiked });
                } catch (error) {
                  updateLikeCache({ targetId: post.id, likeCount: previousCount, liked: wasLiked });
                  setLocalLike(post.id, wasLiked);
                } finally {
                  setIsLikeLoading(false);
                }
              }}
              className={`flex items-center gap-1.5 font-bold px-4 py-2 rounded-xl text-sm transition-colors ${post.liked ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-stone-500 bg-stone-50 dark:text-gray-300 dark:bg-gray-800'
                }`}
            >
              <Heart className={`w-4 h-4 ${post.liked ? 'fill-rose-500' : ''}`} /> {post.likeCount ?? 0}
            </button>
            <button className="flex items-center gap-1.5 text-stone-500 dark:text-gray-300 font-bold bg-stone-50 dark:bg-gray-800 px-4 py-2 rounded-xl text-sm">
              <MessageSquare className="w-4 h-4" /> {post.commentCount ?? 0}
            </button>
          </div>







          {/* 댓글 영역 */}
          <div className="space-y-6 pb-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-800 dark:text-gray-100">댓글</h3>
              {!isAuthenticated && (
                <span className="text-xs text-stone-400 dark:text-gray-500">로그인 후 작성 가능</span>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 dark:border-gray-800 p-3 space-y-2 bg-white dark:bg-gray-900">

              <div className="flex items-center gap-2">
                <textarea
                  ref={commentTextareaRef}
                  rows={1}
                  placeholder="댓글을 입력하세요"
                  value={commentInput}
                  onChange={(event) => {
                    setCommentInput(event.target.value);
                    autoResize(event.target, 3);
                  }}
                  disabled={!isAuthenticated}
                  className="flex-1 rounded-xl bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60 resize-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#4b5563_#1f2937]"
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={commentMutation.isPending || !isAuthenticated}
                  className="bg-amber-500 text-gray-900 p-2.5 rounded-full hover:bg-amber-600 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-amber-500"
                />
                <Lock className="w-3 h-3 text-stone-400 dark:text-gray-500" />
                <span className="text-[11px] text-stone-400 dark:text-gray-500 font-medium">비밀글</span>
              </label>

              {(commentError || commentsErrorMessage) && (
                <p className="text-xs text-rose-500">{commentError || commentsErrorMessage}</p>
              )}
            </div>

            <div className="space-y-4 max-w-3xl mx-auto w-full">
              {groupedComments.length === 0 && (
                <p className="text-sm text-stone-400 dark:text-gray-500">첫 댓글을 남겨주세요.</p>
              )}

              {groupedComments.map((comment) => {
                const canViewSecret = comment.secretYn !== 'Y' || comment.isAuthor || isAuthor;
                return (
                <div key={comment.id} className={`py-4 border-b border-stone-100 dark:border-gray-800 group ${comment.fixYn === 'Y' ? 'bg-amber-50/50 dark:bg-amber-900/10 -mx-2 px-2 rounded-xl' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-gray-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-stone-300 dark:text-gray-500" />
                      </div>
                      <span className="text-sm font-bold text-stone-700 dark:text-gray-200">{comment.regUserName || '알 수 없음'}</span>
                      {comment.fixYn === 'Y' && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 rotate-45" />}
                      {comment.secretYn === 'Y' && <Lock className="w-3 h-3 text-stone-400 dark:text-gray-500" />}
                      <span className="text-xs text-stone-400 dark:text-gray-500">{formatDate(comment.regDate)}</span>
                    </div>
                    <div
                      className={`flex items-center gap-3 text-xs transition-opacity transition-colors ${comment.isPending || comment.isError
                        ? 'opacity-100 text-stone-500 dark:text-gray-400'
                        : 'opacity-0 group-hover:opacity-100 text-stone-300 dark:text-gray-600 group-hover:text-stone-600 dark:group-hover:text-gray-300'
                        }`}
                    >
                      {comment.isPending ? (
                        <span>전송 중...</span>
                      ) : comment.isError ? (
                        <>
                          <button type="button" onClick={() => retryComment(comment)}>재시도</button>
                          <button type="button" onClick={() => removeTempComment(comment.id)}>삭제</button>
                        </>
                      ) : comment.deleteYn !== 'Y' && (
                        <>
                          {isAuthor && !comment.parentSeq && (
                            <button
                              type="button"
                              onClick={() => pinCommentMutation.mutate({ commentId: comment.id, pinned: comment.fixYn === 'Y' })}
                              className={comment.fixYn === 'Y' ? 'text-amber-500' : ''}
                            >
                              {comment.fixYn === 'Y' ? '고정해제' : '고정'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTarget(comment);
                              setReplyInput('');
                              setIsReplySecret(false);
                            }}
                          >
                            답글
                          </button>
                          {comment.isAuthor && (
                            <>
                              <button type="button" onClick={() => startEditComment(comment)}>수정</button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCommentError('');
                                  deleteCommentMutation.mutate(comment.id);
                                }}
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pl-10 pr-4 mt-2 text-sm text-stone-600 dark:text-gray-300 leading-relaxed">
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          className="w-full rounded-lg bg-white/70 dark:bg-gray-900/60 border border-stone-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none"
                        />
                        <div className="flex gap-2 text-[11px] text-stone-400">
                          <button type="button" onClick={submitEditComment} className="text-amber-500">저장</button>
                          <button type="button" onClick={cancelEditComment}>취소</button>
                        </div>
                      </div>
                    ) : canViewSecret ? (
                      comment.content
                    ) : (
                      <span className="flex items-center gap-1 text-stone-400 dark:text-gray-500 italic">
                        <Lock className="w-3.5 h-3.5" /> 비밀 댓글입니다.
                      </span>
                    )}
                  </div>

                  {(comment.replies?.length > 0 || replyTarget?.id === comment.id) && (
                    <div className="mt-3 ml-10 border-l-2 border-stone-100 dark:border-gray-800 pl-4 space-y-3">
                      {comment.replies?.map((reply) => {
                        const canViewReplySecret = reply.secretYn !== 'Y' || reply.isAuthor || isAuthor;
                        return (
                        <div key={reply.id} className="group">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-gray-800 flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-stone-300 dark:text-gray-500" />
                              </div>
                              <span className="text-xs font-bold text-stone-700 dark:text-gray-200">{reply.regUserName || '알 수 없음'}</span>
                              {reply.secretYn === 'Y' && <Lock className="w-3 h-3 text-stone-400 dark:text-gray-500" />}
                              <span className="text-[10px] text-stone-400 dark:text-gray-500">{formatDate(reply.regDate)}</span>
                            </div>
                            <div
                              className={`flex items-center gap-3 text-[11px] transition-opacity transition-colors ${reply.isPending || reply.isError
                                ? 'opacity-100 text-stone-500 dark:text-gray-400'
                                : 'opacity-0 group-hover:opacity-100 text-stone-300 dark:text-gray-600 group-hover:text-stone-600 dark:group-hover:text-gray-300'
                                }`}
                            >
                              {reply.isPending ? (
                                <span>전송 중...</span>
                              ) : reply.isError ? (
                                <>
                                  <button type="button" onClick={() => retryComment(reply)}>재시도</button>
                                  <button type="button" onClick={() => removeTempComment(reply.id)}>삭제</button>
                                </>
                              ) : reply.deleteYn !== 'Y' && (
                                reply.isAuthor && (
                                  <>
                                    <button type="button" onClick={() => startEditComment(reply)}>수정</button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCommentError('');
                                        deleteCommentMutation.mutate(reply.id);
                                      }}
                                    >
                                      삭제
                                    </button>
                                  </>
                                )
                              )}
                            </div>
                          </div>
                          <div className="pl-9 pr-4 mt-2 text-sm text-stone-600 dark:text-gray-300 leading-relaxed">
                            {editingCommentId === reply.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingContent}
                                  onChange={(event) => setEditingContent(event.target.value)}
                                  className="w-full rounded-lg bg-white/70 dark:bg-gray-900/60 border border-stone-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none"
                                />
                                <div className="flex gap-2 text-[11px] text-stone-400">
                                  <button type="button" onClick={submitEditComment} className="text-amber-500">저장</button>
                                  <button type="button" onClick={cancelEditComment}>취소</button>
                                </div>
                              </div>
                            ) : canViewReplySecret ? (
                              reply.content
                            ) : (
                              <span className="flex items-center gap-1 text-stone-400 dark:text-gray-500 italic">
                                <Lock className="w-3.5 h-3.5" /> 비밀 댓글입니다.
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}

                      {replyTarget?.id === comment.id && (
                        <div className="rounded-xl bg-white/70 dark:bg-gray-900/70 border border-stone-200 dark:border-gray-700 p-3 space-y-2">
                          <div className="text-[11px] text-stone-400 dark:text-gray-500 flex items-center justify-between">
                            <span>{comment.regUserName || '알 수 없음'}에게 답글 작성</span>
                            <button type="button" onClick={() => setReplyTarget(null)} className="font-medium">취소</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <textarea
                              ref={replyTextareaRef}
                              rows={1}
                              placeholder="답글을 입력하세요"
                              value={replyInput}
                              onChange={(event) => {
                                setReplyInput(event.target.value);
                                autoResize(event.target, 2);
                              }}
                              disabled={!isAuthenticated}
                              className="flex-1 rounded-lg bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60 resize-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#4b5563_#1f2937]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitReply(comment)}
                              disabled={commentMutation.isPending || !isAuthenticated}
                              className="bg-amber-500 text-gray-900 p-2.5 rounded-full hover:bg-amber-600 disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isReplySecret}
                              onChange={(e) => setIsReplySecret(e.target.checked)}
                              className="w-3.5 h-3.5 rounded accent-amber-500"
                            />
                            <Lock className="w-3 h-3 text-stone-400 dark:text-gray-500" />
                            <span className="text-[11px] text-stone-400 dark:text-gray-500 font-medium">비밀글</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 max-w-[90vw] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800 dark:text-gray-100">게시글 삭제</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone-600 dark:text-gray-300 mb-6">
              정말 이 게시글을 삭제하시겠습니까?<br />
              삭제된 게시글은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-gray-700 text-stone-700 dark:text-gray-200 font-bold text-sm hover:bg-stone-200 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  deletePostMutation.mutate();
                }}
                disabled={deletePostMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 disabled:opacity-50"
              >
                {deletePostMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailPage;
