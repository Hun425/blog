# 개인 기술 블로그 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** velog 글 102건을 이전한 Astro 정적 블로그를 `https://hun425.github.io/blog` 에 배포한다. 카드 그리드 홈, 5개 고정 카테고리, 본문 TOC, 시리즈, giscus 댓글, GA4 커스텀 이벤트, RSS/사이트맵/SEO 를 포함한다.

**Architecture:** Astro 6 콘텐츠 레이어(`glob` 로더)로 `src/content/posts/<날짜-슬러그>/index.md` 를 읽고, 카테고리·시리즈는 zod 스키마로 빌드 시점에 검증한다. 모든 조회는 `src/lib/posts.ts` 한 곳을 거치고, 순수 함수(정렬·읽기 시간·슬러그·카테고리 매핑)는 `astro:content` 에 의존하지 않게 분리해 vitest 로 단위 테스트한다. GitHub Actions 가 `main` 푸시마다 빌드해 GitHub Pages 프로젝트 사이트(`base: /blog`)로 배포한다.

**Tech Stack:** Astro 6 · TypeScript · `astro/zod` · `@astrojs/sitemap` · `@astrojs/rss` · Shiki(듀얼 테마) · vitest · Playwright · sharp(OG 이미지 생성) · giscus · GA4(gtag) · GitHub Actions(`withastro/action@v3`, `actions/deploy-pages@v4`) · Node 26 (네이티브 TS 실행)

**Spec:** `docs/superpowers/specs/2026-09-16-blog-design.md` (목업: `docs/superpowers/specs/2026-09-16-blog-mockup.html`)

## Global Constraints

- 저장소 위치 `~/Desktop/project/blog`, GitHub `Hun425/blog` **public**, 기본 브랜치 `main`.
- `astro.config.mjs`: `site: 'https://hun425.github.io'`, `base: '/blog'`. 모든 내부 링크는 `src/lib/url.ts` 의 `url()` 헬퍼를 거친다 (하드코딩 `/blog` 금지).
- 카테고리는 정확히 `['backend', 'cs', 'infra', 'algorithm', 'career']`. 라벨·색·기본 커버는 `src/lib/categories.ts` 한 곳에서만 정의.
- 글 폴더 `YYYY-MM-DD-<slug>/index.md`, URL 은 `/blog/posts/<slug>/` (날짜 제외).
- `description` 은 160자 이하. `series.order` 는 양의 정수, 같은 시리즈 내 중복 시 빌드 실패.
- velog 시리즈는 카테고리로만 매핑하고 새 블로그 시리즈로 옮기지 않는다 (`src/content/series/` 는 이전 후 빈 상태).
- 서체 IBM Plex Sans KR + IBM Plex Mono (Google Fonts). 디자인 토큰은 스펙 6절 값 그대로.
- 패키지 매니저 npm. Node 26. 스크립트 실행은 `node scripts/*.ts` (타입 스트리핑).
- 통계 GA4 만. Cloudflare Web Analytics 사용 안 함. 동의 배너 없음.
- 커밋 메시지: 단일 줄 한국어 + `feat:`/`fix:`/`docs:`/`chore:`/`test:` 접두사.
- 품질 게이트: 각 태스크 끝에 `npm run check` 와 `npm test` 가 PASS 여야 커밋. 페이지가 생긴 이후로는 `npm run build` 도 포함.

---

## 파일 구조

| 경로 | 책임 |
|---|---|
| `astro.config.mjs` | site/base, sitemap, Shiki 듀얼 테마 |
| `src/config.ts` | 사이트 상수 (제목, 설명, GA4 ID, giscus 설정). 빈 값이면 해당 기능 비활성 |
| `src/content.config.ts` | `posts`, `series` 컬렉션 스키마 + `generateId` |
| `src/lib/categories.ts` | `CATEGORIES`, `Category`, `CATEGORY_META`, `isCategory` |
| `src/lib/url.ts` | `url(path)` — base 접두 |
| `src/lib/text.ts` | `readingTime`, `stripDatePrefix`, `normalizeSlug` (순수) |
| `src/lib/series-logic.ts` | `sortSeries`, `assertUniqueOrder`, `prevNext` (순수) |
| `src/lib/posts.ts` | `astro:content` 조회 함수 (위 순수 함수를 조합) |
| `src/lib/analytics.ts` | `track(event)` gtag 래퍼 + 이벤트 타입 |
| `src/styles/global.css` | 토큰, 리셋, 공용 클래스 |
| `src/layouts/Base.astro` | `<head>`(SEO, 폰트, 테마 초기화 스크립트, GA4), Header, Footer |
| `src/layouts/Post.astro` | 본문 2단 레이아웃 (article + aside) |
| `src/components/Seo.astro` | title/description/canonical/OG/JSON-LD |
| `src/components/Header.astro` | 브랜드, 메뉴, ThemeToggle |
| `src/components/ThemeToggle.astro` | data-theme 토글 + localStorage + giscus 동기화 + track |
| `src/components/CategoryTabs.astro` | 전체 + 5개 탭, 글 수 |
| `src/components/PostCard.astro` | 카드 (featured prop) |
| `src/components/PostHeader.astro` | 칩, 제목, 요약, 메타, 커버 |
| `src/components/Toc.astro` | headings → 목차, IntersectionObserver 강조, track |
| `src/components/SeriesNav.astro` | 시리즈 헤더 + 이전/다음 편, track |
| `src/components/SeriesBox.astro` | aside 시리즈 목록 상자 |
| `src/components/TagList.astro` | 태그 링크 |
| `src/components/Giscus.astro` | giscus client.js |
| `src/components/Analytics.astro` | gtag 스니펫 + read_progress/code_copy/outbound 리스너 |
| `src/pages/index.astro` | 전체 카드 그리드 |
| `src/pages/category/[category].astro` | 카테고리별 그리드 |
| `src/pages/posts/[slug].astro` | 본문 |
| `src/pages/series/[series].astro` | 시리즈 목록 |
| `src/pages/tags/[tag].astro` | 태그별 그리드 |
| `src/pages/rss.xml.ts` | RSS |
| `src/pages/404.astro` | 404 |
| `public/og/<category>.png` | 카테고리 기본 OG 이미지 (스크립트 생성) |
| `scripts/gen-og.ts` | OG PNG 5장 생성 |
| `scripts/velog/client.ts` | GraphQL 호출 (목록·단건) |
| `scripts/velog/transform.ts` | 슬러그·카테고리·이미지 링크 치환·frontmatter 생성 (순수) |
| `scripts/migrate-velog.ts` | 오케스트레이션 + 이미지 다운로드 + 보고서 |
| `scripts/obsidian/convert.ts` | 옵시디언 문법 → 표준 마크다운 (순수) |
| `scripts/import-obsidian.ts` | 초안 → 글 폴더 생성 + 첨부 복사 |
| `.claude/skills/publish-post/SKILL.md` | 초안 발행 절차 스킬 |
| `tests/unit/*.test.ts` | vitest |
| `tests/e2e/*.spec.ts` | Playwright |
| `.github/workflows/ci.yml` | PR: check/test/build |
| `.github/workflows/deploy.yml` | main: build → Pages |

---

### Task 1: 프로젝트 스캐폴드와 빌드 파이프라인

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.nvmrc`, `src/config.ts`, `src/lib/url.ts`, `src/pages/index.astro`(임시), `tests/unit/url.test.ts`

**Interfaces:**
- Produces: `url(path: string): string` — `'/'` 또는 `'posts/x/'` 를 받아 `'/blog/'`, `'/blog/posts/x/'` 반환. `SITE` 상수 객체.

- [ ] **Step 1: Astro 프로젝트 생성**

```bash
cd ~/Desktop/project/blog
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --skip-houston
npm install
npm install -D vitest @astrojs/sitemap @astrojs/rss sharp
```

`.nvmrc` 에 `26` 을 쓴다. 생성된 `src/pages/index.astro` 는 그대로 둔다(Task 5 에서 교체).

- [ ] **Step 2: 설정 파일 작성**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hun425.github.io',
  base: '/blog',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
```

```ts
// vitest.config.ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
});
```

```ts
// src/config.ts
// 빈 문자열이면 해당 기능(GA4/giscus)은 렌더되지 않는다.
export const SITE = {
  title: 'hun425.log',
  description: '백엔드 개발자 Hun의 기술 블로그. Java·Kotlin·Spring, CS, 인프라, 알고리즘, 커리어.',
  author: 'Hun425',
  lang: 'ko',
  resumeUrl: 'https://hun425.github.io/',
  githubUrl: 'https://github.com/Hun425',
  velogUrl: 'https://velog.io/@chae0738',
  ga4Id: '',
  giscus: {
    repo: 'Hun425/blog',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
  },
} as const;
```

```ts
// src/lib/url.ts
const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // '/blog'

/** 'posts/foo/' | '/posts/foo/' | '' → '/blog/posts/foo/' | '/blog/' */
export function url(path = ''): string {
  const clean = path.replace(/^\//, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}
```

`package.json` scripts 를 다음으로 교체:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "migrate": "node scripts/migrate-velog.ts",
    "gen:og": "node scripts/gen-og.ts"
  }
}
```

`.gitignore` 에 `node_modules/ dist/ .astro/ test-results/ playwright-report/ scripts/.cache/` 를 넣는다.

- [ ] **Step 3: 실패하는 테스트 작성**

```ts
// tests/unit/url.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('BASE_URL', '/blog/');
const { url } = await import('../../src/lib/url');

describe('url', () => {
  it('루트는 /blog/ 로', () => expect(url()).toBe('/blog/'));
  it('상대 경로 앞에 base 를 붙인다', () => expect(url('posts/foo/')).toBe('/blog/posts/foo/'));
  it('선행 슬래시를 중복시키지 않는다', () => expect(url('/posts/foo/')).toBe('/blog/posts/foo/'));
});
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: 3 passed. (`vi.stubEnv` 가 `import.meta.env.BASE_URL` 을 채운다. 실패하면 `getViteConfig` 가 `.env` 를 못 읽는 것이므로 `vitest.config.ts` 의 import 경로를 확인.)

- [ ] **Step 5: 빌드·체크 통과 확인**

Run: `npm run check && npm run build`
Expected: `dist/index.html` 존재. (`base` 는 출력 폴더 구조를 바꾸지 않는다. 링크만 `/blog/` 접두가 붙고, Pages 가 저장소 이름으로 `/blog/` 에 매핑한다.) `ls dist/index.html` 로 확인.

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: Astro 6 스캐폴드와 base/site 설정, vitest 구성"
```

---

### Task 2: 카테고리 모듈과 콘텐츠 스키마

**Files:**
- Create: `src/lib/categories.ts`, `src/content.config.ts`, `src/content/posts/2026-01-01-sample-backend/index.md`, `src/content/posts/2026-01-02-sample-algorithm/index.md`, `src/content/posts/2026-01-03-sample-career/index.md`, `src/content/series/sample-series.md`, `tests/unit/categories.test.ts`

**Interfaces:**
- Produces: `CATEGORIES`, `type Category`, `CATEGORY_META: Record<Category, { label: string; cssVar: string }>`, `isCategory(x): x is Category`. 컬렉션 `posts`(id = 날짜 뺀 슬러그), `series`(id = 파일명).

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/unit/categories.test.ts
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
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `npm test -- categories`
Expected: FAIL — `Cannot find module '../../src/lib/categories'`

- [ ] **Step 3: 구현**

```ts
// src/lib/categories.ts
export const CATEGORIES = ['backend', 'cs', 'infra', 'algorithm', 'career'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { label: string; cssVar: string }> = {
  backend:   { label: 'Backend',   cssVar: '--c-backend' },
  cs:        { label: 'CS',        cssVar: '--c-cs' },
  infra:     { label: 'Infra',     cssVar: '--c-infra' },
  algorithm: { label: 'Algorithm', cssVar: '--c-algorithm' },
  career:    { label: 'Career',    cssVar: '--c-career' },
};

export function isCategory(x: unknown): x is Category {
  return typeof x === 'string' && (CATEGORIES as readonly string[]).includes(x);
}
```

```ts
// src/content.config.ts
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories';

/** '2026-08-09-terraform-도입기/index.md' → 'terraform-도입기' */
function postId({ entry }: { entry: string }): string {
  return entry.replace(/\/index\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

const series = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts', generateId: postId }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160),
      date: z.coerce.date(),
      category: z.enum(CATEGORIES),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      series: z
        .object({
          id: reference('series'),
          order: z.number().int().positive(),
        })
        .optional(),
      velogUrl: z.string().url().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts, series };
```

- [ ] **Step 4: 샘플 콘텐츠 3건 + 시리즈 1건**

```md
<!-- src/content/series/sample-series.md -->
---
title: 샘플 시리즈
description: 시리즈 내비게이션 확인용. 이전 완료 후 삭제.
---
```

```md
<!-- src/content/posts/2026-01-01-sample-backend/index.md -->
---
title: 샘플 — 백엔드 글
description: 카드·본문·TOC·시리즈 렌더링 확인용 샘플. 이전 완료 후 삭제.
date: 2026-01-01
category: backend
tags: [Spring, sample]
series: { id: sample-series, order: 1 }
velogUrl: https://velog.io/@chae0738
---

## 첫 번째 섹션

본문입니다. `인라인 코드` 와 **강조**.

### 하위 섹션

```kotlin
fun hello() = println("hi")
```

## 두 번째 섹션

> 인용문입니다.

| 항목 | 값 |
|---|---|
| a | 1 |
```

```md
<!-- src/content/posts/2026-01-02-sample-algorithm/index.md -->
---
title: 샘플 — 알고리즘 글 (커버 없음)
description: 커버 이미지가 없을 때 카테고리 그라데이션이 나오는지 확인.
date: 2026-01-02
category: algorithm
tags: [백준]
series: { id: sample-series, order: 2 }
---

## 문제

내용.
```

```md
<!-- src/content/posts/2026-01-03-sample-career/index.md -->
---
title: 샘플 — 커리어 글
description: 시리즈 없는 글.
date: 2026-01-03
category: career
draft: false
---

## 회고

내용.
```

- [ ] **Step 5: 테스트·체크 통과 확인**

Run: `npm test && npm run check`
Expected: categories 3 passed. `astro check` 0 errors (스키마 오류가 있으면 여기서 파일명과 함께 출력된다).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 카테고리 모듈과 posts/series 콘텐츠 스키마, 샘플 글 추가"
```

---

### Task 3: 순수 로직 — 읽기 시간, 슬러그, 시리즈 정렬/검증

**Files:**
- Create: `src/lib/text.ts`, `src/lib/series-logic.ts`, `src/lib/posts.ts`, `tests/unit/text.test.ts`, `tests/unit/series-logic.test.ts`

**Interfaces:**
- Produces:
  - `readingTime(body: string): number` (분, 최소 1, 한글 500자/분·영단어 200/분 혼합)
  - `normalizeSlug(velogSlug: string): string` (소문자, 끝 랜덤 접미사 제거, 공백→`-`)
  - `sortSeries<T extends { data: { series?: { order: number } } }>(posts: T[]): T[]`
  - `assertUniqueOrder(seriesId: string, posts): void` (중복 시 throw)
  - `prevNext<T>(sorted: T[], currentId: string, idOf: (p: T) => string): { prev?: T; next?: T }`
  - `getPublishedPosts()`, `getPostsByCategory(c)`, `getSeries(id)`, `getPost(slug)` (astro:content)

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// tests/unit/text.test.ts
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
```

```ts
// tests/unit/series-logic.test.ts
import { describe, it, expect } from 'vitest';
import { sortSeries, assertUniqueOrder, prevNext } from '../../src/lib/series-logic';

const p = (id: string, order: number) => ({ id, data: { series: { order } } });

describe('sortSeries', () => {
  it('order 오름차순', () => {
    expect(sortSeries([p('c', 3), p('a', 1), p('b', 2)]).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('assertUniqueOrder', () => {
  it('중복 order 는 throw', () => {
    expect(() => assertUniqueOrder('s', [p('a', 1), p('b', 1)])).toThrow(/series "s".*order 1/);
  });
  it('중복 없으면 통과', () => {
    expect(() => assertUniqueOrder('s', [p('a', 1), p('b', 2)])).not.toThrow();
  });
});

describe('prevNext', () => {
  const sorted = [p('a', 1), p('b', 2), p('c', 3)];
  const idOf = (x: { id: string }) => x.id;
  it('가운데', () => expect(prevNext(sorted, 'b', idOf)).toEqual({ prev: sorted[0], next: sorted[2] }));
  it('처음', () => expect(prevNext(sorted, 'a', idOf)).toEqual({ prev: undefined, next: sorted[1] }));
  it('끝', () => expect(prevNext(sorted, 'c', idOf)).toEqual({ prev: sorted[1], next: undefined }));
});
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — 두 모듈 모두 `Cannot find module`

- [ ] **Step 3: 구현**

```ts
// src/lib/text.ts
const HANGUL_PER_MIN = 500;
const WORDS_PER_MIN = 200;

export function readingTime(body: string): number {
  const hangul = (body.match(/[가-힣]/g) ?? []).length;
  const words = (body.replace(/[가-힣]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  const minutes = hangul / HANGUL_PER_MIN + words / WORDS_PER_MIN;
  return Math.max(1, Math.round(minutes));
}

/** velog url_slug → 새 블로그 슬러그 */
export function normalizeSlug(velogSlug: string): string {
  return velogSlug
    .toLowerCase()
    .replace(/-[a-z0-9]{8}$/, '')          // velog 가 중복 제목에 붙이는 8자리 접미사
    .replace(/[^\p{L}\p{N}]+/gu, '-')       // 문자·숫자 외 → 하이픈
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
```

```ts
// src/lib/series-logic.ts
type WithOrder = { data: { series?: { order: number } } };

export function sortSeries<T extends WithOrder>(posts: T[]): T[] {
  return [...posts].sort((a, b) => (a.data.series?.order ?? 0) - (b.data.series?.order ?? 0));
}

export function assertUniqueOrder<T extends WithOrder>(seriesId: string, posts: T[]): void {
  const seen = new Set<number>();
  for (const p of posts) {
    const o = p.data.series?.order ?? 0;
    if (seen.has(o)) throw new Error(`series "${seriesId}": duplicate order ${o}`);
    seen.add(o);
  }
}

export function prevNext<T>(sorted: T[], currentId: string, idOf: (p: T) => string): { prev?: T; next?: T } {
  const i = sorted.findIndex((p) => idOf(p) === currentId);
  return { prev: i > 0 ? sorted[i - 1] : undefined, next: i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : undefined };
}
```

```ts
// src/lib/posts.ts
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
```

- [ ] **Step 4: 테스트·체크 통과 확인**

Run: `npm test && npm run check`
Expected: text 8 + series-logic 5 passed, check 0 errors.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 읽기 시간·슬러그·시리즈 정렬 순수 로직과 posts 조회 모듈 추가"
```

---

### Task 4: 디자인 토큰, Base 레이아웃, 헤더, 테마 토글

**Files:**
- Create: `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/ThemeToggle.astro`, `src/components/Seo.astro`
- Modify: `src/pages/index.astro` (Base 레이아웃 적용, 내용은 임시)

**Interfaces:**
- Produces: `<Base title description? image? type?>` 슬롯 레이아웃. `Seo` props `{ title, description, canonical, image, type: 'website' | 'article', publishedTime? }`. 전역 CSS 클래스 `.wrap`, `.chip.<category>`, `.cover.<category>`.
- 테마: `<html data-theme="light|dark">`. `localStorage['theme']`. 커스텀 이벤트 `window.dispatchEvent(new CustomEvent('themechange', { detail: 'dark' }))` 를 토글 시 발행 (Giscus·Analytics 가 구독).

- [ ] **Step 1: 전역 CSS (목업의 토큰을 그대로 옮긴다)**

```css
/* src/styles/global.css */
:root {
  --bg:#F4F6F9; --surface:#FFFFFF; --surface-2:#EBEFF4; --line:#D9DFE7;
  --ink:#111827; --ink-2:#4B5563; --ink-3:#7B8595;
  --accent:#1F4FD8; --accent-ink:#FFFFFF; --accent-soft:#E3EAFB;
  --c-backend:#1F4FD8; --c-cs:#7C3AED; --c-infra:#0F766E; --c-algorithm:#B45309; --c-career:#BE185D;
  --shadow:0 1px 2px rgba(17,24,39,.06),0 8px 24px -12px rgba(17,24,39,.18);
  --radius:10px;
  color-scheme: light;
}
:root[data-theme="dark"] {
  --bg:#0E1217; --surface:#161B22; --surface-2:#1F2630; --line:#2A3340;
  --ink:#E6EAF0; --ink-2:#AAB3C0; --ink-3:#737E8D;
  --accent:#7B9CFF; --accent-ink:#0B1220; --accent-soft:#1B2540;
  --c-backend:#7B9CFF; --c-cs:#B896FF; --c-infra:#4FD1C5; --c-algorithm:#F6B26B; --c-career:#F783AC;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -12px rgba(0,0,0,.6);
  color-scheme: dark;
}

*,*::before,*::after { box-sizing:border-box; }
html { -webkit-text-size-adjust:100%; }
body {
  margin:0; background:var(--bg); color:var(--ink);
  font-family:"IBM Plex Sans KR","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;
  font-size:15px; line-height:1.6; -webkit-font-smoothing:antialiased;
}
a { color:inherit; text-decoration:none; }
h1,h2,h3 { text-wrap:balance; margin:0; }
img { max-width:100%; height:auto; }
:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.mono { font-family:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace; }
.wrap { max-width:1120px; margin:0 auto; padding-inline:20px; }

/* 카테고리 칩 */
.chip { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; letter-spacing:.04em;
  text-transform:uppercase; padding:2px 8px; border-radius:4px; width:fit-content; color:var(--chip); background:color-mix(in srgb,var(--chip) 12%,transparent); }
.chip::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor; }
.chip.backend { --chip:var(--c-backend); } .chip.cs { --chip:var(--c-cs); } .chip.infra { --chip:var(--c-infra); }
.chip.algorithm { --chip:var(--c-algorithm); } .chip.career { --chip:var(--c-career); }

/* 기본 커버 (이미지 없을 때) */
.cover { aspect-ratio:16/9; width:100%; position:relative; overflow:hidden; background:var(--surface-2); display:grid; place-items:center; }
.cover.fallback { background:linear-gradient(135deg,color-mix(in srgb,var(--cov) 18%,var(--surface-2)),color-mix(in srgb,var(--cov) 40%,var(--surface-2))); }
.cover.backend { --cov:var(--c-backend); } .cover.cs { --cov:var(--c-cs); } .cover.infra { --cov:var(--c-infra); }
.cover.algorithm { --cov:var(--c-algorithm); } .cover.career { --cov:var(--c-career); }
.cover img { width:100%; height:100%; object-fit:cover; display:block; }

/* Shiki 듀얼 테마 */
:root[data-theme="dark"] .astro-code, :root[data-theme="dark"] .astro-code span {
  color:var(--shiki-dark) !important; background-color:var(--shiki-dark-bg) !important;
}
@media (prefers-reduced-motion: reduce) { * { transition:none !important; animation:none !important; } }
```

- [ ] **Step 2: Seo, Header, ThemeToggle, Base**

```astro
---
// src/components/Seo.astro
import { SITE } from '../config';
interface Props { title: string; description: string; canonical: string; image: string; type: 'website' | 'article'; publishedTime?: string; }
const { title, description, canonical, image, type, publishedTime } = Astro.props;
const fullTitle = title === SITE.title ? title : `${title} · ${SITE.title}`;
const jsonLd = type === 'article'
  ? { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description, image, datePublished: publishedTime, author: { '@type': 'Person', name: SITE.author }, mainEntityOfPage: canonical }
  : { '@context': 'https://schema.org', '@type': 'Blog', name: SITE.title, description, url: canonical };
---
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta property="og:type" content={type} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={image} />
<meta property="og:locale" content="ko_KR" />
<meta name="twitter:card" content="summary_large_image" />
{publishedTime && <meta property="article:published_time" content={publishedTime} />}
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

```astro
---
// src/components/ThemeToggle.astro
---
<button id="theme-toggle" class="icon-btn" type="button" aria-label="테마 전환" title="테마 전환">
  <span class="sun" aria-hidden="true">☼</span><span class="moon" aria-hidden="true">☾</span>
</button>
<style>
  .icon-btn { width:32px; height:32px; border-radius:8px; border:1px solid var(--line); background:var(--surface-2); display:grid; place-items:center; color:var(--ink-2); font-size:14px; cursor:pointer; }
  .moon, :global(:root[data-theme="dark"]) .sun { display:none; }
  :global(:root[data-theme="dark"]) .moon { display:inline; }
</style>
<script>
  const btn = document.getElementById('theme-toggle')!;
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  });
</script>
```

```astro
---
// src/components/Header.astro
import { SITE } from '../config';
import { url } from '../lib/url';
import ThemeToggle from './ThemeToggle.astro';
const path = Astro.url.pathname;
const is = (p: string) => path.startsWith(url(p));
---
<header class="site-header">
  <div class="wrap">
    <a class="brand" href={url()}><span class="dot"></span>{SITE.title}</a>
    <nav class="nav" aria-label="주요 메뉴">
      <a class:list={{ active: path === url() || is('posts') || is('category') }} href={url()}>글</a>
      <a class:list={{ active: is('series') }} href={url('series/')}>시리즈</a>
      <a class:list={{ active: is('tags') }} href={url('tags/')}>태그</a>
      <a href={SITE.resumeUrl} data-outbound="resume">이력서 ↗</a>
    </nav>
    <ThemeToggle />
  </div>
</header>
<style>
  .site-header { border-bottom:1px solid var(--line); background:var(--surface); }
  .wrap { display:flex; align-items:center; gap:24px; height:60px; }
  .brand { font-weight:700; font-size:17px; letter-spacing:-.01em; display:flex; align-items:center; gap:8px; }
  .dot { width:10px; height:10px; border-radius:3px; background:var(--accent); }
  .nav { display:flex; gap:18px; color:var(--ink-2); font-size:14px; margin-left:auto; }
  .nav a.active { color:var(--ink); font-weight:600; }
  @media (max-width:560px) { .nav { gap:12px; font-size:13px; } }
</style>
```

```astro
---
// src/layouts/Base.astro
import '../styles/global.css';
import { SITE } from '../config';
import { url } from '../lib/url';
import Seo from '../components/Seo.astro';
import Header from '../components/Header.astro';
import Analytics from '../components/Analytics.astro';
interface Props { title?: string; description?: string; image?: string; type?: 'website' | 'article'; publishedTime?: string; }
const { title = SITE.title, description = SITE.description, image = new URL(url('og/default.png'), Astro.site).href, type = 'website', publishedTime } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
---
<html lang={SITE.lang}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <Seo {title} {description} {canonical} {image} {type} {publishedTime} />
  <link rel="alternate" type="application/rss+xml" title={SITE.title} href={url('rss.xml')} />
  <link rel="sitemap" href={url('sitemap-index.xml')} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" />
  <script is:inline>
    (function(){try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();
  </script>
  <Analytics />
</head>
<body>
  <Header />
  <slot />
  <footer class="site-footer">
    <div class="wrap">
      <span>© {new Date().getFullYear()} {SITE.author}</span>
      <span><a href={url('rss.xml')}>RSS</a> · <a href={SITE.githubUrl} data-outbound="github">GitHub</a> · <a href={SITE.resumeUrl} data-outbound="resume">이력서</a></span>
    </div>
  </footer>
</body>
</html>
<style>
  .site-footer { border-top:1px solid var(--line); padding-block:24px; color:var(--ink-3); font-size:12.5px; margin-top:48px; }
  .site-footer .wrap { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
</style>
```

`Analytics.astro` 는 Task 9 에서 만든다. 이 태스크에서는 빈 컴포넌트로 먼저 만든다:

```astro
---
// src/components/Analytics.astro  (Task 9 에서 채움)
---
```

- [ ] **Step 3: index.astro 를 Base 로 감싸기 (임시 내용)**

```astro
---
// src/pages/index.astro
import Base from '../layouts/Base.astro';
---
<Base>
  <main class="wrap"><p>카드 그리드 자리 (Task 5)</p></main>
</Base>
```

- [ ] **Step 4: 빌드·체크 확인 + 눈으로 확인**

Run: `npm run check && npm run build && npm run preview`
Expected: check 0 errors. 브라우저에서 `http://localhost:4321/blog/` 열어 헤더·푸터·토글 동작(새로고침 후 유지) 확인. `dist/index.html` 에 `og:image` 가 `https://hun425.github.io/blog/og/default.png` 로 찍혀 있는지 `grep og:image dist/index.html`.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 디자인 토큰·Base 레이아웃·헤더·테마 토글·SEO 메타 추가"
```

---

### Task 5: 카드 그리드 홈과 카테고리 페이지

**Files:**
- Create: `src/components/PostCard.astro`, `src/components/CategoryTabs.astro`, `src/pages/category/[category].astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getPublishedPosts`, `getPostsByCategory`, `countByCategory`, `CATEGORY_META`, `readingTime`, `url`.
- Produces: `<PostCard post featured?>`, `<CategoryTabs active counts>` (`active: Category | 'all'`).

- [ ] **Step 1: PostCard**

```astro
---
// src/components/PostCard.astro
import { Image } from 'astro:assets';
import type { Post } from '../lib/posts';
import { CATEGORY_META } from '../lib/categories';
import { readingTime } from '../lib/text';
import { url } from '../lib/url';
interface Props { post: Post; featured?: boolean; }
const { post, featured = false } = Astro.props;
const { title, description, date, category, cover, series } = post.data;
const fmt = date.toISOString().slice(0, 10).replaceAll('-', '.');
---
<a class:list={['card', { featured }]} href={url(`posts/${post.id}/`)}>
  {cover
    ? <div class="cover"><Image src={cover} alt="" widths={[480, 960]} sizes={featured ? '(max-width: 900px) 100vw, 740px' : '(max-width: 560px) 100vw, 360px'} loading={featured ? 'eager' : 'lazy'} /></div>
    : <div class:list={['cover', 'fallback', category]}><span class="glyph mono">{CATEGORY_META[category].label}</span></div>}
  <div class="body">
    <span class:list={['chip', category]}>{CATEGORY_META[category].label}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <div class="meta">
      <span class="mono">{fmt}</span><span>·</span><span>{readingTime(post.body ?? '')}분</span>
      {series && <span class="series">시리즈</span>}
    </div>
  </div>
</a>
<style>
  .card { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); overflow:hidden; display:flex; flex-direction:column; transition:transform .15s ease, box-shadow .15s ease; }
  .card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
  .card.featured { grid-column:span 2; grid-row:span 2; }
  .card.featured .cover { aspect-ratio:16/8.4; }
  .glyph { font-size:13px; letter-spacing:.12em; text-transform:uppercase; opacity:.55; }
  .body { padding:16px 18px 18px; display:flex; flex-direction:column; gap:8px; flex:1; }
  h3 { font-size:17px; font-weight:600; line-height:1.35; letter-spacing:-.01em; }
  .featured h3 { font-size:24px; }
  p { margin:0; color:var(--ink-2); font-size:13.5px; line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .featured p { -webkit-line-clamp:3; font-size:14.5px; }
  .meta { margin-top:auto; padding-top:6px; display:flex; gap:10px; align-items:center; color:var(--ink-3); font-size:12px; font-variant-numeric:tabular-nums; }
  .series { color:var(--accent); font-weight:500; }
  @media (max-width:900px) { .card.featured { grid-column:span 2; grid-row:auto; } }
  @media (max-width:560px) { .card.featured { grid-column:span 1; } }
</style>
```

- [ ] **Step 2: CategoryTabs**

```astro
---
// src/components/CategoryTabs.astro
import { CATEGORIES, CATEGORY_META, type Category } from '../lib/categories';
import { url } from '../lib/url';
interface Props { active: Category | 'all'; counts: Record<Category, number>; }
const { active, counts } = Astro.props;
const total = Object.values(counts).reduce((a, b) => a + b, 0);
---
<nav class="tabs" aria-label="카테고리">
  <a class:list={['tab', { active: active === 'all' }]} href={url()} aria-current={active === 'all' ? 'page' : undefined}>전체 <span class="n">{total}</span></a>
  {CATEGORIES.map((c) => (
    <a class:list={['tab', { active: active === c }]} href={url(`category/${c}/`)} aria-current={active === c ? 'page' : undefined}>
      <span class="sw" style={`background:var(${CATEGORY_META[c].cssVar})`}></span>{CATEGORY_META[c].label} <span class="n">{counts[c]}</span>
    </a>
  ))}
</nav>
<style>
  .tabs { display:flex; gap:6px; overflow-x:auto; padding-block:18px 6px; scrollbar-width:none; }
  .tabs::-webkit-scrollbar { display:none; }
  .tab { flex:none; display:inline-flex; align-items:center; gap:8px; padding:7px 14px; border-radius:999px; border:1px solid var(--line); background:var(--surface); color:var(--ink-2); font-size:13.5px; font-weight:500; }
  .n { font-size:11.5px; color:var(--ink-3); font-variant-numeric:tabular-nums; }
  .tab.active { background:var(--ink); color:var(--bg); border-color:var(--ink); }
  .tab.active .n { color:inherit; opacity:.7; }
  .sw { width:8px; height:8px; border-radius:50%; }
</style>
```

- [ ] **Step 3: 홈과 카테고리 페이지**

```astro
---
// src/pages/index.astro
import Base from '../layouts/Base.astro';
import CategoryTabs from '../components/CategoryTabs.astro';
import PostCard from '../components/PostCard.astro';
import { getPublishedPosts, countByCategory } from '../lib/posts';
const posts = await getPublishedPosts();
const counts = await countByCategory();
---
<Base>
  <main class="wrap">
    <CategoryTabs active="all" {counts} />
    <div class="grid">
      {posts.map((post, i) => <PostCard {post} featured={i === 0} />)}
    </div>
  </main>
</Base>
<style is:global>
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; padding-block:14px 48px; }
  @media (max-width:900px) { .grid { grid-template-columns:repeat(2,1fr); } }
  @media (max-width:560px) { .grid { grid-template-columns:1fr; gap:16px; } }
</style>
```

```astro
---
// src/pages/category/[category].astro
import Base from '../../layouts/Base.astro';
import CategoryTabs from '../../components/CategoryTabs.astro';
import PostCard from '../../components/PostCard.astro';
import { CATEGORIES, CATEGORY_META } from '../../lib/categories';
import { getPostsByCategory, countByCategory } from '../../lib/posts';

export function getStaticPaths() {
  return CATEGORIES.map((category) => ({ params: { category } }));
}
const { category } = Astro.params;
const posts = await getPostsByCategory(category);
const counts = await countByCategory();
---
<Base title={CATEGORY_META[category].label} description={`${CATEGORY_META[category].label} 카테고리 글 ${posts.length}건`}>
  <main class="wrap">
    <CategoryTabs active={category} {counts} />
    <div class="grid">
      {posts.map((post, i) => <PostCard {post} featured={i === 0} />)}
      {posts.length === 0 && <p class="empty">아직 글이 없습니다.</p>}
    </div>
  </main>
</Base>
```

`.grid` 스타일은 index.astro 의 `is:global` 이 전역에 남으므로 재사용된다. 더 깔끔하게 하려면 `.grid` 규칙을 `global.css` 로 옮긴다 — 이 태스크에서 `global.css` 끝에 옮기고 index.astro 의 `<style is:global>` 은 삭제한다.

- [ ] **Step 4: 빌드·확인**

Run: `npm run check && npm run build && npm run preview`
Expected: `dist/category/backend/index.html` 등 5개 생성. 브라우저에서 홈: 샘플 3건 중 최신(career)이 featured 로 2칸, 알고리즘 카드는 그라데이션 커버. 탭 클릭 시 필터링과 숫자 일치.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: 카드 그리드 홈과 카테고리 탭·페이지 추가"
```

---

### Task 6: 본문 페이지 — PostHeader, TOC, 태그, 태그 페이지

**Files:**
- Create: `src/layouts/Post.astro`, `src/components/PostHeader.astro`, `src/components/Toc.astro`, `src/components/TagList.astro`, `src/pages/posts/[slug].astro`, `src/pages/tags/[tag].astro`, `src/pages/tags/index.astro`, `src/pages/404.astro`

**Interfaces:**
- Consumes: `getPublishedPosts`, `getPost`, `allTags`, `render(entry)` 의 `headings: { depth; slug; text }[]`.
- Produces: `<Toc headings>`, `<TagList tags>`, `<PostHeader post>`. Post 레이아웃 슬롯 `default`(article), `aside`.
- TOC 클릭 시 `document.dispatchEvent(new CustomEvent('blog:toc_click', { detail: { heading } }))` 발행 (Analytics 가 구독).

- [ ] **Step 1: 컴포넌트**

```astro
---
// src/components/PostHeader.astro
import { Image } from 'astro:assets';
import type { Post } from '../lib/posts';
import { CATEGORY_META } from '../lib/categories';
import { readingTime } from '../lib/text';
interface Props { post: Post; seriesLabel?: string; }
const { post, seriesLabel } = Astro.props;
const { title, description, date, category, cover } = post.data;
const fmt = date.toISOString().slice(0, 10).replaceAll('-', '.');
---
<div class="post-head">
  <span class:list={['chip', category]}>{CATEGORY_META[category].label}</span>
  <h1>{title}</h1>
  <p class="lead">{description}</p>
  <div class="meta">
    <span class="mono">{fmt}</span><span>·</span><span>{readingTime(post.body ?? '')}분 읽기</span>
    {seriesLabel && <><span>·</span><span class="series">{seriesLabel}</span></>}
  </div>
</div>
{cover && <div class="post-cover"><Image src={cover} alt="" widths={[720, 1440]} sizes="(max-width: 760px) 100vw, 1120px" loading="eager" /></div>}
<style>
  .post-head { padding-block:36px 24px; max-width:760px; }
  h1 { font-size:34px; font-weight:700; line-height:1.25; letter-spacing:-.02em; margin-top:12px; }
  .lead { color:var(--ink-2); font-size:16px; margin:12px 0 0; }
  .meta { padding-top:16px; display:flex; gap:10px; align-items:center; color:var(--ink-3); font-size:13px; font-variant-numeric:tabular-nums; }
  .series { color:var(--accent); font-weight:500; }
  .post-cover { border-radius:var(--radius); border:1px solid var(--line); overflow:hidden; aspect-ratio:21/8; margin-bottom:8px; }
  .post-cover img { width:100%; height:100%; object-fit:cover; display:block; }
  @media (max-width:560px) { h1 { font-size:26px; } }
</style>
```

```astro
---
// src/components/Toc.astro
import type { MarkdownHeading } from 'astro';
interface Props { headings: MarkdownHeading[]; }
const items = Astro.props.headings.filter((h) => h.depth === 2 || h.depth === 3);
---
{items.length > 0 && (
  <nav class="toc" aria-label="목차">
    <div class="t">On this page</div>
    <ol>
      {items.map((h) => <li class:list={{ sub: h.depth === 3 }}><a href={`#${h.slug}`} data-toc={h.slug}>{h.text}</a></li>)}
    </ol>
  </nav>
)}
<style>
  .toc { font-size:13.5px; }
  .t { font-size:11.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-3); font-weight:600; margin-bottom:10px; }
  ol { list-style:none; margin:0; padding:0; border-left:1px solid var(--line); }
  li a { display:block; padding:5px 0 5px 14px; color:var(--ink-3); border-left:2px solid transparent; margin-left:-1px; line-height:1.4; }
  li.sub a { padding-left:26px; font-size:13px; }
  li.on a { color:var(--ink); border-left-color:var(--accent); font-weight:500; }
</style>
<script>
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc]')];
  const byId = new Map(links.map((a) => [a.dataset.toc!, a.parentElement!]));
  const headings = links.map((a) => document.getElementById(a.dataset.toc!)).filter(Boolean) as HTMLElement[];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      byId.forEach((li) => li.classList.remove('on'));
      byId.get(e.target.id)?.classList.add('on');
    }
  }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });
  headings.forEach((h) => io.observe(h));
  links.forEach((a) => a.addEventListener('click', () =>
    document.dispatchEvent(new CustomEvent('blog:toc_click', { detail: { heading: a.textContent ?? '' } }))));
</script>
```

```astro
---
// src/components/TagList.astro
import { url } from '../lib/url';
interface Props { tags: string[]; }
---
{Astro.props.tags.length > 0 && (
  <div class="tags">{Astro.props.tags.map((t) => <a href={url(`tags/${encodeURIComponent(t)}/`)}>#{t}</a>)}</div>
)}
<style>
  .tags { display:flex; gap:8px; flex-wrap:wrap; margin-top:28px; }
  a { font-size:12.5px; color:var(--ink-2); background:var(--surface-2); padding:3px 10px; border-radius:999px; }
</style>
```

- [ ] **Step 2: Post 레이아웃과 본문 페이지**

```astro
---
// src/layouts/Post.astro
import Base from './Base.astro';
interface Props { title: string; description: string; image?: string; publishedTime: string; }
---
<Base {...Astro.props} type="article">
  <main class="wrap">
    <slot name="header" />
    <div class="post-layout">
      <article class="article"><slot /></article>
      <aside class="aside"><slot name="aside" /></aside>
    </div>
  </main>
</Base>
<style is:global>
  .post-layout { display:grid; grid-template-columns:minmax(0,720px) 240px; gap:56px; padding-block:24px 64px; justify-content:space-between; }
  .aside { position:sticky; top:72px; align-self:start; display:flex; flex-direction:column; gap:26px; }
  .article { font-size:16px; line-height:1.8; }
  .article h2 { font-size:22px; font-weight:700; margin:40px 0 12px; letter-spacing:-.01em; scroll-margin-top:80px; }
  .article h3 { font-size:17.5px; font-weight:600; margin:28px 0 8px; scroll-margin-top:80px; }
  .article p { margin:0 0 16px; }
  .article pre { border-radius:8px; padding:16px 18px; overflow-x:auto; font-size:13.5px; line-height:1.6; margin:0 0 20px; position:relative; }
  .article :not(pre) > code { background:var(--surface-2); padding:1px 6px; border-radius:4px; font-size:.92em; font-family:"IBM Plex Mono",monospace; }
  .article blockquote { margin:0 0 16px; padding:10px 18px; border-left:3px solid var(--accent); background:var(--accent-soft); border-radius:0 8px 8px 0; color:var(--ink-2); }
  .article table { border-collapse:collapse; width:100%; font-size:14px; margin:0 0 20px; display:block; overflow-x:auto; }
  .article th, .article td { border:1px solid var(--line); padding:8px 12px; text-align:left; }
  .article th { background:var(--surface-2); font-weight:600; }
  .article img { border-radius:8px; }
  .origin { margin-top:18px; font-size:13px; color:var(--ink-3); }
  .origin a { color:var(--accent); }
  @media (max-width:900px) { .post-layout { grid-template-columns:1fr; } .aside { position:static; order:-1; } }
</style>
```

```astro
---
// src/pages/posts/[slug].astro
import { render } from 'astro:content';
import Post from '../../layouts/Post.astro';
import PostHeader from '../../components/PostHeader.astro';
import Toc from '../../components/Toc.astro';
import TagList from '../../components/TagList.astro';
import { getPublishedPosts } from '../../lib/posts';
import { url } from '../../lib/url';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}
const { post } = Astro.props;
const { Content, headings } = await render(post);
const image = post.data.cover
  ? new URL(post.data.cover.src, Astro.site).href
  : new URL(url(`og/${post.data.category}.png`), Astro.site).href;
---
<Post title={post.data.title} description={post.data.description} {image} publishedTime={post.data.date.toISOString()}>
  <PostHeader slot="header" {post} />
  <Content />
  <TagList tags={post.data.tags} />
  {post.data.velogUrl && <p class="origin">이 글은 velog에 먼저 올렸던 글입니다 · <a href={post.data.velogUrl} data-outbound="velog" rel="noopener">원문 보기 ↗</a></p>}
  <Toc slot="aside" {headings} />
</Post>
```

```astro
---
// src/pages/tags/[tag].astro
import Base from '../../layouts/Base.astro';
import PostCard from '../../components/PostCard.astro';
import { allTags } from '../../lib/posts';
export async function getStaticPaths() {
  const tags = await allTags();
  return [...tags.entries()].map(([tag, posts]) => ({ params: { tag }, props: { tag, posts } }));
}
const { tag, posts } = Astro.props;
---
<Base title={`#${tag}`} description={`${tag} 태그 글 ${posts.length}건`}>
  <main class="wrap">
    <h1 class="page-title">#{tag} <span class="n">{posts.length}</span></h1>
    <div class="grid">{posts.map((post) => <PostCard {post} />)}</div>
  </main>
</Base>
<style is:global>
  .page-title { font-size:24px; font-weight:700; padding-block:28px 8px; }
  .page-title .n { color:var(--ink-3); font-size:16px; font-weight:500; margin-left:6px; }
</style>
```

```astro
---
// src/pages/tags/index.astro
import Base from '../../layouts/Base.astro';
import { allTags } from '../../lib/posts';
import { url } from '../../lib/url';
const tags = [...(await allTags()).entries()].sort((a, b) => b[1].length - a[1].length);
---
<Base title="태그" description="전체 태그 목록">
  <main class="wrap">
    <h1 class="page-title">태그 <span class="n">{tags.length}</span></h1>
    <div class="cloud">{tags.map(([t, ps]) => <a href={url(`tags/${encodeURIComponent(t)}/`)}>#{t} <span>{ps.length}</span></a>)}</div>
  </main>
</Base>
<style>
  .cloud { display:flex; flex-wrap:wrap; gap:8px; padding-block:12px 48px; }
  .cloud a { font-size:13.5px; color:var(--ink-2); background:var(--surface-2); padding:5px 12px; border-radius:999px; }
  .cloud span { color:var(--ink-3); font-size:12px; }
</style>
```

```astro
---
// src/pages/404.astro
import Base from '../layouts/Base.astro';
import { url } from '../lib/url';
---
<Base title="404">
  <main class="wrap" style="padding-block:80px; text-align:center;">
    <h1>페이지를 찾을 수 없습니다</h1>
    <p><a href={url()} style="color:var(--accent)">홈으로</a></p>
  </main>
</Base>
```

- [ ] **Step 3: 빌드·확인**

Run: `npm run check && npm run build && npm run preview`
Expected: `dist/posts/sample-backend/index.html` 존재 (날짜 접두사 없는 슬러그). 브라우저에서 본문: 코드 블록이 라이트/다크에서 각각 다른 테마, TOC 가 h2/h3 표시, 스크롤 시 현재 항목 강조, 태그 클릭 시 태그 페이지 이동. `grep -c 'shiki-dark' dist/posts/sample-backend/index.html` ≥ 1.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: 본문 페이지·TOC·태그 목록·태그 페이지·404 추가"
```

---

### Task 7: 시리즈 내비게이션과 시리즈 페이지

**Files:**
- Create: `src/components/SeriesNav.astro`, `src/components/SeriesBox.astro`, `src/pages/series/[series].astro`, `src/pages/series/index.astro`
- Modify: `src/pages/posts/[slug].astro`

**Interfaces:**
- Consumes: `getSeriesNeighbors(post)` → `{ meta, posts, prev?, next? }`, `getSeries(id)`, `getCollection('series')`.
- SeriesNav 클릭 시 `document.dispatchEvent(new CustomEvent('blog:series_nav', { detail: { direction } }))`.

- [ ] **Step 1: 컴포넌트**

```astro
---
// src/components/SeriesNav.astro
import type { Post, Series } from '../lib/posts';
import { url } from '../lib/url';
interface Props { meta: Series; posts: Post[]; current: Post; prev?: Post; next?: Post; }
const { meta, posts, current, prev, next } = Astro.props;
const idx = posts.findIndex((p) => p.id === current.id) + 1;
---
<nav class="series-nav" aria-label="시리즈 이동">
  <div class="head"><a href={url(`series/${meta.id}/`)}><b>시리즈 · {meta.data.title}</b></a><span class="mono">{idx} / {posts.length}</span></div>
  <div class="pn">
    {prev ? <a href={url(`posts/${prev.id}/`)} data-series-nav="prev"><small>← 이전 편</small><strong>{prev.data.title}</strong></a> : <span></span>}
    {next ? <a href={url(`posts/${next.id}/`)} data-series-nav="next"><small>다음 편 →</small><strong>{next.data.title}</strong></a> : <span></span>}
  </div>
</nav>
<style>
  .series-nav { margin-top:44px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); overflow:hidden; }
  .head { padding:12px 18px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; font-size:13px; }
  .head b { color:var(--accent); }
  .head span { color:var(--ink-3); }
  .pn { display:grid; grid-template-columns:1fr 1fr; }
  .pn a { padding:14px 18px; display:flex; flex-direction:column; gap:3px; }
  .pn a + a, .pn span + a { border-left:1px solid var(--line); text-align:right; }
  small { color:var(--ink-3); font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; }
  strong { font-weight:600; font-size:14.5px; }
  @media (max-width:560px) { .pn { grid-template-columns:1fr; } .pn a + a, .pn span + a { border-left:0; border-top:1px solid var(--line); text-align:left; } }
</style>
<script>
  document.querySelectorAll<HTMLAnchorElement>('[data-series-nav]').forEach((a) =>
    a.addEventListener('click', () => document.dispatchEvent(new CustomEvent('blog:series_nav', { detail: { direction: a.dataset.seriesNav } }))));
</script>
```

```astro
---
// src/components/SeriesBox.astro
import type { Post, Series } from '../lib/posts';
import { url } from '../lib/url';
interface Props { meta: Series; posts: Post[]; currentId: string; }
const { meta, posts, currentId } = Astro.props;
---
<div class="box">
  <b>시리즈 · {meta.data.title}</b>
  {posts.map((p, i) => <a class:list={{ cur: p.id === currentId }} href={url(`posts/${p.id}/`)}>{i + 1}. {p.data.title}</a>)}
</div>
<style>
  .box { padding:14px; border:1px solid var(--line); border-radius:8px; background:var(--surface); font-size:13.5px; }
  b { display:block; font-size:12px; color:var(--ink-3); letter-spacing:.06em; text-transform:uppercase; margin-bottom:8px; }
  a { display:block; color:var(--ink-2); padding:3px 0; }
  a.cur { color:var(--accent); font-weight:600; }
  @media (max-width:900px) { .box { display:none; } }
</style>
```

- [ ] **Step 2: 본문 페이지에 연결**

`src/pages/posts/[slug].astro` 의 frontmatter 에 추가:

```ts
import SeriesNav from '../../components/SeriesNav.astro';
import SeriesBox from '../../components/SeriesBox.astro';
import { getPublishedPosts, getSeriesNeighbors } from '../../lib/posts';
const series = await getSeriesNeighbors(post);
const seriesLabel = series ? `시리즈 · ${series.meta.data.title} ${series.posts.findIndex((p) => p.id === post.id) + 1}/${series.posts.length}` : undefined;
```

템플릿 수정:

```astro
<PostHeader slot="header" {post} {seriesLabel} />
<Content />
<TagList tags={post.data.tags} />
{post.data.velogUrl && <p class="origin">이 글은 velog에 먼저 올렸던 글입니다 · <a href={post.data.velogUrl} data-outbound="velog" rel="noopener">원문 보기 ↗</a></p>}
{series && <SeriesNav meta={series.meta} posts={series.posts} current={post} prev={series.prev} next={series.next} />}
<Fragment slot="aside">
  <Toc {headings} />
  {series && <SeriesBox meta={series.meta} posts={series.posts} currentId={post.id} />}
</Fragment>
```

- [ ] **Step 3: 시리즈 페이지**

```astro
---
// src/pages/series/[series].astro
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { getSeries } from '../../lib/posts';
import { url } from '../../lib/url';
export async function getStaticPaths() {
  const all = await getCollection('series');
  return all.map((s) => ({ params: { series: s.id } }));
}
const { meta, posts } = await getSeries(Astro.params.series);
---
<Base title={meta.data.title} description={meta.data.description}>
  <main class="wrap">
    <h1 class="page-title">{meta.data.title}</h1>
    <p class="desc">{meta.data.description}</p>
    <ol class="list">
      {posts.map((p) => <li><a href={url(`posts/${p.id}/`)}><span class="mono">{p.data.date.toISOString().slice(0, 10)}</span>{p.data.title}</a></li>)}
    </ol>
  </main>
</Base>
<style>
  .desc { color:var(--ink-2); margin:0 0 20px; }
  .list { padding-left:20px; display:flex; flex-direction:column; gap:10px; padding-bottom:48px; }
  .list a { display:flex; gap:14px; align-items:baseline; }
  .list .mono { color:var(--ink-3); font-size:12.5px; }
</style>
```

```astro
---
// src/pages/series/index.astro
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import { getSeries } from '../../lib/posts';
import { url } from '../../lib/url';
const all = await getCollection('series');
const items = await Promise.all(all.map(async (s) => ({ s, count: (await getSeries(s.id)).posts.length })));
---
<Base title="시리즈" description="연재 글 모음">
  <main class="wrap">
    <h1 class="page-title">시리즈 <span class="n">{items.length}</span></h1>
    {items.length === 0 && <p style="color:var(--ink-3); padding-bottom:48px;">아직 시리즈가 없습니다.</p>}
    <ul class="series-list">
      {items.map(({ s, count }) => <li><a href={url(`series/${s.id}/`)}><b>{s.data.title}</b><span>{s.data.description}</span><small>{count}편</small></a></li>)}
    </ul>
  </main>
</Base>
<style>
  .series-list { list-style:none; padding:0 0 48px; margin:0; display:grid; gap:12px; }
  .series-list a { display:grid; gap:4px; padding:16px 18px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface); }
  .series-list span { color:var(--ink-2); font-size:14px; }
  .series-list small { color:var(--ink-3); }
</style>
```

- [ ] **Step 4: 중복 order 가 빌드를 실패시키는지 확인**

샘플 알고리즘 글의 `order: 2` 를 잠시 `1` 로 바꾸고 `npm run build` → `series "sample-series": duplicate order 1` 로 실패해야 한다. 확인 후 `2` 로 되돌린다.

- [ ] **Step 5: 빌드·확인 후 커밋**

Run: `npm run check && npm run build`
Expected: `dist/series/sample-series/index.html` 존재. 샘플 백엔드 글 본문 하단에 "다음 편 → 샘플 — 알고리즘 글", 우측 aside 에 시리즈 상자.

```bash
git add -A
git commit -m "feat: 시리즈 내비게이션·시리즈 상자·시리즈 페이지 추가"
```

---

### Task 8: giscus 댓글

**Files:**
- Create: `src/components/Giscus.astro`
- Modify: `src/pages/posts/[slug].astro`

**Interfaces:**
- Consumes: `SITE.giscus`, `themechange` 윈도우 이벤트.
- `repoId` 또는 `categoryId` 가 빈 문자열이면 아무것도 렌더하지 않는다 (빌드는 통과).

- [ ] **Step 1: 컴포넌트**

```astro
---
// src/components/Giscus.astro
import { SITE } from '../config';
const g = SITE.giscus;
const enabled = g.repoId !== '' && g.categoryId !== '';
---
{enabled ? (
  <section class="comments" id="comments">
    <script is:inline src="https://giscus.app/client.js"
      data-repo={g.repo} data-repo-id={g.repoId}
      data-category={g.category} data-category-id={g.categoryId}
      data-mapping="pathname" data-strict="1" data-reactions-enabled="1" data-emit-metadata="0"
      data-input-position="top" data-theme="preferred_color_scheme" data-lang="ko" data-loading="lazy"
      crossorigin="anonymous" async></script>
  </section>
) : (
  <section class="comments placeholder">댓글은 giscus 설정 후 표시됩니다.</section>
)}
<style>
  .comments { margin-top:40px; }
  .placeholder { border:1px dashed var(--line); border-radius:var(--radius); padding:28px; text-align:center; color:var(--ink-3); font-size:13.5px; }
</style>
<script>
  window.addEventListener('themechange', (e) => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    const theme = (e as CustomEvent<string>).detail === 'dark' ? 'dark' : 'light';
    iframe?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app');
  });
</script>
```

- [ ] **Step 2: 본문 페이지에 삽입**

`src/pages/posts/[slug].astro`: `import Giscus from '../../components/Giscus.astro';` 추가, `SeriesNav` 다음 줄에 `<Giscus />`.

- [ ] **Step 3: 빌드·확인 후 커밋**

Run: `npm run check && npm run build`
Expected: 본문 하단에 점선 플레이스홀더("댓글은 giscus 설정 후 표시됩니다"). ID 는 Task 14 에서 채운다.

```bash
git add -A
git commit -m "feat: giscus 댓글 컴포넌트 추가 (설정값 비어 있으면 플레이스홀더)"
```

---

### Task 9: GA4 와 커스텀 이벤트

**Files:**
- Create: `src/lib/analytics.ts`, `tests/unit/analytics.test.ts`
- Modify: `src/components/Analytics.astro`(Task 4 의 빈 파일), `src/components/ThemeToggle.astro`

**Interfaces:**
- Produces: `track(e: BlogEvent): void`, `type BlogEvent` (스펙 8절 6종). 전역 `window.gtag` 옵셔널.
- Consumes: DOM 이벤트 `blog:toc_click`, `blog:series_nav`, 윈도우 이벤트 `themechange`, `[data-outbound]` 앵커, `.astro-code` 복사 버튼.

- [ ] **Step 1: 실패하는 테스트**

```ts
// tests/unit/analytics.test.ts
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
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `npm test -- analytics`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

```ts
// src/lib/analytics.ts
export type BlogEvent =
  | { name: 'read_progress'; percent: 25 | 50 | 75 | 100 }
  | { name: 'toc_click'; heading: string }
  | { name: 'code_copy'; lang: string }
  | { name: 'series_nav'; direction: 'prev' | 'next' }
  | { name: 'outbound'; url: string }
  | { name: 'theme_toggle'; to: 'light' | 'dark' };

declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export function track(e: BlogEvent): void {
  const { name, ...params } = e;
  window.gtag?.('event', name, { ...params, post: window.location.pathname });
}

const BUCKETS = [25, 50, 75, 100] as const;
/** ratio(0~1) 가 넘은 버킷 중 아직 보내지 않은 것만 반환하고 seen 에 기록 */
export function progressBuckets(ratio: number, seen: Set<number>): number[] {
  const out: number[] = [];
  for (const b of BUCKETS) if (ratio * 100 >= b && !seen.has(b)) { seen.add(b); out.push(b); }
  return out;
}
```

```astro
---
// src/components/Analytics.astro
import { SITE } from '../config';
const id = SITE.ga4Id;
---
{id && (
  <>
    <script is:inline async src={`https://www.googletagmanager.com/gtag/js?id=${id}`}></script>
    <script is:inline define:vars={{ id }}>
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', id, { anonymize_ip: true });
    </script>
  </>
)}
<script>
  import { track, progressBuckets } from '../lib/analytics';

  // 읽기 진행률 (본문 페이지에서만)
  const article = document.querySelector<HTMLElement>('article.article');
  if (article) {
    const seen = new Set<number>();
    const onScroll = () => {
      const bottom = article.getBoundingClientRect().bottom + window.scrollY;
      const ratio = Math.min(1, (window.scrollY + window.innerHeight - article.offsetTop) / (bottom - article.offsetTop));
      for (const b of progressBuckets(ratio, seen)) track({ name: 'read_progress', percent: b as 25 | 50 | 75 | 100 });
      if (seen.size === 4) window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 코드 복사 버튼
    document.querySelectorAll<HTMLPreElement>('pre.astro-code').forEach((pre) => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = '복사';
      btn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(pre.innerText);
        btn.textContent = '복사됨'; setTimeout(() => (btn.textContent = '복사'), 1500);
        track({ name: 'code_copy', lang: pre.dataset.language ?? 'text' });
      });
      pre.appendChild(btn);
    });
  }

  document.addEventListener('blog:toc_click', (e) => track({ name: 'toc_click', heading: (e as CustomEvent).detail.heading }));
  document.addEventListener('blog:series_nav', (e) => track({ name: 'series_nav', direction: (e as CustomEvent).detail.direction }));
  window.addEventListener('themechange', (e) => track({ name: 'theme_toggle', to: (e as CustomEvent).detail }));
  document.querySelectorAll<HTMLAnchorElement>('a[data-outbound]').forEach((a) =>
    a.addEventListener('click', () => track({ name: 'outbound', url: a.href })));
</script>
<style is:global>
  .copy-btn { position:absolute; top:8px; right:8px; font:inherit; font-size:11.5px; padding:3px 8px; border-radius:6px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.35); color:#fff; cursor:pointer; opacity:0; transition:opacity .15s; }
  pre.astro-code:hover .copy-btn, .copy-btn:focus-visible { opacity:1; }
</style>
```

- [ ] **Step 4: 테스트·빌드 확인**

Run: `npm test && npm run check && npm run build`
Expected: analytics 3 passed. `ga4Id` 가 비어 있으므로 gtag 스크립트는 HTML 에 없음(`grep -c googletagmanager dist/index.html` → 0). 리스너 스크립트는 있음. 브라우저 콘솔에서 `window.gtag = console.log` 를 넣고 스크롤·복사·TOC 클릭 시 로그가 찍히는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: GA4 스니펫과 읽기 진행률·코드 복사·TOC·시리즈·아웃바운드·테마 이벤트 추가"
```

---

### Task 10: RSS, 기본 OG 이미지

**Files:**
- Create: `src/pages/rss.xml.ts`, `scripts/gen-og.ts`, `public/og/default.png`, `public/og/{backend,cs,infra,algorithm,career}.png`

**Interfaces:**
- Consumes: `getPublishedPosts`, `SITE`, `CATEGORY_META`.

- [ ] **Step 1: RSS**

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { getPublishedPosts } from '../lib/posts';
import { url } from '../lib/url';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: url(`posts/${p.id}/`),
      categories: [p.data.category, ...p.data.tags],
    })),
    customData: `<language>ko-kr</language>`,
  });
}
```

- [ ] **Step 2: OG 이미지 생성 스크립트**

```ts
// scripts/gen-og.ts   (실행: npm run gen:og)
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const COLORS: Record<string, string> = {
  default: '#1F4FD8', backend: '#1F4FD8', cs: '#7C3AED', infra: '#0F766E', algorithm: '#B45309', career: '#BE185D',
};
const LABEL: Record<string, string> = { default: 'hun425.log', backend: 'Backend', cs: 'CS', infra: 'Infra', algorithm: 'Algorithm', career: 'Career' };

mkdirSync('public/og', { recursive: true });
for (const [key, color] of Object.entries(COLORS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E1217"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="72" y="72" width="14" height="14" rx="3" fill="${color}"/>
    <text x="100" y="86" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="#E6EAF0">hun425.log</text>
    <text x="72" y="560" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">${LABEL[key]}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`public/og/${key}.png`);
  console.log('wrote public/og/' + key + '.png');
}
```

- [ ] **Step 3: 실행·빌드 확인**

Run: `npm run gen:og && npm run build`
Expected: `public/og/*.png` 6장 (각 1200×630). `dist/rss.xml` 에 샘플 3건, `<link>` 가 `https://hun425.github.io/blog/posts/sample-backend/`. `dist/sitemap-index.xml` 존재.

```bash
file public/og/*.png
grep -o '<link>[^<]*' dist/rss.xml
```

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: RSS 피드와 카테고리별 기본 OG 이미지 추가"
```

---

### Task 11: velog 이전 스크립트

**Files:**
- Create: `scripts/velog/client.ts`, `scripts/velog/transform.ts`, `scripts/velog/mapping.ts`, `scripts/migrate-velog.ts`, `tests/unit/velog-transform.test.ts`

**Interfaces:**
- `client.ts`: `listPosts(username): Promise<VelogListItem[]>`, `fetchPost(username, urlSlug): Promise<VelogPost>`.
- `mapping.ts`: `SERIES_TO_CATEGORY`, `OVERRIDES_BY_TITLE`, `resolveCategory(seriesName: string | null, title: string): { category: Category; unmapped: boolean }`.
- `transform.ts`: `folderName(date: string, urlSlug: string): string`, `rewriteImages(body, mapper: (src, i) => string): { body; sources: string[] }`, `buildFrontmatter(input): string`, `truncate(s, n)`.
- Consumes: `normalizeSlug`(src/lib/text.ts), `Category`.

- [ ] **Step 1: 실패하는 테스트**

```ts
// tests/unit/velog-transform.test.ts
import { describe, it, expect } from 'vitest';
import { folderName, rewriteImages, buildFrontmatter, truncate } from '../../scripts/velog/transform';
import { resolveCategory } from '../../scripts/velog/mapping';

describe('folderName', () => {
  it('날짜 + 정규화 슬러그', () => {
    expect(folderName('2026-08-09T11:03:13.230Z', 'Terraform-도입기')).toBe('2026-08-09-terraform-도입기');
  });
});

describe('rewriteImages', () => {
  it('velcdn 이미지를 로컬 파일로 치환하고 원본 목록을 돌려준다', () => {
    const body = '![a](https://velog.velcdn.com/images/x/1.png)\n텍스트\n![b](https://velog.velcdn.com/images/x/2.jpeg)';
    const r = rewriteImages(body, (src, i) => `./img-${String(i + 1).padStart(2, '0')}${src.slice(src.lastIndexOf('.'))}`);
    expect(r.sources).toEqual(['https://velog.velcdn.com/images/x/1.png', 'https://velog.velcdn.com/images/x/2.jpeg']);
    expect(r.body).toBe('![a](./img-01.png)\n텍스트\n![b](./img-02.jpeg)');
  });
  it('외부 이미지는 건드리지 않는다', () => {
    const body = '![c](https://example.com/c.png)';
    expect(rewriteImages(body, () => 'x').body).toBe(body);
  });
});

describe('resolveCategory', () => {
  it('시리즈 직접 매핑', () => expect(resolveCategory('Algorithm', '아무 제목')).toEqual({ category: 'algorithm', unmapped: false }));
  it('회사 시리즈는 제목 오버라이드', () => expect(resolveCategory('회사', 'Terraform 도입기')).toEqual({ category: 'infra', unmapped: false }));
  it('회사 시리즈 기본값 backend', () => expect(resolveCategory('회사', '세션 관리 전략: 세션 vs JWT')).toEqual({ category: 'backend', unmapped: false }));
  it('모르는 시리즈는 backend + unmapped', () => expect(resolveCategory('신규', '제목')).toEqual({ category: 'backend', unmapped: true }));
});

describe('truncate', () => {
  it('160자 초과 시 … 붙여 자른다', () => expect(truncate('가'.repeat(200), 160)).toHaveLength(160));
  it('짧으면 그대로', () => expect(truncate('짧다', 160)).toBe('짧다'));
});

describe('buildFrontmatter', () => {
  it('YAML 안전한 frontmatter', () => {
    const fm = buildFrontmatter({ title: '제목: 콜론 "따옴표"', description: '요약', date: '2026-08-09', category: 'infra', tags: ['Infra', 'terraform'], cover: './cover.png', velogUrl: 'https://velog.io/@chae0738/x' });
    expect(fm).toContain('title: "제목: 콜론 \\"따옴표\\""');
    expect(fm).toContain('tags: ["Infra", "terraform"]');
    expect(fm).toContain('cover: ./cover.png');
    expect(fm.startsWith('---\n') && fm.endsWith('---\n')).toBe(true);
  });
});
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `npm test -- velog`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

```ts
// scripts/velog/mapping.ts
import type { Category } from '../../src/lib/categories';

export const SERIES_TO_CATEGORY: Record<string, Category | null> = {
  Algorithm: 'algorithm', CS: 'cs', Spring: 'backend', Project: 'backend', 일상: 'career', 회사: null,
};

/** '회사' 시리즈 개별 매핑 (제목 정확 일치). 없으면 backend */
export const OVERRIDES_BY_TITLE: Record<string, Category> = {
  'Terraform 도입기': 'infra',
  'Discord가 수조 개의 메세지를 인덱싱하는 방법': 'infra',
  'AI 페어프로그래밍의 한계': 'career',
  '두 번째 회사를 마무리하며': 'career',
  '두 번째 회사 입사 후기': 'career',
  '첫 SI 회사 회고록': 'career',
  '왜 스타트업은 Node.js를 많이 쓸까?': 'career',
  'OOP vs 함수형 프로그래밍': 'cs',
  '데이터베이스 정규화와 비정규화에 대한 고찰': 'cs',
};

export function resolveCategory(seriesName: string | null, title: string): { category: Category; unmapped: boolean } {
  if (seriesName === null || !(seriesName in SERIES_TO_CATEGORY)) return { category: 'backend', unmapped: true };
  const direct = SERIES_TO_CATEGORY[seriesName];
  if (direct) return { category: direct, unmapped: false };
  return { category: OVERRIDES_BY_TITLE[title.trim()] ?? 'backend', unmapped: false };
}
```

```ts
// scripts/velog/transform.ts
import { normalizeSlug } from '../../src/lib/text';
import type { Category } from '../../src/lib/categories';

export function folderName(releasedAt: string, urlSlug: string): string {
  return `${releasedAt.slice(0, 10)}-${normalizeSlug(urlSlug)}`;
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

export function buildFrontmatter(f: { title: string; description: string; date: string; category: Category; tags: string[]; cover?: string; velogUrl: string }): string {
  const lines = [
    `title: ${q(f.title)}`,
    `description: ${q(f.description)}`,
    `date: ${f.date}`,
    `category: ${f.category}`,
    `tags: [${f.tags.map(q).join(', ')}]`,
    ...(f.cover ? [`cover: ${f.cover}`] : []),
    `velogUrl: ${f.velogUrl}`,
  ];
  return `---\n${lines.join('\n')}\n---\n`;
}
```

```ts
// scripts/velog/client.ts
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
```

```ts
// scripts/migrate-velog.ts   (실행: npm run migrate [-- --force])
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { listPosts, fetchPost } from './velog/client';
import { folderName, rewriteImages, buildFrontmatter, truncate } from './velog/transform';
import { resolveCategory } from './velog/mapping';

const USERNAME = 'chae0738';
const OUT = 'src/content/posts';
const FORCE = process.argv.includes('--force');

async function download(src: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!res.ok) return false;
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch { return false; }
}

const report = { total: 0, written: 0, skipped: 0, unmapped: [] as string[], imageFailed: [] as string[], byCategory: {} as Record<string, number> };

const list = await listPosts(USERNAME);
report.total = list.length;
const usedFolders = new Set<string>();

for (const item of list) {
  if (item.is_private) { report.skipped++; continue; }
  const post = await fetchPost(USERNAME, item.url_slug);
  if (!post.is_markdown) { report.unmapped.push(`${post.title} (HTML 본문)`); }

  let folder = folderName(post.released_at, post.url_slug);
  while (usedFolders.has(folder)) folder += '-2';
  usedFolders.add(folder);
  const dir = join(OUT, folder);
  if (existsSync(dir) && !FORCE) { report.skipped++; continue; }
  mkdirSync(dir, { recursive: true });

  const { category, unmapped } = resolveCategory(post.series?.name ?? null, post.title);
  if (unmapped) report.unmapped.push(post.title);
  report.byCategory[category] = (report.byCategory[category] ?? 0) + 1;

  const { body, sources } = rewriteImages(post.body, (src, i) => `./img-${String(i + 1).padStart(2, '0')}${extname(new URL(src).pathname) || '.png'}`);
  for (const [i, src] of sources.entries()) {
    const ok = await download(src, join(dir, `img-${String(i + 1).padStart(2, '0')}${extname(new URL(src).pathname) || '.png'}`));
    if (!ok) report.imageFailed.push(`${post.title}: ${src}`);
  }

  let cover: string | undefined;
  if (post.thumbnail) {
    const ext = extname(new URL(post.thumbnail).pathname) || '.png';
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: velog-transform 9 passed 포함 전체 PASS.

- [ ] **Step 5: 실제 이전 실행**

먼저 샘플 3건과 샘플 시리즈를 삭제한다: `rm -rf src/content/posts/2026-01-0* src/content/series/sample-series.md`

Run: `npm run migrate`
Expected: 102줄의 `✓` 출력, `scripts/migrate-report.md` 에 "작성 102", 미분류 0, 카테고리별 합계 = algorithm 37 · cs 17 · backend 34 · career 12 · infra 2 (스펙 7절 매핑 기준: cs 15+2, backend 5+9+20, career 7+5). 이미지 실패 목록이 비어 있지 않으면 해당 글의 frontmatter 는 유지하고 실패 목록만 사용자에게 보고한다.

- [ ] **Step 6: 빌드 통과 확인**

Run: `npm run check && npm run build`
Expected: 0 errors, `dist/posts/` 아래 102개 폴더. 실패 시 대부분은 (a) `description` 160자 초과 → `truncate` 확인, (b) 이미지 확장자 이상(`.webp` 등) → `image()` 는 webp 지원하므로 문제 없음, (c) frontmatter 따옴표 → `q()` 확인.

```bash
ls dist/posts | wc -l   # 102
```

- [ ] **Step 7: 커밋 (스크립트와 콘텐츠를 분리)**

```bash
git add scripts tests
git commit -m "feat: velog 이전 스크립트와 시리즈→카테고리 매핑 추가"
git add src/content scripts/migrate-report.md
git commit -m "feat: velog 글 102건 이전"
```

---

### Task 12: Playwright 스모크 테스트

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: 설치와 설정**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4321/blog/' },
  webServer: { command: 'npm run preview', url: 'http://localhost:4321/blog/', reuseExistingServer: !process.env.CI },
});
```

- [ ] **Step 2: 테스트**

```ts
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('홈: 카드가 렌더되고 첫 카드가 featured', async ({ page }) => {
  await page.goto('./');
  const cards = page.locator('a.card');
  expect(await cards.count()).toBeGreaterThan(10);
  await expect(cards.first()).toHaveClass(/featured/);
});

test('카테고리 탭: algorithm 탭은 algorithm 칩만 보여준다', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /Algorithm/ }).click();
  await expect(page).toHaveURL(/category\/algorithm\/$/);
  const chips = page.locator('a.card .chip');
  const texts = await chips.allTextContents();
  expect(texts.every((t) => t.trim() === 'Algorithm')).toBe(true);
});

test('본문: TOC 링크가 앵커로 이동하고 velog 원문 링크가 있다', async ({ page }) => {
  await page.goto('./');
  await page.locator('a.card').first().click();
  await expect(page).toHaveURL(/posts\/[^/]+\/$/);
  const toc = page.locator('nav.toc a').first();
  if (await toc.count()) {
    const href = await toc.getAttribute('href');
    await toc.click();
    await expect(page).toHaveURL(new RegExp(href!.replace('#', '#') + '$'));
  }
  await expect(page.locator('a[data-outbound="velog"]')).toBeVisible();
});

test('테마 토글이 data-theme 를 바꾸고 새로고침 후 유지된다', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: '테마 전환' }).click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  expect(await html.getAttribute('data-theme')).toBe(after);
});
```

- [ ] **Step 3: 실행**

Run: `npm run build && npm run test:e2e`
Expected: 4 passed.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "test: Playwright 스모크 테스트 추가"
```

---

### Task 13: CI, GitHub 저장소, Pages 배포

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: 워크플로**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
  push:
    branches-ignore: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npm run build
```

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
        with: { node-version: 26 }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

```md
<!-- README.md -->
# hun425.log

Astro 기반 기술 블로그. https://hun425.github.io/blog

- `npm run dev` 개발 서버 · `npm run build` 빌드 · `npm run check` 타입/스키마 · `npm test` 단위 · `npm run test:e2e` 스모크
- 글 추가: `src/content/posts/YYYY-MM-DD-<slug>/index.md` (frontmatter 는 `src/content.config.ts` 참고)
- 시리즈: `src/content/series/<id>.md` 만들고 글 frontmatter 에 `series: { id, order }`
- 설계: `docs/superpowers/specs/2026-09-16-blog-design.md`
```

- [ ] **Step 2: 커밋 (푸시 전에 워크플로가 커밋되어 있어야 첫 푸시에서 Deploy 가 돈다)**

```bash
git add -A
git commit -m "chore: CI/배포 워크플로와 README 추가"
```

- [ ] **Step 3: GitHub 저장소 생성과 푸시**

```bash
cd ~/Desktop/project/blog
gh repo create Hun425/blog --public --source=. --remote=origin --description "hun425.log — 기술 블로그" --push
```

- [ ] **Step 4: Pages 소스를 GitHub Actions 로 설정**

```bash
gh api -X POST repos/Hun425/blog/pages -f build_type=workflow
```

(이미 있으면 `-X PUT` 으로.) 이후 `gh run watch` 로 Deploy 워크플로 완료를 기다린다.

- [ ] **Step 5: 배포 확인**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://hun425.github.io/blog/
curl -s https://hun425.github.io/blog/rss.xml | head -5
```

Expected: 200, RSS XML. 브라우저에서 홈·본문·카테고리 페이지 확인. 이력서 `https://hun425.github.io/` 가 여전히 정상인지도 확인.

---

### Task 14: 이력서 링크, 외부 서비스 연결 (수동 단계 포함)

**Files:**
- Modify (다른 저장소 `hun425.github.io`): `index.html` 상단 메뉴
- Modify: `src/config.ts` (GA4 ID, giscus ID)

- [ ] **Step 1: 이력서 사이트에 블로그 링크**

```bash
cd ~/Desktop/project && gh repo clone Hun425/hun425.github.io resume-site 2>/dev/null || true
cd resume-site && grep -n "portfolio.html\|resume.html" index.html | head
```

메뉴 앵커가 있는 곳 옆에 `<a href="https://hun425.github.io/blog/">Blog →</a>` 를 같은 클래스로 추가하고 커밋·푸시:

```bash
git add index.html && git commit -m "feat: 블로그 링크 추가" && git push
```

- [ ] **Step 2: giscus (사용자가 브라우저에서 수행)**

1. https://github.com/Hun425/blog/settings → Features → Discussions 체크
2. https://github.com/apps/giscus → Install → `Hun425/blog` 만 허용
3. https://giscus.app → Repository 에 `Hun425/blog` 입력 → Discussion Category `Announcements` → 아래 나오는 `data-repo-id`, `data-category-id` 값을 복사
4. `src/config.ts` 의 `giscus.repoId`, `giscus.categoryId` 에 붙여넣기

- [ ] **Step 3: GA4 (사용자가 브라우저에서 수행)**

1. https://analytics.google.com → 속성 만들기 → 웹 스트림 URL `https://hun425.github.io`, 스트림 이름 `blog`
2. 측정 ID (`G-XXXXXXXXXX`) 를 `src/config.ts` 의 `ga4Id` 에 입력
3. 관리 → 데이터 수집 및 수정 → 데이터 보관 → **14개월**
4. 관리 → 제품 링크 → Search Console 링크 (아래 Step 4 이후)

- [ ] **Step 4: 검색엔진 등록 (사용자가 브라우저에서 수행)**

- Google Search Console: 속성 `https://hun425.github.io/blog/` (URL 접두어) → 소유권은 GA4 태그로 자동 확인 → Sitemaps 에 `https://hun425.github.io/blog/sitemap-index.xml` 제출
- 네이버 서치어드바이저: 사이트 등록 `https://hun425.github.io/blog/` → HTML 태그 인증값을 `Base.astro` `<head>` 에 `<meta name="naver-site-verification" content="…">` 로 추가 → 사이트맵 제출

- [ ] **Step 5: 설정 반영 커밋·배포**

```bash
cd ~/Desktop/project/blog
npm run check && npm run build && npm test
git add -A && git commit -m "chore: GA4·giscus·네이버 인증 설정값 반영" && git push
```

Expected: 배포 후 본문 페이지에 giscus 위젯이 뜨고, GA4 실시간 보고서에 접속이 잡힌다.

- [ ] **Step 6: 옵시디언 문서 상태 갱신**

`~/Desktop/project/obsidain/1_Projects/블로그/블로그 설계.md` 머리의 상태 줄을 `> 상태: 배포 완료 (YYYY-MM-DD) · https://hun425.github.io/blog` 로 바꾸고, 이전 보고서 요약(카테고리별 건수, 이미지 실패 건수)을 문서 끝에 `## 이전 결과` 절로 덧붙인다.

---

### Task 15: 옵시디언 초안 → 블로그 글 가져오기 (스크립트 + 스킬)

**Files:**
- Create: `scripts/import-obsidian.ts`, `scripts/obsidian/convert.ts`, `tests/unit/obsidian-convert.test.ts`, `.claude/skills/publish-post/SKILL.md`
- Modify: `scripts/velog/transform.ts` (`buildFrontmatter` 의 `velogUrl` 을 선택 필드로)
- Create (옵시디언): `~/Desktop/project/obsidain/1_Projects/블로그/초안/`, `~/Desktop/project/obsidain/1_Projects/블로그/발행/`

**Interfaces:**
- `convert.ts` (순수): `convertObsidian(md: string): { body: string; attachments: string[]; title?: string }`
  - `![[img.png]]` / `![[img.png|300]]` → `![](./img-NN.png)` 로 치환하고 `attachments` 에 원본 파일명을 순서대로 기록
  - `[[노트]]`, `[[노트|표시]]` → `표시` 또는 `노트` 텍스트 (링크 제거)
  - `> [!note] 제목` 콜아웃 첫 줄 → `> **제목**`, 제목 없으면 그 줄 제거. 나머지 인용은 유지
  - `==강조==` → `**강조**`
  - 첫 `# 제목` 줄은 `title` 로 뽑고 본문에서 제거
- `import-obsidian.ts`: `node scripts/import-obsidian.ts <초안.md> --slug <slug> --category <c> --description "<요약>" [--tags a,b] [--date YYYY-MM-DD] [--force]`
  - 첨부 파일 탐색 순서: 초안과 같은 폴더 → 볼트 루트 `img/` → 초안 폴더의 `attachments/`
  - frontmatter 는 Task 11 의 `buildFrontmatter` 재사용
  - `src/content/posts/<date>-<slug>/index.md` 생성. 이미 있으면 `--force` 없이는 중단

- [ ] **Step 1: 실패하는 테스트**

```ts
// tests/unit/obsidian-convert.test.ts
import { describe, it, expect } from 'vitest';
import { convertObsidian } from '../../scripts/obsidian/convert';

describe('convertObsidian', () => {
  it('이미지 임베드 → 로컬 경로 + 첨부 목록', () => {
    const r = convertObsidian('본문\n![[Pasted image 1.png]]\n![[b.jpg|300]]');
    expect(r.attachments).toEqual(['Pasted image 1.png', 'b.jpg']);
    expect(r.body).toBe('본문\n![](./img-01.png)\n![](./img-02.jpg)');
  });
  it('위키링크는 텍스트로', () => {
    expect(convertObsidian('[[다른 글]] 과 [[노트|표시명]]').body).toBe('다른 글 과 표시명');
  });
  it('콜아웃 → 굵은 제목 인용', () => {
    expect(convertObsidian('> [!note] 주의\n> 내용').body).toBe('> **주의**\n> 내용');
    expect(convertObsidian('> [!tip]\n> 내용').body).toBe('> 내용');
  });
  it('하이라이트 → 굵게', () => {
    expect(convertObsidian('이건 ==중요== 하다').body).toBe('이건 **중요** 하다');
  });
  it('첫 H1 은 title 로 뽑고 본문에서 제거', () => {
    const r = convertObsidian('# 제목이다\n\n본문');
    expect(r.title).toBe('제목이다');
    expect(r.body).toBe('본문');
  });
});
```

- [ ] **Step 2: 실행 → 실패 확인**

Run: `npm test -- obsidian`
Expected: FAIL — module not found

- [ ] **Step 3: 구현**

```ts
// scripts/obsidian/convert.ts
const DROP = '@@DROP-LINE@@';

export function convertObsidian(md: string): { body: string; attachments: string[]; title?: string } {
  const attachments: string[] = [];
  let title: string | undefined;
  let body = md;

  const h1 = body.match(/^# (.+)\n?/m);
  if (h1) { title = h1[1].trim(); body = body.replace(h1[0], ''); }

  body = body.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_m, file: string) => {
    const name = file.trim();
    const i = attachments.push(name);
    return `![](./img-${String(i).padStart(2, '0')}${name.slice(name.lastIndexOf('.'))})`;
  });
  body = body.replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_m, note: string, label?: string) => (label ?? note).trim());
  body = body.replace(/^> \[!\w+\][ ]*(.*)$/gm, (_m, t: string) => (t.trim() ? `> **${t.trim()}**` : DROP));
  body = body.split('\n').filter((line) => line !== DROP).join('\n');
  body = body.replace(/==([^=\n]+)==/g, '**$1**');

  return { body: body.trim(), attachments, title };
}
```

```ts
// scripts/import-obsidian.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { convertObsidian } from './obsidian/convert';
import { buildFrontmatter } from './velog/transform';
import { isCategory } from '../src/lib/categories';

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

const VAULT = '/Users/hun/Desktop/project/obsidain';
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
```

`scripts/velog/transform.ts` 의 `buildFrontmatter` 는 `velogUrl?: string` 으로 바꾸고, 값이 없으면 `velogUrl:` 줄을 넣지 않는다. Task 11 의 테스트는 그대로 통과해야 한다.

- [ ] **Step 4: 스킬 문서와 옵시디언 폴더**

```md
<!-- .claude/skills/publish-post/SKILL.md -->
---
name: publish-post
description: 옵시디언 초안(1_Projects/블로그/초안/*.md)을 블로그 글로 변환해 커밋·푸시·배포하고 원본을 발행/ 으로 옮긴다. "이 글 올려줘", "초안 발행", "블로그에 올려" 요청 시 사용.
---

# publish-post

1. 초안 파일을 읽는다. 첫 줄 `# 제목` 이 없으면 제목을 묻는다.
2. 본문을 보고 세 가지를 제안하고 **한 번에** 확인받는다: `slug`(영문 소문자-하이픈), `category`(backend/cs/infra/algorithm/career), `description`(160자 이하, 첫 문단 요약). 태그도 함께 제안한다.
3. 확인 후 실행: `node scripts/import-obsidian.ts "<초안 경로>" --slug <slug> --category <c> --description "<d>" --tags a,b`
4. `npm run check && npm run build` 가 PASS 인지 확인한다. 실패하면 원인을 고치고 다시 실행한다 (description 길이·이미지 누락이 대부분).
5. 커밋: `git add src/content/posts/<폴더> && git commit -m "글: <제목>"` 후 `git push`.
6. 배포 URL `https://hun425.github.io/blog/posts/<slug>/` 을 알려 준다. Actions 완료까지 1~2분.
7. 옵시디언 원본을 `1_Projects/블로그/발행/` 로 옮기고, 파일 머리에 `> 발행: <URL> (<날짜>)` 한 줄을 추가한다.
8. velog 크로스포스팅을 원하면 변환된 `index.md` 본문(frontmatter 제외)을 그대로 붙여넣을 수 있다고 안내한다. velog 업로드는 사용자가 직접 한다.

주의: 첨부 이미지는 초안과 같은 폴더 → 볼트 `img/` → `attachments/` 순으로 찾는다. 못 찾으면 중단하고 파일 위치를 묻는다.
```

```bash
mkdir -p ~/Desktop/project/obsidain/1_Projects/블로그/초안 ~/Desktop/project/obsidain/1_Projects/블로그/발행
```

- [ ] **Step 5: 테스트 + 실제 초안 1건으로 종단 확인**

Run: `npm test`
Expected: obsidian-convert 5 passed, velog-transform 도 여전히 PASS.

옵시디언 `초안/테스트 글.md` 에 아래 내용을 쓰고 가져오기·빌드·정리를 순서대로 실행한다.

```md
# 테스트 글

본문 ==강조==
> [!note] 메모
> 내용
```

```bash
node scripts/import-obsidian.ts "$HOME/Desktop/project/obsidain/1_Projects/블로그/초안/테스트 글.md" --slug test-post --category career --description "가져오기 확인용" --date 2026-01-01
npm run check && npm run build && ls dist/posts/test-post/index.html
rm -rf src/content/posts/2026-01-01-test-post "$HOME/Desktop/project/obsidain/1_Projects/블로그/초안/테스트 글.md"
```

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 옵시디언 초안 가져오기 스크립트와 publish-post 스킬 추가"
```
