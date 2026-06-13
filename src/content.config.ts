import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				date: z.coerce.date().optional(),
				tags: z.array(z.string()).optional(),
				/** 本地封面路径，如 /images/articles/foo.webp */
				cover: z.string().optional(),
				/** 待下载的网络封面（由 npm run article:covers 处理） */
				coverUrl: z.string().url().optional(),
			}),
		}),
	}),
};
