import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeMarkdownText, normalizeMarkdownTable } from '../src/utils/markdownFormatter.js';

describe('normalizeMarkdownTable', () => {
  it('파이프 테이블 구분선은 제거하고 행만 텍스트로 변환한다', () => {
    const input = [
      '| 항목 | 설명 |',
      '| --- | --- |',
      '| 원인 | 알레르기 반응 |',
      '| 수면 습관 | 오후 낮잠이 짧음 |',
    ].join('\n');

    const output = normalizeMarkdownTable(input);

    assert.equal(output.includes('|'), false);
    assert.equal(output.includes('원인: 알레르기 반응'), true);
    assert.equal(output.includes('수면 습관: 오후 낮잠이 짧음'), true);
  });

  it('공백이 섞인 파이프 테이블도 정규화한다', () => {
    const input = [
      ' | 분류 | 메모 | ',
      ' | --- | ---: | ',
      ' | 수면 | 오후에 잘 깸 | ',
      ' | 식사 | 밤늦은 수유 | ',
    ].join('\n');

    const output = normalizeMarkdownTable(input);

    assert.equal(output.includes('|'), false);
    assert.equal(output.includes('수면: 오후에 잘 깸'), true);
    assert.equal(output.includes('식사: 밤늦은 수유'), true);
  });

  it('빈 줄이 섞인 테이블도 헤더만 제거하고 내용은 변환한다', () => {
    const input = [
      '| 분류 | 값 |',
      '| --- | --- |',
      '',
      '| 수면 | 오후 낮잠이 짧음 |',
      '',
      '| 성장 | 체중 변화는 정상 범위 내 |',
    ].join('\n');

    const output = normalizeMarkdownTable(input);

    assert.equal(output.includes('분류'), false);
    assert.equal(output.includes('수면: 오후 낮잠이 짧음'), true);
    assert.equal(output.includes('성장: 체중 변화는 정상 범위 내'), true);
  });
});

describe('normalizeMarkdownText', () => {
  it('헤더, 코드 블록, 굵은 글자 표기를 평문으로 정리한다', () => {
    const input = [
      '# 제목',
      '',
      '```',
      '코드',
      '```',
      '**강조**',
      '*기울임*',
      '- 목록 1',
      '1. 번호는 그대로 유지',
      '[링크](https://example.com)',
    ].join('\n');

    const output = normalizeMarkdownText(input);

    assert.equal(output.includes('#'), false);
    assert.equal(output.includes('```'), false);
    assert.equal(output.includes('강조'), true);
    assert.equal(output.includes('기울임'), true);
    assert.equal(output.includes('링크'), true);
  });

  it('테이블 마크업을 파이프 텍스트로 변환한다', () => {
    const input = '| 구분 | 내용 |\n|---|---|\n| 원인 | 수면 주기가 불규칙 |';
    const output = normalizeMarkdownText(input);

    assert.equal(output.includes('구분: 내용'), false);
    assert.equal(output.includes('원인: 수면 주기가 불규칙'), true);
  });
});
