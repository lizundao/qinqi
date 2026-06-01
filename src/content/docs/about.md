---
title: 关于
description: 亲戚百科的初心：在涣散的亲情里，帮大家搞清称呼、读懂亲缘、珍重相处。
sidebar:
  hidden: true
---

## 为什么做亲戚百科

现代社会里，家族往往越分越散：孩子之间素不相识，逢年过节的称呼张口结舌；不少小说、影视里的亲戚关系也经不起推敲。

**qinqi.wiki（亲戚百科）** 想做的，不只是一本「称呼词典」，而是帮大家在血脉与日常之间，多一点清醒、少一点尴尬：

- **辨别亲疏** — 谁近谁远、为何讲究，心里有数
- **理智看待血缘** — 亲缘有远近，不必勉强，也不必冷漠
- **珍重亲情** — 该走动时走动，该问候时问候
- **注重日常交往** — 称呼叫对了，话才说得顺，情才接得住

## 网站提供什么

1. **在线计算器** — 基于 [relationship.js](https://github.com/mumuy/relationship) 在浏览器本地计算称呼，支持关系链、反向查询与自然语言
2. **亲戚常识** — 俗语典故、亲缘辨析，读懂习俗与相处里的分寸

## 开源致谢

计算器核心算法来自 [mumuy/relationship](https://github.com/mumuy/relationship)（MIT 协议）。  
演示参考：[passer-by.com/relationship](https://passer-by.com/relationship/)

使用、修改、分发时请保留原作者版权与许可声明。

## 部署

本站为 Astro 静态站点，构建产物在 `dist/` 目录。

| 配置项 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

详细步骤见仓库 [docs/deploy-cloudflare-pages.md](https://github.com/lizundao/qinqi/blob/main/docs/deploy-cloudflare-pages.md)。

## 写文章

亲戚常识文章放在 `src/content/docs/articles/`，使用 `.mdx` 格式，文件名即 URL 路径。

```yaml
---
title: 文章标题
description: 摘要，用于 SEO
date: 2026-05-31
tags: [习俗, 舅舅]
draft: false
---
```
