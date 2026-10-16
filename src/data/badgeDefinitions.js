/**
 * badgeDefinitions.js
 * Registry for Hogwarts Audio English Learning Gamification & Achievement System.
 * Zero Unicode emojis strictly enforced.
 */

export const BADGE_CATEGORIES = {
  journey: {
    id: 'journey',
    name: '魔法征程',
    desc: '开启魔法世界的每一个里程碑',
    icon: 'Compass'
  },
  grit: {
    id: 'grit',
    name: '坚韧修行',
    desc: '每日微契约与坚持不懈的巫师毅力',
    icon: 'Flame'
  },
  skill: {
    id: 'skill',
    name: '语言造诣',
    desc: '听辨、影子跟读与词汇深度运用',
    icon: 'Wand2'
  },
  owls: {
    id: 'owls',
    name: 'O.W.L.s 优异',
    desc: '普通巫师等级大考官方认证',
    icon: 'GraduationCap'
  }
}

export const BADGE_RARITIES = {
  bronze: {
    id: 'bronze',
    name: '青铜',
    borderColor: '#d97706',
    bgColor: '#fef3c7',
    textColor: '#92400e'
  },
  silver: {
    id: 'silver',
    name: '白银',
    borderColor: '#94a3b8',
    bgColor: '#f1f5f9',
    textColor: '#334155'
  },
  gold: {
    id: 'gold',
    name: '黄金',
    borderColor: '#eab308',
    bgColor: '#fef9c3',
    textColor: '#854d0e'
  },
  legendary: {
    id: 'legendary',
    name: '传奇',
    borderColor: '#a855f7',
    bgColor: '#faf5ff',
    textColor: '#6b21a8'
  }
}

export const BADGE_DEFINITIONS = [
  {
    id: 'sorting-ceremony',
    name: '分院礼赞',
    category: 'journey',
    rarity: 'bronze',
    desc: '完成分院仪式选定学院',
    icon: 'GraduationCap',
    lore: '魔法石第 7 章：分院帽为你开启了通向霍格沃茨四大学院的大门。'
  },
  {
    id: 'first-journey',
    name: '破釜启程',
    category: 'journey',
    rarity: 'bronze',
    desc: '首次完成第 1 章精听或泛听',
    icon: 'BookOpen',
    lore: '破釜酒吧与九又四分之三站台，属于你的魔法冒险由此拉开序幕。'
  },
  {
    id: 'streak-3',
    name: '荧光闪烁',
    category: 'grit',
    rarity: 'bronze',
    desc: '连续打卡学习达到 3 天',
    icon: 'Flame',
    target: 3,
    lore: 'Lumos! 魔杖顶端点亮了第一缕恒久微光，照亮习惯的萌芽。'
  },
  {
    id: 'streak-7',
    name: '烈火熊熊',
    category: 'grit',
    rarity: 'silver',
    desc: '连续打卡学习达到 7 天',
    icon: 'Flame',
    target: 7,
    lore: 'Incendio! 坚韧的火焰持续燃烧一周，获得守护神冷冻符补充。'
  },
  {
    id: 'streak-30',
    name: '傲罗毅力',
    category: 'grit',
    rarity: 'gold',
    desc: '连续打卡学习达到 30 天',
    icon: 'Shield',
    target: 30,
    lore: '唯有意志如同凤凰涅槃般顽强的巫师，方能获得傲罗指挥部的无上勋章。'
  },
  {
    id: 'patronus-shield',
    name: '呼神护卫',
    category: 'grit',
    rarity: 'silver',
    desc: '首次使用守护神冷冻符保住连续打卡',
    icon: 'Sparkles',
    lore: 'Expecto Patronum! 银色牡鹿驱散遗忘与疲惫，捍卫了你的学习链条。'
  },
  {
    id: 'ear-master-1',
    name: '听风密语',
    category: 'skill',
    rarity: 'bronze',
    desc: '累计精听总时长达到 60 分钟',
    icon: 'Volume2',
    targetMinutes: 60,
    lore: '如倾听飞贼掠过草尖的呼啸，耳朵已经开始捕捉原版英音的细微音变。'
  },
  {
    id: 'ear-master-10',
    name: '音律通幽',
    category: 'skill',
    rarity: 'gold',
    desc: '累计精听总时长达到 600 分钟 (10h)',
    icon: 'Headphones',
    targetMinutes: 600,
    lore: '十小时纯正沉浸听辨，已能自如辨析弱读、连读与语调起伏。'
  },
  {
    id: 'shadowing-85',
    name: '纯正英音',
    category: 'skill',
    rarity: 'silver',
    desc: '影子跟读单次得分达到 85 分以上',
    icon: 'Mic',
    targetScore: 85,
    lore: '字正腔圆，发音与节奏如同斯内普教授宣读魔药配方般沉稳精准。'
  },
  {
    id: 'vocab-50',
    name: '羊皮卷轴',
    category: 'skill',
    rarity: 'bronze',
    desc: '词汇本总收录生词达到 50 词',
    icon: 'BookMarked',
    targetVocab: 50,
    lore: '羊皮纸上密密麻麻记录下魔法词汇，构筑词汇网络的第一块基石。'
  },
  {
    id: 'vocab-l4-20',
    name: '妙笔生花',
    category: 'skill',
    rarity: 'gold',
    desc: '达成 L4 产出能力的词汇达到 20 词',
    icon: 'PenTool',
    targetL4: 20,
    lore: '不仅仅能识别，更能自由拼写产出，字句如魔咒般收放自如。'
  },
  {
    id: 'dictation-ace',
    name: '绝不手抖',
    category: 'skill',
    rarity: 'silver',
    desc: '章节单词听写取得 100% 正确率',
    icon: 'Check',
    lore: '羽毛笔尖落下每个字母皆无偏差，宛如最严苛的变形术课堂满分卷面。'
  },
  {
    id: 'owls-pass',
    name: '巫师评定',
    category: 'owls',
    rarity: 'silver',
    desc: '首次完成 O.W.L.s 等级综合评定',
    icon: 'Award',
    lore: '魔法部考试管理局颁发官方证书，你的魔法英语素养已获得正式立案。'
  },
  {
    id: 'owls-outstanding',
    name: '卓越巫师 (O)',
    category: 'owls',
    rarity: 'legendary',
    desc: 'O.W.L.s 综合测验取得 Outstanding 卓越认证',
    icon: 'Crown',
    lore: '全科目登峰造极，荣获校长特别嘉许与传奇巫师授勋。'
  }
]
