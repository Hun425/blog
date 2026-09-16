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
