import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildChatRequestContextPolicy,
  normalizeChatProfileConsentStatus,
} from '../src/utils/chatRequestContextPolicy.js';

describe('normalizeChatProfileConsentStatus', () => {
  it('유효한 상태값을 대문자로 정규화한다', () => {
    assert.equal(normalizeChatProfileConsentStatus('granted'), 'GRANTED');
    assert.equal(normalizeChatProfileConsentStatus('Denied'), 'DENIED');
    assert.equal(normalizeChatProfileConsentStatus(' PENDING '), 'PENDING');
  });

  it('알 수 없는 상태값은 PENDING으로 처리한다', () => {
    assert.equal(normalizeChatProfileConsentStatus('unknown'), 'PENDING');
    assert.equal(normalizeChatProfileConsentStatus(null), 'PENDING');
  });
});

describe('buildChatRequestContextPolicy', () => {
  it('GRANTED 상태는 AUTO + child_id 포함 + profile_context 미포함으로 생성한다', () => {
    const result = buildChatRequestContextPolicy({
      consentStatus: 'GRANTED',
      activeChildId: 42,
      manualContextInput: '알레르기 있음',
    });

    assert.equal(result.canSend, true);
    assert.equal(result.contextMode, 'AUTO');
    assert.equal(result.childIdForRequest, 42);
    assert.equal(result.profileContextForRequest, undefined);
  });

  it('DENIED + 수동 입력값이 있으면 MANUAL + child_id 없음 + profile_context 전달', () => {
    const result = buildChatRequestContextPolicy({
      consentStatus: 'DENIED',
      activeChildId: 42,
      manualContextInput: '  알레르기: 계란  ',
    });

    assert.equal(result.canSend, true);
    assert.equal(result.contextMode, 'MANUAL');
    assert.equal(result.childIdForRequest, undefined);
    assert.equal(result.profileContextForRequest, '알레르기: 계란');
  });

  it('DENIED + 수동 입력값이 없으면 빈 profile_context를 전달한다', () => {
    const result = buildChatRequestContextPolicy({
      consentStatus: 'DENIED',
      activeChildId: 99,
      manualContextInput: '   ',
    });

    assert.equal(result.canSend, true);
    assert.equal(result.contextMode, 'MANUAL');
    assert.equal(result.childIdForRequest, undefined);
    assert.equal(result.profileContextForRequest, '');
  });

  it('PENDING 상태는 전송 차단 플래그를 반환한다', () => {
    const result = buildChatRequestContextPolicy({
      consentStatus: 'PENDING',
      activeChildId: 42,
      manualContextInput: '수면 8시간',
    });

    assert.equal(result.canSend, false);
    assert.equal(result.reason, 'CONSENT_REQUIRED');
    assert.equal(result.contextMode, null);
  });
});
