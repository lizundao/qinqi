import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { TOPICS, topicHref } from '../data/topics';
import { getArticles } from '../utils/articles';

export const prerender = true;

export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const today = new Date().toISOString().slice(0, 10);

  const entries: { path: string; priority: string; changefreq: string; lastmod?: string }[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/calc/', priority: '0.9', changefreq: 'monthly', lastmod: today },
    { path: '/cheatsheet/', priority: '0.9', changefreq: 'monthly', lastmod: today },
    { path: '/articles/', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/about/', priority: '0.4', changefreq: 'yearly' },
    ...TOPICS.map((topic) => ({
      path: topicHref(topic.slug),
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: today,
    })),
    ...articles.map((article) => ({
      path: article.href,
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: article.date?.toISOString().slice(0, 10),
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url><loc>${SITE.url}${entry.path}</loc>${
        entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
      }<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
