# 亲戚百科 · qinqi.wiki

中国亲戚关系在线计算器 + 亲戚常识词条。纯 Astro 静态站，**仓库根目录即站点根目录**，产物在 `dist/`。
`main` 分支已关联 Cloudflare Pages：**push 到 main 会自动构建部署**。

- 线上：https://qinqi.wiki
- 源码：https://github.com/lizundao/qinqi
- 微信小程序：「亲戚称呼计算器」，与本站共用同一套算法与十单字键盘

## 当前版本（2026-11-07 · v2 重构）

| 项 | 旧版 | 现在 |
| --- | --- | --- |
| 壳层 | Starlight + Tailwind + 遗留组件（Header/Hero/PageFrame/Pagefind…） | 纯 Astro + 一套自研 CSS 设计系统，无 Starlight / 无 Tailwind / 无外部字体 |
| 品牌 | 宣纸米白 + 朱红，和小程序蓝底 logo 不一致 | 与小程序统一的 `#2E6BEF` 蓝色体系、圆角卡片、同款 logo |
| 首屏 | 只有标题 + 两张功能卡，要跳转才能算 | **结果卡置顶的可用计算器**：先看答案，下面是输入与十单字键盘 |
| 计算器 | 文本输入 + 插入「爸爸/妈妈」词块，无方言 | 十单字关系链、性别自动屏蔽、称呼反查、反向视角、通用/北方/广东、URL 分享、本地历史 |
| 内容 | 97 篇 AI 俗语散文 + 245 个零散标签，无分类 | 97 篇「关系链 → 称呼」词条式百科、8 个受控栏目、64 个标签、每篇附实算称呼表 |
| 封面图 | 97 张 AI 写实中国风摄影，10.2MB | 程序化品牌蓝关系链信息图，约 3MB，图文同源、可复现，页面完整不裁切 |
| SEO / GEO | 无 canonical、无 sitemap、无结构化数据 | canonical / OG / JSON-LD（WebSite、WebApplication、FAQPage、Article、BreadcrumbList）/ sitemap.xml / robots.txt / llms.txt / llms-full.txt |
| 数据可信度 | 速查类内容靠手写 | `src/data/cheats.ts` 与每篇文章的称呼表都由 `relationship.js` **实际计算**生成 |

首页区块顺序：结果置顶的计算器 → 第二屏小程序码 → 常见称呼速查 → 三步说明 + 8 个栏目 → 文章精选 → 常见问题。

### 重构收尾的几处调整

- 计算结果卡提到计算器最上方并横跨全宽；桌面 / 手机、首页 / `/calc/` 一致，输入与单字键盘在其下。
- 文章封面在详情页和列表卡片里改为完整显示，不再裁掉左右两侧的标题与署名。
- 小程序码卡片从页尾提到第二屏，二维码恢复 1:1 正方形，不再被拉成竖条。
- 旧 Starlight / Tailwind / `@fontsource` 依赖移除，`package-lock.json` 重建为 `qinqi-site@2.0.0`。

旧版源码与 97 张旧封面已单独备份，**不纳入本仓库**。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321/
npm run build      # 产物 dist/，111 个页面
npm run preview

npm run data:cheats      # 用 relationship.js 实算，重新生成称呼速查表
npm run content:rewrite  # 按词条数据重写 97 篇文章
npm run content:covers   # 按文章内容重生成 97 张封面（需要 Python + Pillow）
```

主要页面：

| 路径 | 说明 |
| --- | --- |
| `/` | 首页：结果置顶的计算器、第二屏小程序码、速查精选、栏目、文章、FAQ |
| `/calc/` | 完整计算器，支持 `?chain=&sex=&reverse=&type=&mode=&optimal=` 还原 |
| `/cheatsheet/` | 23 条常见称呼速查（可按父系/母系/祖辈/晚辈/姻亲筛选） |
| `/articles/` | 97 篇文章，前端搜索 + 栏目筛选 + 分页 |
| `/articles/<slug>/` | 文章详情，含相关阅读与结构化数据 |
| `/topics/<slug>/` | 8 个栏目页 |
| `/about/` | 关于与口径说明 |
| `/sitemap.xml` `/robots.txt` `/llms.txt` `/llms-full.txt` | SEO / GEO 资产 |

## 数据来源（重要）

- 计算核心：[relationship.js](https://github.com/mumuy/relationship) v1.2.9（MIT，npm `relationship.js`）。
- 方言叫法：`src/scripts/locale-data.js`，由该仓库官方 `src/locale/north.js` / `guangdong.js` 转成 ESM，数据未改动。
- 称呼速查答案：`npm run data:cheats` 用上述库**实际计算**生成 `src/data/cheats.ts`，不要手改。
- 文章：97 个 slug / URL 保留，正文由 `scripts/lexicon/part-1..5.mjs` 的词条数据经 `scripts/rewrite-articles.mjs` 生成。每篇的称呼对照表同样由库实算，**不要直接改 `.mdx`**，改词条数据后重跑。
- 封面：`scripts/generate-covers.py` 直接读取文章的标题、栏目、主关系链与实算称呼绘图，因此改完文章重跑封面即可保持图文一致；字体用系统 PingFang，产物为 1200×675 WebP。

## 图片与布局约定（别改回去）

- 文章封面是 1200×675（16/9）信息图，**文字分布在左右两端**；小程序码是 1280×1280 正方形。任何裁切都会丢信息。
- 所有 `<img>` 在 CSS 里都要显式写 `height: auto`、与实际一致的 `aspect-ratio`，并用 `object-fit: contain`。全局只设了 `img { max-width: 100% }`，HTML 的 `height` 属性会被浏览器当成固定 CSS 高度，配合 `object-fit: cover` 会裁掉两侧或把图拉成长条。
- `<img>` 的 `width` / `height` 属性必须与真实比例一致（详情页封面 `1200×675`、卡片 `640×360`、小程序码 `320×320`）。
- 改完样式用 `npm run build` 后，浏览器实拍复核详情页、列表页与首页计算器。

## 目录

```
src/
├── content.config.ts        内容集合（原生 glob loader，替代 Starlight docsLoader）
├── content/docs/            97 篇文章 + about.md
├── data/                    站点常量、栏目、FAQ、速查表（生成）
├── layouts/BaseLayout.astro 全站 head / SEO / JSON-LD / 主题
├── components/              计算器、速查、文章卡、FAQ、小程序码、面包屑、页头页脚
├── pages/                   页面 + sitemap.xml.ts + llms*.txt.ts
├── scripts/                 浏览器端计算器、文章筛选、方言数据
├── styles/site.css          设计系统（全站唯一 CSS 入口）
└── utils/                   文章聚合 / 精确栏目归类 / Markdown 渲染
public/                      favicon、logo、小程序码、OG 图、文章封面、robots.txt
scripts/
├── generate-cheats.mjs      称呼速查表（实算生成）
├── rewrite-articles.mjs     97 篇文章重写生成器
├── lexicon/part-*.mjs       97 条词条数据（文章单一真源）
├── generate-covers.py       97 张品牌蓝关系链封面生成器
└── *article* / *cover*      旧版 AI 写作与生图工具（v2 不再使用）
docs/                        旧版部署 / 写作说明，与本版有出入时以本 README 为准
wrangler.jsonc               Workers Builds 静态资源配置（assets.directory = ./dist）
```

## 部署（Cloudflare Pages · 自动）

仓库 `main` 分支已关联 Cloudflare Pages，push 即自动构建，不需要手动 deploy。

| 配置 | 值 |
| --- | --- |
| Production branch | `main` |
| Root directory | `/`（仓库根） |
| Build command | `npm run build` |
| 产物目录 | `dist/` |
| **Node** | **≥ 22.12.0**（`astro@6.4.2` 与 `@astrojs/mdx@5.0.6` 的 engines 硬性要求）；在 Pages 环境变量设 `NODE_VERSION=22`，本地为 v22.22.2 |
| npm | ≥ 9.6.5 |

> 如果 Pages 项目还停留在 Node 20 或平台默认版本，`npm run build` 会直接失败。推送后先确认 Cloudflare 后台的 `NODE_VERSION`。

`wrangler.jsonc`（`name: qinqi`、`assets.directory: ./dist`）供 Workers Builds / `npx wrangler deploy` 使用；Pages 直接读 `dist/`。
`site` 固定为 `https://qinqi.wiki`，canonical / sitemap / OG 都基于它；换域名要同时改 `astro.config.mjs` 与 `src/data/site.ts`。

## 写文章

文章是**词条数据驱动**的，不要直接编辑 `.mdx`（下次重写会被覆盖）：

1. 在 `scripts/lexicon/part-*.mjs` 里改对应 slug 词条：`h` 标题、`q` 引子、`a` 一句话结论、`c` 主关系链、`b` 三个要点、`m` 两个误区、`k` 附加标签、`t` 栏目。
2. `npm run content:rewrite` 重新生成 97 篇 `.mdx`（保留 slug 与原发布日期）。
3. `npm run content:covers` 按新文章重生成封面。
4. `npm run build` 更新站点、sitemap 与 llms.txt。

新增文章时先在 `src/content/docs/articles/` 建同名 `.mdx` 占位（提供 `date`），再补词条数据；`rewrite-articles.mjs` 会校验「文章文件 ↔ 词条数据」一一对应，缺一条就报错。

正文结构固定：引子 → 一句话结论 → 关系链拆解（含实算称呼对照表）→ 三个要点 → 两个常见误解 → 相关词条 → 口径说明。
`draft: true` 仅在 dev 可见，生产构建排除。栏目由 `tags[0]`（栏目中文名）精确归类。

## 隐私与合规

纯静态：无后端、无登录、无埋点、无第三方字体/统计脚本。计算与历史记录都在浏览器本地（localStorage）。
仓库内不含任何 API Key；`.env.example` 只是变量名示例，旧版 AI 脚本仅从环境变量读取密钥，`.env` 已被 `.gitignore` 排除。
爬虫策略见 `public/robots.txt`；给 AI 的事实清单见 `/llms.txt`。
