import { getCollection, type CollectionEntry } from 'astro:content';

export type ArticleEntry = CollectionEntry<'docs'>;

const INDEX_SLUGS = new Set(['index', 'articles']);

export function getArticleSlug(entry: ArticleEntry) {
	const id = entry.id.replace(/\\/g, '/');
	const slug = id.replace(/^articles\//, '').replace(/\.mdx?$/, '');
	return slug;
}

export function isArticleEntry(entry: ArticleEntry) {
	if (entry.data.draft === true) return false;

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
