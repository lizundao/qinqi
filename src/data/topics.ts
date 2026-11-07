/**
 * 内容栏目：把 97 篇文章从 245 个零散标签，收敛为 8 个可浏览、可做内链的栏目。
 * 归类依据 = 标签 + 标题 + 摘要的关键词命中（构建时自动计算，不改动文章 frontmatter）。
 */
export interface Topic {
  slug: string;
  title: string;
  short: string;
  description: string;
  keywords: string[];
}

export const TOPICS: Topic[] = [
  {
    slug: 'chengwei',
    title: '称呼辨析',
    short: '谁该怎么叫',
    description: '堂表、姑舅姨、侄甥、五服……把最容易叫错的亲戚关系一次讲清楚。',
    keywords: [
      '称呼', '称谓', '亲戚称谓', '亲戚称呼', '称呼辨析', '称呼文化', '堂表', '堂表亲', '表亲',
      '姑舅姨', '舅舅', '舅权', '舅甥', '侄', '外甥', '五服', '六亲', '三姑六婆', '亲戚谱系',
      '亲属关系', '亲戚关系', '血缘亲疏', '亲疏关系', '谱系', '三亲',
    ],
  },
  {
    slug: 'xiongdi',
    title: '兄弟姐妹',
    short: '手足之间',
    description: '长兄如父、长姐如母、兄弟如手足，聊聊同胞之间的情分与分寸。',
    keywords: [
      '兄弟', '姐妹', '手足', '兄弟姐妹', '兄弟情', '兄弟情谊', '兄弟情义', '兄弟关系', '兄弟相处',
      '兄弟感情', '兄弟吵架', '长兄如父', '长姐如母', '姐弟', '姐姐', '姐妹关系', '姐妹', '手足之情',
      '手足情', '手足关系', '兄友弟恭', '嫂', '棠棣', '同宗', '分家', '兄弟分家',
    ],
  },
  {
    slug: 'suyu',
    title: '俗语典故',
    short: '老话里的道理',
    description: '「娘亲舅大」「远亲不如近邻」这些老话，究竟从哪儿来、今天还成立吗。',
    keywords: [
      '俗语', '谚语', '俗语谚语', '谚语俗语', '民间俗语', '民间谚语', '民间说法', '谚语解读',
      '成语', '成语典故', '典故', '习俗典故', '传统故事', '神话', '三国', '诗经', '孔融',
      '血浓于水', '远亲不如近邻', '打虎亲兄弟', '六亲不认', '株连九族', '举案齐眉',
    ],
  },
  {
    slug: 'zongzu',
    title: '宗族与家族',
    short: '一家人的边界',
    description: '祠堂、族谱、香火、四世同堂：传统家族的结构，以及它在今天的变化。',
    keywords: [
      '宗族', '家族', '大家族', '宗族文化', '宗族观念', '宗族关系', '宗族互助', '家族观念',
      '家族规矩', '祠堂', '祭祖', '族谱', '修谱', '香火', '光宗耀祖', '四世同堂', '门当户对',
      '开枝散叶', '多子多福', '传宗接代', '族长', '家法', '义庄', '族田', '五服', '聚族而居',
    ],
  },
  {
    slug: 'yinqin',
    title: '姻亲与夫妻',
    short: '结亲之后',
    description: '岳母婆婆、女婿妯娌、回娘家与过年回谁家：由婚姻带来的另一套亲戚。',
    keywords: [
      '姻亲', '姻亲关系', '夫妻', '夫妻关系', '夫妻礼仪', '婚姻家庭', '婚姻', '女婿', '岳',
      '婆婆', '回娘家', '出嫁女', '嫁出去的女儿', '过年回谁家', '宗族联姻', '古代婚俗',
      '姐妹回娘家', '当妈之后', '牛郎织女', '梁山伯', '钱塘君', '柳毅',
    ],
  },
  {
    slug: 'fumu',
    title: '父母与子女',
    short: '上下两代',
    description: '养育、养老、多子女与独生子女，两代人之间最实在的牵挂。',
    keywords: [
      '父母', '父母恩情', '父母子女', '父母离世', '亲子', '养育', '孝', '养儿防老', '现代养老',
      '代际', '生育', '生育观念', '生育选择', '多子女家庭', '独生子女', '独生女', '三孩',
      '三胎', '二胎', '小家庭', '现代家庭', '家庭角色', '长子长女', '成长回忆',
    ],
  },
  {
    slug: 'renqing',
    title: '人情与交情',
    short: '亲疏之间',
    description: '借钱、帮忙、邻里、知己与结拜：亲戚之外，中国人怎么衡量关系的远近。',
    keywords: [
      '人情', '人情世故', '人情冷暖', '友情', '朋友', '知己', '知音', '交情', '结拜', '义结金兰',
      '八拜之交', '过命交情', '患难之交', '忘年交', '刎颈之交', '君子之交', '古人交友',
      '邻里', '邻里关系', '借钱', '家庭经济', '谈钱伤感情', '亲情与金钱', '有福同享',
      '帮扶', '互助', '一诺千金', '舍命全交', '管鲍之交',
    ],
  },
  {
    slug: 'jiachang',
    title: '家常与相处',
    short: '日子里的亲情',
    description: '家庭聚会、长大之后联系变少、那些说不出口但在意的日常。',
    keywords: [
      '亲情', '家庭', '家庭伦理', '家庭关系', '家庭温暖', '家庭文化', '家庭幸福', '家庭故事',
      '家庭聚会', '过年', '过年习俗', '联系变少', '长大', '回忆', '感情', '安全感', '相处',
      '分寸', '亲情维系', '亲情纽带', '传统与现代', '传统文化', '现实考验', '人生价值',
    ],
  },
];

export const DEFAULT_TOPIC = TOPICS[TOPICS.length - 1];

/** 重写后的文章把栏目中文名放在 tags[0]，据此精确归类，关键词匹配仅作兜底 */
export const TOPIC_BY_LABEL: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((topic) => [topic.title, topic])
);

/** 按关键词命中数给文章归类，标签命中权重更高 */
export function matchTopic(tags: string[] = [], title = '', description = ''): Topic {
  let best: Topic = DEFAULT_TOPIC;
  let bestScore = 0;

  for (const topic of TOPICS) {
    let score = 0;
    for (const keyword of topic.keywords) {
      if (tags.some((tag) => tag.includes(keyword) || keyword.includes(tag))) score += 3;
      if (title.includes(keyword)) score += 2;
      if (description.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  return best;
}

export function topicHref(slug: string) {
  return `/topics/${slug}/`;
}
