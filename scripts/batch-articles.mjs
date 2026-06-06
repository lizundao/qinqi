#!/usr/bin/env node
/**
 * 批量生成文章：先用 AI 生成选题，再循环写稿
 *
 * 用法:
 *   npm run article:batch -- "姐妹之情"
 *   npm run article:batch -- --theme "过年走亲戚" --count 10
 *   npm run article:batch -- --topics-only "兄弟之情"
 *   npm run article:batch -- --topics-file .cache/topics.json
 */
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	ROOT,
	loadEnvFile,
	resolveAiConfig,
	resolveChatCompletionsUrl,
	generateTopics,
	getExistingArticleTitles,
} from './article-ai-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DELAY_MS = 3000;

function parseArgs(argv) {
	const args = {
		theme: '',
		count: 10,
		topicsFile: '',
		topicsOnly: false,
		publish: true,
		delay: DEFAULT_DELAY_MS,
	};
	const positional = [];

	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if ((a === '--theme' || a === '-t') && argv[i + 1]) args.theme = argv[++i];
		else if (a === '--count' && argv[i + 1]) args.count = Number(argv[++i]);
		else if (a === '--topics-file' && argv[i + 1]) args.topicsFile = argv[++i];
		else if (a === '--topics-only') args.topicsOnly = true;
		else if (a === '--draft') args.publish = false;
		else if (a === '--publish') args.publish = true;
		else if (a === '--delay' && argv[i + 1]) args.delay = Number(argv[++i]);
		else if ((a === '--api-url' || a === '--base-url') && argv[i + 1]) args.apiUrl = argv[++i];
		else if ((a === '--api-key' || a === '--key') && argv[i + 1]) args.apiKey = argv[++i];
		else if (a === '--model' && argv[i + 1]) args.model = argv[++i];
		else if (a === '--help' || a === '-h') args.help = true;
		else if (!a.startsWith('-')) positional.push(a);
	}

	if (!args.theme && positional.length) {
		args.theme = positional.join(' ');
	}

	return args;
}

function printHelp() {
	console.log(`
用法: npm run article:batch -- "主题方向" [选项]

流程: AI 生成 N 条写作描述 → 循环调用 article:ai 写稿

选项:
  "主题方向" / --theme     必填（除非用 --topics-file）
  --count <n>              选题条数，默认 10
  --topics-only            只生成选题，不写正文
  --topics-file <json>     使用已保存的选题 JSON（跳过 AI 选题）
  --publish                draft: false（默认）
  --draft                  draft: true
  --delay <ms>             篇与篇之间间隔，默认 3000

示例:
  npm run article:batch -- "姐妹之间的亲情"
  npm run article:batch -- --theme "婆媳相处" --count 8 --topics-only
  npm run article:topics -- "婆媳相处" --out .cache/topics.json
  npm run article:batch -- --topics-file .cache/topics.json
`);
}

async function loadTopicsFromFile(filePath) {
	const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
	const raw = await readFile(abs, 'utf8');
	const data = JSON.parse(raw);
	if (!Array.isArray(data.topics)) throw new Error('topics 文件缺少 topics 数组');
	return data.topics.map((t) => (typeof t === 'string' ? t : t.description)).filter(Boolean);
}

function runOneArticle(topic, index, total, publish) {
	return new Promise((resolve, reject) => {
		console.log(`\n========== 写稿 [${index + 1}/${total}] ==========`);
		const cliArgs = ['scripts/generate-article.mjs', '--topic', topic];
		if (publish) cliArgs.push('--publish');

		const child = spawn('node', cliArgs, {
			cwd: ROOT,
			stdio: 'inherit',
			env: process.env,
		});
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`第 ${index + 1} 篇写稿失败，退出码 ${code}`));
		});
	});
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}

	if (!args.topicsFile && !args.theme?.trim()) {
		printHelp();
		process.exit(1);
	}

	if (!Number.isFinite(args.count) || args.count < 1 || args.count > 20) {
		throw new Error('--count 须在 1～20 之间');
	}

	await loadEnvFile();

	let topics;

	if (args.topicsFile) {
		console.log(`→ 从文件加载选题：${args.topicsFile}`);
		topics = await loadTopicsFromFile(args.topicsFile);
	} else {
		const ai = resolveAiConfig(args);
		const existingTitles = await getExistingArticleTitles();

		console.log(`→ AI 生成选题：${args.theme}`);
		console.log(`  模型：${ai.model}`);
		console.log(`  条数：${args.count}`);
		console.log(`  已有文章：${existingTitles.length} 篇`);
		console.log(`  ${resolveChatCompletionsUrl(ai.baseUrl)}\n`);

		topics = await generateTopics({
			theme: args.theme,
			count: args.count,
			ai,
			existingTitles,
		});

		console.log('\n--- 选题列表 ---');
		topics.forEach((desc, i) => console.log(`${i + 1}. ${desc}`));
	}

	if (topics.length === 0) throw new Error('没有可用选题');

	if (args.topicsOnly) {
		console.log(`\n✓ 已生成 ${topics.length} 条选题（--topics-only，未写稿）`);
		console.log('  可保存后批量写稿：npm run article:topics -- "主题" --out .cache/topics.json');
		return;
	}

	console.log(`\n→ 开始写稿，共 ${topics.length} 篇（draft: ${args.publish ? 'false' : 'true'}）`);

	for (let i = 0; i < topics.length; i++) {
		await runOneArticle(topics[i], i, topics.length, args.publish);
		if (i < topics.length - 1 && args.delay > 0) {
			console.log(`\n等待 ${args.delay / 1000}s 后继续…`);
			await sleep(args.delay);
		}
	}

	console.log('\n✓ 选题 + 写稿全部完成');
}

main().catch((err) => {
	console.error('\n✗', err.message || err);
	process.exit(1);
});
