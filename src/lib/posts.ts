import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Category } from './categories';
import { sortSeries, assertUniqueOrder, prevNext } from './series-logic';

export type Post = CollectionEntry<'posts'>;
export type Series = CollectionEntry<'series'>;

const byDateDesc = (a: Post, b: Post) => b.data.date.getTime() - a.data.date.getTime();

export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort(byDateDesc);
}

export async function getPostsByCategory(category: Category): Promise<Post[]> {
  return (await getPublishedPosts()).filter((p) => p.data.category === category);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return getEntry('posts', slug);
}

export async function getSeries(id: string): Promise<{ meta: Series; posts: Post[] }> {
  const meta = await getEntry('series', id);
  if (!meta) throw new Error(`series "${id}" not found`);
  const members = (await getPublishedPosts()).filter((p) => p.data.series?.id.id === id);
  assertUniqueOrder(id, members);
  return { meta, posts: sortSeries(members) };
}

export async function getSeriesNeighbors(post: Post) {
  if (!post.data.series) return undefined;
  const { meta, posts } = await getSeries(post.data.series.id.id);
  return { meta, posts, ...prevNext(posts, post.id, (p) => p.id) };
}

export async function countByCategory(): Promise<Record<Category, number>> {
  const posts = await getPublishedPosts();
  const counts = { backend: 0, cs: 0, infra: 0, algorithm: 0, career: 0 } as Record<Category, number>;
  for (const p of posts) counts[p.data.category]++;
  return counts;
}

export async function allTags(): Promise<Map<string, Post[]>> {
  const map = new Map<string, Post[]>();
  for (const p of await getPublishedPosts())
    for (const t of p.data.tags) map.set(t, [...(map.get(t) ?? []), p]);
  return map;
}
