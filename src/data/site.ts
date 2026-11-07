export const SITE = {
  url: 'https://qinqi.wiki',
  name: '亲戚百科',
  appName: '亲戚称呼计算器',
  tagline: '一句关系链，算出该怎么叫',
  description:
    '中国亲戚关系在线计算器：输入「爸爸的妈妈的兄弟」或「七舅姥爷」，本地即时算出正确称呼；支持通用、北方、广东三种叫法，并附亲戚常识与称呼速查。',
  lib: 'https://github.com/mumuy/relationship',
  libVersion: '1.2.9',
  github: 'https://github.com/lizundao/qinqi',
  ogImage: '/og.png',
  wxacode: '/images/wxacode.jpg',
  logo: '/images/logo.svg',
} as const;

export const NAV = [
  { label: '称呼计算器', href: '/calc/' },
  { label: '称呼速查', href: '/cheatsheet/' },
  { label: '亲戚常识', href: '/articles/' },
  { label: '关于', href: '/about/' },
] as const;

/** 计算器支持的 10 个单字原语，与微信小程序完全一致 */
export const CHAIN_KEYS = [
  { v: '父', hint: '爸爸' },
  { v: '母', hint: '妈妈' },
  { v: '兄', hint: '哥哥' },
  { v: '姐', hint: '姐姐' },
  { v: '夫', hint: '老公' },
  { v: '妻', hint: '老婆' },
  { v: '弟', hint: '弟弟' },
  { v: '妹', hint: '妹妹' },
  { v: '子', hint: '儿子' },
  { v: '女', hint: '女儿' },
] as const;

export const CHAIN_EXAMPLES = [
  { chain: '父的父', label: '爷爷' },
  { chain: '母的母', label: '外婆' },
  { chain: '父的弟', label: '叔叔' },
  { chain: '妻的母', label: '岳母' },
  { chain: '姐的夫', label: '姐夫' },
  { chain: '母的母的兄', label: '舅外公' },
] as const;
