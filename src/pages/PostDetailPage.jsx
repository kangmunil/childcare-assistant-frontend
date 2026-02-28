import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreHorizontal, Heart, MessageSquare, Share2, User, Send, Trash2, Edit3, X, MapPin, Crown, AlertCircle, Lock, Globe, CheckCircle2, RotateCcw } from 'lucide-react';
import api from '../lib/api';
import { getLocalLikeMap, setLocalLike } from '../lib/likeStorage';
import { useAuth } from '../contexts/AuthContext';
import { getRegionLabels } from '../utils/regionLabel';
import {
  isCommunityLegacyDisplayImageExtension,
  getCommunityImageVariantSet,
  getCommunityPreferredVariantUrl,
} from '../utils/communityImageUpload';

const getPostScopeBadgeMeta = (postScope) => {
  if (String(postScope || '').toLowerCase() === 'neighbor') {
    return {
      label: '동네생활',
      Icon: MapPin,
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    };
  }

  return {
    label: '육아광장',
    Icon: Globe,
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
  };
};

const PostDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  const passedSlug = location.state?.boardSlug;
  const isAuthenticated = Boolean(user);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentLikeLoadingSet, setCommentLikeLoadingSet] = useState(() => new Set());
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [isReplySecret, setIsReplySecret] = useState(false);
  const commentTextareaRef = useRef(null);
  const replyTextareaRef = useRef(null);
  const commentLikeLoadingRef = useRef(new Set());
  const commentMenuFirstActionRef = useRef(null);
  const commentMenuCloseTimerRef = useRef(null);
  const queryClient = useQueryClient();

  const categoryLabels = {
    qna: '고민상담',
    daily: '자유게시판',
    tip: '육아꿀팁',
    item_review: '육아템리뷰',
    info_share: '정보공유',
    urgent: '긴급/SOS',
    local_info: '동네정보',
    local_review: '동네후기',
    local_gathering: '동네번개',
    local_share: '동네나눔',
    hospital: '병원/기관'
  };
  const communityListPath = `/community${location.search || ''}`;

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
      const localLikeMap = getLocalLikeMap(user?.id);
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

  const {
    data: commentsData,
    error: commentsError
  } = useQuery({
    queryKey: ['community', 'comments', id],
    queryFn: async ({ signal }) => {
      const slug = post?.boardSlug || passedSlug || 'community';
      const response = await api.get(`/boards/${slug}/items/${id}/comments`, { signal });
      const data = response?.data || response || [];
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  const comments = useMemo(() => (Array.isArray(commentsData) ? commentsData : []), [commentsData]);
  const commentsErrorMessage = commentsError ? '댓글을 불러오지 못했습니다.' : '';
  const postRegionLabels = useMemo(() => getRegionLabels(post?.regUserRegionName), [post?.regUserRegionName]);
  const postScopeBadge = useMemo(() => getPostScopeBadgeMeta(post?.postScope), [post?.postScope]);
  const isUrgentPost = useMemo(() => String(post?.category || '').toLowerCase() === 'urgent', [post?.category]);

  useEffect(() => {
    if (!openCommentMenuId) return;

    const menuExists = comments.some((comment) => String(comment?.id ?? '') === openCommentMenuId);
    if (!menuExists) {
      setOpenCommentMenuId(null);
    }
  }, [comments, openCommentMenuId]);

  useEffect(() => {
    if (!openCommentMenuId) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      commentMenuFirstActionRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenCommentMenuId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openCommentMenuId]);

  useEffect(() => {
    if (!openCommentMenuId) return undefined;

    const isInsideCommentMenu = (node) => (
      node instanceof Element && (
        node.closest('[data-comment-menu]') !== null
        || node.closest('[data-comment-menu-trigger]') !== null
        || node.closest('[data-comment-menu-hover-bridge]') !== null
      )
    );

    const handleOutsideInteraction = (event) => {
      const target = event.target;
      const targetElement = target instanceof Element ? target : null;
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];

      if (!targetElement) return;
      if (isInsideCommentMenu(targetElement)) return;
      if (path.some(isInsideCommentMenu)) return;

      setOpenCommentMenuId(null);
    };

    window.addEventListener('pointerdown', handleOutsideInteraction, true);
    const needsMouseFallback = typeof window.PointerEvent === 'undefined';
    if (needsMouseFallback) {
      document.addEventListener('mousedown', handleOutsideInteraction, true);
    }
    return () => {
      window.removeEventListener('pointerdown', handleOutsideInteraction, true);
      if (needsMouseFallback) {
        document.removeEventListener('mousedown', handleOutsideInteraction, true);
      }
    };
  }, [openCommentMenuId]);

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

  const postImages = useMemo(() => {
    const files = Array.isArray(post?.files) ? post.files : [];
    return files
      .filter((file) => isCommunityLegacyDisplayImageExtension(file?.extension))
      .map((file) => {
        const directPath = typeof file?.filePath === 'string' && /^https?:\/\//.test(file.filePath)
          ? file.filePath
          : null;
        const detailVariant = getCommunityImageVariantSet(file, 'detail');
        const posterVariant = getCommunityImageVariantSet(file, 'poster');
        const preferredOptimizedUrl = getCommunityPreferredVariantUrl(file, 'detail')
          || getCommunityPreferredVariantUrl(file, 'poster');
        const width = detailVariant?.width || posterVariant?.width || null;
        const height = detailVariant?.height || posterVariant?.height || null;
        return {
          id: file?.id,
          url: preferredOptimizedUrl || file?.downloadUrl || directPath,
          detailVariant,
          posterVariant,
          width,
          height,
          name: file?.orgFilename || file?.fileName || '첨부 이미지'
        };
      })
      .filter((file) => Boolean(file.url));
  }, [post?.files]);

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
      secretYn: payload.secretYn || 'N',
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

  const toNumericId = (value) => {
    const numericId = Number(value);
    return Number.isFinite(numericId) ? numericId : null;
  };

  const toComparableId = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const toCommentMenuId = (commentId) => toComparableId(commentId);

  const isDeletedComment = (comment) => (
    comment?.deleted === true || comment?.deleteYn === 'Y'
  );

  const isOwnedComment = (comment) => {
    if (!comment || isDeletedComment(comment)) return false;
    if (user?.role === 'ADMIN') return true;
    if (typeof comment.isAuthor === 'boolean') return comment.isAuthor;
    if (typeof comment.author === 'boolean') return comment.author;

    const currentUserId = toComparableId(user?.id);
    const commentAuthorId = toComparableId(comment.regId);
    return Boolean(currentUserId) && Boolean(commentAuthorId) && currentUserId === commentAuthorId;
  };

  const getCommentActionErrorMessage = (error, actionType) => {
    const code = error?.code || error?.payload?.code;

    if (error?.status === 401) {
      return '로그인 상태가 만료되었습니다. 다시 로그인해주세요.';
    }

    if (actionType === 'delete' && code === 'BOARD_011') {
      return '댓글 삭제 권한이 없습니다.';
    }

    if (actionType === 'edit' && code === 'BOARD_012') {
      return '댓글 수정 권한이 없습니다.';
    }

    return error?.message || (actionType === 'delete' ? '댓글 삭제에 실패했습니다.' : '댓글 수정에 실패했습니다.');
  };

  const isCommentLikeAvailable = (comment) => (
    Boolean(comment)
    && !comment.isPending
    && !comment.isError
    && !isDeletedComment(comment)
    && comment.accessible !== false
  );

  const isCommentLikeLoading = (commentId) => commentLikeLoadingSet.has(String(commentId));

  const setCommentLikeLoading = (commentId, isLoading) => {
    const loadingKey = String(commentId);

    if (isLoading) {
      commentLikeLoadingRef.current.add(loadingKey);
    } else {
      commentLikeLoadingRef.current.delete(loadingKey);
    }

    setCommentLikeLoadingSet(new Set(commentLikeLoadingRef.current));
  };

  const updateCommentLikeCache = ({ commentId, likeCount, liked }) => {
    const targetKey = String(commentId);

    updateCommentsCache((prev) => prev.map((item) => (
      String(item.id) === targetKey
        ? { ...item, likeCount, liked }
        : item
    )));
  };

  const updateCommentCountCache = ({ targetId, increment }) => {
    const safeIncrement = Number.isFinite(increment) ? increment : 0;
    const safeTargetId = toNumericId(targetId);
    if (!safeIncrement || safeTargetId === null) return;

    queryClient.setQueriesData({ queryKey: ['community', 'detail'] }, (old) => {
      if (!old || typeof old !== 'object') return old;
      if (toNumericId(old.id) !== safeTargetId) return old;
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
            if (toNumericId(item.id) !== safeTargetId) return item;
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

  const hasActiveReplies = (commentsList, parentId) => (
    commentsList.some((item) => (
      toComparableId(item.parentSeq) === toComparableId(parentId)
      && !isDeletedComment(item)
    ))
  );

  const applyOptimisticDelete = (commentsList, commentId) => {
    const targetKey = toComparableId(commentId);
    const targetComment = commentsList.find((item) => toComparableId(item.id) === targetKey);
    if (!targetComment) {
      return { nextComments: commentsList, decremented: false };
    }

    const isParentComment = targetComment.parentSeq === null || targetComment.parentSeq === undefined;
    let nextComments = commentsList;

    if (isParentComment && hasActiveReplies(commentsList, targetComment.id)) {
      nextComments = commentsList.map((item) => (
        toComparableId(item.id) === targetKey
          ? {
            ...item,
            content: '작성자가 댓글을 삭제했습니다.',
            deleteYn: 'Y',
            deleted: true,
            regId: null,
            regUserName: '',
            isAuthor: false,
            author: false,
            accessible: true
          }
          : item
      ));
      return { nextComments, decremented: true };
    }

    nextComments = commentsList.filter((item) => toComparableId(item.id) !== targetKey);

    if (!isParentComment) {
      const parentKey = toComparableId(targetComment.parentSeq);
      const parentComment = nextComments.find((item) => toComparableId(item.id) === parentKey);
      if (
        parentComment
        && (parentComment.parentSeq === null || parentComment.parentSeq === undefined)
        && isDeletedComment(parentComment)
        && !hasActiveReplies(nextComments, parentComment.id)
      ) {
        nextComments = nextComments.filter((item) => toComparableId(item.id) !== parentKey);
      }
    }

    return { nextComments, decremented: true };
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
    if (user?.role === 'ADMIN') return true;
    if (post.isAuthor || post.author) return true;
    const currentUserId = toComparableId(user?.id);
    const postAuthorId = toComparableId(post.regId);
    return Boolean(currentUserId) && Boolean(postAuthorId) && currentUserId === postAuthorId;
  }, [post, user]);
  const canToggleUrgentResolved = isAuthor && isUrgentPost;

  const closeCommentMenu = () => {
    if (commentMenuCloseTimerRef.current !== null) {
      window.clearTimeout(commentMenuCloseTimerRef.current);
      commentMenuCloseTimerRef.current = null;
    }
    setOpenCommentMenuId(null);
  };

  const isCommentMenuOpen = (commentId) => openCommentMenuId === toCommentMenuId(commentId);

  const toggleCommentMenu = (commentId) => {
    const nextMenuId = toCommentMenuId(commentId);
    if (commentMenuCloseTimerRef.current !== null) {
      window.clearTimeout(commentMenuCloseTimerRef.current);
      commentMenuCloseTimerRef.current = null;
    }
    setOpenCommentMenuId((prev) => (prev === nextMenuId ? null : nextMenuId));
  };

  const clearCommentMenuCloseTimer = () => {
    if (commentMenuCloseTimerRef.current !== null) {
      window.clearTimeout(commentMenuCloseTimerRef.current);
      commentMenuCloseTimerRef.current = null;
    }
  };

  const scheduleCommentMenuClose = (commentId) => {
    const targetMenuId = toCommentMenuId(commentId);
    clearCommentMenuCloseTimer();
    commentMenuCloseTimerRef.current = window.setTimeout(() => {
      setOpenCommentMenuId((prev) => (prev === targetMenuId ? null : prev));
      commentMenuCloseTimerRef.current = null;
    }, 120);
  };

  useEffect(() => () => {
    if (commentMenuCloseTimerRef.current !== null) {
      window.clearTimeout(commentMenuCloseTimerRef.current);
      commentMenuCloseTimerRef.current = null;
    }
  }, []);

  // 로그인 상태 변경 시 데이터 갱신
  useEffect(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['community', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    }
  }, [user, id, queryClient]);

  const commentMutation = useMutation({
    mutationFn: (payload) => {
      const requestPayload = { ...payload };
      delete requestPayload.__tempId;
      return api.post(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}/comments`, requestPayload);
    },
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
    mutationFn: ({ commentId, content }) => api.put(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}/comments/${commentId}`, { content }),
    onSuccess: () => {
      cancelEditComment();
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    },
    onError: (error) => {
      setCommentError(getCommentActionErrorMessage(error, 'edit'));
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: () => api.delete(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] });
      navigate(communityListPath);
    },
    onError: (error) => {
      alert(error?.message || '게시글 삭제에 실패했습니다.');
    }
  });

  const toggleUrgentResolveMutation = useMutation({
    mutationFn: (resolved) => api.put(
      `/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}/urgent-resolve`,
      { resolved }
    ),
    onSuccess: async (response) => {
      const data = response?.data || response || null;
      if (data) {
        queryClient.setQueryData(['community', 'detail', id], (old) => (
          old ? { ...old, ...data } : old
        ));
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community', 'detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['community'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'urgent-slot'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] }),
      ]);
    },
    onError: (error) => {
      alert(error?.message || '긴급/SOS 상태 변경에 실패했습니다.');
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}/comments/${commentId}`),
    onMutate: async (commentId) => {
      closeCommentMenu();
      await queryClient.cancelQueries({ queryKey: ['community', 'comments', id] });
      const previousComments = queryClient.getQueryData(['community', 'comments', id]);
      const currentComments = Array.isArray(previousComments) ? previousComments : [];
      const { nextComments, decremented } = applyOptimisticDelete(currentComments, commentId);

      queryClient.setQueryData(['community', 'comments', id], nextComments);

      if (decremented) {
        updateCommentCountCache({ targetId: Number(id), increment: -1 });
      }

      const targetCommentKey = toComparableId(commentId);
      const deletedComment = currentComments.find((item) => toComparableId(item.id) === targetCommentKey);
      if (
        deletedComment
        && (toComparableId(replyTarget?.id) === targetCommentKey
          || toComparableId(replyTarget?.id) === toComparableId(deletedComment.parentSeq))
      ) {
        setReplyTarget(null);
        setReplyInput('');
      }

      if (toComparableId(editingCommentId) === targetCommentKey) {
        cancelEditComment();
      }

      return { previousComments, decremented };
    },
    onError: (error, _commentId, context) => {
      queryClient.setQueryData(['community', 'comments', id], context?.previousComments);
      if (context?.decremented) {
        updateCommentCountCache({ targetId: Number(id), increment: 1 });
      }
      setCommentError(getCommentActionErrorMessage(error, 'delete'));
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'detail', id] }),
        queryClient.invalidateQueries({ queryKey: ['community'] })
      ]);
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
    closeCommentMenu();
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
    closeCommentMenu();
    commentMutation.mutate(payload);
  };

  const toggleReplyComposer = (parentComment) => {
    if (!isAuthenticated) {
      setCommentError('로그인 후 댓글을 작성할 수 있어요.');
      return;
    }

    if (replyTarget?.id === parentComment.id) {
      setReplyTarget(null);
      setReplyInput('');
      setIsReplySecret(false);
      return;
    }

    setCommentError('');
    closeCommentMenu();
    setReplyTarget(parentComment);
    setReplyInput('');
    setIsReplySecret(false);
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
    if (!isOwnedComment(comment)) return;
    closeCommentMenu();
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

  const toggleCommentLike = async (comment) => {
    if (!isAuthenticated) {
      setCommentError('로그인 후 댓글 공감을 할 수 있어요.');
      return;
    }

    if (!isCommentLikeAvailable(comment)) return;

    const commentId = toNumericId(comment.id);
    if (commentId === null) return;

    const loadingKey = String(commentId);
    if (commentLikeLoadingRef.current.has(loadingKey)) return;

    const wasLiked = !!comment.liked;
    const previousCount = Number.isFinite(comment.likeCount) ? comment.likeCount : 0;
    const nextCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));

    setCommentError('');
    setCommentLikeLoading(commentId, true);
    updateCommentLikeCache({ commentId, likeCount: nextCount, liked: !wasLiked });

    try {
      const response = wasLiked
        ? await api.delete(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}/comments/${commentId}/like`)
        : await api.post(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${id}/comments/${commentId}/like`);
      const data = response?.data ?? response;
      const finalCount = Number.isFinite(data) ? data : nextCount;
      updateCommentLikeCache({ commentId, likeCount: finalCount, liked: !wasLiked });
    } catch (error) {
      updateCommentLikeCache({ commentId, likeCount: previousCount, liked: wasLiked });
      setCommentError(error?.message || '댓글 공감 처리에 실패했습니다.');
    } finally {
      setCommentLikeLoading(commentId, false);
      await queryClient.invalidateQueries({ queryKey: ['community', 'comments', id] });
    }
  };

  const updateLikeCache = ({ targetId, likeCount, liked }) => {
    const safeTargetId = toNumericId(targetId);
    if (safeTargetId === null) return;

    queryClient.setQueriesData({ queryKey: ['community', 'detail'] }, (old) => {
      if (!old || typeof old !== 'object') return old;
      if (toNumericId(old.id) !== safeTargetId) return old;
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
            toNumericId(item.id) === safeTargetId
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

  const handleToggleUrgentResolved = () => {
    if (!canToggleUrgentResolved || toggleUrgentResolveMutation.isPending) return;
    const nextResolved = !Boolean(post?.urgentResolved);
    toggleUrgentResolveMutation.mutate(nextResolved);
    setShowPostMenu(false);
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
        <button onClick={() => navigate(communityListPath)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto w-full bg-white dark:bg-gray-900 rounded-3xl border border-stone-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-20 px-4 py-4 flex items-center justify-between border-b border-stone-100 dark:border-gray-800">
          <button onClick={() => navigate(communityListPath)} className="p-2 -ml-2 text-stone-400 hover:text-stone-800 dark:text-gray-400 dark:hover:text-gray-200">
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
                        {canToggleUrgentResolved && (
                          <button
                            onClick={handleToggleUrgentResolved}
                            disabled={toggleUrgentResolveMutation.isPending}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-stone-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-60 ${
                              post?.urgentResolved
                                ? 'text-amber-600 dark:text-amber-300'
                                : 'text-emerald-600 dark:text-emerald-300'
                            }`}
                          >
                            {post?.urgentResolved ? <RotateCcw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            {post?.urgentResolved ? '해결 해제' : '해결됨 처리'}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowPostMenu(false);
                            navigate(`/community/${id}/edit${location.search || ''}`, { state: { boardSlug: post?.boardSlug } });
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
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-stone-800 dark:text-gray-100">{post.regUserName || '알 수 없음'}</span>
                {post.sameNeighborhood && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-stone-900 dark:bg-amber-500 dark:text-gray-900 shadow-sm">
                    <MapPin className="w-3 h-3" />
                    인증이웃
                  </span>
                )}
                {post.regUserHonorNeighbor && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-200 to-yellow-400 text-stone-900 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-700" />
                    육아고수
                  </span>
                )}
                {post.regUserParentingStage && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${post.regUserParentingStage === '신생아' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' :
                    post.regUserParentingStage === '영아' || post.regUserParentingStage === '유아' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                    }`}>
                    {post.regUserParentingStage}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${postScopeBadge.className}`}>
                  <postScopeBadge.Icon className="w-3 h-3" strokeWidth={2.5} />
                  {postScopeBadge.label}
                </span>
                {isUrgentPost && post?.urgentResolved && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                    해결됨
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-gray-400">
                <span>{formatDate(post.regDate)}</span>
                {(post.regUserRegionDongLabel || postRegionLabels.dongLabel) && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.regUserRegionDongLabel || postRegionLabels.dongLabel}
                    </span>
                  </>
                )}
                {post.updateDate && (
                  <span className="text-stone-400 dark:text-gray-500 ml-1">(수정됨)</span>
                )}
                {post.category && (
                  <>
                    <span>•</span>
                    {post.category === 'urgent' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] dark:shadow-[0_0_12px_rgba(244,63,94,0.5)]">
                        <AlertCircle className="w-3 h-3" />
                        지금 급해요
                      </span>
                    ) : (
                      <span className="font-bold text-amber-500 dark:text-amber-400">{post.category === 'hospital' ? '🏥 병원/기관' : categoryLabels[post.category] || post.category}</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-stone-900 dark:text-gray-100 mb-4">{post.title}</h1>
            <p className="text-stone-600 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {postImages.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {postImages.map((file) => (
                  <div
                    key={file.id || file.url}
                    className="rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 bg-stone-50 dark:bg-gray-800/40"
                    style={file.width && file.height ? { aspectRatio: `${file.width} / ${file.height}` } : undefined}
                  >
                    {file.detailVariant || file.posterVariant ? (
                      <picture>
                        {file.detailVariant?.avifUrl && <source type="image/avif" srcSet={file.detailVariant.avifUrl} />}
                        {file.detailVariant?.webpUrl && <source type="image/webp" srcSet={file.detailVariant.webpUrl} />}
                        {file.detailVariant?.jpegUrl && <source type="image/jpeg" srcSet={file.detailVariant.jpegUrl} />}
                        {file.detailVariant?.pngUrl && <source type="image/png" srcSet={file.detailVariant.pngUrl} />}
                        {file.posterVariant?.webpUrl && <source type="image/webp" srcSet={file.posterVariant.webpUrl} />}
                        {file.posterVariant?.jpegUrl && <source type="image/jpeg" srcSet={file.posterVariant.jpegUrl} />}
                        {file.posterVariant?.pngUrl && <source type="image/png" srcSet={file.posterVariant.pngUrl} />}
                        <img
                          src={file.url}
                          alt={file.name}
                          width={file.width || undefined}
                          height={file.height || undefined}
                          className="w-full h-full max-h-[340px] object-cover"
                          loading="lazy"
                        />
                      </picture>
                    ) : (
                      <img
                        src={file.url}
                        alt={file.name}
                        width={file.width || undefined}
                        height={file.height || undefined}
                        className="w-full h-full max-h-[340px] object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {post.category === 'hospital' && post.placeName && (
              <div className="mt-8 p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-800/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-stone-900 dark:text-gray-100 text-base md:text-lg mb-0.5 truncate">{post.placeName}</p>
                    <p className="text-sm text-stone-600 dark:text-gray-400 truncate">{post.placeAddress}</p>
                    <a
                      href={`https://map.kakao.com/link/map/${encodeURIComponent(post.placeName)},${post.placeLat},${post.placeLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                    >
                      카카오맵에서 보기 〉
                    </a>
                  </div>
                </div>
              </div>
            )}
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
                setLocalLike(user?.id, post.id, !wasLiked);

                try {
                  const response = wasLiked
                    ? await api.delete(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${post.id}/like`)
                    : await api.post(`/boards/${post?.boardSlug || passedSlug || 'community'}/items/${post.id}/like`);
                  const data = response?.data || response;
                  const finalCount = typeof data === 'number' ? data : nextCount;
                  updateLikeCache({ targetId: post.id, likeCount: finalCount, liked: !wasLiked });
                  await queryClient.invalidateQueries({ queryKey: ['community', 'highlights'] });
                } catch {
                  updateLikeCache({ targetId: post.id, likeCount: previousCount, liked: wasLiked });
                  setLocalLike(user?.id, post.id, wasLiked);
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

            <div className="rounded-2xl border border-stone-200/90 dark:border-slate-700/80 p-3.5 space-y-2 bg-white/90 dark:bg-slate-900/70 shadow-sm">

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
                  className="flex-1 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 px-3 py-2.5 text-sm leading-6 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300/70 dark:focus:ring-amber-400/50 focus:border-amber-300 dark:focus:border-amber-500 disabled:opacity-60 resize-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#4b5563_#1f2937]"
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={commentMutation.isPending || !isAuthenticated}
                  className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full bg-amber-400 text-stone-900 hover:bg-amber-300 active:scale-95 transition disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(event) => setIsSecret(event.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-amber-500"
                />
                <Lock className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">비밀댓글</span>
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
                const canViewSecret = comment.secretYn !== 'Y' || isOwnedComment(comment) || isAuthor;
                return (
                  <div key={comment.id} className="py-4 px-1.5 md:px-2 rounded-xl border-b border-stone-100/90 dark:border-slate-700/60 group transition-colors hover:bg-stone-50/60 dark:hover:bg-slate-800/40">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-stone-300 dark:text-gray-500" />
                        </div>
                        <span className="text-sm font-bold text-stone-700 dark:text-gray-200">{comment.regUserName || '알 수 없음'}</span>
                        {comment.secretYn === 'Y' && <Lock className="w-3 h-3 text-stone-400 dark:text-slate-500" />}
                        <span className="text-xs text-stone-500 dark:text-slate-400">{formatDate(comment.regDate)}</span>
                      </div>
                      <div className={`flex items-center gap-2.5 text-xs transition-opacity transition-colors ${comment.isPending || comment.isError
                        ? 'opacity-100 text-stone-500 dark:text-slate-400'
                        : `${isCommentMenuOpen(comment.id)
                          ? 'opacity-100 md:opacity-100'
                          : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                        } text-stone-500 dark:text-slate-400 md:text-stone-400 md:dark:text-slate-500`
                        }`}>
                        {comment.isPending ? (
                          <span>전송 중...</span>
                        ) : comment.isError ? (
                          <>
                            <button type="button" onClick={() => retryComment(comment)}>재시도</button>
                            <button type="button" onClick={() => removeTempComment(comment.id)}>삭제</button>
                          </>
                        ) : (
                          isOwnedComment(comment) && (
                            <div
                              className="relative z-40"
                              onPointerEnter={clearCommentMenuCloseTimer}
                              onPointerLeave={() => {
                                if (isCommentMenuOpen(comment.id)) {
                                  scheduleCommentMenuClose(comment.id);
                                }
                              }}
                            >
                              <button
                                type="button"
                                data-comment-menu-trigger
                                data-comment-menu-id={toCommentMenuId(comment.id)}
                                aria-label="댓글 메뉴"
                                aria-haspopup="menu"
                                aria-expanded={isCommentMenuOpen(comment.id)}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleCommentMenu(comment.id);
                                }}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700/60"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {isCommentMenuOpen(comment.id) && (
                                <>
                                  <div
                                    data-comment-menu-hover-bridge
                                    aria-hidden="true"
                                    className="absolute right-0 top-full h-2 w-28"
                                  />
                                  <div
                                    role="menu"
                                    data-comment-menu
                                    data-comment-menu-id={toCommentMenuId(comment.id)}
                                    className="absolute right-0 top-full mt-1 w-28 rounded-lg border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                                  >
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      onTouchStart={(event) => event.stopPropagation()}
                                      ref={commentMenuFirstActionRef}
                                      onClick={() => startEditComment(comment)}
                                      className="w-full px-3 py-2 text-left text-xs text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-700"
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onMouseDown={(event) => event.stopPropagation()}
                                      onTouchStart={(event) => event.stopPropagation()}
                                      role="menuitem"
                                      onClick={() => {
                                        setCommentError('');
                                        closeCommentMenu();
                                        deleteCommentMutation.mutate(comment.id);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )
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
                        <span className="flex items-center gap-1 text-stone-400 dark:text-slate-500 italic">
                          <Lock className="w-3.5 h-3.5" /> 비밀 댓글입니다.
                        </span>
                      )}
                    </div>

                    {!comment.isPending && !comment.isError && (
                      <div className="pl-10 pr-4 mt-2 flex items-center gap-2.5">
                        {isCommentLikeAvailable(comment) && (
                          <button
                            type="button"
                            onClick={() => toggleCommentLike(comment)}
                            disabled={isCommentLikeLoading(comment.id)}
                            className={`inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${comment.liked
                              ? 'text-rose-600 bg-rose-50 ring-1 ring-rose-200/70 dark:text-rose-300 dark:bg-rose-500/20 dark:ring-rose-400/25'
                              : 'text-stone-600 bg-stone-100 hover:bg-stone-200 dark:text-slate-300 dark:bg-slate-700/70 dark:hover:bg-slate-700'
                              }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${comment.liked ? 'fill-rose-500' : ''}`} />
                            {comment.likeCount ?? 0}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleReplyComposer(comment)}
                          className={`inline-flex min-h-9 items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${replyTarget?.id === comment.id
                            ? 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/20'
                            : 'text-stone-600 bg-stone-100 hover:bg-stone-200 dark:text-slate-300 dark:bg-slate-700/70 dark:hover:bg-slate-700'
                            }`}
                        >
                          {replyTarget?.id === comment.id ? '답글 입력 닫기' : '답글 달기'}
                        </button>
                      </div>
                    )}

                    {(comment.replies?.length > 0 || replyTarget?.id === comment.id) && (
                      <div className="relative mt-3 pl-10 space-y-3">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute left-4 -top-16 bottom-0 w-px bg-stone-200/80 dark:bg-slate-700/70"
                        />
                        {comment.replies?.map((reply) => {
                          const canViewReplySecret = reply.secretYn !== 'Y' || isOwnedComment(reply) || isAuthor;
                          return (
                            <div key={reply.id} className="group rounded-xl px-2 py-2 bg-stone-50/55 dark:bg-slate-800/35 border border-stone-100/70 dark:border-slate-700/40">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-gray-800 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-stone-300 dark:text-gray-500" />
                                  </div>
                                  <span className="text-xs font-bold text-stone-700 dark:text-gray-200">{reply.regUserName || '알 수 없음'}</span>
                                  {reply.secretYn === 'Y' && <Lock className="w-3 h-3 text-stone-400 dark:text-slate-500" />}
                                  <span className="text-[10px] text-stone-500 dark:text-slate-400">{formatDate(reply.regDate)}</span>
                                </div>
                                <div className={`flex items-center gap-2 text-[11px] transition-opacity transition-colors ${reply.isPending || reply.isError
                                  ? 'opacity-100 text-stone-500 dark:text-slate-400'
                                  : `${isCommentMenuOpen(reply.id)
                                    ? 'opacity-100 md:opacity-100'
                                    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                                  } text-stone-500 dark:text-slate-400 md:text-stone-400 md:dark:text-slate-500`
                                  }`}>
                                  {reply.isPending ? (
                                    <span>전송 중...</span>
                                  ) : reply.isError ? (
                                    <>
                                      <button type="button" onClick={() => retryComment(reply)}>재시도</button>
                                      <button type="button" onClick={() => removeTempComment(reply.id)}>삭제</button>
                                    </>
                                  ) : (
                                    isOwnedComment(reply) && (
                                      <div
                                        className="relative z-40"
                                        onPointerEnter={clearCommentMenuCloseTimer}
                                        onPointerLeave={() => {
                                          if (isCommentMenuOpen(reply.id)) {
                                            scheduleCommentMenuClose(reply.id);
                                          }
                                        }}
                                      >
                                        <button
                                          type="button"
                                          data-comment-menu-trigger
                                          data-comment-menu-id={toCommentMenuId(reply.id)}
                                          aria-label="대댓글 메뉴"
                                          aria-haspopup="menu"
                                          aria-expanded={isCommentMenuOpen(reply.id)}
                                          onPointerDown={(event) => event.stopPropagation()}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            toggleCommentMenu(reply.id);
                                          }}
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-700/60"
                                        >
                                          <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                        {isCommentMenuOpen(reply.id) && (
                                          <>
                                            <div
                                              data-comment-menu-hover-bridge
                                              aria-hidden="true"
                                              className="absolute right-0 top-full h-2 w-28"
                                            />
                                            <div
                                              role="menu"
                                              data-comment-menu
                                              data-comment-menu-id={toCommentMenuId(reply.id)}
                                              className="absolute right-0 top-full mt-1 w-28 rounded-lg border border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                                            >
                                              <button
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onTouchStart={(event) => event.stopPropagation()}
                                                role="menuitem"
                                                ref={commentMenuFirstActionRef}
                                                onClick={() => startEditComment(reply)}
                                                className="w-full px-3 py-2 text-left text-xs text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-700"
                                              >
                                                수정
                                              </button>
                                              <button
                                                type="button"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onMouseDown={(event) => event.stopPropagation()}
                                                onTouchStart={(event) => event.stopPropagation()}
                                                role="menuitem"
                                                onClick={() => {
                                                  setCommentError('');
                                                  closeCommentMenu();
                                                  deleteCommentMutation.mutate(reply.id);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                              >
                                                삭제
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
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
                                  <span className="flex items-center gap-1 text-stone-400 dark:text-slate-500 italic">
                                    <Lock className="w-3.5 h-3.5" /> 비밀 댓글입니다.
                                  </span>
                                )}
                              </div>
                              {isCommentLikeAvailable(reply) && (
                                <div className="pl-9 pr-4 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleCommentLike(reply)}
                                    disabled={isCommentLikeLoading(reply.id)}
                                    className={`inline-flex min-h-8 items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${reply.liked
                                      ? 'text-rose-600 bg-rose-50 ring-1 ring-rose-200/70 dark:text-rose-300 dark:bg-rose-500/20 dark:ring-rose-400/25'
                                      : 'text-stone-600 bg-stone-100 hover:bg-stone-200 dark:text-slate-300 dark:bg-slate-700/70 dark:hover:bg-slate-700'
                                      }`}
                                  >
                                    <Heart className={`w-3 h-3 ${reply.liked ? 'fill-rose-500' : ''}`} />
                                    {reply.likeCount ?? 0}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {replyTarget?.id === comment.id && (
                          <div className="rounded-xl bg-stone-50/70 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-600/70 p-3.5 space-y-2.5">
                            <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center justify-between">
                              <span>{comment.regUserName || '알 수 없음'}에게 답글 작성</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTarget(null);
                                  setIsReplySecret(false);
                                }}
                                className="font-medium text-stone-600 dark:text-slate-300 hover:text-stone-800 dark:hover:text-slate-100"
                              >
                                취소
                              </button>
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
                                className="flex-1 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 px-3 py-2 text-sm leading-6 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300/70 dark:focus:ring-amber-400/50 focus:border-amber-300 dark:focus:border-amber-500 disabled:opacity-60 resize-none overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#4b5563_#1f2937]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSubmitReply(comment)}
                                disabled={commentMutation.isPending || !isAuthenticated}
                                className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full bg-amber-400 text-stone-900 hover:bg-amber-300 active:scale-95 transition disabled:opacity-45 disabled:cursor-not-allowed"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none ml-0.5">
                              <input
                                type="checkbox"
                                checked={isReplySecret}
                                onChange={(event) => setIsReplySecret(event.target.checked)}
                                className="w-3.5 h-3.5 rounded accent-amber-500"
                              />
                              <Lock className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                              <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">비밀답글</span>
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
