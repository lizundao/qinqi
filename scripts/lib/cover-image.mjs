import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../..');
export const COVERS_DIR = path.join(ROOT, 'public/images/articles');
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 675;

export const FALLBACK_QUERIES = [
	'chinese family reunion dinner',
	'multigenerational asian family portrait',
	'chinese new year family gathering',
	'grandparents grandchildren warm',
	'siblings family together',
	'chinese tea family home',
	'family dinner table asia',
	'elderly parents adult children',
	'cousins family gathering',
	'chinese wedding family photo',
	'family walking park autumn',
	'mother daughter traditional',
];

export async function coverFileExists(slug) {
	try {
		await access(path.join(COVERS_DIR, `${slug}.webp`), constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export function fallbackQuery(slug) {
	let hash = 0;
	for (const c of slug) hash = (hash + c.charCodeAt(0)) >>> 0;
	return FALLBACK_QUERIES[hash % FALLBACK_QUERIES.length];
}

export async function searchOpenverse(query, slug, triedPages = new Set()) {
	const baseHash = [...slug].reduce((h, c) => (h + c.charCodeAt(0)) >>> 0, 0);
	for (let attempt = 0; attempt < 5; attempt++) {
		const page = ((baseHash + attempt * 7) % 8) + 1;
		if (triedPages.has(page)) continue;
		triedPages.add(page);

		const params = new URLSearchParams({
			q: query,
			page_size: '20',
			page: String(page),
			aspect_ratio: 'wide',
			license: 'cc0,pdm,by,by-sa',
		});

		const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
			headers: { 'User-Agent': 'qinqi-wiki/1.0 (https://qinqi.wiki; cover batch)' },
		});
		if (!res.ok) continue;

		const data = await res.json();
		const candidates = (data.results || [])
			.filter((r) => !r.mature && r.url && (r.width ?? 0) >= 640)
			.sort((a, b) => (b.width ?? 0) - (a.width ?? 0));

		if (candidates.length > 0) {
			const pick = candidates[attempt % candidates.length];
			return { url: pick.url, title: pick.title, source: 'openverse' };
		}
	}
	return null;
}

export async function searchPexels(query, apiKey) {
	if (!apiKey) return null;
	const res = await fetch(
		`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
		{ headers: { Authorization: apiKey } },
	);
	if (!res.ok) return null;
	const data = await res.json();
	const photo = data.photos?.[0];
	if (!photo?.src) return null;
	return {
		url: photo.src.large2x || photo.src.large || photo.src.original,
		title: photo.alt || query,
		source: 'pexels',
	};
}

export async function findCoverUrl(query, slug, pexelsKey) {
	const pexels = await searchPexels(query, pexelsKey);
	if (pexels) return pexels;

	let result = await searchOpenverse(query, slug);
	if (result) return result;

	result = await searchOpenverse(fallbackQuery(slug), slug);
	return result;
}

function isImageBuffer(buffer) {
	if (buffer.length < 12) return false;
	// PNG
	if (buffer[0] === 0x89 && buffer[1] === 0x50) return true;
	// JPEG
	if (buffer[0] === 0xff && buffer[1] === 0xd8) return true;
	// WEBP
	if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
	return false;
}

export async function downloadImage(url) {
	const res = await fetch(url, {
		headers: { 'User-Agent': 'qinqi-wiki-cover-fetch/1.0' },
		redirect: 'follow',
	});
	if (!res.ok) throw new Error(`下载失败 ${res.status}`);
	const type = res.headers.get('content-type') || '';
	const buffer = Buffer.from(await res.arrayBuffer());
	if (buffer.length < 512) throw new Error('图片过小');
	if (type.startsWith('image/') || isImageBuffer(buffer)) return buffer;
	throw new Error(`非图片 (${type})`);
}

export async function saveArticleCover(slug, buffer) {
	await mkdir(COVERS_DIR, { recursive: true });
	const outPath = path.join(COVERS_DIR, `${slug}.webp`);
	await sharp(buffer)
		.resize(COVER_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'centre' })
		.webp({ quality: 82 })
		.toFile(outPath);
	return `/images/articles/${slug}.webp`;
}

/** Kwai-Kolors/Kolors 硅基流动配额（按账户） */
export const IMAGE_IPM = 2;
export const IMAGE_IPD = 400;
/** IPM=2 → 至少 30s/张，留 2s 余量 */
export const IMAGE_MIN_DELAY_MS = Number(process.env.ARTICLE_IMAGE_DELAY) || 32_000;

export function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(err) {
	const msg = String(err?.message || err);
	return msg.includes('429') || msg.includes('50604') || msg.includes('rate limiting');
}

/** 429/503 时指数退避重试 */
export async function withRateLimitRetry(fn, { maxRetries = 6, label = '请求', minWaitMs = 20_000 } = {}) {
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			const retryable = isRateLimitError(err) || String(err.message).includes('503');
			if (!retryable || attempt === maxRetries) throw err;
			const wait = Math.min(120_000, Math.max(minWaitMs, 20_000 * (attempt + 1)));
			console.log(`  ⏳ ${label} 限流，${wait / 1000}s 后重试 (${attempt + 1}/${maxRetries})…`);
			await sleep(wait);
		}
	}
}

const DEFAULT_IMAGE_MODEL = 'Kwai-Kolors/Kolors';
/** 每条提示词末尾追加，强化写实中国风 */
export const COVER_STYLE_SUFFIX =
	'，写实摄影风格，真实中国人物面孔与服饰，自然光，生活场景，高清细节，无文字无水印';
export const DEFAULT_NEGATIVE_PROMPT =
	'抽象, 插画, 卡通, 动漫, 水墨, 油画, 3D渲染, 概念艺术, 符号化, 剪影, 几何, 龙, 神话生物, ' +
	'文字, 水印, logo, 签名, 模糊, 畸形, 低质量, 变形, ' +
	'abstract, illustration, cartoon, anime, painting, 3d render, concept art, silhouette, text, watermark, blurry, deformed';

/** @param {Record<string, string | undefined>} [args] */
export function resolveImageConfig(args = {}) {
	const apiKey =
		args.apiKey?.trim() ||
		process.env.ARTICLE_AI_API_KEY?.trim() ||
		process.env.DEEPSEEK_API_KEY?.trim();
	const baseUrl =
		args.apiUrl?.trim() ||
		process.env.ARTICLE_AI_BASE_URL?.trim() ||
		process.env.ARTICLE_AI_API_URL?.trim() ||
		'https://api.siliconflow.cn/v1';
	const model =
		args.imageModel?.trim() ||
		process.env.ARTICLE_IMAGE_MODEL?.trim() ||
		DEFAULT_IMAGE_MODEL;

	if (!apiKey) throw new Error('未设置 API Key（ARTICLE_AI_API_KEY）');

	return { apiKey, baseUrl: baseUrl.replace(/\/+$/, ''), model };
}

/**
 * 硅基流动 Kolors 文生图，返回图片 Buffer（生成 URL 仅 1 小时有效，需立即下载）
 * @see https://docs.siliconflow.cn/cn/api-reference/images/images-generations
 */
async function generateCoverImageOnce(prompt, opts = {}) {
	const { apiKey, baseUrl, model } = resolveImageConfig(opts);
	const url = `${baseUrl}/images/generations`;

	const body = {
		model,
		prompt: prompt.trim(),
		image_size: opts.imageSize || '1024x1024',
		batch_size: 1,
		num_inference_steps: opts.steps ?? 20,
		guidance_scale: opts.guidanceScale ?? 7.5,
		negative_prompt: opts.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
	};

	if (opts.seed != null) body.seed = opts.seed;

	const res = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`生图 API ${res.status}: ${errText}`);
	}

	const data = await res.json();
	const imageUrl = data.images?.[0]?.url;
	if (!imageUrl) throw new Error('生图返回为空');

	return downloadImage(imageUrl);
}

export async function generateCoverImage(prompt, opts = {}) {
	return withRateLimitRetry(() => generateCoverImageOnce(prompt, opts), {
		maxRetries: opts.maxRetries ?? 6,
		label: '生图',
		minWaitMs: 35_000,
	});
}

export function seedFromSlug(slug) {
	return [...slug].reduce((h, c) => (h + c.charCodeAt(0)) >>> 0, 0) % 9999999999;
}
