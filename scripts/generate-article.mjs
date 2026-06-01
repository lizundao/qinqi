#!/usr/bin/env node
/**
 * 使用 OpenAI 兼容 API 生成亲戚常识 MDX（硅基流动 / DeepSeek 等）
 * 写入 src/content/docs/articles/
 *
 * 用法:
 *   npm run article:ai -- --topic "堂兄弟姐妹和表兄弟姐妹有什么区别"
 *   npm run article:ai -- --topic "..." --slug tang-vs-biao
 *   npm run article:ai -- --topic "..." --api-url https://api.siliconflow.cn/v1 --model deepseek-ai/DeepSeek-V3
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'src/content/docs/articles');
const SAMPLE_PATH = path.join(ARTICLES_DIR, 'tang-biao-qu-bie.mdx');

function parseArgs(argv) {
	const args = { prompt: '', slug: '', publish: false, dryRun: false };
	const positional = [];

	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if ((a === '--prompt' || a === '--topic' || a === '-p') && argv[i + 1]) {
			args.prompt = argv[++i];
		} else if (a === '--slug' && argv[i + 1]) args.slug = argv[++i];
		else if ((a === '--api-url' || a === '--base-url') && argv[i + 1]) args.apiUrl = argv[++i];
		else if ((a === '--api-key' || a === '--key') && argv[i + 1]) args.apiKey = argv[++i];
		else if (a === '--model' && argv[i + 1]) args.model = argv[++i];
		else if (a === '--publish') args.publish = true;
		else if (a === '--dry-run') args.dryRun = true;
		else if (a === '--help' || a === '-h') args.help = true;
		else if (!a.startsWith('-')) positional.push(a);
	}

	if (!args.prompt && positional.length) {
		args.prompt = positional.join(' ');
	}

	return args;
}

function printHelp() {
	console.log(`
用法: npm run article:ai -- "写作描述" [选项]
      npm run article:ai -- --prompt "写作描述" [选项]

只需用自然语言说明想写什么，不必提供标题、摘要或 slug，均由 AI 生成。

选项:
  "写作描述"           必填（也可 --prompt / --topic / -p）
  --slug <name>        可选，仅指定 URL 文件名；标题等仍由 AI 生成
  --api-url <url>      可选，API 根地址（覆盖 .env）
  --api-key <key>      可选，API Key（覆盖 .env，慎用于命令行历史）
  --model <id>         可选，模型 ID（覆盖 .env）
  --publish            draft: false（默认 draft: true）
  --dry-run            只预览，不写文件

环境变量（推荐写在 .env）:
  ARTICLE_AI_API_KEY      必填，API Key
  ARTICLE_AI_BASE_URL     必填，接口根地址（OpenAI 兼容，通常以 /v1 结尾）
  ARTICLE_AI_MODEL        必填，模型 ID

兼容旧名（任选其一）: DEEPSEEK_API_KEY / DEEPSEEK_API_BASE / DEEPSEEK_MODEL

示例（硅基流动）:
  ARTICLE_AI_BASE_URL=https://api.siliconflow.cn/v1
  ARTICLE_AI_MODEL=deepseek-ai/DeepSeek-V3

  npm run article:ai -- "帮我写篇关于成语举案齐眉的文章"
  npm run article:ai -- "侄子与外甥有什么区别，要有对比表"
`);
}

/** 读取配置：CLI 优先，其次 ARTICLE_AI_*，最后 DEEPSEEK_* */
function resolveAiConfig(args) {
	const apiKey =
		args.apiKey?.trim() ||
		process.env.ARTICLE_AI_API_KEY?.trim() ||
		process.env.DEEPSEEK_API_KEY?.trim();
	const baseUrl =
		args.apiUrl?.trim() ||
		process.env.ARTICLE_AI_BASE_URL?.trim() ||
		process.env.ARTICLE_AI_API_URL?.trim() ||
		process.env.DEEPSEEK_API_BASE?.trim();
	const model =
		args.model?.trim() ||
		process.env.ARTICLE_AI_MODEL?.trim() ||
		process.env.DEEPSEEK_MODEL?.trim();

	if (!apiKey) {
		throw new Error(
			'未设置 API Key。请在 .env 中配置 ARTICLE_AI_API_KEY，或使用 --api-key',
		);
	}
	if (!baseUrl) {
		throw new Error(
			'未设置 API 地址。请在 .env 中配置 ARTICLE_AI_BASE_URL，或使用 --api-url',
		);
	}
	if (!model) {
		throw new Error('未设置模型。请在 .env 中配置 ARTICLE_AI_MODEL，或使用 --model');
	}

	return { apiKey, baseUrl, model };
}

/** 支持只填根地址或完整 .../chat/completions */
function resolveChatCompletionsUrl(baseUrl) {
	const trimmed = baseUrl.replace(/\/+$/, '');
	if (trimmed.endsWith('/chat/completions')) return trimmed;
	return `${trimmed}/chat/completions`;
}

function loadEnvFile() {
	const envPath = path.join(ROOT, '.env');
	return readFile(envPath, 'utf8')
		.then((text) => {
			for (const line of text.split('\n')) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith('#')) continue;
				const eq = trimmed.indexOf('=');
				if (eq === -1) continue;
				const key = trimmed.slice(0, eq).trim();
				let val = trimmed.slice(eq + 1).trim();
				if (
					(val.startsWith('"') && val.endsWith('"')) ||
					(val.startsWith("'") && val.endsWith("'"))
				) {
					val = val.slice(1, -1);
				}
				if (!(key in process.env)) process.env[key] = val;
			}
		})
		.catch(() => {});
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function todayISO() {
	return new Date().toISOString().slice(0, 10);
}

function buildFrontmatter({ title, description, tags, draft }) {
	const tagLine = tags?.length
		? `tags: [${tags.map((t) => JSON.stringify(String(t))).join(', ')}]`
		: 'tags: ["亲戚常识"]';
	return `---
title: ${escapeYaml(title)}
description: ${escapeYaml(description)}
date: ${todayISO()}
${tagLine}
tableOfContents: false
prev: false
next: false
sidebar:
  hidden: true
draft: ${draft}
---`;
}

function escapeYaml(str) {
	const s = String(str).replace(/\r?\n/g, ' ').trim();
	if (/[:#\[\]{}|>&*!%@`]/.test(s) || s.includes('"')) {
		return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	}
	return s;
}

/** 修复 AI 把表格行挤在一行（| ... | | ... |）的情况 */
function normalizeMarkdownTables(markdown) {
	let text = String(markdown);
	// 「数据行 | | 下一行」→ 换行
	text = text.replace(/(\|)\s+\|(?=\s*[^|\n\-])/g, '$1\n|');
	// 表头分隔行后确保换行
	text = text.replace(/(\|[-:| ]+\|)\s*\|/g, '$1\n|');
	return text;
}

function extractJson(text) {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
	const raw = fenced ? fenced[1].trim() : text.trim();
	const start = raw.indexOf('{');
	const end = raw.lastIndexOf('}');
	if (start === -1 || end === -1) throw new Error('模型未返回有效 JSON');
	return JSON.parse(raw.slice(start, end + 1));
}

async function loadSample() {
	try {
		return await readFile(SAMPLE_PATH, 'utf8');
	} catch {
		return '';
	}
}

async function callChatApi(ai, messages) {
	const url = resolveChatCompletionsUrl(ai.baseUrl);
	const body = {
		model: ai.model,
		messages,
		temperature: 0.6,
		response_format: { type: 'json_object' },
	};

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${ai.apiKey}`,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`API ${res.status} (${url}): ${errText}`);
	}

	const data = await res.json();
	const content = data.choices?.[0]?.message?.content;
	if (!content) throw new Error('模型返回为空');
	return content;
}

function buildSystemPrompt(sampleMdx) {
	return `你是「亲戚百科 qinqi.wiki」的科普作者。站点初心：现代社会家族渐散，许多人搞不清称呼、不懂亲缘分寸；本站帮读者辨别亲疏、理智看待血缘、珍重亲情、注重日常相处。文章聚焦中国亲戚称谓、家庭伦理与民俗。

用户会用自然语言描述想写的文章（例如「帮我写篇关于成语举案齐眉的文章」），**不必**提供标题、摘要或 slug——你需要根据描述自行拟定全部元数据并撰写正文。

## 你必须生成的 JSON 字段

- **title**：贴切、可读的中文标题（不要只用用户原话）
- **description**：50–120 字 SEO 摘要，说清读者能学到什么
- **slug**：小写拼音 + 连字符，如 \`ju-an-qi-mei\`、\`zhi-zi-vs-wai-sheng\`（简短、见名知意）
- **tags**：2–4 个中文标签（如：习俗典故、成语、称呼辨析、婚姻家庭）
- **body**：完整 Markdown 正文（**不要** frontmatter，**不要** H1）

## 写作要求

1. 准确、口语化；不编造出处或地方习俗，不确定处用「相传」「常见说法」等。
2. 篇幅约 800–1500 字；至少 1 个 ## 小节；辨析类文章宜含 Markdown 表格。
3. **表格**：每行单独一行，行与行之间必须用换行分隔，禁止多行挤在同一行。示例：
   | 列A | 列B |
   | --- | --- |
   | 值1 | 值2 |
4. 根据题材自选结构，例如：
   - **称呼辨析**：点题 → 核心区别（表格）→ 误区 → 可选 [计算器](/calc/) → 小结
   - **成语/典故**（如举案齐眉）：成语含义 → 出处故事 → 与夫妻/家庭礼仪的关系 → 现代理解 → 小结
   - **习俗节庆**：场景 → 讲究 → 常见叫法 → 小结
5. 若用户主题偏成语、历史、婚恋礼仪，须落到「家庭与亲戚文化」视角，避免写成泛语文或历史百科。
6. 与称谓计算相关时，可自然链到 [计算器](/calc/)。

${sampleMdx ? `【范文参考（称呼辨析类）】\n${sampleMdx.slice(0, 3200)}` : ''}

只输出一个 JSON 对象，不要其它说明文字：
{
  "slug": "kebab-case-slug",
  "title": "文章标题",
  "description": "SEO 摘要",
  "tags": ["标签1", "标签2"],
  "body": "Markdown 正文"
}`;
}

function buildUserPrompt(prompt, slug) {
	let text = `用户的写作需求：\n${prompt.trim()}`;
	if (slug) {
		text += `\n\n请使用 URL slug：${slug}（title、description、tags、正文仍由你撰写）`;
	}
	return text;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || !args.prompt?.trim()) {
		printHelp();
		process.exit(args.help ? 0 : 1);
	}

	await loadEnvFile();
	const ai = resolveAiConfig(args);

	const sample = await loadSample();
	const userPrompt = buildUserPrompt(args.prompt, args.slug);

	const endpoint = resolveChatCompletionsUrl(ai.baseUrl);
	console.log(`→ 正在请求 ${ai.model}`);
	console.log(`  ${endpoint}`);
	console.log(`  需求：${args.prompt.trim().slice(0, 80)}${args.prompt.length > 80 ? '…' : ''}`);

	const raw = await callChatApi(ai, [
		{ role: 'system', content: buildSystemPrompt(sample) },
		{ role: 'user', content: userPrompt },
	]);

	const parsed = extractJson(raw);

	if (!parsed.title?.trim()) throw new Error('模型未返回 title');
	if (!parsed.description?.trim()) throw new Error('模型未返回 description');
	if (!parsed.body?.trim()) throw new Error('模型未返回 body');

	console.log(`  标题：${parsed.title}`);
	console.log(`  摘要：${String(parsed.description).slice(0, 60)}…`);
	const slug = (args.slug || parsed.slug || '').trim().toLowerCase();
	if (!SLUG_RE.test(slug)) {
		throw new Error(`无效 slug「${slug}」，请使用小写字母、数字与连字符，或通过 --slug 指定`);
	}

	const outPath = path.join(ARTICLES_DIR, `${slug}.mdx`);
	try {
		await access(outPath, constants.F_OK);
		throw new Error(`文件已存在：${outPath}\n请换 --slug 或删除旧文件`);
	} catch (e) {
		if (e.code !== 'ENOENT') throw e;
	}

	const draft = !args.publish;
	const frontmatter = buildFrontmatter({
		title: parsed.title,
		description: parsed.description,
		tags: parsed.tags,
		draft,
	});
	const body = normalizeMarkdownTables(String(parsed.body || '').trim());
	const fileContent = `${frontmatter}\n\n${body}\n`;

	if (args.dryRun) {
		console.log('\n--- 预览 ---\n');
		console.log(fileContent);
		console.log('--- 将写入 ---');
		console.log(outPath);
		return;
	}

	await writeFile(outPath, fileContent, 'utf8');
	console.log(`✓ 已写入 ${path.relative(ROOT, outPath)}`);
	console.log(`  draft: ${draft}（${draft ? '仅 npm run dev 可见，审完后改 draft: false' : '生产构建会包含'}）`);
	console.log(`  预览: http://localhost:4321/articles/${slug}/`);
}

main().catch((err) => {
	console.error('✗', err.message || err);
	process.exit(1);
});
