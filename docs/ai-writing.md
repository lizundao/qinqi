# AI 写作

使用 **OpenAI 兼容 API** 生成亲戚常识文章，写入 `src/content/docs/articles/*.mdx`。  
推荐 [硅基流动](https://cloud.siliconflow.cn/)，也可使用 DeepSeek 官方或其它中转。

## 配置

1. 复制根目录 `.env.example` 为 `.env`
2. 填入三项（均可自定义）：

```env
ARTICLE_AI_API_KEY=你的密钥
ARTICLE_AI_BASE_URL=https://api.siliconflow.cn/v1
ARTICLE_AI_MODEL=deepseek-ai/DeepSeek-V3
```

| 变量 | 说明 |
| --- | --- |
| `ARTICLE_AI_API_KEY` | API Key |
| `ARTICLE_AI_BASE_URL` | 接口根地址，一般以 `/v1` 结尾；也可填完整 `.../v1/chat/completions` |
| `ARTICLE_AI_MODEL` | 模型 ID，以服务商控制台为准 |

`.env` 已在 `.gitignore` 中，勿提交。

### 硅基流动

- 注册：[cloud.siliconflow.cn](https://cloud.siliconflow.cn/)
- 根地址：`https://api.siliconflow.cn/v1`
- 模型示例：`deepseek-ai/DeepSeek-V3`、`Pro/deepseek-ai/DeepSeek-R1`（以控制台「模型广场」显示 ID 为准）

### DeepSeek 官方

```env
ARTICLE_AI_BASE_URL=https://api.deepseek.com
ARTICLE_AI_MODEL=deepseek-chat
```

### 命令行覆盖（临时）

```bash
npm run article:ai -- \
  --topic "女婿和姑爷有什么区别" \
  --api-url https://api.siliconflow.cn/v1 \
  --api-key sk-xxx \
  --model deepseek-ai/DeepSeek-V3
```

`--api-key` 会留在 shell 历史里，日常建议只用 `.env`。

### 兼容旧环境变量

仍可使用 `DEEPSEEK_API_KEY` / `DEEPSEEK_API_BASE` / `DEEPSEEK_MODEL`，与 `ARTICLE_AI_*` 二选一即可。

## 生成文章

用**自然语言**描述即可，**标题、摘要、slug、标签、正文** 均由 AI 生成：

```bash
npm run article:ai -- "帮我写篇关于成语举案齐眉的文章"
```

```bash
npm run article:ai -- "侄子与外甥有什么区别，要有对比表"
```

也支持 `--prompt` / `--topic`（与直接传描述等价）：

```bash
npm run article:ai -- --prompt "女婿和姑爷有什么区别"
```

仅指定 URL 文件名（标题等仍由 AI 写）：

```bash
npm run article:ai -- "举案齐眉的典故" --slug ju-an-qi-mei
```

```bash
npm run article:ai -- "..." --dry-run
npm run article:ai -- "..." --publish
```

## 批量生成（AI 选题 + 写稿）

不再手写 10 条描述。给一个**主题方向**，AI 先生成 N 条互不重复的写作描述，再循环写稿：

```bash
npm run article:batch -- "姐妹之间的亲情"
```

```bash
npm run article:batch -- --theme "过年走亲戚" --count 10 --publish
```

只生成选题、不写正文（可先审选题再写稿）：

```bash
npm run article:batch -- --topics-only "婆媳相处"
```

单独生成选题并保存 JSON：

```bash
npm run article:topics -- "兄弟之情" --out .cache/topics.json
npm run article:batch -- --topics-file .cache/topics.json
```

选题会去重：会读取 `src/content/docs/articles/` 里已有文章的 `title`，避免与站内重复。

**默认** `draft: true`，仅 `npm run dev` 可见。

## 文风说明

目标：**像朋友聊天**——口语、温馨、有正能量，**不要**教育口吻和 AI 套话。

- 禁止「首先其次」「综上所述」「三点建议」「我们应该」等讲课腔
- 不强制「小结」、不篇篇「很多人从小听到大」式开头
- 随机一种写法（场景、唠嗑、短问答等）；表格最多一张
- 范文语气参考：`po-chu-qu-de-shui.mdx`

若仍偏模板，可换模型或多生成几篇挑一篇改。

## 发布流程

1. `npm run article:ai -- "你的写作描述…"`
2. `npm run dev` → `/articles/<slug>/` 审阅
3. 修改正文 / frontmatter
4. `draft: false` 后 commit、push

## 审阅清单

- [ ] 侄子/外甥、堂/表等称谓是否正确
- [ ] 表格与「小结」一致
- [ ] 可用 [计算器](/calc/) 抽查关系链
- [ ] `description` 适合 SEO
- [ ] slug 为拼音连字符

## 常见问题

**报错 `response_format` 不支持**  
部分模型不支持 JSON 模式，请换用 DeepSeek V3 等支持 `json_object` 的模型，或到 [scripts/generate-article.mjs](../scripts/generate-article.mjs) 去掉 `response_format`（需自行保证输出为 JSON）。

**401 / 403**  
检查 Key、余额与 `ARTICLE_AI_BASE_URL` 是否与服务商文档一致。

**模型 ID 无效**  
到硅基流动控制台复制完整模型名（含厂商前缀，如 `deepseek-ai/DeepSeek-V3`）。
