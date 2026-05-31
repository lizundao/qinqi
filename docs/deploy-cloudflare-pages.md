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

Cloudflare 现在默认使用 **Workers Builds**（`Create application` → `Import a repository`），分为两步：

1. **Build command** — 构建项目（生成 `dist/`）
2. **Deploy command** — 用 Wrangler 上传并发布（必填）

> 若你看到的是旧版 **Pages → Connect to Git**，只需填 Build command 和 Output directory，没有 Deploy command 字段。

### 1. 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application**
3. 选择 **Import a repository**（导入 Git 仓库）
4. 授权 GitHub，选择仓库 `qinqi`
5. 进入 **Set up your application**

### 2. 填写构建与部署命令（Workers Builds）

| 配置项 | 填什么 |
| --- | --- |
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory** | 留空 |

**非生产分支 Deploy command**（Preview，可选，默认即可）：

```bash
npx wrangler versions upload
```

### 3. wrangler.jsonc（仓库已包含）

项目根目录已有 `wrangler.jsonc`，告诉 Wrangler 静态文件在 `dist/`：

```jsonc
{
  "name": "qinqi",
  "compatibility_date": "2026-05-31",
  "assets": {
    "directory": "./dist"
  }
}
```

**重要**：Dashboard 里创建的应用名称，必须与 `wrangler.jsonc` 里的 `"name": "qinqi"` 一致，否则部署会失败。

### 4. 环境变量（建议）

在 **Settings → Variables & Secrets** 或构建配置里添加：

| 变量名 | 值 | 说明 |
| --- | --- | --- |
| `NODE_VERSION` | `20` | Astro 6 建议 Node 20 |

### 5. 保存并部署

点击 **Save and Deploy**。流程为：

```
git push → npm install → npm run build → npx wrangler deploy → 上线
```

---

### 附：旧版 Cloudflare Pages 界面

若界面是 **Pages** 标签下的 **Connect to Git**，填法如下（无 Deploy command）：

| 配置项 | 值 |
| --- | --- |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

参考：[Cloudflare Astro 指南（Pages）](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)

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

```bash
npm install
npm run build
npx wrangler login    # 首次需要
npx wrangler deploy
```

参考：[Cloudflare Astro 指南（Workers）](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)

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
- [Cloudflare Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Astro 部署（Workers）](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Cloudflare Pages Astro 指南（旧版）](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
