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
