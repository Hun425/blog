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
