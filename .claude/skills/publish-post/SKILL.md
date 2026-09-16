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

주의: 첨부 이미지는 초안과 같은 폴더 → 볼트 `img/` → `attachments/` 순으로 찾는다. 못 찾으면 중단하고 파일 위치를 묻는다. 볼트 경로가 기본값(`/Users/hun/Desktop/project/obsidain`)과 다르면 `OBSIDIAN_VAULT` 환경변수로 지정할 수 있다.
