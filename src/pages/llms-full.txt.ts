import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { TOPICS, topicHref } from '../data/topics';
import { getArticles } from '../utils/articles';

export const prerender = true;

/** llms-full.txt：全部常识文章的标题 / 摘要 / 链接索引，供 AI 检索引用 */
export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const lines = [
    `# ${SITE.name} · 完整内容索引`,
    '',
    `> ${articles.length} 篇文章 · ${TOPICS.length} 个栏目 · 源站 ${SITE.url}`,
    `> 简版说明见 ${SITE.url}/llms.txt`,
    '',
  ];

  for (const topic of TOPICS) {
    const list = articles.filter((a) => a.topic.slug === topic.slug);
    lines.push(`## ${topic.title}（${list.length} 篇）`, '');
    lines.push(`栏目页：${SITE.url}${topicHref(topic.slug)}`, '');
    for (const article of list) {
      lines.push(`- [${article.title}](${SITE.url}${article.href})`);
      if (article.description) lines.push(`  ${article.description}`);
      if (article.dateLabel) lines.push(`  发布于 ${article.dateLabel}`);
    }
    lines.push('');
  }

  lines.push('## 工具页面', '');
  lines.push(`- [亲戚关系计算器](${SITE.url}/calc/)`);
  lines.push(`- [常见称呼速查表](${SITE.url}/cheatsheet/)`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
