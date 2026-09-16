const HANGUL_PER_MIN = 500;
const WORDS_PER_MIN = 200;

export function readingTime(body: string): number {
  const hangul = (body.match(/[가-힣]/g) ?? []).length;
  const words = (body.replace(/[가-힣]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  const minutes = hangul / HANGUL_PER_MIN + words / WORDS_PER_MIN;
  return Math.max(1, Math.round(minutes));
}

const RANDOM_SUFFIX_RE = /-([a-z0-9]{8})$/;

/** 소문자화 → 문자·숫자 외 하이픈화 → 앞뒤/연속 하이픈 정리. slug 정규화의 공통 마무리 단계. */
function slugifyBase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * velog url_slug → 새 블로그 슬러그
 *
 * velog 는 제목 기반 슬러그가 충돌할 때만 끝에 임의의 8자리 접미사(영문/숫자)를 붙인다.
 * `title` 을 넘기면 제목을 같은 규칙으로 슬러그화한 뒤 그 꼬리와 비교해서,
 * velog 슬러그의 끝 8자리가 "제목에는 없는" 진짜 임의 접미사일 때만 제거한다
 * (예: "...hol-blocking" 의 "blocking" 은 제목에도 있는 실제 단어이므로 유지된다).
 *
 * `title` 을 넘기지 않으면 이전 동작대로 끝 8자리 영숫자를 무조건 제거한다 —
 * 이 경우 "database", "protocol" 처럼 우연히 8자인 단어도 잘려나갈 수 있는
 * 트레이드오프가 있음을 문서화해둔다 (호출자가 title 을 넘기지 못하는 경로 전용).
 */
export function normalizeSlug(velogSlug: string, title?: string): string {
  const lower = velogSlug.toLowerCase();
  const suffixMatch = lower.match(RANDOM_SUFFIX_RE);

  let withoutSuffix = lower;
  if (suffixMatch) {
    const tail = suffixMatch[1];
    const isRealRandomSuffix = title === undefined || !slugifyBase(title).endsWith(tail);
    if (isRealRandomSuffix) {
      withoutSuffix = lower.slice(0, lower.length - tail.length - 1);
    }
  }

  return slugifyBase(withoutSuffix);
}
