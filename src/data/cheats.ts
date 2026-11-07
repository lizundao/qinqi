// 此文件由 scripts/generate-cheats.mjs 自动生成，请勿手改。
// 答案来自 relationship.js v1.2.9 实际计算：npm run data:cheats
export interface Cheat {
  q: string;
  chain: string;
  group: string;
  answer: string;
  alt: string[];
}

export const CHEATS: Cheat[] = [
  { q: "爸爸的爸爸", chain: "父的父", group: "父系", answer: "爷爷", alt: [] },
  { q: "爸爸的妈妈", chain: "父的母", group: "父系", answer: "奶奶", alt: [] },
  { q: "爸爸的哥哥", chain: "父的兄", group: "父系", answer: "伯父", alt: [] },
  { q: "爸爸的弟弟", chain: "父的弟", group: "父系", answer: "叔叔", alt: [] },
  { q: "爸爸的姐姐", chain: "父的姐", group: "父系", answer: "大姑", alt: [] },
  { q: "爸爸的妹妹", chain: "父的妹", group: "父系", answer: "小姑", alt: [] },
  { q: "爸爸的爸爸的哥哥", chain: "父的父的兄", group: "祖辈", answer: "伯公", alt: [] },
  { q: "爸爸的爸爸的弟弟", chain: "父的父的弟", group: "祖辈", answer: "叔公", alt: [] },
  { q: "妈妈的爸爸", chain: "母的父", group: "母系", answer: "外公", alt: [] },
  { q: "妈妈的妈妈", chain: "母的母", group: "母系", answer: "外婆", alt: [] },
  { q: "妈妈的哥哥", chain: "母的兄", group: "母系", answer: "大舅", alt: [] },
  { q: "妈妈的弟弟", chain: "母的弟", group: "母系", answer: "小舅", alt: [] },
  { q: "妈妈的姐姐", chain: "母的姐", group: "母系", answer: "大姨", alt: [] },
  { q: "妈妈的妈妈的兄弟", chain: "母的母的兄", group: "祖辈", answer: "舅外公", alt: [] },
  { q: "哥哥的儿子", chain: "兄的子", group: "晚辈", answer: "侄子", alt: [] },
  { q: "姐姐的儿子", chain: "姐的子", group: "晚辈", answer: "外甥", alt: [] },
  { q: "儿子的儿子", chain: "子的子", group: "晚辈", answer: "孙子", alt: [] },
  { q: "女儿的儿子", chain: "女的子", group: "晚辈", answer: "外孙", alt: [] },
  { q: "女儿的老公", chain: "女的夫", group: "姻亲", answer: "女婿", alt: [] },
  { q: "儿子的老婆", chain: "子的妻", group: "姻亲", answer: "儿媳", alt: [] },
  { q: "姐姐的老公", chain: "姐的夫", group: "姻亲", answer: "姐夫", alt: [] },
  { q: "老婆的妈妈", chain: "妻的母", group: "姻亲", answer: "岳母", alt: [] },
  { q: "老公的妈妈", chain: "夫的母", group: "姻亲", answer: "婆婆", alt: [] },
];

export const CHEAT_GROUPS = ['全部', '父系', '母系', '祖辈', '晚辈', '姻亲'];
