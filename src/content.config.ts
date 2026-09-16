import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './lib/categories';

/** '2026-08-09-terraform-도입기/index.md' → 'terraform-도입기' */
function postId({ entry }: { entry: string }): string {
  return entry.replace(/\/index\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

const series = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts', generateId: postId }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(160),
      date: z.coerce.date(),
      category: z.enum(CATEGORIES),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      series: z
        .object({
          id: reference('series'),
          order: z.number().int().positive(),
        })
        .optional(),
      velogUrl: z.string().url().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts, series };
