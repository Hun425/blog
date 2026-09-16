import { describe, it, expect } from 'vitest';
import { convertObsidian } from '../../scripts/obsidian/convert';

describe('convertObsidian', () => {
  it('이미지 임베드 → 로컬 경로 + 첨부 목록', () => {
    const r = convertObsidian('본문\n![[Pasted image 1.png]]\n![[b.jpg|300]]');
    expect(r.attachments).toEqual(['Pasted image 1.png', 'b.jpg']);
    expect(r.body).toBe('본문\n![](./img-01.png)\n![](./img-02.jpg)');
  });
  it('위키링크는 텍스트로', () => {
    expect(convertObsidian('[[다른 글]] 과 [[노트|표시명]]').body).toBe('다른 글 과 표시명');
  });
  it('콜아웃 → 굵은 제목 인용', () => {
    expect(convertObsidian('> [!note] 주의\n> 내용').body).toBe('> **주의**\n> 내용');
    expect(convertObsidian('> [!tip]\n> 내용').body).toBe('> 내용');
  });
  it('하이라이트 → 굵게', () => {
    expect(convertObsidian('이건 ==중요== 하다').body).toBe('이건 **중요** 하다');
  });
  it('첫 H1 은 title 로 뽑고 본문에서 제거', () => {
    const r = convertObsidian('# 제목이다\n\n본문');
    expect(r.title).toBe('제목이다');
    expect(r.body).toBe('본문');
  });
});
