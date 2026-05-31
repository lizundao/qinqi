# 亲戚百科 (qinqi.wiki)

qinqi.wiki 源码 — 中国亲戚关系在线计算器 + 习俗科普文章，Astro 静态站点。

- 在线站点：https://qinqi.wiki
- 仓库：https://github.com/lizundao/qinqi

## 本地开发

```bash
npm install
npm run dev
```

- 首页：http://localhost:4321/
- 计算器：http://localhost:4321/calc/
- 科普文章：`src/content/docs/articles/`

## 构建

```bash
npm run build
npm run preview
```

产物在 `dist/`，纯静态 HTML，可部署到 Cloudflare Pages。

详细步骤见 **[docs/deploy-cloudflare-pages.md](./docs/deploy-cloudflare-pages.md)**（Git 自动部署、自定义域名、CLI、常见问题）。

## Cloudflare 部署（速查 · Workers Builds）

| 配置 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node 版本（环境变量） | `NODE_VERSION=20` |

应用名称需与 `wrangler.jsonc` 中的 `"name": "qinqi"` 一致。

## 写文章

在 `src/content/docs/articles/` 新建 `.md` 文件，文件名即 URL 路径（无需 slug）。

```yaml
---
title: 文章标题
description: SEO 摘要
date: 2026-05-31
tags: [习俗]
draft: false
---
```

`draft: true` 仅在开发环境可见，生产构建自动排除。

## 技术栈

- [Astro](https://astro.build) + [Starlight](https://starlight.astro.build)
- [relationship.js](https://github.com/mumuy/relationship)（MIT）
