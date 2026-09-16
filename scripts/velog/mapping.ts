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
