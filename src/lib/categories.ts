export const CATEGORIES = ['backend', 'cs', 'infra', 'algorithm', 'career'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { label: string; cssVar: string }> = {
  backend:   { label: 'Backend',   cssVar: '--c-backend' },
  cs:        { label: 'CS',        cssVar: '--c-cs' },
  infra:     { label: 'Infra',     cssVar: '--c-infra' },
  algorithm: { label: 'Algorithm', cssVar: '--c-algorithm' },
  career:    { label: 'Career',    cssVar: '--c-career' },
};

export function isCategory(x: unknown): x is Category {
  return typeof x === 'string' && (CATEGORIES as readonly string[]).includes(x);
}
