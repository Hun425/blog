import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { convertObsidian } from './obsidian/convert.ts';
import { buildFrontmatter } from './velog/transform.ts';
import { isCategory } from '../src/lib/categories.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    slug: { type: 'string' }, category: { type: 'string' }, description: { type: 'string' },
    tags: { type: 'string', default: '' }, date: { type: 'string', default: new Date().toISOString().slice(0, 10) },
    force: { type: 'boolean', default: false },
  },
});
const src = positionals[0];
if (!src || !values.slug || !values.category || !values.description)
  throw new Error('usage: import-obsidian <초안.md> --slug --category --description [--tags] [--date] [--force]');
if (!isCategory(values.category)) throw new Error(`unknown category: ${values.category}`);
if (values.description.length > 160) throw new Error('description must be ≤ 160 chars');

const VAULT = process.env.OBSIDIAN_VAULT ?? '/Users/hun/Desktop/project/obsidain';
const { body, attachments, title } = convertObsidian(readFileSync(src, 'utf-8'));
if (!title) throw new Error('초안 첫 줄에 "# 제목" 이 필요합니다');

const dir = join('src/content/posts', `${values.date}-${values.slug}`);
if (existsSync(dir) && !values.force) throw new Error(`${dir} already exists (use --force)`);
mkdirSync(dir, { recursive: true });

const searchDirs = [dirname(src), join(VAULT, 'img'), join(dirname(src), 'attachments')];
attachments.forEach((file, i) => {
  const found = searchDirs.map((d) => join(d, file)).find(existsSync);
  if (!found) throw new Error(`attachment not found: ${file}`);
  copyFileSync(found, join(dir, `img-${String(i + 1).padStart(2, '0')}${extname(file)}`));
});

const tags = values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
const cover = attachments.length ? `./img-01${extname(attachments[0])}` : undefined;
const fm = buildFrontmatter({ title, description: values.description, date: values.date, category: values.category, tags, cover });
writeFileSync(join(dir, 'index.md'), fm + '\n' + body + '\n');
console.log(`wrote ${dir}/index.md (${attachments.length} images) from ${basename(src)}`);
