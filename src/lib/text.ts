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
