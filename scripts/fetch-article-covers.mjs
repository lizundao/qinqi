#!/usr/bin/env node
/**
 * 下载文章封面图到 public/images/articles/，并写入 frontmatter cover 字段
 *
 * 用法:
 *   npm run article:cover -- --slug tang-vs-biao --url "https://example.com/photo.jpg"
 *   npm run article:covers                    # 批量处理 frontmatter 含 coverUrl 的文章
 *   npm run article:covers -- --dry-run
 */
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	getFrontmatterValue,
	getSlugFromFile,
	listArticleMdxFiles,
	readArticleFile,
	removeFrontmatterKey,
	setFrontmatterValue,
	writeArticleFile,
} from './lib/article-frontmatter.mjs';
import {
	coverFileExists,
	downloadImage,
	saveArticleCover,
} from './lib/cover-image.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'src/content/docs/articles');

function parseArgs(argv) {
	const args = { slug: '', url: '', dryRun: false, force: false, all: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--slug' && argv[i + 1]) args.slug = argv[++i];
		else if (a === '--url' && argv[i + 1]) args.url = argv[++i];
		else if (a === '--dry-run') args.dryRun = true;
		else if (a === '--force') args.force = true;
		else if (a === '--all') args.all = true;
		else if (a === '--help' || a === '-h') args.help = true;
	}
	if (!args.all && !args.slug && !args.url) args.all = true;
	return args;
}

function printHelp() {
	console.log(`
用法:
  npm run article:cover -- --slug <slug> --url <图片URL>
  npm run article:covers [--dry-run] [--force]

frontmatter 字段:
  coverUrl: "https://..."   待下载的网络图片（下载后自动改为 cover）
  cover: /images/articles/<slug>.webp   本地封面路径

单篇示例:
  npm run article:cover -- --slug tang-vs-biao --url "https://images.unsplash.com/photo-xxx"

批量:
  在 MDX 里写 coverUrl，然后 npm run article:covers
`);
}

async function saveCover(slug, buffer, dryRun) {
	if (dryRun) {
		console.log(`  [dry-run] 将写入 public/images/articles/${slug}.webp`);
		return `/images/articles/${slug}.webp`;
	}
	return saveArticleCover(slug, buffer);
}

async function processArticle(filePath, url, { dryRun, force }) {
	const slug = getSlugFromFile(filePath);
	const { frontmatter, body } = await readArticleFile(filePath);
	const coverUrl = url || getFrontmatterValue(frontmatter, 'coverUrl');
	const existingCover = getFrontmatterValue(frontmatter, 'cover');

	if (!coverUrl) {
		if (existingCover && (await coverFileExists(slug))) return { slug, status: 'skip', reason: '已有 cover' };
		return { slug, status: 'skip', reason: '无 coverUrl' };
	}

	if (existingCover && (await coverFileExists(slug)) && !force) {
		return { slug, status: 'skip', reason: '封面已存在（加 --force 覆盖）' };
	}

	console.log(`→ ${slug}`);
	console.log(`  ${coverUrl.slice(0, 90)}${coverUrl.length > 90 ? '…' : ''}`);

	const buffer = await downloadImage(coverUrl);
	const publicPath = await saveCover(slug, buffer, dryRun);

	let nextFrontmatter = setFrontmatterValue(frontmatter, 'cover', publicPath);
	nextFrontmatter = removeFrontmatterKey(nextFrontmatter, 'coverUrl');

	if (!dryRun) {
		await writeArticleFile(filePath, nextFrontmatter, body);
	}

	return { slug, status: 'ok', cover: publicPath };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		process.exit(0);
	}

	if (args.slug && args.url) {
		const filePath = path.join(ARTICLES_DIR, `${args.slug}.mdx`);
		try {
			await access(filePath, constants.F_OK);
		} catch {
			throw new Error(`找不到文章 ${args.slug}.mdx`);
		}
		const result = await processArticle(filePath, args.url, args);
		console.log(result.status === 'ok' ? `✓ ${result.cover}` : `· ${result.reason}`);
		return;
	}

	const files = await listArticleMdxFiles(ARTICLES_DIR);
	let ok = 0;
	let skipped = 0;

	for (const filePath of files) {
		try {
			const result = await processArticle(filePath, '', args);
			if (result.status === 'ok') {
				ok++;
				console.log(`  ✓ cover: ${result.cover}`);
			} else {
				skipped++;
			}
		} catch (err) {
			console.error(`  ✗ ${getSlugFromFile(filePath)}: ${err.message}`);
		}
	}

	console.log(`\n完成：${ok} 篇已下载，${skipped} 篇跳过`);
}

main().catch((err) => {
	console.error('✗', err.message || err);
	process.exit(1);
});
