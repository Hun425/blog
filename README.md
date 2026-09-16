# hun425.log

Astro 기반 기술 블로그. https://hun425.github.io/blog

- `npm run dev` 개발 서버 · `npm run build` 빌드 · `npm run check` 타입/스키마 · `npm test` 단위 · `npm run test:e2e` 스모크 (사전에 `npm run build` 필요)
- 글 추가: `src/content/posts/YYYY-MM-DD-<slug>/index.md` (frontmatter 는 `src/content.config.ts` 참고)
- 시리즈: `src/content/series/<id>.md` 만들고 글 frontmatter 에 `series: { id, order }`
- 설계: `docs/superpowers/specs/2026-09-16-blog-design.md`

## 스크립트

- `npm run migrate` — velog 1회성 이전 (완료됨)
- `npm run gen:og` — 카테고리 OG PNG 재생성
- `node scripts/import-obsidian.ts <초안.md> --slug … --category … --description … [--tags a,b] [--date YYYY-MM-DD] [--force]` — 옵시디언 초안 → 글 (`publish-post` 스킬이 이 절차를 따름)
