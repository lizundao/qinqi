import { getCollection, type CollectionEntry } from 'astro:content';
import { matchTopic, TOPICS, TOPIC_BY_LABEL, type Topic } from '../data/topics';

export type ArticleEntry = CollectionEntry<'docs'>;

export interface ArticleView {
  slug: string;
  href: string;
  title: string;
  description: string;
  date?: Date;
  dateLabel: string;
  tags: string[];
  cover?: string;
  topic: Topic;
}

function slugOf(entry: ArticleEntry) {
  return entry.id.replace(/\\/g, '/').replace(/^articles\//, '').replace(/\.mdx?$/, '');
}

function formatDate(date?: Date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

export function toView(entry: ArticleEntry): ArticleView {
  const slug = slugOf(entry);
  const { title, description, date, tags = [], cover } = entry.data;
  return {
    slug,
    href: `/articles/${slug}/`,
    title,
    description,
    date,
    dateLabel: formatDate(date),
    tags,
    cover: cover?.trim() || undefined,
    topic: TOPIC_BY_LABEL[tags[0]] ?? matchTopic(tags, title, description),
  };
}

export function isArticleEntry(entry: ArticleEntry) {
  const id = entry.id.replace(/\\/g, '/');
  if (!id.startsWith('articles/')) return false;
  if (entry.data.draft && import.meta.env.PROD) return false;
  return true;
}

export async function getArticles(): Promise<ArticleView[]> {
  const entries = (await getCollection('docs')).filter(isArticleEntry);
  return entries
    .map(toView)
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

export async function getArticleBySlug(slug: string) {
  const entries = (await getCollection('docs')).filter(isArticleEntry);
  const entry = entries.find((item) => slugOf(item) === slug);
  return entry ? { entry, view: toView(entry) } : undefined;
}

export async function getTopicGroups() {
  const articles = await getArticles();
  return TOPICS.map((topic) => ({
    topic,
    count: articles.filter((article) => article.topic.slug === topic.slug).length,
  })).filter((group) => group.count > 0);
}

export async function getArticlesByTopic(slug: string) {
  return (await getArticles()).filter((article) => article.topic.slug === slug);
}

/** 相关文章：同栏目优先，其次标签重合，最后按日期补齐 */
export async function getRelatedArticles(view: ArticleView, limit = 3) {
  const articles = (await getArticles()).filter((item) => item.slug !== view.slug);
  const scored = articles.map((item) => {
    let score = 0;
    if (item.topic.slug === view.topic.slug) score += 4;
    score += item.tags.filter((tag) => view.tags.includes(tag)).length * 2;
    return { item, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || (b.item.date?.getTime() ?? 0) - (a.item.date?.getTime() ?? 0))
    .slice(0, limit)
    .map(({ item }) => item);
}
