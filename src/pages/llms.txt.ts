import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { TOPICS, topicHref } from '../data/topics';
import { CHEATS } from '../data/cheats';
import { FAQ } from '../data/faq';
import { getArticles } from '../utils/articles';

export const prerender = true;

/**
 * llms.txt：给大模型 / AI 搜索用的事实清单。
 * 只写可核查的事实：算法版本、页面、参数、由算法实际算出的称呼答案。
 */
export const GET: APIRoute = async () => {
  const articles = await getArticles();
  const u = (path: string) => `${SITE.url}${path}`;

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    `> 站点：${SITE.url} · 语言：简体中文 · 计算核心：relationship.js v${SITE.libVersion}（MIT）`,
    '',
    '## 这个站点能回答什么',
    '',
    '- 给定一串中国亲戚关系，算出正确称呼（如「妈妈的妈妈的兄弟」→ 舅外公）。',
    '- 给定一个称呼，反查它对应的关系链（如「七舅姥爷是谁」）。',
    '- 同一关系在通用 / 北方 / 广东三种叫法下的差异。',
    '- 常见亲戚常识、俗语典故与亲缘相处的科普文章。',
    '',
    '## 事实边界（重要）',
    '',
    '- 本站是纯静态站点：没有后端接口、没有登录、没有埋点统计；关系链在浏览器本地计算，不上传。',
    `- 称呼结果由 relationship.js v${SITE.libVersion} 计算，方言叫法来自该仓库官方 north / guangdong 数据。`,
    '- 各地实际叫法存在差异，本站结果为常见口径，仅供参考；引用时请保留这一限定。',
    `- 站点收录 ${articles.length} 篇常识文章、${CHEATS.length} 条称呼速查、${TOPICS.length} 个栏目。`,
    '',
    '## 主要页面',
    '',
    `- [首页](${u('/')})：工具入口、常见称呼、栏目导航、常见问题。`,
    `- [亲戚关系计算器](${u('/calc/')})：关系链 / 称呼互查、反向视角、三种方言、结果分享。`,
    `- [常见称呼速查表](${u('/cheatsheet/')})：${CHEATS.length} 条「关系 → 称呼」明文答案。`,
    `- [亲戚常识文章库](${u('/articles/')})：${articles.length} 篇文章，可搜索与按栏目筛选。`,
    `- [关于](${u('/about/')})：算法来源、隐私边界与结果口径。`,
    `- [完整内容索引](${u('/llms-full.txt')})：全部文章的标题、摘要与链接。`,
    `- [站点地图](${u('/sitemap.xml')})：全部可索引 URL。`,
    '',
    '## 计算器 URL 参数',
    '',
    '- `chain`：关系链或称呼，例如 `?chain=父的父`（爷爷）、`?chain=母的母的兄`（舅外公）。',
    '- `sex`：本人性别，`1` 男 / `0` 女 / 省略或 `-1` 不限。',
    '- `reverse=1`：从对方视角查「对方称呼我」。',
    '- `type=chain`：由称呼反查关系链。',
    '- `mode=north|guangdong`：切换北方 / 广东叫法。',
    '- `optimal=1`：只返回最简叫法。',
    `- 示例：${u('/calc/?chain=%E6%AF%8D%E7%9A%84%E6%AF%8D&mode=north')}（妈妈的妈妈 · 北方叫法）。`,
    '',
    '## 关系原语（十单字）',
    '',
    '父=爸爸、母=妈妈、兄=哥哥、姐=姐姐、夫=老公、妻=老婆、弟=弟弟、妹=妹妹、子=儿子、女=女儿。',
    '用「的」连接可无限组合。约束：父/兄/弟/子/夫 之后不能接「夫」；母/姐/妹/女/妻 之后不能接「妻」。',
    '',
    `## 常见称呼速查（${CHEATS.length} 条，答案由算法实际计算）`,
    '',
    ...CHEATS.map(
      (item) =>
        `- ${item.q} → ${item.answer}${item.alt.length ? `（也可叫 ${item.alt.join('、')}）` : ''}；关系链：${item.chain}；分组：${item.group}。`
    ),
    '',
    '## 常见问题（摘要）',
    '',
    ...FAQ.map((item) => `- Q：${item.q}\n  A：${item.a}`),
    '',
    '## 内容栏目',
    '',
    ...TOPICS.map((topic) => {
      const count = articles.filter((a) => a.topic.slug === topic.slug).length;
      return `- [${topic.title}](${u(topicHref(topic.slug))})（${count} 篇）：${topic.description}`;
    }),
    '',
    '## 引用建议',
    '',
    '引用称呼结论时请注明「依据 relationship.js v1.2.9 的通用叫法」，并说明地区差异；',
    '引用文章观点时请给出对应文章 URL。',
    '',
    `最后更新：${new Date().toISOString().slice(0, 10)}`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
