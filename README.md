# 亲戚百科 · qinqi.wiki

中国亲戚关系在线计算器 + 亲戚常识词条。纯 Astro 静态站，**仓库根目录即站点根目录**，产物在 `dist/`。
`main` 分支已关联 Cloudflare Pages：**push 到 main 会自动构建部署**。

- 线上：https://qinqi.wiki
- 源码：https://github.com/lizundao/qinqi
- 微信小程序：「亲戚关系计算丫」，与本站共用同一套算法与十单字键盘

## 当前版本（2026-11-07 · v2 重构）

| 项 | 旧版 | 现在 |
| --- | --- | --- |
| 壳层 | Starlight + Tailwind + 遗留组件（Header/Hero/PageFrame/Pagefind…） | 纯 Astro + 一套自研 CSS 设计系统，无 Starlight / 无 Tailwind / 无外部字体 |
| 品牌 | 宣纸米白 + 朱红，和小程序蓝底 logo 不一致 | 与小程序统一的 `#2E6BEF` 蓝色体系、圆角卡片、同款 logo |
| 首屏 | 只有标题 + 两张功能卡，要跳转才能算 | **结果卡置顶的可用计算器**：先看答案，下面是输入与十单字键盘 |
| 计算器 | 文本输入 + 插入「爸爸/妈妈」词块，无方言 | 十单字关系链、性别自动屏蔽、称呼反查、反向视角、通用/北方/广东、URL 分享、本地历史 |
| 内容 | 97 篇 AI 俗语散文 + 245 个零散标签，无分类 | 105 篇「关系链 → 称呼」词条式百科、8 个受控栏目、94 个标签、每篇附实算称呼表 |
| 封面图 | 97 张 AI 写实中国风摄影，10.2MB | 105 张程序化品牌蓝关系链信息图，约 3.4MB，图文同源、可复现，页面完整不裁切 |
| SEO / GEO | 无 canonical、无 sitemap、无结构化数据 | canonical / OG / JSON-LD（WebSite、WebApplication、FAQPage、Article、BreadcrumbList）/ sitemap.xml / robots.txt / llms.txt / llms-full.txt |
| 数据可信度 | 速查类内容靠手写 | `src/data/cheats.ts` 与每篇文章的称呼表都由 `relationship.js` **实际计算**生成 |

首页区块顺序：结果置顶的计算器 → 第二屏小程序码 → 常见称呼速查 → 三步说明 + 8 个栏目 → 文章精选 → 常见问题。

### 重构收尾的几处调整

- 计算结果卡提到计算器最上方并横跨全宽；桌面 / 手机、首页 / `/calc/` 一致，输入与单字键盘在其下。
- 文章封面在详情页和列表卡片里改为完整显示，不再裁掉左右两侧的标题与署名。
- 小程序码卡片从页尾提到第二屏，二维码恢复 1:1 正方形，不再被拉成竖条。
- 旧 Starlight / Tailwind / `@fontsource` 依赖移除，`package-lock.json` 重建为 `qinqi-site@2.0.0`。

旧版源码与 97 张旧封面已单独备份，**不纳入本仓库**。

### 2026-11-07 内容增补

- 新增 2 篇词条文章：`zhou-li-lian-jin-gu-sao`（妯娌、连襟、姑嫂：平辈姻亲怎么互称）、`qi-jiu-lao-ye-shi-shui`（七舅姥爷是谁：长关系链怎么一层层拆）。文章与封面总数 97 → 99。
- 词条新增可选字段 `cc`：自定义该篇称呼对照表的关系链，不填则沿用栏目 `CHAIN_POOL` 补两条。
- 微信小程序名称为「亲戚关系计算丫」（`src/data/site.ts` 的 `SITE.appName` 是唯一真源，注册名不随网站改）；网站品牌名为「亲戚百科」（`SITE.name`）。2026-11-11 起网页侧不再使用「亲戚称呼计算器」等别名。

### 2026-11-09 内容增补

- 新增 2 篇词条文章：`ba-fu-shu-fu-gu-mu`（伯父、叔父、姑母：爸爸的兄弟姐妹怎么分别称呼）、`qin-jia-gong-qin-jia-mu`（亲家公、亲家母：儿女成婚后双方父母怎么互称）。文章与封面总数 99 → 101。

### 2026-11-10 内容增补

- 新增 2 篇词条文章：`gong-po-yue-fu-mu`（公婆、岳父母：配偶的父母怎么称呼）、`biao-ge-biao-jie`（表哥表姐表弟表妹：表亲怎么分）。文章与封面总数 101 → 103，标签 71 → 84。
- 随文章集合变化，部分「相关词条」交叉链接由 `relatedFor` 自动重排（确定性结果，非手改）。
- 词条分片由 `part-1..6` 增至 `part-1..8`，`rewrite-articles.mjs` 已 import 并拼进 `ENTRIES`；新增文件自动使用当天日期（`getDate` 兜底 `2026-11-10`）。

### 2026-11-11 内容增补

- 新增 2 篇词条文章：`da-bo-zi-xiao-shu-zi`（大伯子、小叔子、大姑子、小姑子：丈夫的兄弟姐妹怎么称呼）、`bo-gong-shu-gong-jiu-gong`（伯公、叔公、舅公、姨婆：祖辈的兄弟姐妹怎么称呼）。文章与封面总数 103 → 105，标签 84 → 94。
- 封面脚本按「主链」去称呼对照表取「通常叫」，因此自定义 `cc` 的首项必须含主链；新增两篇已按此写。11-10 两篇曾因缺主链回退成 `—`，已于风格统一时一并修正（实测受影响仅这 2 张，非历史普遍问题）。
- 词条分片增至 `part-1..9`，`getDate` 兜底改为 `2026-11-11`；随词条集合变化，部分「相关词条」由 `relatedFor` 确定性重排。

### 2026-11-11 全站风格统一

- **品牌命名**：网站侧统一为「亲戚百科」（`SITE.name` 为唯一真源），清理「亲戚称呼计算器」「在线称呼计算器」等别名；网页工具统一称「称呼计算器」，页面标题由 `BaseLayout` 自动补 `| 亲戚百科`，首页 / 计算器页 `WebApplication` 结构化数据的 name 不再误用小程序名。小程序注册名「亲戚关系计算丫」保持不变。
- **文章文案**：`rewrite-articles.mjs` 生成 description 时把标题内的「」降级为『』，消除 70 篇嵌套引号；`part-8` 两篇 `cc` 补主链，修掉 2 张封面「通常叫」显示 `—`。105 篇全量重生成，103 张旧封面字节不变。
- **品牌图可复现**：新增 `scripts/generate-brand-assets.py`，`og.png`（1200×630）与 `poster.png`（1080×864）改用与文章封面同一套蓝色渐变 / 半透明卡片 / 金黄点缀，品牌文字统一为「亲戚百科」；小程序码直接复用 `public/images/wxacode.jpg`，不重绘、不裁切定位圆，避免码失效。
- **设计系统收敛**：`site.css` 新增 `--radius-xs`、`--radius-pill`，31 处零散圆角与两处品牌渐变改用变量，品牌色只在 `:root` 定义；保留 `2px` 细条与 `50%` 圆形语义。浅色 / 深色主题与关键页面经无头浏览器实拍确认无破损。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321/
npm run build      # 产物 dist/，119 个页面
npm run preview

npm run data:cheats      # 用 relationship.js 实算，重新生成称呼速查表
npm run content:rewrite  # 按词条数据重写 105 篇文章
npm run content:covers   # 按文章内容重生成 105 张封面（需要 Python + Pillow）
npm run brand:assets     # 重画 og.png 与 poster.png（需要 Python + Pillow）
```

主要页面：

| 路径 | 说明 |
| --- | --- |
| `/` | 首页：结果置顶的计算器、第二屏小程序码、速查精选、栏目、文章、FAQ |
| `/calc/` | 完整计算器，支持 `?chain=&sex=&reverse=&type=&mode=&optimal=` 还原 |
| `/cheatsheet/` | 23 条常见称呼速查（可按父系/母系/祖辈/晚辈/姻亲筛选） |
| `/articles/` | 105 篇文章，前端搜索 + 栏目筛选 + 分页 |
| `/articles/<slug>/` | 文章详情，含相关阅读与结构化数据 |
| `/topics/<slug>/` | 8 个栏目页 |
| `/about/` | 关于与口径说明 |
| `/sitemap.xml` `/robots.txt` `/llms.txt` `/llms-full.txt` | SEO / GEO 资产 |

## 数据来源（重要）

- 计算核心：[relationship.js](https://github.com/mumuy/relationship) v1.2.9（MIT，npm `relationship.js`）。
- 方言叫法：`src/scripts/locale-data.js`，由该仓库官方 `src/locale/north.js` / `guangdong.js` 转成 ESM，数据未改动。
- 称呼速查答案：`npm run data:cheats` 用上述库**实际计算**生成 `src/data/cheats.ts`，不要手改。
- 文章：101 篇，正文由 `scripts/lexicon/part-1..7.mjs` 的词条数据经 `scripts/rewrite-articles.mjs` 生成。已有 slug / URL / 发布日期保留；新增词条自动建文件并用当天日期。每篇的称呼对照表同样由库实算，**不要直接改 `.mdx`**，改词条数据后重跑。
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
├── content/docs/            101 篇文章 + about.md
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
├── rewrite-articles.mjs     101 篇文章重写生成器
├── lexicon/part-*.mjs       101 条词条数据（文章单一真源，分 7 个分片）
├── generate-covers.py       101 张品牌蓝关系链封面生成器
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

1. 在 `scripts/lexicon/part-*.mjs` 里改对应 slug 词条：`h` 标题、`q` 引子、`a` 一句话结论、`c` 主关系链、`cc` 可选的自定义对照表链、`b` 三个要点、`m` 两个误区、`k` 附加标签、`t` 栏目、`d` 补充。
2. `npm run content:rewrite` 重新生成 101 篇 `.mdx`（已有文章保留 slug 与原发布日期，新词条自动建文件并用当天日期）。
3. `npm run content:covers` 按新文章重生成封面。
4. `npm run build` 更新站点、sitemap 与 llms.txt。

新增文章直接在某个 `part-*.mjs` 追加词条即可，不必先建 `.mdx` 占位；`rewrite-articles.mjs` 会校验「已有文章文件 ↔ 词条数据」一一对应，删了词条却留着文件才报错。新增分片记得在 `rewrite-articles.mjs` 里 import 并拼进 `ENTRIES`。

正文结构固定：引子 → 一句话结论 → 关系链拆解（含实算称呼对照表）→ 三个要点 → 两个常见误解 → 相关词条 → 口径说明。
`draft: true` 仅在 dev 可见，生产构建排除。栏目由 `tags[0]`（栏目中文名）精确归类。

## 隐私与合规

纯静态：无后端、无登录、无埋点、无第三方字体/统计脚本。计算与历史记录都在浏览器本地（localStorage）。
仓库内不含任何 API Key；`.env.example` 只是变量名示例，旧版 AI 脚本仅从环境变量读取密钥，`.env` 已被 `.gitignore` 排除。
爬虫策略见 `public/robots.txt`；给 AI 的事实清单见 `/llms.txt`。
