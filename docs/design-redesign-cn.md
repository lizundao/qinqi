# 亲戚百科 · 中国风改版清单

> 基于 [design-taste-frontend](https://github.com/Leonxlnx/taste-skill) 审计结论整理。  
> 目标气质：**中国风、温馨实用、像一本能查能读的亲戚年鉴**，而不是 SaaS 产品落地页。  
> 状态：**阶段 A～C 已落地**（2026-05-31）；阶段 D 验收待手动走查

---

## 一、设计方向（中国风）

### Design Read

**Reading this as:** 中文亲戚文化 **Editorial + Tool** 站，面向过年走亲戚、叫不准称呼的普通读者；**中国风、温馨、像老辈人跟你唠家常**，外壳从「硅谷蓝 SaaS」转向「中式年鉴 / 民俗小站」。

### 建议 Dial

| 旋钮 | 值 | 说明 |
|------|-----|------|
| DESIGN_VARIANCE | 5～6 | 对称为主，略留白，不玩不对称实验 |
| MOTION_INTENSITY | 3～4 | 轻 hover，无炫动效；尊重 `prefers-reduced-motion` |
| VISUAL_DENSITY | 3 | 留白足，像读书不像看 dashboard |

### 视觉语言（要 / 不要）

| 要 | 不要 |
|----|------|
| 宣纸/米白底、淡墨灰字、少量朱红/花青点缀 | 大面积科技蓝渐变、霓虹光晕、AI 紫 |
| 标题可用一款** restrained 书法或宋体感**（仅标题，正文仍 sans） | 全站水墨滤镜、龙纹底纹、过度古风 UI |
| 细线框、轻微纸纹、分隔如「题签下划线」 | 统一 `rounded-2xl + shadow + hover 上浮` 营销卡 |
| 计算器 = **实用面板**；文章 = **期刊阅读** | 全站同一套「产品推广卡」 |
| 小程序码保留，外框可改中式卡片（朱印角标等） | 去掉 QR 或换成抽象插图 |
| 暖色点缀：朱红（强调）、花青（链接 hover）、琥珀（常识区块） | 纯 Tailwind blue-600 一统天下 |

### 色彩草案（待落地到 `global.css`）

| Token | 浅色建议 | 用途 |
|-------|----------|------|
| `--qq-paper` | `#f7f3eb` 或 `#faf8f3` | 页面底，宣纸感 |
| `--qq-ink` | `#2c2c2c` / `#3d3d3d` | 主文字，墨灰非纯黑 |
| `--qq-ink-muted` | `#6b6560` | 次要文字 |
| `--qq-cinnabar` | `#b91c1c` 或 `#c0392b` | 主 CTA、强调（克制使用） |
| `--qq-indigo` | `#1e4d6b` 或 `#2563eb` 降饱和 | 链接、次要 accent |
| `--qq-gold` | `#b45309` | 「亲戚常识」区块暖色 |
| 深色 `--qq-night` | `#1a1814` + 暖灰字 | 夜读模式，非冷 slate |

### 字体草案

| 层级 | 建议 | 备注 |
|------|------|------|
| 正文 | Noto Sans SC（**自托管**，去掉 Google `@import`） | 可读性优先 |
| 标题 / 站名 | Noto Serif SC（**自托管**） | 仅 H1/H2/Logo，勿全文 serif |
| 数字 / 计算器 | 保持 sans 或等宽 | 工具感 |

---

## 二、改版总原则

1. **去 SaaS 壳**：减 eyebrow、减光晕、减双 CTA 堆叠、减卡片 hover 抬升。
2. **Eyebrow 全站 ≤ 2 处**（taste skill：每 3 区块最多 1 个）；其余用标题直接说话。
3. **一种 accent 锁全页**：朱红主 CTA + 花青链接，或统一降饱和蓝，禁止 section 间换色。
4. **布局家族要分**：Hero / 功能入口 / 文章网格 / 计算器 / 长文阅读，至少 4 种不同结构。
5. **中国风 =  restraint**：留白、墨色层次、少量传统色；**不要**整站水墨插画风。

---

## 三、改版清单（按页面）

### P0 · 设计系统基础

| # | 项 | 文件 | 做法 |
|---|-----|------|------|
| 0.1 | 色彩 token 中国风 | `src/styles/global.css` | 引入 `--qq-paper/ink/cinnabar/...`，替换 slate+纯蓝为主色 |
| 0.2 | 字体自托管 | `global.css`、`public/fonts/` | 去掉 Google Fonts `@import`；woff2 本地 + `font-display: swap` |
| 0.3 | 标题字体 | `global.css`、`SiteHeader` | 站名 + 页面 H1 用书法/宋体类；正文不变 |
| 0.4 | 减动效无障碍 | `global.css` | `@media (prefers-reduced-motion: reduce)` 关闭 translate/scale hover |
| 0.5 | Starlight 变量同步 | `global.css`、`astro.config` | `--sl-color-accent*` 与新 accent 一致 |
| 0.6 | 圆角体系 | 全站 | 定一套：如卡片 `rounded-lg`，按钮 `rounded-md`，勿混 pill 与大方角 |

---

### P1 · 首页 `/`

| # | 项 | 文件 | 现状问题 | 改版方向 |
|---|-----|------|----------|----------|
| 1.1 | Hero 背景 | `global.css` `.home-hero`、`HomeHero.astro` | 蓝橙 radial 渐变 = SaaS | 宣纸底 + 极淡水墨晕染 SVG（可选）或纯色纸纹 |
| 1.2 | Hero 光晕 blob | `HomeHero.astro` L21-25 | 蓝色 radial  behind 文字 | **删除**或改为淡墨圆晕 |
| 1.3 | Hero eyebrow 药丸 | `HomeHero.astro` L29-34 | 「称呼不求人 · …」tracking-wide pill | **删除**；必要信息并入副标题一句 |
| 1.4 | Hero 关键词 pill | `HomeHero.astro` L44-51 | 三个 rounded-full chip | **删除**或改为一句副文，不单独占一行 |
| 1.5 | Hero 副标题 | `HomeHero.astro` | 两行偏长 | 压到 **≤20 字 + 最多 2 行** |
| 1.6 | Hero CTA | `HomeHero.astro` | 双按钮 + 蓝阴影 | **主按钮 1 个**「查称呼」；次要改文字链，朱红/描边中式按钮 |
| 1.7 | QR 外光晕 | `HomeHero.astro` L101-105 | blur 蓝橙 gradient | 改 **细线框中式卡片**，保留 `HeroQrCode` 内容 |
| 1.8 | QR 卡片样式 | `HeroQrCode.astro`、`global.css` | 偏 App Store 推广卡 | 可选：角标朱印、标题宋体感、「微信扫一扫」留 |
| 1.9 | 功能区 | `HomeFeatures.astro` | 两张大 gradient 营销卡 | 改 **左右分栏链接** 或 **左色条简块**（计算器 / 常识），少 shadow/lift |
| 1.10 | 推荐阅读 eyebrow | `index.astro` L27 | 「推荐阅读」小标签 | **删除** eyebrow，只留 H2「亲戚常识」 |
| 1.11 | 文章卡 tag 色 | `ArticleList.astro` | 首页 slate tag，列表页 blue | **统一**为墨色浅底 tag |

---

### P1 · 头部 / 页脚

| # | 项 | 文件 | 改版方向 |
|---|-----|------|----------|
| 2.1 | Header 背景 | `SiteHeader.astro`、`global.css` | 宣纸/半透 + 细底边，减 blur SaaS 感 |
| 2.2 | Nav 药丸 active | `SiteHeader.astro` | active 态改 **底边线 / 朱点** 而非 blue-50 圆 pill |
| 2.3 | Logo 区 | `SiteHeader.astro` | 站名用标题字体；与 favicon 一致 |
| 2.4 | Footer | `SiteFooter.astro` | 与纸色底统一；链接 hover 花青；去掉多余 tracking-wide |

---

### P1 · 文章列表 `/articles/`

| # | 项 | 文件 | 改版方向 |
|---|-----|------|----------|
| 3.1 | 页头 eyebrow | `ArticlesPage.astro` L23 | **删除**「知识库」 eyebrow，H1 直接「亲戚常识」 |
| 3.2 | 搜索框 | `ArticlesPage.astro` | 圆角略收、边框墨色；focus 环改花青/朱 |
| 3.3 | 文章卡 | `ArticlesPage.astro`、`ArticleList.astro` | 保留封面 16:9；**减 hover 上浮**；边框改 1px 墨线 |
| 3.4 | 「阅读全文」 | `ArticlesPage.astro` | 改「阅读 →」或去掉，整卡可点即可 |
| 3.5 | 分页 | `articles-page.ts` + nav | 样式与纸色系统一致 |

---

### P1 · 文章详情 `/articles/[slug]`

| # | 项 | 文件 | 改版方向 |
|---|-----|------|----------|
| 4.1 | Section eyebrow | `ArticleDetail.astro` L60 | **保留 1 处**即可（全站唯二 eyebrow 候选：此处或计算器） |
| 4.2 | 封面 hero | `ArticleCover.astro` | 可加 **细框 + 题签式 caption**（可选） |
| 4.3 | 正文排版 | `global.css` `.article-prose` | 引述块改 **淡朱/淡青左边线**；H2 下加短墨线（题签感） |
| 4.4 | 返回按钮 | `ArticleDetail.astro` footer | 改文字链或细框，减 rounded-xl 大按钮 |

---

### P2 · 计算器 `/calc/`

| # | 项 | 文件 | 现状 | 改版方向 |
|---|-----|------|------|----------|
| 5.1 | 顶部 eyebrow | `Calculator.astro` | `在线工具` uppercase tracking-widest | **删除**；H1 下一句说明即可 |
| 5.2 | 顶部光晕 | `Calculator.astro` | blue radial | 删除或纸色 |
| 5.3 | 主按钮 | `Calculator.astro` | 纯蓝 shadow | 朱红或墨色实心，无彩色 shadow |
| 5.4 | 结果面板 | `Calculator.astro` | gradient 蓝白卡 | **面板/纸框**风格，与首页功能卡区分 |
| 5.5 | 「本地运行」badge | `Calculator.astro` | emerald pill | 改墨色小标签或「本地计算」纯文字 |

---

### P2 · 关于页 / Starlight 遗留

| # | 项 | 文件 | 改版方向 |
|---|-----|------|----------|
| 6.1 | `Hero.astro`（Starlight） | `src/components/Hero.astro` | 若仍引用，与 `HomeHero` 中国风对齐或弃用 |
| 6.2 | 主题键 | `ToolLayout.astro` | 长期可保留 `starlight-theme`；视觉逐步脱离 Starlight 默认蓝 |

---

### P3 · 内容与资产（非 UI 代码，但影响观感）

| # | 项 | 说明 |
|---|-----|------|
| 7.1 | 文章封面 | 已走 AI 写实中国风；列表与详情统一展示即可 |
| 7.2 | `hero-family-network.svg` | 若未使用可删；若用需改中式线描关系图 |
| 7.3 | Logo | 评估是否加轻微中式元素（现有蓝标可保留，与朱红 accent 协调） |

---

## 四、明确不做（避免伪中国风）

- 全站水墨滤镜、宣纸纹理铺满屏
- 每条分隔线都加祥云/回纹
- 正文改用繁体或竖排（除非单篇专题）
- 大段书法字体当正文
- 为了「古风」牺牲计算器可读性
- 恢复 Inter / AI 紫 / 三等分 feature 三卡片

---

## 五、实施阶段建议

### 阶段 A · 地基（1～2 次 PR）

- [x] 0.1～0.6 色彩 / 字体 / 减动效
- [x] 1.1～1.6 Hero 精简 + 去 SaaS 光效
- [x] 2.1～2.2 Header 导航

### 阶段 B · 内容页（1 次 PR）

- [x] 3.1～3.4 文章列表
- [x] 4.1～4.4 文章详情 prose
- [x] 1.9～1.11 首页功能区 + 推荐区

### 阶段 C · 工具与其它（1 次 PR）

- [x] 5.1～5.5 计算器
- [x] 1.7～1.8 QR 卡片中式化
- [x] 2.4 Footer + 6.x 清理

### 阶段 D · 验收

- [ ] 浅色 / 深色各走一遍首页、列表、详情、计算器
- [ ] Lighthouse + 对比度（CTA 朱红底白字 ≥ 4.5:1）
- [ ] `prefers-reduced-motion` 手动测
- [ ] 对照本文第三节逐项勾选

---

## 六、文件索引（改版会动到的）

```
src/styles/global.css
src/pages/index.astro
src/components/HomeHero.astro
src/components/HomeFeatures.astro
src/components/HeroQrCode.astro
src/components/SiteHeader.astro
src/components/SiteFooter.astro
src/components/ArticleList.astro
src/components/ArticlesPage.astro
src/components/ArticleDetail.astro
src/components/ArticleCover.astro
src/components/Calculator.astro
src/layouts/ToolLayout.astro
astro.config.mjs          # site / Starlight accent
public/fonts/             # 自托管字体（新建）
```

---

## 七、参考

- Taste skill 审计对话（2026-06）：Eyebrow 过密、SaaS 壳 vs 百科内容、卡片语言统一
- 站点定位：qinqi.wiki · 亲戚称呼 + 亲戚常识 · 微信小程序
- 封面生图风格：中国元素 + 真实人物摄影（`docs/ai-writing.md`）

---

*最后更新：2026-05-31 · 阶段 A～C 代码已合并至 main 工作区，待本地预览验收。*
