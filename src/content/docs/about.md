---
title: 关于
description: 关于亲戚百科站点与开源致谢。
---

## 关于亲戚百科

**qinqi.wiki** 是一个围绕中国亲戚称谓的轻量网站，包含两部分：

1. **在线计算器** — 基于 [relationship.js](https://github.com/mumuy/relationship) 在浏览器端计算称呼
2. **科普文章** — 解读习俗、历史与称呼背后的文化逻辑

## 开源致谢

计算器核心算法来自 [mumuy/relationship](https://github.com/mumuy/relationship)（MIT 协议）。  
演示参考：[passer-by.com/relationship](https://passer-by.com/relationship/)

使用、修改、分发时请保留原作者版权与许可声明。

## 部署

本站为静态站点，构建命令：

```bash
npm run build
```

产物目录 `dist/` 可直接部署到 Cloudflare Pages 或其他静态托管。

| 配置项 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |

## 写文章

科普文章放在 `src/content/docs/articles/`，文件名即 URL 路径，无需在 frontmatter 里写 slug。

```yaml
---
title: 文章标题
description: 摘要，用于 SEO
date: 2026-05-31
tags: [习俗, 舅舅]
draft: false   # true 时仅在开发环境可见
---
```
