const VALID_CHAT_CONSENT_STATUSES = new Set(['PENDING', 'GRANTED', 'DENIED']);

export const normalizeChatProfileConsentStatus = (status) => {
  const normalized = typeof status === 'string' ? status.trim().toUpperCase() : '';
  if (VALID_CHAT_CONSENT_STATUSES.has(normalized)) {
    return normalized;
  }
  return 'PENDING';
};

export const buildChatRequestContextPolicy = ({
  consentStatus,
  activeChildId,
  manualContextInput,
} = {}) => {
  const normalizedConsentStatus = normalizeChatProfileConsentStatus(consentStatus);

  if (normalizedConsentStatus === 'PENDING') {
    return {
      canSend: false,
      reason: 'CONSENT_REQUIRED',
      contextMode: null,
      childIdForRequest: undefined,
      profileContextForRequest: undefined,
    };
  }

  if (normalizedConsentStatus === 'GRANTED') {
    return {
      canSend: true,
      reason: null,
      contextMode: 'AUTO',
      childIdForRequest: activeChildId ?? undefined,
      profileContextForRequest: undefined,
    };
  }

  const normalizedManualContext = typeof manualContextInput === 'string'
    ? manualContextInput.trim()
    : '';

  return {
    canSend: true,
    reason: null,
    contextMode: 'MANUAL',
    childIdForRequest: undefined,
    profileContextForRequest: normalizedManualContext,
  };
};
