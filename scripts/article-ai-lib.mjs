import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const ARTICLES_DIR = path.join(ROOT, 'src/content/docs/articles');

export async function loadEnvFile() {
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

/** @param {Record<string, string | undefined>} args */
export function resolveAiConfig(args = {}) {
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

	if (!apiKey) throw new Error('未设置 API Key（ARTICLE_AI_API_KEY）');
	if (!baseUrl) throw new Error('未设置 API 地址（ARTICLE_AI_BASE_URL）');
	if (!model) throw new Error('未设置模型（ARTICLE_AI_MODEL）');

	return { apiKey, baseUrl, model };
}

export function resolveChatCompletionsUrl(baseUrl) {
	const trimmed = baseUrl.replace(/\/+$/, '');
	if (trimmed.endsWith('/chat/completions')) return trimmed;
	return `${trimmed}/chat/completions`;
}

export function extractJson(text) {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
	const raw = fenced ? fenced[1].trim() : text.trim();
	const start = raw.indexOf('{');
	const end = raw.lastIndexOf('}');
	if (start === -1 || end === -1) throw new Error('模型未返回有效 JSON');
	return JSON.parse(raw.slice(start, end + 1));
}

/** @param {{ apiKey: string; baseUrl: string; model: string }} ai */
export async function callChatApi(ai, messages, opts = {}) {
	const url = resolveChatCompletionsUrl(ai.baseUrl);
	const body = {
		model: ai.model,
		messages,
		temperature: opts.temperature ?? 0.78,
	};
	if (opts.json !== false) {
		body.response_format = { type: 'json_object' };
	}

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

/** 读取已有文章标题，供选题去重 */
export async function getExistingArticleTitles() {
	const titles = [];
	try {
		const files = await readdir(ARTICLES_DIR);
		for (const file of files) {
			if (!/\.mdx?$/.test(file)) continue;
			const text = await readFile(path.join(ARTICLES_DIR, file), 'utf8');
			const m = text.match(/^title:\s*(.+)$/m);
			if (m) titles.push(m[1].replace(/^["']|["']$/g, '').trim());
		}
	} catch {
		/* empty dir */
	}
	return titles;
}

function buildTopicsSystemPrompt(existingTitles, count) {
	const existingBlock =
		existingTitles.length > 0
			? `\n【站内已有文章标题，禁止重复或高度相似】\n${existingTitles.slice(0, 80).map((t) => `- ${t}`).join('\n')}${existingTitles.length > 80 ? `\n…共 ${existingTitles.length} 篇` : ''}`
			: '';

	return `你是「亲戚百科 qinqi.wiki」的选题策划。站点写中国亲戚称谓、人情世故、家庭相处，读者喜欢口语、温馨、像朋友聊天。

任务：根据用户给的**主题方向**，策划 ${count} 个**互不重复**的文章写作描述。

## 每条 description 的格式

- 以「帮我写篇关于…」开头，一句话说清写什么
- 可嵌入成语、谚语、俗语、老话（优先）
- 末尾可加语气要求：「像朋友聊天」「温馨别讲课」「别列三点建议」等（简短）
- 每条 30～80 字，是交给写稿 AI 的**指令**，不是成品标题

## 选题要求

- ${count} 条角度各不相同，别都一个套路
- 尽量从成语谚语、过年走亲戚、称呼、亲疏、手足、婆媳、姻亲等切入
- 别写已有文章同题；别写「一文读懂」「深度解析」式选题
- 正能量、温馨，避免戾气和说教选题${existingBlock}

只输出 JSON：
{
  "topics": [
    { "description": "帮我写篇关于…" }
  ]
}`;
}

/**
 * @param {{ theme: string; count?: number; ai: ReturnType<typeof resolveAiConfig>; existingTitles?: string[] }} params
 */
export async function generateTopics({ theme, count = 10, ai, existingTitles = [] }) {
	const system = buildTopicsSystemPrompt(existingTitles, count);
	const user = `主题方向：${theme.trim()}\n请生成 ${count} 条写作描述。`;

	const raw = await callChatApi(
		ai,
		[
			{ role: 'system', content: system },
			{ role: 'user', content: user },
		],
		{ temperature: 0.85 },
	);

	const parsed = extractJson(raw);
	const topics = parsed.topics;

	if (!Array.isArray(topics) || topics.length === 0) {
		throw new Error('模型未返回 topics 数组');
	}

	return topics
		.map((item) => {
			if (typeof item === 'string') return item.trim();
			if (item && typeof item.description === 'string') return item.description.trim();
			return '';
		})
		.filter(Boolean)
		.slice(0, count);
}
