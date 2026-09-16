const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // '/blog'

/** 'posts/foo/' | '/posts/foo/' | '' → '/blog/posts/foo/' | '/blog/' */
export function url(path = ''): string {
  const clean = path.replace(/^\//, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}
