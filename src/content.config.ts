import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 原生 Astro 内容集合，替代 Starlight 的 docsLoader / docsSchema。
 * 文章 frontmatter 里残留的 sidebar / prev / next 等 Starlight 字段会被自动忽略。
 */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverUrl: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { docs };
