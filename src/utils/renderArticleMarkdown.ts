import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import type { ArticleEntry } from './articles';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

let processorPromise: ReturnType<typeof createMarkdownProcessor> | null = null;

function getProcessor() {
	if (!processorPromise) {
		processorPromise = createMarkdownProcessor({
			gfm: true,
			smartypants: true,
		});
	}
	return processorPromise;
}

function stripFrontmatter(source: string) {
	return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

async function resolveArticleFilePath(entry: ArticleEntry) {
	if (entry.filePath) return entry.filePath;

	const id = entry.id.replace(/\\/g, '/');
	const base = path.join(ROOT, 'src/content/docs', id);
	for (const ext of ['.mdx', '.md']) {
		const candidate = `${base}${ext}`;
		try {
			await access(candidate);
			return candidate;
		} catch {
			/* try next */
		}
	}

	throw new Error(`找不到文章源文件：${id}`);
}

/** 用 GFM Markdown 渲染文章正文，避免 MDX optimize 把表格压成纯文本 */
export async function renderArticleMarkdown(entry: ArticleEntry) {
	let body = entry.body?.trim();
	let filePath = entry.filePath;

	if (!body) {
		filePath = await resolveArticleFilePath(entry);
		const raw = await readFile(filePath, 'utf8');
		body = stripFrontmatter(raw);
	}

	const processor = await getProcessor();
	const { code } = await processor.render(body, { fileURL: filePath });
	return code;
}
