// 실행: npm run migrate [-- --force]
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { listPosts, fetchPost } from './velog/client.ts';
import { folderName, rewriteImages, buildFrontmatter, truncate } from './velog/transform.ts';
import { resolveCategory } from './velog/mapping.ts';

const USERNAME = 'chae0738';
const OUT = 'src/content/posts';
const FORCE = process.argv.includes('--force');
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** astro:assets `image()` 가 인식하지 못하는 확장자를 동일 포맷의 인식 가능한 확장자로 바꾼다. */
function normalizeImageExt(ext: string): string {
  return ext.toLowerCase() === '.jfif' ? '.jpg' : ext;
}

function imageExt(url: string): string {
  return normalizeImageExt(extname(new URL(url).pathname) || '.png');
}

async function download(src: string, dest: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        if (attempt === 0) { await sleep(RETRY_DELAY_MS); continue; }
        return false;
      }
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch {
      if (attempt === 0) { await sleep(RETRY_DELAY_MS); continue; }
      return false;
    }
  }
  return false;
}

async function fetchPostWithRetry(username: string, urlSlug: string) {
  try {
    return await fetchPost(username, urlSlug);
  } catch {
    await sleep(RETRY_DELAY_MS);
    return await fetchPost(username, urlSlug);
  }
}

const report = { total: 0, written: 0, skipped: 0, unmapped: [] as string[], imageFailed: [] as string[], byCategory: {} as Record<string, number> };

const list = await listPosts(USERNAME);
report.total = list.length;
const usedFolders = new Set<string>();

for (const item of list) {
  if (item.is_private) { report.skipped++; continue; }
  const post = await fetchPostWithRetry(USERNAME, item.url_slug);
  if (!post.is_markdown) { report.unmapped.push(`${post.title} (HTML 본문)`); }

  let folder = folderName(post.released_at, post.url_slug, post.title);
  while (usedFolders.has(folder)) folder += '-2';
  usedFolders.add(folder);
  const dir = join(OUT, folder);
  if (existsSync(dir) && !FORCE) { report.skipped++; continue; }
  mkdirSync(dir, { recursive: true });

  const { category, unmapped } = resolveCategory(post.series?.name ?? null, post.title);
  if (unmapped) report.unmapped.push(post.title);
  report.byCategory[category] = (report.byCategory[category] ?? 0) + 1;

  const { body, sources } = rewriteImages(post.body, (src, i) => `./img-${String(i + 1).padStart(2, '0')}${imageExt(src)}`);
  for (const [i, src] of sources.entries()) {
    const ok = await download(src, join(dir, `img-${String(i + 1).padStart(2, '0')}${imageExt(src)}`));
    if (!ok) report.imageFailed.push(`${post.title}: ${src}`);
  }

  let cover: string | undefined;
  if (post.thumbnail) {
    const ext = imageExt(post.thumbnail);
    const idx = sources.indexOf(post.thumbnail);
    if (idx >= 0) cover = `./img-${String(idx + 1).padStart(2, '0')}${ext}`;          // 본문 첫 이미지와 동일하면 재사용
    else if (await download(post.thumbnail, join(dir, `cover${ext}`))) cover = `./cover${ext}`;
    else report.imageFailed.push(`${post.title}: thumbnail ${post.thumbnail}`);
  }

  const fm = buildFrontmatter({
    title: post.title,
    description: truncate(post.short_description || post.title, 160),
    date: post.released_at.slice(0, 10),
    category,
    tags: post.tags,
    cover,
    velogUrl: `https://velog.io/@${USERNAME}/${encodeURIComponent(post.url_slug)}`,
  });
  writeFileSync(join(dir, 'index.md'), fm + '\n' + body.trim() + '\n');
  report.written++;
  console.log(`✓ ${folder} [${category}]`);
}

const md = [
  `# velog 이전 보고서 (${new Date().toISOString().slice(0, 10)})`, '',
  `- 총 ${report.total}건 / 작성 ${report.written} / 건너뜀 ${report.skipped}`,
  `- 카테고리별: ${Object.entries(report.byCategory).map(([k, v]) => `${k} ${v}`).join(', ')}`, '',
  `## 미분류 (${report.unmapped.length})`, ...report.unmapped.map((t) => `- ${t}`), '',
  `## 이미지 실패 (${report.imageFailed.length})`, ...report.imageFailed.map((t) => `- ${t}`), '',
].join('\n');
writeFileSync('scripts/migrate-report.md', md);
console.log('\n' + md);
