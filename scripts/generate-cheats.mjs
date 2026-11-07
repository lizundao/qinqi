/**
 * 生成「常见称呼速查」数据。
 * 答案由 relationship.js v1.2.9 实际计算得出，不手写，避免口径错误。
 * 用法：npm run data:cheats
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import relationship from 'relationship.js';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const CASES = [
  ['爸爸的爸爸', '父的父', '父系'],
  ['爸爸的妈妈', '父的母', '父系'],
  ['爸爸的哥哥', '父的兄', '父系'],
  ['爸爸的弟弟', '父的弟', '父系'],
  ['爸爸的姐姐', '父的姐', '父系'],
  ['爸爸的妹妹', '父的妹', '父系'],
  ['爸爸的爸爸的哥哥', '父的父的兄', '祖辈'],
  ['爸爸的爸爸的弟弟', '父的父的弟', '祖辈'],
  ['妈妈的爸爸', '母的父', '母系'],
  ['妈妈的妈妈', '母的母', '母系'],
  ['妈妈的哥哥', '母的兄', '母系'],
  ['妈妈的弟弟', '母的弟', '母系'],
  ['妈妈的姐姐', '母的姐', '母系'],
  ['妈妈的妈妈的兄弟', '母的母的兄', '祖辈'],
  ['哥哥的儿子', '兄的子', '晚辈'],
  ['姐姐的儿子', '姐的子', '晚辈'],
  ['儿子的儿子', '子的子', '晚辈'],
  ['女儿的儿子', '女的子', '晚辈'],
  ['女儿的老公', '女的夫', '姻亲'],
  ['儿子的老婆', '子的妻', '姻亲'],
  ['姐姐的老公', '姐的夫', '姻亲'],
  ['老婆的妈妈', '妻的母', '姻亲'],
  ['老公的妈妈', '夫的母', '姻亲'],
];

const rows = CASES.map(([q, chain, group]) => {
  let list = [];
  try {
    const out = relationship({ text: chain, sex: -1, reverse: false, type: 'default', mode: 'default' });
    list = (Array.isArray(out) ? out : [out]).filter((x) => typeof x === 'string' && x.trim());
  } catch {
    list = [];
  }
  return { q, chain, group, answer: list[0] || '', alt: list.slice(1) };
});

const empty = rows.filter((r) => !r.answer);
if (empty.length) {
  throw new Error(`以下关系链没有算出结果：${empty.map((r) => r.chain).join(', ')}`);
}

const q = (s) => JSON.stringify(s);
const body = `// 此文件由 scripts/generate-cheats.mjs 自动生成，请勿手改。
// 答案来自 relationship.js v1.2.9 实际计算：npm run data:cheats
export interface Cheat {
  q: string;
  chain: string;
  group: string;
  answer: string;
  alt: string[];
}

export const CHEATS: Cheat[] = [
${rows
  .map(
    (r) =>
      `  { q: ${q(r.q)}, chain: ${q(r.chain)}, group: ${q(r.group)}, answer: ${q(r.answer)}, alt: [${r.alt
        .map(q)
        .join(', ')}] },`
  )
  .join('\n')}
];

export const CHEAT_GROUPS = ['全部', '父系', '母系', '祖辈', '晚辈', '姻亲'];
`;

writeFileSync(path.join(ROOT, 'src/data/cheats.ts'), body, 'utf8');
console.log(`已生成 ${rows.length} 条速查数据 → src/data/cheats.ts`);
