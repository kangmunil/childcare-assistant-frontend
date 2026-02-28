import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildClientFallbackMeta, normalizeDomainList, sanitizeChatMeta } from '../src/utils/chatMeta.js';

describe('normalizeDomainList', () => {
  it('도메인 목록을 소문자/중복 제거로 정규화한다', () => {
    const result = normalizeDomainList(['Sleep', 'sleep', ' routine ', '', null]);
    assert.deepEqual(result, ['sleep', 'routine']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    assert.deepEqual(normalizeDomainList(null), []);
    assert.deepEqual(normalizeDomainList('growth'), []);
  });
});

describe('sanitizeChatMeta', () => {
  it('meta의 리스트 개수 제한과 필터링 규칙을 적용한다', () => {
    const meta = sanitizeChatMeta({
      request_id: 'req-1',
      response_mode: 'clarify',
      intent: 'sleep',
      confidence: 0.77,
      fallback_code: 'timeout',
      citations: [
        { label: '근거1', source_type: 'profile' },
        { label: '근거2', source_type: 'knowledge_base' },
        { label: '근거3', source_type: 'public_api' },
        { label: '근거4', source_type: 'system_policy' },
      ],
      quick_actions: [
        { id: 'a1', label: '이동', action_type: 'NAVIGATE', route: '/dashboard' },
        { id: 'a2', label: '질문', action_type: 'OPEN_CHAT_QUERY', query: '질문' },
        { id: 'a3', label: '이동2', action_type: 'NAVIGATE', route: '/guide' },
        { id: 'a4', label: '제외', action_type: 'UNKNOWN' },
      ],
      follow_up_questions: ['q1', 'q2', 'q3', 'q4'],
      clarification: {
        question: '어떤 정보가 필요할까요?',
        missing_fields: ['location', 'child_selection', 'one-more', 'extra', 'drop'],
        options: [
          { id: 'c1', label: '옵션1', action_type: 'NAVIGATE', route: '/record' },
          { id: 'c2', label: '옵션2', action_type: 'OPEN_CHAT_QUERY', query: '서울 강남구 어린이집 찾아줘' },
          { id: 'c3', label: '옵션3', action_type: 'NAVIGATE', route: '/calendar' },
          { id: 'c4', label: '옵션4', action_type: 'NAVIGATE', route: '/guide' },
          { id: 'c5', label: '옵션5', action_type: 'NAVIGATE', route: '/dashboard' },
        ]
      }
    });

    assert.equal(meta.response_mode, 'CLARIFY');
    assert.equal(meta.intent, 'SLEEP');
    assert.equal(meta.fallback_code, 'TIMEOUT');
    assert.equal(meta.citations.length, 3);
    assert.equal(meta.quick_actions.length, 3);
    assert.equal(meta.follow_up_questions.length, 3);
    assert.equal(meta.clarification.options.length, 4);
    assert.equal(meta.clarification.missing_fields.length, 4);
  });

  it('유효하지 않은 meta 입력은 null을 반환한다', () => {
    assert.equal(sanitizeChatMeta(null), null);
    assert.equal(sanitizeChatMeta('invalid'), null);
  });
});

describe('buildClientFallbackMeta', () => {
  it('클라이언트 fallback meta를 규격에 맞춰 생성한다', () => {
    const meta = buildClientFallbackMeta({
      lastUserMsg: '다시 알려줘',
      fallbackCode: 'UPSTREAM_ERROR',
      intentHint: 'MEDICAL',
      requestedProfileDomains: ['medical', 'allergy'],
    });

    assert.equal(meta.response_mode, 'FALLBACK');
    assert.equal(meta.fallback_code, 'UPSTREAM_ERROR');
    assert.equal(meta.intent, 'MEDICAL');
    assert.equal(meta.quick_actions.length, 3);
    assert.equal(meta.quick_actions[0].action_type, 'OPEN_CHAT_QUERY');
    assert.equal(meta.quick_actions[0].query, '다시 알려줘');
    assert.equal(meta.follow_up_questions.length, 3);
  });
});
