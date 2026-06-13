#!/usr/bin/env node
/**
 * 批量为文章 AI 生图封面（硅基流动 Kwai-Kolors/Kolors）
 *
 * 用法:
 *   npm run article:covers:batch
 *   npm run article:covers:batch -- --limit 5 --dry-run
 *   npm run article:covers:batch -- --force
 *   npm run article:covers:batch -- --resume          # 续跑失败/未完成的
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	ARTICLES_DIR,
	ROOT,
	loadEnvFile,
	resolveAiConfig,
	callChatApi,
	extractJson,
} from './article-ai-lib.mjs';
import {
	getFrontmatterValue,
	getSlugFromFile,
	listArticleMdxFiles,
	parseTagsFromFrontmatter,
	readArticleFile,
	removeFrontmatterKey,
	setFrontmatterValue,
	writeArticleFile,
} from './lib/article-frontmatter.mjs';
import {
	coverFileExists,
	COVER_STYLE_SUFFIX,
	generateCoverImage,
	IMAGE_IPD,
	IMAGE_IPM,
	resolveImageConfig,
	saveArticleCover,
	seedFromSlug,
	sleep,
	withRateLimitRetry,
} from './lib/cover-image.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_CACHE = path.join(ROOT, '.cache/cover-prompts.json');
const DAILY_CACHE = path.join(ROOT, '.cache/cover-gen-daily.json');
const BATCH_SIZE = 8;
/** Kolors IPM=2 → 默认 32s/张 */
const DEFAULT_DELAY = Number(process.env.ARTICLE_IMAGE_DELAY) || 32_000;

function parseArgs(argv) {
	const args = {
		limit: 0,
		delay: DEFAULT_DELAY,
		dryRun: false,
		force: false,
		skipAi: false,
		resume: false,
	};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--limit' && argv[i + 1]) args.limit = Number(argv[++i]);
		else if (a === '--delay' && argv[i + 1]) args.delay = Number(argv[++i]);
		else if (a === '--dry-run') args.dryRun = true;
		else if (a === '--force') args.force = true;
		else if (a === '--skip-ai') args.skipAi = true;
		else if (a === '--resume') args.resume = true;
		else if (a === '--help' || a === '-h') args.help = true;
	}
	if (args.resume) args.force = false;
	args.delay = enforceDelay(args.delay);
	return args;
}

function printHelp() {
	console.log(`
用法: npm run article:covers:batch [--limit N] [--dry-run] [--force] [--resume] [--delay ms]

为文章批量 AI 生图封面（硅基流动 Kwai-Kolors/Kolors + DeepSeek 写提示词）。

环境变量:
  ARTICLE_AI_API_KEY       必填
  ARTICLE_AI_BASE_URL      默认 https://api.siliconflow.cn/v1
  ARTICLE_IMAGE_MODEL      默认 Kwai-Kolors/Kolors
  ARTICLE_IMAGE_DELAY      篇间间隔 ms，默认 32000（Kolors IPM=2，约 2 张/分钟）

Kolors 配额：IPM 最高 2，IPD 最高 400。81 篇约需 41 分钟，单日可跑完。

选项:
  --limit <n>    只处理前 n 篇
  --dry-run      只生成提示词，不生图
  --force        覆盖已有封面（清除提示词缓存）
  --resume       只补未完成
  --skip-ai      用标题作简易提示词（测试用）
  --delay <ms>   篇间间隔，默认 ${DEFAULT_DELAY}（勿低于 30000）

429 限流时脚本会自动等待重试。中断后执行:
  npm run article:covers:batch -- --resume
`);
}

async function loadPromptCache() {
	try {
		const raw = await readFile(PROMPT_CACHE, 'utf8');
		const data = JSON.parse(raw);
		return new Map(Object.entries(data.prompts || {}));
	} catch {
		return new Map();
	}
}

async function savePromptCache(promptMap) {
	await mkdir(path.dirname(PROMPT_CACHE), { recursive: true });
	await writeFile(
		PROMPT_CACHE,
		JSON.stringify(
			{ updatedAt: new Date().toISOString(), prompts: Object.fromEntries(promptMap) },
			null,
			2,
		) + '\n',
		'utf8',
	);
}

function todayKey() {
	return new Date().toISOString().slice(0, 10);
}

async function loadDailyCount() {
	try {
		const data = JSON.parse(await readFile(DAILY_CACHE, 'utf8'));
		if (data.date === todayKey()) return data.count || 0;
	} catch {
		/* empty */
	}
	return 0;
}

async function incrementDailyCount() {
	await mkdir(path.dirname(DAILY_CACHE), { recursive: true });
	const count = (await loadDailyCount()) + 1;
	await writeFile(DAILY_CACHE, JSON.stringify({ date: todayKey(), count }, null, 2) + '\n', 'utf8');
	return count;
}

function enforceDelay(delay) {
	if (delay < 30_000) {
		console.warn(`⚠ 间隔 ${delay}ms 低于 Kolors IPM=2 要求，已调整为 32000ms`);
		return 32_000;
	}
	return delay;
}

async function listArticlesNeedingCover(force) {
	const files = await listArticleMdxFiles(ARTICLES_DIR);
	const articles = [];

	for (const filePath of files) {
		const slug = getSlugFromFile(filePath);
		const { frontmatter, body } = await readArticleFile(filePath);
		const cover = getFrontmatterValue(frontmatter, 'cover');

		if (!force && cover && (await coverFileExists(slug))) continue;

		articles.push({
			filePath,
			slug,
			frontmatter,
			body,
			title: getFrontmatterValue(frontmatter, 'title'),
			description: getFrontmatterValue(frontmatter, 'description'),
			tags: parseTagsFromFrontmatter(frontmatter),
		});
	}

	return articles;
}

async function generatePromptsBatch(articles, ai) {
	const payload = articles.map((a) => ({
		slug: a.slug,
		title: a.title,
		description: a.description.slice(0, 100),
		tags: a.tags.slice(0, 4),
	}));

	const raw = await withRateLimitRetry(
		() =>
			callChatApi(
				ai,
				[
					{
						role: 'system',
						content: `你是「亲戚百科」配图编辑。为每篇中文家庭/亲戚文化文章写一条**中文文生图提示词**，供 Kwai-Kolors 模型生成封面。

## 风格（必须严格遵守）

- **写实摄影**：像真实照片，有真实的中国/东亚人物（老人、父母、兄弟姐妹、孩子）
- **中国元素**：中式家居、年夜饭、红包、走亲戚、四合院、现代中国客厅、春节装饰等
- **生活场景**：过年团聚、陪父母、兄弟姐妹聊天、走亲戚送礼等日常画面
- 成语典故：画**真人演绎**的历史/生活场景，不要画抽象符号或神话生物

## 禁止

- 抽象、概念艺术、符号化、几何图形
- 插画、卡通、动漫、水墨、油画、3D渲染
- 龙、神仙、妖怪等神话形象（除非文章明确讲神话且需真人扮相）
- 无人物的空镜（每篇至少 1～3 个真实人物）
- 文字、字幕、水印、logo

## 格式

- prompt：50～130 字，写清人物关系、动作、场景、光线
- 每篇 prompt 必须不同
- 结尾不要写「写实摄影」等（系统会自动追加）

只输出 JSON：
{ "prompts": [{ "slug": "xxx", "prompt": "中文画面描述…" }] }`,
					},
					{ role: 'user', content: JSON.stringify(payload, null, 2) },
				],
				{ temperature: 0.8 },
			),
		{ label: '提示词', maxRetries: 4 },
	);

	const parsed = extractJson(raw);
	const map = new Map();
	for (const item of parsed.prompts || []) {
		if (item?.slug && item?.prompt) map.set(item.slug, String(item.prompt).trim());
	}
	return map;
}

function fallbackPrompt(article) {
	return `中国现代家庭客厅，${article.tags[0] || '亲人'}围坐交谈，真实人物摄影，自然光，温馨日常`;
}

function buildImagePrompt(prompt) {
	const base = prompt.trim();
	if (base.includes('写实摄影')) return base;
	return `${base}${COVER_STYLE_SUFFIX}`;
}

async function assignCover(article, prompt, opts) {
	const { dryRun, imageConfig } = opts;
	const { slug, filePath, frontmatter, body } = article;

	console.log(`→ ${slug}`);
	console.log(`  提示词：${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}`);

	if (dryRun) {
		console.log('  [dry-run] 跳过生图');
		return { slug, status: 'ok', dryRun: true };
	}

	const daily = await loadDailyCount();
	if (daily >= IMAGE_IPD) {
		throw new Error(`已达今日 IPD 上限 ${IMAGE_IPD}，请明天再跑 --resume`);
	}

	const buffer = await generateCoverImage(buildImagePrompt(prompt), {
		...imageConfig,
		seed: seedFromSlug(slug),
	});
	const publicPath = await saveArticleCover(slug, buffer);

	let nextFrontmatter = setFrontmatterValue(frontmatter, 'cover', publicPath);
	nextFrontmatter = removeFrontmatterKey(nextFrontmatter, 'coverUrl');
	await writeArticleFile(filePath, nextFrontmatter, body);

	const todayCount = await incrementDailyCount();
	console.log(`  ✓ ${publicPath}（今日 ${todayCount}/${IMAGE_IPD}）`);
	return { slug, status: 'ok', cover: publicPath };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}

	await loadEnvFile();
	const imageConfig = resolveImageConfig({});

	if (args.force) {
		try {
			const { unlink } = await import('node:fs/promises');
			await unlink(PROMPT_CACHE);
			console.log('已清除提示词缓存（--force）\n');
		} catch {
			/* no cache */
		}
	}

	let articles = await listArticlesNeedingCover(args.force);
	if (args.limit > 0) articles = articles.slice(0, args.limit);

	const dailyUsed = await loadDailyCount();
	const dailyLeft = IMAGE_IPD - dailyUsed;
	if (!args.dryRun && dailyLeft <= 0) {
		console.log(`今日生图已达 IPD 上限 ${IMAGE_IPD}，请明天再执行 --resume`);
		process.exit(1);
	}
	if (!args.dryRun && articles.length > dailyLeft) {
		console.log(`⚠ 今日剩余配额 ${dailyLeft} 张，仅处理前 ${dailyLeft} 篇（IPD=${IMAGE_IPD}）`);
		articles = articles.slice(0, dailyLeft);
	}

	if (articles.length === 0) {
		console.log('没有需要配图的文章（已全部完成）');
		return;
	}

	console.log(`待配图：${articles.length} 篇`);
	console.log(`生图模型：${imageConfig.model}`);
	console.log(`配额：IPM=${IMAGE_IPM}，今日已用 ${dailyUsed}/${IMAGE_IPD}`);
	console.log(`篇间间隔：${args.delay}ms（约 ${(60_000 / args.delay).toFixed(1)} 张/分钟）`);
	console.log(`预计耗时：约 ${Math.ceil((articles.length * args.delay) / 60_000)} 分钟\n`);

	const promptMap = await loadPromptCache();
	const needPrompts = articles.filter((a) => !promptMap.has(a.slug));

	if (!args.skipAi && needPrompts.length > 0) {
		const ai = resolveAiConfig({});
		console.log(`需生成提示词：${needPrompts.length} 篇（缓存已有 ${promptMap.size} 条）`);
		for (let i = 0; i < needPrompts.length; i += BATCH_SIZE) {
			const batch = needPrompts.slice(i, i + BATCH_SIZE);
			console.log(`\n[AI 提示词 ${i + 1}-${i + batch.length} / ${needPrompts.length}]`);
			const batchPrompts = await generatePromptsBatch(batch, ai);
			for (const [slug, prompt] of batchPrompts) promptMap.set(slug, prompt);
			await savePromptCache(promptMap);
			if (i + BATCH_SIZE < needPrompts.length) await sleep(3000);
		}
	}

	let ok = 0;
	let failed = 0;

	for (let i = 0; i < articles.length; i++) {
		const article = articles[i];
		const prompt = promptMap.get(article.slug) || fallbackPrompt(article);

		try {
			await assignCover(article, prompt, { ...args, imageConfig });
			ok++;
		} catch (err) {
			failed++;
			console.error(`  ✗ ${article.slug}: ${err.message}`);
		}

		if (i < articles.length - 1 && args.delay > 0) await sleep(args.delay);
	}

	console.log(`\n完成：${ok} 篇成功，${failed} 篇失败`);
	if (failed > 0) {
		console.log('可稍后执行: npm run article:covers:batch -- --resume');
		process.exitCode = 1;
	}
}

main().catch((err) => {
	console.error('✗', err.message || err);
	process.exit(1);
});
