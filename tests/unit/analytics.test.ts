import { describe, it, expect, vi, beforeEach } from 'vitest';
import { track, progressBuckets } from '../../src/lib/analytics';

describe('track', () => {
  beforeEach(() => { (globalThis as any).window = { gtag: vi.fn(), location: { pathname: '/blog/posts/x/' } }; });
  it('gtag 가 있으면 event 로 호출', () => {
    track({ name: 'toc_click', heading: '들어가며' });
    expect((window as any).gtag).toHaveBeenCalledWith('event', 'toc_click', { heading: '들어가며', post: '/blog/posts/x/' });
  });
  it('gtag 가 없으면 조용히 무시', () => {
    (window as any).gtag = undefined;
    expect(() => track({ name: 'theme_toggle', to: 'dark' })).not.toThrow();
  });
});

describe('progressBuckets', () => {
  it('넘은 버킷만, 한 번씩', () => {
    const seen = new Set<number>();
    expect(progressBuckets(0.3, seen)).toEqual([25]);
    expect(progressBuckets(0.8, seen)).toEqual([50, 75]);
    expect(progressBuckets(1, seen)).toEqual([100]);
    expect(progressBuckets(1, seen)).toEqual([]);
  });
});
