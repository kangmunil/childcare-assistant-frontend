import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import useStore from '../store/useStore';
import { normalizeMarkdownText } from '../utils/markdownFormatter';

const CHAT_MESSAGE_MAX_LENGTH = 2000;
const CHAT_FEEDBACK_REASON_OPTIONS = [
  { code: 'INCORRECT', label: '부정확함' },
  { code: 'UNCLEAR', label: '설명이 모호함' },
  { code: 'NOT_HELPFUL', label: '도움이 안 됨' },
  { code: 'OUTDATED', label: '정보가 오래됨' },
  { code: 'SAFETY_CONCERN', label: '안전 우려' },
  { code: 'OTHER', label: '기타' },
];
const CHAT_SOURCE_TYPE_LABEL = {
  PROFILE: '프로필',
  GROWTH_HISTORY: '성장기록',
  KNOWLEDGE_BASE: '지식베이스',
  PUBLIC_API: '검색/공공데이터',
  SYSTEM_POLICY: '안전정책',
};

// =================================================================
// 1. 메인 채팅 창 컴포넌트
// =================================================================
const ChatWindow = () => {
  const {
    isChatOpen,
    closeChat,
    messages,
    children,
    activeChildId,
    openChatWithQuery,
    addUserMessage,
    generateAiResponse,
    submitAiChatFeedback,
    markChatMessageFeedbackStatus,
    isAiThinking,
    aiChatMetaUiEnabled,
    aiChatFeedbackEnabled,
    chatProfileConsentStatus,
    chatManualContextInput,
    setChatProfileConsentStatus,
    setChatManualContextInput,
    chatQuery,
    setChatQuery
  } = useStore();

  const [input, setInput] = useState('');
  const [isPanelVisible, setIsPanelVisible] = useState(isChatOpen);
  const [downvoteTargetId, setDownvoteTargetId] = useState(null);
  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState(null);
  const [showConsentGuide, setShowConsentGuide] = useState(false);
  const [isConsentPanelExpanded, setIsConsentPanelExpanded] = useState(true);
  const [showManualContextInput, setShowManualContextInput] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const isNearMessageLimit = input.length >= 1800;
  const isMessageDisabled = isAiThinking || !input.trim();
  const isConsentPending = chatProfileConsentStatus === 'PENDING';
  const isConsentGranted = chatProfileConsentStatus === 'GRANTED';
  const isConsentDenied = chatProfileConsentStatus === 'DENIED';
  const hasManualContextInput = chatManualContextInput.trim().length > 0;
  const showConsentSelectionPanel = isConsentPending || isConsentPanelExpanded;
  const shouldShowManualContextInput = showConsentSelectionPanel && isConsentDenied && showManualContextInput;
  const normalizedChildren = Array.isArray(children) ? children : [];
  const currentChild = normalizedChildren.find((child) => child.id === activeChildId) || normalizedChildren[0];
  const childDisplayName = currentChild?.name || '아이';
  const chatQuickActions = [
    {
      label: '예방접종 확인',
      icon: '💉',
      query: `${childDisplayName}의 다음 예방접종 시기 언제야?`,
      intentHint: 'VACCINATION',
      requestedProfileDomains: ['vaccination', 'medical']
    },
    {
      label: '발달 특성',
      icon: '👶',
      query: `${childDisplayName} 개월 수에 맞는 발달 특성 알려줘`,
      intentHint: 'DEVELOPMENT',
      requestedProfileDomains: ['development']
    },
    {
      label: '성장발달 확인',
      icon: '📈',
      query: '아이 성장발달 확인해줘',
      intentHint: 'GROWTH_CHECK',
      requestedProfileDomains: ['growth']
    },
    {
      label: '수면 교육',
      icon: '💤',
      query: '지금 시기 수면 패턴 어떻게 잡아야 해?',
      intentHint: 'SLEEP',
      requestedProfileDomains: ['sleep', 'routine']
    },
    {
      label: '이유식 가이드',
      icon: '🍼',
      query: '지금 월령에 맞는 이유식 식단 추천해줘',
      intentHint: 'FEEDING',
      requestedProfileDomains: ['feeding', 'routine']
    }
  ];
  const firstAiMessageIndex = messages.findIndex((message) => message.role === 'ai');

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  useEffect(() => {
    if (!isChatOpen) return;

    inputRef.current?.focus();
  }, [isChatOpen]);

  // 챗 오픈 시 자동 질문 처리
  useEffect(() => {
    if (isChatOpen && chatQuery && !isAiThinking && !isConsentPending) {
      const timer = setTimeout(async () => {
        const trimmedChatQuery = chatQuery.trim();
        if (!trimmedChatQuery) {
          setChatQuery('');
          return;
        }

        addUserMessage(trimmedChatQuery);
        setChatQuery('');
        await generateAiResponse();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isChatOpen, chatQuery, isAiThinking, isConsentPending, addUserMessage, generateAiResponse, setChatQuery]);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      let frameId = 0;
      frameId = window.requestAnimationFrame(() => {
        setIsPanelVisible(isChatOpen);
      });
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (isChatOpen) {
      let frameId = 0;
      let nestedFrameId = 0;
      frameId = window.requestAnimationFrame(() => {
        setIsPanelVisible(false);
        nestedFrameId = window.requestAnimationFrame(() => {
          setIsPanelVisible(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frameId);
        window.cancelAnimationFrame(nestedFrameId);
      };
    }

    let closeFrameId = 0;
    closeFrameId = window.requestAnimationFrame(() => {
      setIsPanelVisible(false);
    });
    return () => {
      window.cancelAnimationFrame(closeFrameId);
    };
  }, [isChatOpen]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // 수동 전송 핸들러
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isAiThinking) return;
    if (isConsentPending) {
      setShowConsentGuide(true);
      return;
    }

    addUserMessage(trimmedInput);
    setInput('');
    await generateAiResponse();
  };

  const handleCloseChat = () => {
    setShowConsentGuide(false);
    setIsConsentPanelExpanded(true);
    setShowManualContextInput(false);
    closeChat();
  };

  const handleConsentSelection = (status) => {
    setChatProfileConsentStatus(status);
    setShowConsentGuide(false);
    setIsConsentPanelExpanded(false);
    setShowManualContextInput(false);
  };

  const handleQuickActionClick = (action) => {
    if (isAiThinking) return;
    openChatWithQuery(action.query, {
      intentHint: action.intentHint,
      requestedProfileDomains: action.requestedProfileDomains
    });
  };

  const executeMetaAction = (action) => {
    if (!action || isAiThinking) return;
    const actionType = action.action_type || action.actionType;
    if (actionType === 'NAVIGATE' && action.route) {
      navigate(action.route);
      return;
    }
    if (actionType === 'OPEN_CHAT_QUERY' && action.query) {
      openChatWithQuery(action.query, {
        intentHint: action.intent_hint || action.intentHint || undefined,
        requestedProfileDomains: action.requested_profile_domains || action.requestedProfileDomains || []
      });
    }
  };

  const submitFeedback = async ({ message, rating, reasonCode = null }) => {
    if (!message || message.role !== 'ai' || !aiChatFeedbackEnabled || feedbackSubmittingId) return;

    const meta = message.meta || {};
    const responseMode = meta.response_mode || 'ANSWER';
    const requestId = message.requestId || meta.request_id || null;
    if (!requestId && !message.meta?.request_id) {
      markChatMessageFeedbackStatus(message.id, 'error');
      return;
    }

    setFeedbackSubmittingId(message.id);
    if (rating === 'DOWN') {
      setDownvoteTargetId(null);
    }

    markChatMessageFeedbackStatus(message.id, 'submitting');
    const result = await submitAiChatFeedback({
      session_id: message.sessionId || undefined,
      request_id: requestId,
      rating,
      reason_code: reasonCode,
      reason_detail: null,
      response_mode: responseMode,
      intent: meta.intent || null,
      is_first_ai_answer: false,
    });

    markChatMessageFeedbackStatus(message.id, result.success ? (rating === 'UP' ? 'up' : 'down') : 'error');
    setFeedbackSubmittingId(null);
  };

  const canShowFeedbackForMessage = (msg, index) => {
    if (!aiChatFeedbackEnabled || !aiChatMetaUiEnabled) return false;
    if (!msg || msg.role !== 'ai') return false;
    if (index === 0) return false; // 초기 인사 제외
    const responseMode = msg.meta?.response_mode || 'ANSWER';
    return responseMode === 'ANSWER' || responseMode === 'FALLBACK';
  };

  const renderMessageMeta = (msg, index) => {
    if (!aiChatMetaUiEnabled || msg.role !== 'ai' || !msg.meta) return null;
    const meta = msg.meta;
    const responseMode = meta.response_mode || 'ANSWER';
    const citations = Array.isArray(meta.citations) ? meta.citations : [];
    const quickActions = Array.isArray(meta.quick_actions) ? meta.quick_actions : [];
    const followUps = Array.isArray(meta.follow_up_questions) ? meta.follow_up_questions : [];
    const clarificationOptions = Array.isArray(meta.clarification?.options) ? meta.clarification.options : [];
    const shouldShowFeedback = canShowFeedbackForMessage(msg, index);
    const feedbackStatus = msg.feedbackStatus;
    const isFeedbackSubmitting = feedbackSubmittingId === msg.id || feedbackStatus === 'submitting';
    const showDownvoteReasons = downvoteTargetId === msg.id && !isFeedbackSubmitting && feedbackStatus !== 'down';

    if (
      !citations.length
      && !quickActions.length
      && !followUps.length
      && !clarificationOptions.length
      && !meta.clarification?.question
      && !shouldShowFeedback
    ) {
      return null;
    }

    return (
      <div className="mt-3 space-y-2">
        {meta.clarification?.question && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 dark:bg-amber-500/10 dark:border-amber-400/30 px-3 py-2">
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">{meta.clarification.question}</p>
          </div>
        )}

        {clarificationOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {clarificationOptions.map((action) => (
              <button
                key={`clarify-${msg.id}-${action.id}`}
                type="button"
                onClick={() => executeMetaAction(action)}
                disabled={isAiThinking}
                className="inline-flex items-center rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:bg-slate-800 dark:border-amber-400/30 dark:text-amber-200"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={`action-${msg.id}-${action.id}`}
                type="button"
                onClick={() => executeMetaAction(action)}
                disabled={isAiThinking}
                className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${responseMode === 'FALLBACK'
                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-100'
                  }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {followUps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {followUps.map((question, qIndex) => (
              <button
                key={`follow-${msg.id}-${qIndex}`}
                type="button"
                onClick={() => executeMetaAction({ action_type: 'OPEN_CHAT_QUERY', query: question, intent_hint: meta.intent })}
                disabled={isAiThinking}
                className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {citations.length > 0 && (
          <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 dark:bg-slate-900/60 dark:border-slate-700 px-3 py-2">
            <p className="text-[10px] font-bold tracking-wide text-stone-500 dark:text-slate-400 mb-1">근거/참고</p>
            <div className="space-y-1">
              {citations.map((citation, cIndex) => (
                <div key={`citation-${msg.id}-${cIndex}`} className="text-[11px] text-stone-600 dark:text-slate-300 leading-snug">
                  <span className="font-semibold">{citation.label}</span>
                  <span className="ml-1 text-stone-400 dark:text-slate-500">
                    {CHAT_SOURCE_TYPE_LABEL[citation.source_type] || citation.source_type}
                  </span>
                  {citation.basis_date ? (
                    <span className="ml-1 text-stone-400 dark:text-slate-500">기준일 {citation.basis_date}</span>
                  ) : null}
                  {citation.note ? (
                    <span className="block text-stone-500 dark:text-slate-400">{citation.note}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {shouldShowFeedback && (
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-stone-500 dark:text-slate-400">도움이 되었나요?</span>
              <button
                type="button"
                onClick={() => submitFeedback({ message: msg, rating: 'UP' })}
                disabled={isFeedbackSubmitting || feedbackStatus === 'up' || feedbackStatus === 'down'}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${feedbackStatus === 'up'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-slate-600 dark:text-slate-200'
                  } disabled:opacity-60`}
              >
                <ThumbsUp className="w-3 h-3" />
                좋아요
              </button>
              <button
                type="button"
                onClick={() => setDownvoteTargetId((prev) => (prev === msg.id ? null : msg.id))}
                disabled={isFeedbackSubmitting || feedbackStatus === 'up' || feedbackStatus === 'down'}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${feedbackStatus === 'down'
                  ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-slate-600 dark:text-slate-200'
                  } disabled:opacity-60`}
              >
                <ThumbsDown className="w-3 h-3" />
                아쉬워요
              </button>
              {feedbackStatus === 'error' && (
                <span className="text-[10px] text-rose-600 dark:text-rose-300">전송 실패</span>
              )}
            </div>
            {showDownvoteReasons && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CHAT_FEEDBACK_REASON_OPTIONS.map((option) => (
                  <button
                    key={`reason-${msg.id}-${option.code}`}
                    type="button"
                    onClick={() => submitFeedback({ message: msg, rating: 'DOWN', reasonCode: option.code })}
                    disabled={isFeedbackSubmitting}
                    className="rounded-full border border-rose-200 bg-white px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 dark:bg-slate-800 dark:border-rose-400/30 dark:text-rose-200 disabled:opacity-60"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center md:items-end md:justify-end md:bottom-8 md:right-8 md:inset-auto pointer-events-none transition-opacity duration-[380ms] ease-out ${isPanelVisible ? 'opacity-100' : 'opacity-0'
      }`}>
      {/* 모바일: 전체 화면 / PC: 팝업 창 */}
      <div
        className={`${isPanelVisible ? 'pointer-events-auto' : 'pointer-events-none'} w-full h-full md:w-[380px] md:h-[600px] bg-white dark:bg-slate-900 md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-stone-100 dark:border-slate-700 transform-gpu transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isPanelVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 md:translate-y-12 scale-[0.97]'
          }`}
        role="dialog"
        aria-label="AI 채팅 창"
      >
        {/* 헤더 */}
        <div className="bg-[#2D2A26] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-white font-serif-kr font-bold text-lg leading-none">AI 육아매니저</h3>
              <span className="text-stone-400 text-xs flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> 답변 가능 상태
              </span>
            </div>
          </div>
          <button
            onClick={handleCloseChat}
            className="text-stone-400 hover:text-white transition-colors p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="채팅 창 닫기"
            title="채팅 창 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#F9F8F6] dark:bg-slate-950 space-y-4 custom-scrollbar [scrollbar-width:thin] [scrollbar-color:#b9b2a5_#ede9e2] dark:[scrollbar-color:#64748b_#0f172a] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#ede9e2] dark:[&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-[#b9b2a5] dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full">
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${msg.role === 'user'
                    ? 'bg-[#2D2A26] text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-100 border border-stone-100 dark:border-slate-700 rounded-tl-none'
                    }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div>
                      <p className="whitespace-pre-wrap leading-relaxed">{normalizeMarkdownText(msg.text || '')}</p>
                      {renderMessageMeta(msg, index)}
                    </div>
                  )}
                </div>
              </div>
              {index === firstAiMessageIndex && (
                <div className="flex flex-col items-start gap-2">
                  {chatQuickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleQuickActionClick(action)}
                      disabled={isAiThinking}
                      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white/85 dark:bg-slate-800/75 px-3 py-2 text-left text-xs font-semibold text-stone-700 dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-400/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-sm">{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
          {isAiThinking && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-stone-100 dark:border-slate-700 flex gap-1 items-center shadow-sm">
                <span className="w-2 h-2 bg-stone-300 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-stone-300 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-stone-300 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-stone-100 dark:border-slate-700 shrink-0">
          <div className="mb-3 space-y-2.5">
            {showConsentSelectionPanel && (
              <div className="rounded-2xl border border-stone-200 dark:border-slate-700 bg-stone-50/80 dark:bg-slate-800/70 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-stone-700 dark:text-slate-200">아이 정보 참고 설정</p>
                    <p className="mt-1 text-[11px] leading-snug text-stone-500 dark:text-slate-400">
                      {isConsentGranted && '저장된 아이 정보를 참고해 개인화된 답변을 제공합니다.'}
                      {isConsentDenied && '저장 정보는 사용하지 않고, 필요 시 아래 입력값만 참고합니다.'}
                      {isConsentPending && '답변 전 아이 저장정보 참고 여부를 먼저 선택해주세요.'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-6 shrink-0 whitespace-nowrap items-center rounded-full px-2.5 text-[10px] font-semibold leading-none ${
                      isConsentGranted
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : isConsentDenied
                          ? 'bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    }`}
                  >
                    {isConsentGranted ? '동의됨' : isConsentDenied ? '미동의' : '선택 필요'}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConsentSelection('GRANTED')}
                    disabled={isAiThinking}
                    className={`h-9 rounded-xl border text-[11px] font-semibold transition-colors ${isConsentGranted
                      ? 'border-[#2D2A26] bg-[#2D2A26] text-white dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950'
                      : 'border-stone-300 text-stone-600 hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                      } disabled:opacity-60`}
                  >
                    동의하고 시작
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConsentSelection('DENIED')}
                    disabled={isAiThinking}
                    className={`h-9 rounded-xl border text-[11px] font-semibold transition-colors ${isConsentDenied
                      ? 'border-stone-600 bg-stone-700 text-white dark:border-slate-500 dark:bg-slate-700'
                      : 'border-stone-300 text-stone-600 hover:bg-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                      } disabled:opacity-60`}
                  >
                    미동의로 시작
                  </button>
                </div>
                {isConsentDenied && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowManualContextInput((prev) => !prev)}
                      className="h-7 rounded-lg border border-stone-300 dark:border-slate-600 px-2 text-[10px] font-semibold text-stone-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                    >
                      {shouldShowManualContextInput ? '입력 접기' : hasManualContextInput ? '입력 수정' : '추가입력'}
                    </button>
                  </div>
                )}
                {!isConsentPending && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualContextInput(false);
                        setIsConsentPanelExpanded(false);
                      }}
                      className="h-7 rounded-lg border border-stone-300 dark:border-slate-600 px-2 text-[10px] font-semibold text-stone-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                    >
                      접기
                    </button>
                  </div>
                )}
              </div>
            )}

            {shouldShowManualContextInput && (
              <textarea
                value={chatManualContextInput}
                onChange={(e) => setChatManualContextInput(e.target.value)}
                disabled={isAiThinking}
                maxLength={4000}
                rows={3}
                placeholder="선택: 아이 상태를 직접 적어주세요 (예: 알레르기, 수면 습관)."
                className="w-full resize-none bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D2A26]/20 dark:focus:ring-amber-400/25 max-h-24 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#64748b_#0f172a] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full"
              />
            )}

            {showConsentGuide && isConsentPending && (
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 px-1">
                답변 전에 아이 정보 참고 여부를 선택해주세요.
              </p>
            )}
          </div>
          <div className="relative block">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="궁금한 점을 물어보세요..."
              disabled={isAiThinking}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              rows={1}
              aria-label="AI에 질문을 입력하세요"
              className="block w-full h-12 overflow-y-auto bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 pl-4 pr-[50px] py-[13px] rounded-[24px] resize-none focus:outline-none focus:ring-2 focus:ring-[#2D2A26]/20 dark:focus:ring-amber-400/25 transition-all font-medium leading-[22px] [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#64748b_#0f172a] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full"
            />
            <button
              type="submit"
              disabled={isMessageDisabled}
              aria-label="메시지 전송"
              className="absolute right-[4px] bottom-[4px] h-[40px] w-[40px] inline-flex items-center justify-center leading-none bg-[#2D2A26] dark:bg-amber-400 text-white dark:text-amber-950 rounded-full disabled:opacity-50 disabled:dark:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2A26]/30 dark:focus-visible:ring-amber-200/60"
            >
              <Send className="w-4 h-4 pr-0.5" />
            </button>
          </div>
          <div className={`mt-1 px-1 text-[11px] ${isNearMessageLimit ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-slate-500'}`}>
            <div className="flex h-7 items-center justify-between gap-2">
              {!showConsentSelectionPanel ? (
                <button
                  type="button"
                  onClick={() => setIsConsentPanelExpanded(true)}
                  className="h-7 rounded-lg border border-stone-300 dark:border-slate-600 px-2 text-[10px] font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  {isConsentGranted ? '참고정보: 동의됨' : '참고정보: 미동의'}
                </button>
              ) : <span className="h-7" />}
              <span className="text-right">{input.length}/{CHAT_MESSAGE_MAX_LENGTH}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// =================================================================
// 2. 둥둥 떠다니는 버튼
// =================================================================
export const FloatingChatButton = () => {
  const { toggleChat, isChatOpen } = useStore();

  if (isChatOpen) return null;

  return (
    <div className="fixed z-40 bottom-24 right-6 md:bottom-10 md:right-10">
      <button
        onClick={toggleChat}
        className="w-14 h-14 md:w-16 md:h-16 min-h-11 min-w-11 bg-[#2D2A26] hover:bg-[#3B362F] dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-amber-950 rounded-full shadow-[0_10px_24px_rgba(45,42,38,0.35)] dark:shadow-[0_10px_24px_rgba(251,191,36,0.28)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D2A26]/45 dark:focus-visible:ring-amber-300"
        aria-label="AI 채팅 열기"
        title="AI 채팅 열기"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
        <Sparkles className="w-8 h-8 fill-current" />
      </button>
    </div>
  );
};

export default ChatWindow;
