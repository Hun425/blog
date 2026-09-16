import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('BASE_URL', '/blog/');
const { url } = await import('../../src/lib/url');

describe('url', () => {
  it('루트는 /blog/ 로', () => expect(url()).toBe('/blog/'));
  it('상대 경로 앞에 base 를 붙인다', () => expect(url('posts/foo/')).toBe('/blog/posts/foo/'));
  it('선행 슬래시를 중복시키지 않는다', () => expect(url('/posts/foo/')).toBe('/blog/posts/foo/'));
});
