const ENDPOINT = 'https://v3.velog.io/graphql';
const HEADERS = { 'content-type': 'application/json', origin: 'https://velog.io', referer: 'https://velog.io/', 'user-agent': 'Mozilla/5.0' };

export interface VelogListItem { id: string; title: string; url_slug: string; released_at: string; thumbnail: string | null; tags: string[]; is_private: boolean; }
export interface VelogPost extends VelogListItem { body: string; is_markdown: boolean; short_description: string; series: { name: string; url_slug: string } | null; }

async function gql<T>(query: string, variables: unknown): Promise<T> {
  const res = await fetch(ENDPOINT, { method: 'POST', headers: HEADERS, body: JSON.stringify({ query, variables }) });
  if (!res.ok) throw new Error(`velog ${res.status}`);
  const json = (await res.json()) as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function listPosts(username: string): Promise<VelogListItem[]> {
  const Q = `query Posts($input: GetPostsInput!){ posts(input:$input){ id title url_slug released_at thumbnail tags is_private } }`;
  const all: VelogListItem[] = [];
  let cursor: string | undefined;
  for (;;) {
    const { posts } = await gql<{ posts: VelogListItem[] }>(Q, { input: { username, limit: 50, cursor } });
    all.push(...posts);
    if (posts.length < 50) break;
    cursor = posts[posts.length - 1].id;
  }
  return all;
}

export async function fetchPost(username: string, url_slug: string): Promise<VelogPost> {
  const Q = `query Post($input: ReadPostInput!){ post(input:$input){ id title url_slug released_at thumbnail tags is_private body is_markdown short_description series { name url_slug } } }`;
  const { post } = await gql<{ post: VelogPost }>(Q, { input: { username, url_slug } });
  return post;
}
