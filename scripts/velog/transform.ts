import { normalizeSlug } from '../../src/lib/text.ts';
import type { Category } from '../../src/lib/categories.ts';

export function folderName(releasedAt: string, urlSlug: string, title: string): string {
  return `${releasedAt.slice(0, 10)}-${normalizeSlug(urlSlug, title)}`;
}

const IMG = /!\[([^\]]*)\]\((https:\/\/velog\.velcdn\.com\/[^)\s]+)\)/g;

export function rewriteImages(body: string, mapper: (src: string, index: number) => string): { body: string; sources: string[] } {
  const sources: string[] = [];
  const out = body.replace(IMG, (_m, alt: string, src: string) => {
    const i = sources.push(src) - 1;
    return `![${alt}](${mapper(src, i)})`;
  });
  return { body: out, sources };
}

export function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1) + '…';
}

const q = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export function buildFrontmatter(f: { title: string; description: string; date: string; category: Category; tags: string[]; cover?: string; velogUrl?: string }): string {
  const lines = [
    `title: ${q(f.title)}`,
    `description: ${q(f.description)}`,
    `date: ${f.date}`,
    `category: ${f.category}`,
    `tags: [${f.tags.map(q).join(', ')}]`,
    ...(f.cover ? [`cover: ${f.cover}`] : []),
    ...(f.velogUrl ? [`velogUrl: ${f.velogUrl}`] : []),
  ];
  return `---\n${lines.join('\n')}\n---\n`;
}
