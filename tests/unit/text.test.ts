import { describe, it, expect } from 'vitest';
import { readingTime, normalizeSlug } from '../../src/lib/text';

describe('readingTime', () => {
  it('빈 본문은 1분', () => expect(readingTime('')).toBe(1));
  it('한글 1000자는 2분', () => expect(readingTime('가'.repeat(1000))).toBe(2));
  it('영단어 400개는 2분', () => expect(readingTime('word '.repeat(400))).toBe(2));
  it('코드 블록도 글자로 센다 (제외하지 않음)', () => {
    expect(readingTime('```\n' + 'x'.repeat(200) + '\n```')).toBe(1);
  });
});

describe('normalizeSlug', () => {
  it('소문자화', () => expect(normalizeSlug('Terraform-도입기')).toBe('terraform-도입기'));
  it('끝 8자리 랜덤 접미사 제거', () => expect(normalizeSlug('가독성-좋은-코드란-exsv51yu')).toBe('가독성-좋은-코드란'));
  it('접미사가 아닌 짧은 꼬리는 유지', () => expect(normalizeSlug('백준-1261-알고스팟')).toBe('백준-1261-알고스팟'));
  it('공백·특수문자 → 하이픈, 연속 하이픈 축약', () => expect(normalizeSlug('TPR vs  EventLoop?')).toBe('tpr-vs-eventloop'));
});
