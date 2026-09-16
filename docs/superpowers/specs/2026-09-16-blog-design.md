# 개인 기술 블로그 설계 (2026-09-16)

## 1. 목적과 배경

- velog(`@chae0738`)는 조회수는 잘 나오지만 통계가 없고 디자인 커스터마이징이 불가능하다.
- GitHub Pages 사용자 사이트(`hun425.github.io`)는 이력서·포트폴리오로 쓰고 있으므로 건드리지 않는다.
- 새 블로그는 **별도 저장소 `Hun425/blog`** 를 GitHub Pages 프로젝트 사이트로 배포해 `https://hun425.github.io/blog` 에서 서비스한다.
- velog 글 102건은 전부 이전하되 velog 원글은 삭제하지 않는다 (기존 검색 유입 유지). 새 블로그 본문 하단에 velog 원문 링크를 둔다.
- 이력서 사이트(`hun425.github.io`) 상단 메뉴에 `Blog →` 링크를 추가한다 (별도 저장소, 별도 커밋).

## 2. 확정된 결정

| 항목 | 결정 |
|---|---|
| 레이아웃 | 카드 그리드 매거진형. 최신 글 1건은 2칸 featured, 나머지 3열 |
| 카테고리 | 고정 5개: `backend` `cs` `infra` `algorithm` `career`. 상단 탭 + 카드 칩 + 기본 커버 색 |
| 태그 | 보조 검색용으로만 유지. 태그 페이지 제공 |
| 기능 | giscus 댓글, 본문 목차(TOC), 시리즈 묶기 |
| 기본 포함 | GA4 통계 + 커스텀 이벤트, RSS, 사이트맵, 다크/라이트, SEO 메타/OG/JSON-LD |
| 제외 (YAGNI) | 전문 검색, 뉴스레터, 조회수 표시, 동의 배너, 다국어 |
| 스택 | Astro 5 + Markdown, npm, Node 26 |
| 배포 | GitHub Actions → GitHub Pages (프로젝트 사이트, `base: /blog`) |
| 통계 | GA4 (주) + Google Search Console 연동 + 네이버 서치어드바이저. Cloudflare WA는 쓰지 않음 |
| 서체 | IBM Plex Sans KR (본문) + IBM Plex Mono (날짜·코드), Google Fonts |
| 색 | 한색 회색 바탕 + 코발트 블루 강조 1색. 카테고리별 파랑/보라/청록/주황/분홍 |

디자인 목업: `docs/superpowers/specs/2026-09-16-blog-mockup.html` (홈·본문·다크/라이트 전환 가능)

## 3. 저장소 구조

```
blog/
├── astro.config.mjs               # site: https://hun425.github.io, base: /blog
├── package.json                   # npm scripts: dev / build / check / migrate / test
├── src/
│   ├── content.config.ts          # posts · series 컬렉션 스키마
│   ├── content/
│   │   ├── posts/
│   │   │   └── 2026-08-09-terraform-도입기/
│   │   │       ├── index.md
│   │   │       ├── cover.png      # 대표 이미지 (velog 썸네일 내려받음)
│   │   │       └── img-01.png     # 본문 이미지
│   │   └── series/
│   │       └── tdd-intro.md       # 시리즈 메타 (title, description)
│   ├── lib/
│   │   ├── categories.ts          # CATEGORIES enum + 라벨/색
│   │   ├── posts.ts               # 조회 함수 (정렬·draft 제외·시리즈 prev/next)
│   │   └── analytics.ts           # gtag 이벤트 래퍼
│   ├── layouts/   Base.astro · Post.astro
│   ├── components/ Header · CategoryTabs · PostCard · PostHeader · Toc · SeriesNav · TagList · Giscus · ThemeToggle · Analytics
│   ├── pages/
│   │   ├── index.astro                 # 전체 카드 그리드
│   │   ├── category/[category].astro   # 탭별 카드 그리드
│   │   ├── posts/[slug].astro          # 본문
│   │   ├── series/[series].astro       # 시리즈 목록 (텍스트 목록)
│   │   ├── tags/[tag].astro            # 태그별 카드 그리드
│   │   └── rss.xml.ts
│   └── styles/global.css          # CSS 변수 토큰 (라이트 기본, 다크 오버라이드)
├── scripts/
│   └── migrate-velog.ts           # 1회성 velog → posts/ 이전
├── tests/e2e/                     # Playwright 스모크
├── docs/superpowers/specs/        # 이 문서 + 목업
└── .github/workflows/deploy.yml
```

## 4. 콘텐츠 스키마

```ts
// src/content.config.ts
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const CATEGORIES = ['backend', 'cs', 'infra', 'algorithm', 'career'] as const;

const series = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().max(160),          // 카드 한 줄 요약 + og:description
    date: z.coerce.date(),
    category: z.enum(CATEGORIES),
    tags: z.array(z.string()).default([]),
    cover: image().optional(),                 // 없으면 카테고리 색 그라데이션
    series: z.object({
      id: reference('series'),                 // 없는 id → 빌드 실패
      order: z.number().int().positive(),
    }).optional(),
    velogUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, series };
```

규칙:

- 폴더명 `YYYY-MM-DD-<slug>`. URL 슬러그는 날짜를 뺀 `<slug>` (`/blog/posts/<slug>/`).
- 슬러그는 velog `url_slug` 소문자, 끝에 붙은 랜덤 접미사(`-exsv51yu` 등) 제거. 충돌 시 `-2` 접미사.
- 같은 시리즈 안 `order` 중복은 `getSeries()`에서 검사해 빌드 실패.
- `draft: true` 는 dev 에서만 보이고 build 에서 제외.

## 5. 페이지와 컴포넌트

| 페이지 | 데이터 | 컴포넌트 |
|---|---|---|
| `index.astro` | `getPublishedPosts()` | CategoryTabs, PostCard(첫 글 featured) |
| `category/[category].astro` | `getPostsByCategory()` | CategoryTabs, PostCard |
| `posts/[slug].astro` | entry + `getSeries()` | PostHeader, Toc, SeriesNav, TagList, Giscus |
| `series/[series].astro` | `getSeries()` | 순서대로 텍스트 목록 |
| `tags/[tag].astro` | 필터 | PostCard |
| `rss.xml.ts` | `getPublishedPosts()` | `@astrojs/rss` |

```ts
// src/lib/posts.ts
export async function getPublishedPosts(): Promise<Post[]>          // date desc, draft 제외
export async function getPostsByCategory(c: Category): Promise<Post[]>
export async function getSeries(id: string): Promise<{ meta: Series; posts: Post[] }>  // order asc, 중복 검사
export function prevNext(series, current): { prev?: Post; next?: Post }
export function readingTime(body: string): number                    // 한글 분당 500자, 최소 1
```

컴포넌트 규칙:

- `PostCard` 는 한 종류. `featured` prop 으로 그리드 첫 칸 확대.
- `Toc` 는 Astro `render()` 의 `headings` (depth 2·3) 사용. 현재 위치 강조는 IntersectionObserver.
- `Giscus` 는 공식 `client.js` 스크립트. `data-mapping="pathname"`, `data-lang="ko"`. 테마 토글 시 `postMessage` 로 giscus 테마 동기화.
- `ThemeToggle` 은 `data-theme` 를 `<html>` 에 찍고 `localStorage` 에 저장. 초기 깜빡임 방지용 인라인 스크립트를 `<head>` 에 둔다.
- 카테고리 라벨·색·기본 커버는 `src/lib/categories.ts` 한 곳에서만 정의.

## 6. 디자인 토큰

```css
:root {
  --bg:#F4F6F9; --surface:#FFF; --surface-2:#EBEFF4; --line:#D9DFE7;
  --ink:#111827; --ink-2:#4B5563; --ink-3:#7B8595;
  --accent:#1F4FD8; --accent-soft:#E3EAFB;
  --c-backend:#1F4FD8; --c-cs:#7C3AED; --c-infra:#0F766E; --c-algorithm:#B45309; --c-career:#BE185D;
}
:root[data-theme="dark"] { /* 목업 파일 참조 */ }
```

- 본문 최대 720px, TOC 240px, 전체 1120px.
- 반응형: 900px 이하 2열 + TOC 본문 위로, 560px 이하 1열.
- 코드 블록: Shiki `github-light` / `github-dark` 듀얼 테마.

## 7. velog 이전 스크립트

```
scripts/migrate-velog.ts   (npm run migrate)
1. 목록  : POST https://v3.velog.io/graphql  posts(input:{username, limit:50, cursor})  페이징 → 102건
2. 본문  : post(input:{username, url_slug}) { body thumbnail tags released_at short_description series{name index} }
3. 이미지: body 내 https://velog.velcdn.com/... 전부 다운로드 → ./img-NN.<ext>, 링크 치환. thumbnail → ./cover.<ext>
4. 폴더  : YYYY-MM-DD-<slug>
5. frontmatter: title / description(short_description, 160자 컷) / date / category(자동) / tags / cover / velogUrl / series
6. velog 시리즈 → src/content/series/<slug>.md 자동 생성
7. 보고서: scripts/migrate-report.md (분류 결과, 미분류 목록, 이미지 실패 목록, 시리즈 목록)
```

카테고리 자동 분류 (태그 → 없으면 제목, 위에서부터 첫 매치):

```ts
const RULES: Array<[Category, RegExp]> = [
  ['algorithm', /백준|알고리즘|코딩테스트|leetcode|코드포스|BFS|DFS|DP|다익스트라|투 ?포인터|백트래킹|UnionFind|MST|위상정렬|greedy|비트마스킹|재귀|B형|삼성|카카오/i],
  ['career',    /회고|면접|취업|이직|회사|SI|후기|SSAFY/i],
  ['infra',     /Infra|terraform|쿠버네티스|kafka|spark|redis|elasticsearch|K6/i],
  ['cs',        /^CS$|운영체제|프로세스|네트워크|http|자료구조|메모리|heap|stack|HashTable|동기|비동기|블로킹/i],
  ['backend',   /Java|Kotlin|Spring|JPA|JVM|GC|MyBatis|gradle|maven|servlet|JWT|session|TDD|OOP|SOLID|함수형|설계|가독성|Armeria|n\+1|Cache|REST/i],
];
// 미분류 → category: backend 로 임시 지정 + 보고서에 UNMAPPED 표시 → 사용자 확인 후 수정
```

- 스크립트는 멱등: 이미 있는 폴더는 건너뛴다 (`--force` 로 덮어쓰기).
- 이전 완료 후 마크다운·이미지는 커밋. 스크립트는 남겨 두되 다시 실행할 일은 없다.

## 8. 배포 · 통계 · 댓글

```yaml
# .github/workflows/deploy.yml
on: { push: { branches: [main] }, workflow_dispatch: }
jobs:
  build:  withastro/action@v3 (npm)
  deploy: actions/deploy-pages@v4
```

- GitHub 저장소 `Hun425/blog` **public** (Pages 무료 조건). Settings → Pages → Source: GitHub Actions.
- GA4: 측정 ID 하나. `Analytics.astro` 가 `<head>` 에 gtag 삽입. 커스텀 이벤트:

```ts
type Event =
  | { name: 'read_progress'; percent: 25 | 50 | 75 | 100 }
  | { name: 'toc_click'; heading: string }
  | { name: 'code_copy'; lang: string }
  | { name: 'series_nav'; direction: 'prev' | 'next' }
  | { name: 'outbound'; url: string }
  | { name: 'theme_toggle'; to: 'light' | 'dark' };
```

- Search Console + 네이버 서치어드바이저: `sitemap.xml` 제출 (수동 1회). GA4 ↔ Search Console 연동.
- giscus 수동 준비 (사용자 계정): Discussions 활성화 → giscus 앱 설치 → giscus.app 에서 repo-id / category-id 발급 → `Giscus.astro` 에 기입.
- 이력서 사이트: `hun425.github.io` 의 `index.html` 상단 메뉴에 `Blog →` (`https://hun425.github.io/blog/`) 추가.

## 9. 테스트와 품질 게이트

| 단계 | 명령 | 검사 |
|---|---|---|
| 타입·스키마 | `npm run check` (`astro check`) | 카테고리 오타, 시리즈 참조 누락, frontmatter 타입 |
| 빌드 | `npm run build` | 102건 렌더, order 중복, 깨진 내부 링크 |
| 단위 | `npm test` (vitest) | `readingTime`, `prevNext`, 슬러그 정규화, 카테고리 분류 규칙 |
| E2E | `npm run test:e2e` (Playwright) | 홈 카드 렌더, 탭 필터, TOC 앵커 이동, 다크 토글 |
| CI | PR: check+build+test / main: deploy | |

## 10. 에러 처리

- 이미지 다운로드 실패: 해당 글은 velog URL 그대로 두고 보고서에 기록. 빌드는 통과.
- 커버 없음: 카테고리 그라데이션. OG 이미지도 카테고리 기본 이미지(정적 PNG 5장).
- giscus 로드 실패(광고 차단 등): 댓글 영역만 비고 나머지 정상.
- GA4 차단: `window.gtag` 옵셔널 체이닝으로 무시.

## 11. 구현 순서 (요약)

1. Astro 스캐폴드 + 스키마 + 토큰 CSS + 레이아웃
2. 홈·카테고리·본문 페이지와 컴포넌트 (샘플 글 3건으로)
3. 이전 스크립트 → 102건 이전 → 미분류 확인
4. TOC · 시리즈 · giscus · 테마 토글 · GA4 이벤트
5. RSS · 사이트맵 · SEO 메타 · OG 기본 이미지
6. 테스트 + CI + Pages 배포
7. 이력서 사이트 링크, Search Console · 네이버 등록
