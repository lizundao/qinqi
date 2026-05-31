# Cloudflare Pages 部署指南

本文说明如何将 **qinqi.wiki**（亲戚百科）部署到 [Cloudflare Pages](https://pages.cloudflare.com/)。

本项目是 **Astro 静态站点**，构建产物在 `dist/` 目录，无需服务器运行时。

---

## 一、准备工作

1. 代码已推送到 Git 仓库（推荐 [GitHub](https://github.com/lizundao/qinqi)）
2. 拥有 [Cloudflare](https://dash.cloudflare.com/) 账号
3. 本地能正常构建：

```bash
npm install
npm run build
```

构建成功后，会在项目根目录生成 `dist/` 文件夹。

---

## 二、通过 Git 自动部署（推荐）

每次推送到主分支，Cloudflare 会自动拉代码、构建并发布。

### 1. 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧选择 **Workers & Pages**
3. 点击 **Create** → **Pages** → **Connect to Git**
4. 授权 GitHub / GitLab，选择仓库 `qinqi`
5. 点击 **Begin setup**

### 2. 构建设置

在 **Build settings** 页面填写：

| 配置项 | 值 |
| --- | --- |
| **Production branch** | `main`（或你的默认分支名） |
| **Framework preset** | `Astro`（或选 None 手动填） |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

> 若列表里没有 Astro，选 **None**，手动填入上表命令和输出目录即可。

### 3. 环境变量（建议）

展开 **Environment variables**，添加：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `NODE_VERSION` | `20` | Astro 6 建议使用 Node 20 |

Production 和 Preview 环境都建议设置。

### 4. 保存并部署

点击 **Save and Deploy**。首次构建约 1～3 分钟。

成功后 Cloudflare 会分配临时域名，例如：

```
https://qinqi.pages.dev
```

### 5. 查看部署状态

- **Workers & Pages** → 你的项目 → **Deployments**
- 每次 Git 推送都会生成一条部署记录
- 绿色 ✓ 表示成功；失败可点进日志查看报错

---

## 三、绑定自定义域名

若使用 `qinqi.wiki`：

1. 进入 Pages 项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入 `qinqi.wiki`（可同时添加 `www.qinqi.wiki`）
4. 按提示在 Cloudflare DNS 中添加记录（域名已在 Cloudflare 托管时会自动配置）
5. 等待 SSL 证书生效（通常几分钟）

站点配置中的 canonical 地址为 `https://qinqi.wiki`（见 `astro.config.mjs` 的 `site` 字段），绑定该域名后 SEO 与 sitemap 才会正确。

---

## 四、Preview 部署

- 对 Pull Request 或推送到非生产分支，Cloudflare 会自动生成 **Preview URL**
- 适合合并前检查页面效果
- Preview 与 Production 使用相同构建命令，环境变量可在 **Settings → Environment variables** 中分别配置

---

## 五、本地 CLI 部署（可选）

不连 Git、手动上传 `dist/` 时可用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/)：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 本地构建
npm run build

# 部署到 Pages（项目名需与 Dashboard 中一致）
npx wrangler pages deploy dist --project-name=qinqi
```

首次使用需在 Cloudflare 中已创建同名 Pages 项目。

---

## 六、常见问题

### 构建失败：Node 版本过低

**现象**：日志中出现 `Unsupported engine` 或 Astro 相关报错。

**处理**：在 Cloudflare 环境变量中设置 `NODE_VERSION=20`，重新部署。

### 构建失败：依赖安装错误

**处理**：

- 确认仓库已提交 `package-lock.json`
- Build command 保持 `npm run build`（Cloudflare 默认会先执行 `npm ci` 或 `npm install`）

### 页面 404

**处理**：

- 确认 **Build output directory** 为 `dist`，不是 `dist/` 以外的路径
- Astro 静态站点一般不需要额外 `_redirects`；若自定义了路由，检查 `public/` 下是否有冲突文件

### 样式或资源加载异常

**处理**：

- 确认 `astro.config.mjs` 中 `site: 'https://qinqi.wiki'` 与实际上线域名一致
- 修改域名后需重新构建部署

### 草稿文章出现在生产环境

**处理**：文章 frontmatter 中设置 `draft: true` 的文章仅在开发环境可见，生产构建会自动排除。

---

## 七、部署检查清单

发布前可在本地验证：

```bash
npm run build
npm run preview
```

确认以下页面正常：

- [ ] 首页 `/`
- [ ] 计算器 `/calc/`
- [ ] 文章列表 `/articles/`
- [ ] 文章详情（如 `/articles/tang-vs-biao/`）
- [ ] 关于页 `/about/`

上线后再次访问上述路径，并检查 HTTPS 与自定义域名是否生效。

---

## 八、相关链接

- 在线站点：https://qinqi.wiki
- 源码仓库：https://github.com/lizundao/qinqi
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Astro 部署文档](https://docs.astro.build/en/guides/deploy/cloudflare/)
