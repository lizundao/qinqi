#!/usr/bin/env node
/**
 * 批量生成文章，默认直接发布（draft: false）
 * 用法: node scripts/batch-articles.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** 多生孩子、壮大家族（口语唠嗑，温馨正能量，勿教育口吻） */
const TOPICS = [
	'帮我写篇关于老话「多子多福」，今天鼓励生育，这话还能怎么理解。像朋友聊天，别讲课',
	'帮我写篇关于「开枝散叶、人丁兴旺」，现代人还想不想壮大家族。温馨，别批判年轻人',
	'帮我写篇关于「四世同堂、五世同堂」，现在大家族还常见吗，亲戚怎么叫。可从过年写起',
	'帮我写篇关于谚语「一个篱笆三个桩，一个好汉三个帮」，跟亲戚兄弟姐妹多有什么关系',
	'帮我写篇关于「兄弟多了是墙，少了是棒」，孩子多了手足关系怎样。口语聊，别列三点建议',
	'帮我写篇关于三孩政策、老人催生，和壮大家族是不是一回事。理解两边难处，温馨收尾',
	'帮我写篇关于「传宗接代、延续香火」，今天怎么跟女儿女婿相处。别重男轻女说教',
	'帮我写篇关于「独木不成林」，小家庭时代还需要大家族吗。像朋友聊天',
	'帮我写篇关于二胎三胎之后，堂表兄弟姐妹是不是又多了，孩子怎么认亲戚',
	'帮我写篇关于「养儿防老」和多生孩子壮大家族有没有关系。现代养老和亲情，温馨不焦虑',
];

const DELAY_MS = 3000;

function runOne(topic, index) {
	return new Promise((resolve, reject) => {
		console.log(`\n========== [${index + 1}/${TOPICS.length}] ==========`);
		const child = spawn('node', ['scripts/generate-article.mjs', '--publish', '--topic', topic], {
			cwd: ROOT,
			stdio: 'inherit',
			env: process.env,
		});
		child.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`第 ${index + 1} 篇失败，退出码 ${code}`));
		});
	});
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

async function main() {
	console.log(`将依次生成 ${TOPICS.length} 篇文章（draft: false）\n`);
	for (let i = 0; i < TOPICS.length; i++) {
		await runOne(TOPICS[i], i);
		if (i < TOPICS.length - 1) {
			console.log(`\n等待 ${DELAY_MS / 1000}s 后继续…`);
			await sleep(DELAY_MS);
		}
	}
	console.log('\n✓ 全部完成');
}

main().catch((err) => {
	console.error('\n✗', err.message || err);
	process.exit(1);
});
