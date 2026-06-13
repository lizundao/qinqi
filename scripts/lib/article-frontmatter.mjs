import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export function parseMdxFile(content) {
	const match = content.match(FRONTMATTER_RE);
	if (!match) throw new Error('无效的 MDX frontmatter');
	return { frontmatter: match[1], body: match[2] };
}

export function getFrontmatterValue(frontmatter, key) {
	const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
	const m = frontmatter.match(re);
	if (!m) return '';
	let val = m[1].trim();
	if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
	if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
	return val;
}

export function setFrontmatterValue(frontmatter, key, value) {
	const line = `${key}: ${JSON.stringify(String(value))}`;
	const re = new RegExp(`^${key}:.*$`, 'm');
	if (re.test(frontmatter)) return frontmatter.replace(re, line);
	return `${frontmatter.trimEnd()}\n${line}\n`;
}

export function removeFrontmatterKey(frontmatter, key) {
	return frontmatter
		.split('\n')
		.filter((line) => !new RegExp(`^${key}:`).test(line))
		.join('\n');
}

export async function listArticleMdxFiles(articlesDir) {
	const files = await readdir(articlesDir);
	return files.filter((f) => /\.mdx?$/.test(f)).map((f) => path.join(articlesDir, f));
}

export async function readArticleFile(filePath) {
	const content = await readFile(filePath, 'utf8');
	const { frontmatter, body } = parseMdxFile(content);
	return { content, frontmatter, body };
}

export async function writeArticleFile(filePath, frontmatter, body) {
	await writeFile(filePath, `---\n${frontmatter.trim()}\n---\n\n${body}`, 'utf8');
}

export function getSlugFromFile(filePath) {
	return path.basename(filePath).replace(/\.mdx?$/, '');
}

export function parseTagsFromFrontmatter(frontmatter) {
	const m = frontmatter.match(/^tags:\s*\[(.*)\]$/m);
	if (!m) return [];
	try {
		return JSON.parse(`[${m[1]}]`);
	} catch {
		return m[1]
			.split(',')
			.map((t) => t.trim().replace(/^["']|["']$/g, ''))
			.filter(Boolean);
	}
}
