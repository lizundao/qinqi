import { getCollection, type CollectionEntry } from 'astro:content';

export type ArticleEntry = CollectionEntry<'docs'>;

const INDEX_SLUGS = new Set(['index', 'articles']);

export function getArticleSlug(entry: ArticleEntry) {
	const id = entry.id.replace(/\\/g, '/');
	const slug = id.replace(/^articles\//, '').replace(/\.mdx?$/, '');
	return slug;
}

/** draft 文章仅在开发环境展示；生产构建排除 */
export function isDraftEntry(entry: ArticleEntry) {
	return entry.data.draft === true;
}

export function isArticleVisible(entry: ArticleEntry) {
	if (isDraftEntry(entry) && import.meta.env.PROD) return false;
	return true;
}

export function isArticleEntry(entry: ArticleEntry) {
	if (!isArticleVisible(entry)) return false;

	const slug = getArticleSlug(entry);
	if (!slug || INDEX_SLUGS.has(slug)) return false;

	const id = entry.id.replace(/\\/g, '/');
	return id.startsWith('articles/') || id.startsWith('articles\\');
}

export function getArticleHref(entry: ArticleEntry) {
	return `/articles/${getArticleSlug(entry)}/`;
}

export async function getArticles() {
	return (await getCollection('docs')).filter(isArticleEntry).sort((a, b) => {
		const dateA = a.data.date instanceof Date ? a.data.date.getTime() : 0;
		const dateB = b.data.date instanceof Date ? b.data.date.getTime() : 0;
		return dateB - dateA;
	});
}

export async function getArticleBySlug(slug: string) {
	const articles = await getArticles();
	return articles.find((entry) => getArticleSlug(entry) === slug);
}
