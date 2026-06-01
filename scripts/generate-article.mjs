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
/** 语气参考：散文式、少表格，勿套结构 */
const SAMPLE_PATH = path.join(ARTICLES_DIR, 'gu-si-le-jiu-zou-le.mdx');

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
			temperature: 0.78,
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
	return `你是给「亲戚百科 qinqi.wiki」写稿的老朋友，懂中国亲戚叫法和人情世故，但**不是**写论文、不是写公众号模板文。

读者：普通人，过年走亲戚、叫不准人、听老人念叨俗语，想弄懂又不爱看套话。

## 输出 JSON

- **title**：像人起的标题，可带引号、俗语，别用「一文读懂」「深度解析」
- **description**：50–100 字，口语一点，**禁止**「本文将」「帮你读懂」「一文说清」
- **slug**：拼音连字符，如 \`ju-an-qi-mei\`
- **tags**：2–4 个中文标签
- **body**：Markdown 正文，无 frontmatter，无 H1

## 语气（最重要）

- 用「你」「咱」偶尔即可，像在饭桌边聊天，别端着
- 句子长短错落，允许半句、反问、插话（「说实话」「你想想」「老辈人常这么说」）
- **禁止** AI 套话和排比三连：首先/其次/最后、第一第二第三、综上所述、归根结底、说到底、不难发现、值得一提的是、从某种意义上、一言以蔽之、我们应当、深入了解、换言之、值得注意的是、这背后折射出、在当今社会、随着…的发展
- **禁止** 固定收尾：不要每篇都写「## 小结」；结尾可以自然收住，一句老话、一个场景、一句掏心话都行
- **禁止** 千篇一律的开头：不要篇篇「这句话很多人从小听到大」「乍一听」「它像一把锋利的刀」

## 结构（每篇必须不同）

写之前在心里**随机选一种**写法，不要默认「定义→表格→现代→三点→小结」：

1. **场景切入**：从一个具体画面写起（年夜饭、回老家、群里发红包），再展开
2. **对话体**：你和二叔/表姐的几句对话引出主题
3. **讲故事**：典故或民间说法当故事讲，别写成百科词条
4. **辨析型**：只有称呼/身份真的需要对比时才用表格；表格最多一张，别用「对比维度」当表头
5. **随笔型**：2～4 个 ## 小标题，角度随意，不必对称
6. **问答型**：几个短问题短答，穿插叙述

硬性规则：
- 全文 **600～1200 字**，宁可短而利落，别注水
- ## 小标题 **2～4 个**，标题要有变化，别总用「一句谚语，三层意思」「现代家庭里…」「看透之后…」
- **表格**：全篇最多 1 张，且不超过 4 行；不是辨析文可以**不要**表格
- 链到 [计算器](/calc/)：**最多 1 次**，且只有真的在讲称呼计算时才提，别硬塞
- 事实拿不准就写「老辈人这么说」「各地不一样」，别编文献和精确朝代

主题须落在亲戚、家庭、人情；别写成纯历史课或心灵鸡汤。

${sampleMdx ? `【语气参考，只学口吻和节奏，禁止套它的段落结构】\n${sampleMdx.slice(0, 2200)}` : ''}

只输出 JSON：
{
  "slug": "kebab-case-slug",
  "title": "文章标题",
  "description": "SEO 摘要",
  "tags": ["标签1", "标签2"],
  "body": "Markdown 正文"
}`;
}

const WRITING_STYLES = [
	'本篇从具体场景写起（如年夜饭、回老家、家族微信群），不要表格，不要用「小结」作标题。',
	'本篇当故事讲，口语化，2～3 个 ## 小标题即可，结尾自然收住。',
	'本篇用短问答穿插叙述，不要「首先其次」，不要排比三点。',
	'本篇若是辨析称呼才用一张小表格；否则纯叙述，别硬上表格。',
	'本篇像跟朋友聊天，可有一句反问开头，别用「很多人从小听到大」式开场。',
];

function buildUserPrompt(prompt, slug) {
	const styleHint = WRITING_STYLES[Math.floor(Math.random() * WRITING_STYLES.length)];
	let text = `用户的写作需求：\n${prompt.trim()}\n\n【本篇写法】${styleHint}`;
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
