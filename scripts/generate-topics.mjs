#!/usr/bin/env node
/**
 * 用 AI 生成批量写作描述（选题）
 *
 * 用法:
 *   npm run article:topics -- "兄弟之情"
 *   npm run article:topics -- --theme "姐妹亲情" --count 10
 *   npm run article:topics -- "过年走亲戚" --out topics.json
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	ROOT,
	loadEnvFile,
	resolveAiConfig,
	resolveChatCompletionsUrl,
	generateTopics,
	getExistingArticleTitles,
} from './article-ai-lib.mjs';

function parseArgs(argv) {
	const args = { theme: '', count: 10, out: '' };
	const positional = [];

	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if ((a === '--theme' || a === '-t') && argv[i + 1]) args.theme = argv[++i];
		else if (a === '--count' && argv[i + 1]) args.count = Number(argv[++i]);
		else if (a === '--out' && argv[i + 1]) args.out = argv[++i];
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
用法: npm run article:topics -- "主题方向" [选项]

由 AI 生成 N 条文章写作描述（供 article:batch 或 article:ai 使用）。

选项:
  "主题方向" / --theme   必填，如「兄弟之情」「多生孩子壮大家族」
  --count <n>            条数，默认 10
  --out <file>           保存 JSON（相对项目根目录）

示例:
  npm run article:topics -- "姐妹之间的亲情"
  npm run article:topics -- --theme "婆媳相处" --count 8 --out .cache/topics.json
`);
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help || !args.theme?.trim()) {
		printHelp();
		process.exit(args.help ? 0 : 1);
	}

	if (!Number.isFinite(args.count) || args.count < 1 || args.count > 20) {
		throw new Error('--count 须在 1～20 之间');
	}

	await loadEnvFile();
	const ai = resolveAiConfig(args);
	const existingTitles = await getExistingArticleTitles();

	console.log(`→ 生成选题：${args.theme}`);
	console.log(`  模型：${ai.model}`);
	console.log(`  条数：${args.count}`);
	console.log(`  已有文章：${existingTitles.length} 篇（用于去重）`);
	console.log(`  ${resolveChatCompletionsUrl(ai.baseUrl)}\n`);

	const topics = await generateTopics({
		theme: args.theme,
		count: args.count,
		ai,
		existingTitles,
	});

	topics.forEach((desc, i) => {
		console.log(`${i + 1}. ${desc}`);
	});

	const payload = {
		theme: args.theme,
		count: topics.length,
		generatedAt: new Date().toISOString(),
		topics,
	};

	if (args.out) {
		const outPath = path.isAbsolute(args.out) ? args.out : path.join(ROOT, args.out);
		await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
		console.log(`\n✓ 已保存 ${path.relative(ROOT, outPath)}`);
	}

	console.log(`\n✓ 共 ${topics.length} 条`);
}

main().catch((err) => {
	console.error('✗', err.message || err);
	process.exit(1);
});
