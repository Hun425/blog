import { describe, it, expect } from 'vitest';
import { CATEGORIES, CATEGORY_META, isCategory } from '../../src/lib/categories';

describe('categories', () => {
  it('정확히 5개, 순서 고정', () => {
    expect(CATEGORIES).toEqual(['backend', 'cs', 'infra', 'algorithm', 'career']);
  });
  it('모든 카테고리에 라벨과 CSS 변수가 있다', () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_META[c].label.length).toBeGreaterThan(0);
      expect(CATEGORY_META[c].cssVar).toBe(`--c-${c}`);
    }
  });
  it('isCategory 가드', () => {
    expect(isCategory('infra')).toBe(true);
    expect(isCategory('devops')).toBe(false);
  });
});
