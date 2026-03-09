const MAX_META_LIST_ITEMS = 3;
const MAX_CLARIFY_OPTION_ITEMS = 4;

const clampList = (value, max = MAX_META_LIST_ITEMS) => (
  Array.isArray(value) ? value.filter(Boolean).slice(0, max) : []
);

export const normalizeDomainList = (domains) => {
  if (!Array.isArray(domains)) {
    return [];
  }
  const seen = new Set();
  return domains
    .map((domain) => (domain || '').toLowerCase().trim())
    .filter((domain) => domain.trim())
    .filter((domain) => {
      if (seen.has(domain)) {
        return false;
      }
      seen.add(domain);
      return true;
    });
};

const sanitizeChatQuickAction = (action) => {
  if (!action || typeof action !== 'object') return null;
  const actionType = typeof action.action_type === 'string' ? action.action_type.toUpperCase() : '';
  if (!['NAVIGATE', 'OPEN_CHAT_QUERY'].includes(actionType)) return null;
  const label = typeof action.label === 'string' ? action.label.trim() : '';
  if (!label) return null;
  return {
    id: typeof action.id === 'string' && action.id.trim() ? action.id.trim() : `qa-${Date.now()}`,
    label,
    action_type: actionType,
    route: typeof action.route === 'string' ? action.route : undefined,
    query: typeof action.query === 'string' ? action.query : undefined,
    intent_hint: typeof action.intent_hint === 'string' ? action.intent_hint : undefined,
    requested_profile_domains: normalizeDomainList(action.requested_profile_domains),
  };
};

const sanitizeChatCitation = (citation) => {
  if (!citation || typeof citation !== 'object') return null;
  const label = typeof citation.label === 'string' ? citation.label.trim() : '';
  const sourceType = typeof citation.source_type === 'string' ? citation.source_type.trim().toUpperCase() : '';
  if (!label || !sourceType) return null;
  return {
    label,
    source_type: sourceType,
    basis_date: typeof citation.basis_date === 'string' ? citation.basis_date : undefined,
    note: typeof citation.note === 'string' ? citation.note : undefined,
    url: typeof citation.url === 'string' ? citation.url : undefined,
  };
};

export const sanitizeChatMeta = (meta) => {
  if (!meta || typeof meta !== 'object') return null;
  const responseMode = typeof meta.response_mode === 'string' ? meta.response_mode.toUpperCase() : 'ANSWER';
  const citations = clampList(meta.citations, MAX_META_LIST_ITEMS)
    .map(sanitizeChatCitation)
    .filter(Boolean);
  const quickActions = clampList(meta.quick_actions, MAX_META_LIST_ITEMS)
    .map(sanitizeChatQuickAction)
    .filter(Boolean);
  const followUpQuestions = clampList(meta.follow_up_questions, MAX_META_LIST_ITEMS)
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  let clarification = null;
  if (meta.clarification && typeof meta.clarification === 'object') {
    const question = typeof meta.clarification.question === 'string' ? meta.clarification.question.trim() : '';
    const options = clampList(meta.clarification.options, MAX_CLARIFY_OPTION_ITEMS)
      .map(sanitizeChatQuickAction)
      .filter(Boolean);
    clarification = {
      question: question || undefined,
      missing_fields: clampList(meta.clarification.missing_fields, MAX_CLARIFY_OPTION_ITEMS)
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean),
      options,
    };
  }

  return {
    request_id: typeof meta.request_id === 'string' ? meta.request_id : undefined,
    response_mode: responseMode,
    intent: typeof meta.intent === 'string' ? meta.intent.toUpperCase() : undefined,
    confidence: typeof meta.confidence === 'number' ? meta.confidence : undefined,
    fallback_code: typeof meta.fallback_code === 'string' ? meta.fallback_code.toUpperCase() : undefined,
    citations,
    follow_up_questions: followUpQuestions,
    quick_actions: quickActions,
    clarification,
  };
};

export const buildClientFallbackMeta = ({ lastUserMsg, fallbackCode, intentHint, requestedProfileDomains = [] }) => sanitizeChatMeta({
  response_mode: 'FALLBACK',
  intent: intentHint || 'AUTO',
  fallback_code: fallbackCode || 'UNKNOWN_ERROR',
  citations: [
    {
      label: '시스템 오류 처리',
      source_type: 'SYSTEM_POLICY',
      note: '안정성 폴백 응답',
    }
  ],
  follow_up_questions: [
    '짧게 다시 질문해 주실래요?',
    '아이 월령/상황을 함께 알려주실래요?',
    '다른 육아 질문으로 도와드릴까요?'
  ],
  quick_actions: [
    {
      id: 'retry_last',
      label: '다시 시도',
      action_type: 'OPEN_CHAT_QUERY',
      query: lastUserMsg || '다시 알려줘',
      intent_hint: intentHint && intentHint !== 'AUTO' ? intentHint : undefined,
      requested_profile_domains: normalizeDomainList(requestedProfileDomains)
    },
    {
      id: 'open_guide',
      label: '가이드 보기',
      action_type: 'NAVIGATE',
      route: '/guide',
    },
    {
      id: 'ask_sleep_example',
      label: '질문 예시',
      action_type: 'OPEN_CHAT_QUERY',
      query: '지금 월령 수면 루틴 예시 알려줘',
      intent_hint: 'SLEEP',
      requested_profile_domains: ['sleep', 'routine'],
    }
  ],
});
