#!/usr/bin/env node
/**
 * 生成微信小程序用反色 logo：品牌蓝底 + 白色图标
 * 输出到 public/logo-wxmp/
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LOGO_SVG = path.join(ROOT, 'src/assets/logo.svg');
const OUT_DIR = path.join(ROOT, 'public/logo-wxmp');

/** 站点品牌色，与 logo.svg 一致 */
const BRAND_BLUE = '#2563eb';

const SIZES = [
	{ name: '144', size: 144 },
	{ name: '256', size: 256 },
	{ name: '512', size: 512 },
];

function buildWxmpSvg(originalSvg) {
	const pathMatch = originalSvg.match(/<path[^>]*d="([^"]+)"[^>]*>/);
	if (!pathMatch) throw new Error('无法在 logo.svg 中解析 path');
	const d = pathMatch[1];
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${BRAND_BLUE}"/>
  <path d="${d}" fill="#ffffff"/>
</svg>`;
}

async function main() {
	const original = await readFile(LOGO_SVG, 'utf8');
	const wxmpSvg = buildWxmpSvg(original);
	await mkdir(OUT_DIR, { recursive: true });

	const svgPath = path.join(OUT_DIR, 'logo-wxmp.svg');
	await writeFile(svgPath, wxmpSvg, 'utf8');

	for (const { name, size } of SIZES) {
		const outPath = path.join(OUT_DIR, `logo-wxmp-${name}.png`);
		await sharp(Buffer.from(wxmpSvg))
			.resize(size, size)
			.png()
			.toFile(outPath);
		console.log(`✓ ${path.relative(ROOT, outPath)} (${size}×${size})`);
	}

	// 默认文件名，方便直接上传
	const defaultPng = path.join(OUT_DIR, 'logo-wxmp.png');
	await sharp(Buffer.from(wxmpSvg)).resize(512, 512).png().toFile(defaultPng);
	console.log(`✓ ${path.relative(ROOT, defaultPng)} (512×512，主文件)`);
	console.log(`\n背景色 ${BRAND_BLUE}，图标白色。微信小程序图标建议用 144 或 512 版本。`);
}

main().catch((err) => {
	console.error('✗', err.message || err);
	process.exit(1);
});
