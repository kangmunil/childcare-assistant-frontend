import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import useStore from '../store/useStore';
import { normalizeMarkdownText } from '../utils/markdownFormatter';

const CHAT_MESSAGE_MAX_LENGTH = 2000;
const CHAT_INPUT_MAX_HEIGHT = 11.5 * 16; // 6 rows (approx)
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
    aiContextMode,
    manualProfileContext,
    setAiContextMode,
    setManualProfileContext,
    chatQuery,
    setChatQuery
  } = useStore();

  const [input, setInput] = useState('');
  const [isPanelVisible, setIsPanelVisible] = useState(isChatOpen);
  const [downvoteTargetId, setDownvoteTargetId] = useState(null);
  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const isNearMessageLimit = input.length >= 1800;
  const isMessageDisabled = isAiThinking || !input.trim();
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
    requestAnimationFrame(() => {
      const textarea = inputRef.current;
      if (!textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, CHAT_INPUT_MAX_HEIGHT)}px`;
    });
  }, [isChatOpen]);

  // 챗 오픈 시 자동 질문 처리
  useEffect(() => {
    if (isChatOpen && chatQuery && !isAiThinking) {
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
  }, [isChatOpen, chatQuery, isAiThinking, addUserMessage, generateAiResponse, setChatQuery]);

  // 입력창 높이 자동 조절 (최대 6줄)
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, CHAT_INPUT_MAX_HEIGHT)}px`;
  }, [input]);

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

    addUserMessage(trimmedInput);
    setInput('');
    await generateAiResponse();
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
                className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                  responseMode === 'FALLBACK'
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
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                  feedbackStatus === 'up'
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
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                  feedbackStatus === 'down'
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
            onClick={closeChat}
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
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">AI 참고정보</span>
              <div className="inline-flex rounded-full bg-stone-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setAiContextMode('AUTO')}
                  disabled={isAiThinking}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${aiContextMode === 'AUTO'
                    ? 'bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-100 shadow-sm'
                    : 'text-stone-500 dark:text-slate-400'
                    }`}
                >
                  자동
                </button>
                <button
                  type="button"
                  onClick={() => setAiContextMode('MANUAL')}
                  disabled={isAiThinking}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${aiContextMode === 'MANUAL'
                    ? 'bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-100 shadow-sm'
                    : 'text-stone-500 dark:text-slate-400'
                    }`}
                >
                  수동
                </button>
              </div>
            </div>
            {aiContextMode === 'MANUAL' && (
              <textarea
                value={manualProfileContext}
                onChange={(e) => setManualProfileContext(e.target.value)}
                disabled={isAiThinking}
                maxLength={4000}
                rows={3}
                placeholder="AI에게 참고시킬 아이 정보(알레르기, 수면, 주의사항 등)를 입력하세요."
                className="w-full resize-none bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D2A26]/20 dark:focus:ring-amber-400/25 max-h-24 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#64748b_#0f172a] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full"
              />
            )}
          </div>
          <div className="relative">
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
              className="w-full min-h-[44px] max-h-32 overflow-y-auto bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 pl-4 pr-12 py-3.5 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-[#2D2A26]/20 dark:focus:ring-amber-400/25 transition-all font-medium [scrollbar-width:thin] [scrollbar-color:#a8a29e_#f5f5f4] dark:[scrollbar-color:#64748b_#0f172a] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-stone-400 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full"
              style={{ height: 44 }}
            />
            <button
              type="submit"
              disabled={isMessageDisabled}
              aria-label="메시지 전송"
              className="absolute right-2 bottom-2 p-2 bg-[#2D2A26] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className={`mt-1 px-1 text-[11px] text-right ${isNearMessageLimit ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-slate-500'}`}>
            {input.length}/{CHAT_MESSAGE_MAX_LENGTH}
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
        className="w-16 h-16 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full shadow-[0_8px_25px_rgba(124,58,237,0.3)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50"
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
