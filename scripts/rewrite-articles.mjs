/**
 * 重写文章库为「亲戚称呼百科」词条。
 * - 已有文章保留 slug / URL 与原发布日期，只替换标题、摘要、正文与标签
 * - 新增词条自动创建文件，日期用当天
 * - 称呼对照表由 relationship.js v1.2.9 实际计算，不手写
 * - 单一数据源：scripts/lexicon/*.mjs（按分片顺序拼接）
 * 用法：npm run content:rewrite
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import relationship from 'relationship.js';
import { ENTRIES as E1 } from './lexicon/part-1.mjs';
import { ENTRIES as E2 } from './lexicon/part-2.mjs';
import { ENTRIES as E3 } from './lexicon/part-3.mjs';
import { ENTRIES as E4 } from './lexicon/part-4.mjs';
import { ENTRIES as E5 } from './lexicon/part-5.mjs';
import { ENTRIES as E6 } from './lexicon/part-6.mjs';
import { ENTRIES as E7 } from './lexicon/part-7.mjs';
import { ENTRIES as E8 } from './lexicon/part-8.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIR = path.join(ROOT, 'src/content/docs/articles');
const ENTRIES = [...E1, ...E2, ...E3, ...E4, ...E5, ...E6, ...E7, ...E8];

/** 栏目中文名（同时作为受控标签，保证自动归类稳定） */
export const TOPIC_LABEL = {
  chengwei: '称呼辨析',
  xiongdi: '兄弟姐妹',
  suyu: '俗语典故',
  zongzu: '宗族与家族',
  yinqin: '姻亲与夫妻',
  fumu: '父母与子女',
  renqing: '人情与交情',
  jiachang: '家常与相处',
};

/** 每个栏目用于生成「称呼对照表」的关系链池（全部实算） */
const CHAIN_POOL = {
  chengwei: ['父的兄', '父的弟', '父的姐', '母的兄', '母的姐', '兄的子', '姐的子', '父的父', '母的母'],
  xiongdi: ['兄的子', '弟的子', '兄的妻', '姐的夫', '兄的女', '姐的子', '兄', '弟'],
  suyu: ['父的父', '母的母', '父的弟', '母的兄', '妻的母', '夫的母', '父的姐'],
  zongzu: ['父的父的兄', '父的兄的子', '父的父的父', '子的子', '父的弟', '父的父'],
  yinqin: ['妻的母', '夫的母', '女的夫', '子的妻', '姐的夫', '妻的兄', '妻', '夫'],
  fumu: ['父的父', '母的母', '子的子', '女的子', '父的母', '母的父'],
  renqing: ['母的兄', '父的姐', '兄的子', '姐的子', '父的弟', '母的姐'],
  jiachang: ['父的父', '母的母', '兄的子', '姐的夫', '妻的母', '子的子'],
};

const WORD = {
  父: '爸爸', 母: '妈妈', 兄: '哥哥', 姐: '姐姐', 夫: '老公', 妻: '老婆',
  弟: '弟弟', 妹: '妹妹', 子: '儿子', 女: '女儿',
};

function readable(chain) {
  return chain.split('的').map((x) => WORD[x] || x).join('的');
}

function calc(chain) {
  try {
    const out = relationship({ text: chain, sex: -1, reverse: false, type: 'default', mode: 'default' });
    const list = (Array.isArray(out) ? out : [out]).filter((x) => typeof x === 'string' && x.trim());
    return list.length ? list.join(' / ') : '—';
  } catch {
    return '—';
  }
}

function getDate(slug) {
  try {
    const raw = readFileSync(path.join(DIR, `${slug}.mdx`), 'utf8');
    const m = raw.match(/^date:\s*([\d-]+)/m);
    if (m) return m[1];
  } catch {
    /* 新文件用今天 */
  }
  return '2026-11-10';
}

function relatedFor(entry, index) {
  const same = ENTRIES.filter((x) => x.t === entry.t && x.s !== entry.s);
  const pool = same.length >= 2 ? same : ENTRIES.filter((x) => x.s !== entry.s);
  const first = pool[index % pool.length];
  const second = pool[(index + Math.floor(pool.length / 2)) % pool.length];
  return second.s === first.s ? [first, pool[(index + 1) % pool.length]] : [first, second];
}

function render(entry, index) {
  const topicLabel = TOPIC_LABEL[entry.t];
  const tags = [...new Set([topicLabel, ...entry.k])];
  const date = getDate(entry.s);
  const pool = CHAIN_POOL[entry.t] || CHAIN_POOL.chengwei;
  // 词条可用 cc 自定义对照表关系链；未填则按栏目链池补两条
  const chains = entry.cc?.length
    ? entry.cc
    : [entry.c, ...pool.filter((x) => x !== entry.c).slice(0, 2)];
  const rows = chains.map((chain) => ({ chain, label: readable(chain), answer: calc(chain) }));
  const related = relatedFor(entry, index);
  const calcLink = `/calc/?chain=${encodeURIComponent(entry.c)}`;

  const description = `${entry.a} 附「${entry.h}」的关系链与称呼对照表。`;
  const body = `
${entry.q}${entry.d ? ` ${entry.d}` : ''}本文按「关系链 → 称呼」的方式拆开来讲，不谈感情，只讲怎么算、怎么叫。

## 一句话结论

> ${entry.a}

## 关系链怎么拆

这条关系的主链是 **${entry.c}**，也就是「${readable(entry.c)}」。在计算器里打开：[${entry.c}](${calcLink})。

| 关系链 | 换成日常说法 | 通常叫 |
| :--- | :--- | :--- |
${rows.map((r) => `| \`${r.chain}\` | ${r.label} | ${r.answer} |`).join('\n')}

上表的称呼由 [relationship.js](https://github.com/mumuy/relationship) v1.2.9 实际计算得出，采用通用叫法；北方、广东等地区叫法可能不同，可在[计算器](/calc/)里切换对照。

## 三个要点

${entry.b.map((x, i) => `${i + 1}. ${x}`).join('\n')}

## 两个常见误解

${entry.m.map((x) => `- **${x.split('：')[0]}**：${x.split('：').slice(1).join('：')}`).join('\n')}

## 相关词条

${related.map((x) => `- [${x.h}](/articles/${x.s}/)`).join('\n')}

## 口径说明

亲戚称呼有明确的辈分与父系 / 母系规则，但各地习惯差异很大。本文给的是通用口径，实际称呼以自家习惯为准；需要算更长的链，用[亲戚关系计算器](/calc/)或查[常见称呼速查表](/cheatsheet/)。
`.trim();

  const frontmatter = `---
title: ${JSON.stringify(entry.h)}
description: ${JSON.stringify(description)}
date: ${date}
tags: ${JSON.stringify(tags)}
draft: false
cover: ${JSON.stringify(`/images/articles/${entry.s}.webp`)}
---
`;

  return `${frontmatter}\n${body}\n`;
}

const bySlug = new Map(ENTRIES.map((e) => [e.s, e]));
const files = readdirSync(DIR).filter((f) => f.endsWith('.mdx'));
const missing = files.filter((f) => !bySlug.has(f.replace(/\.mdx$/, '')));
if (missing.length) {
  throw new Error(`这些文章缺少词条数据：${missing.join(', ')}`);
}

let count = 0;
ENTRIES.forEach((entry, index) => {
  const file = path.join(DIR, `${entry.s}.mdx`);
  writeFileSync(file, render(entry, index), 'utf8');
  count += 1;
});
console.log(`已重写 ${count} 篇文章 → src/content/docs/articles/`);
console.log(`栏目分布：${Object.entries(ENTRIES.reduce((acc, e) => ({ ...acc, [e.t]: (acc[e.t] || 0) + 1 }), {})).map(([k, v]) => `${TOPIC_LABEL[k]} ${v}`).join('、')}`);
