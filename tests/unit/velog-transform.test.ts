import { describe, it, expect } from 'vitest';
import { folderName, rewriteImages, buildFrontmatter, truncate } from '../../scripts/velog/transform';
import { resolveCategory } from '../../scripts/velog/mapping';

describe('folderName', () => {
  it('날짜 + 정규화 슬러그', () => {
    expect(folderName('2026-08-09T11:03:13.230Z', 'Terraform-도입기', 'Terraform 도입기')).toBe(
      '2026-08-09-terraform-도입기',
    );
  });

  it('제목에도 있는 8자 꼬리는 임의 접미사가 아니므로 유지한다', () => {
    expect(
      folderName(
        '2025-05-01T00:00:00.000Z',
        '헤드-오브-라인-블로킹hol-blocking',
        '헤드 오브 라인 블로킹(HOL Blocking)',
      ),
    ).toBe('2025-05-01-헤드-오브-라인-블로킹hol-blocking');
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
