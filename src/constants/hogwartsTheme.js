/**
 * Hogwarts Theme Constants & Canon Taxonomy Registry
 * - Four Houses Theme Tokens (Gryffindor, Slytherin, Ravenclaw, Hufflepuff)
 * - O.W.L.s (Ordinary Wizarding Level) 6-Grade Examination Scale
 * - Canonical Magical Taxonomy Dictionary
 * Strictly 100% Zero-Emoji Compliant
 */

export const HOUSES = {
  gryffindor: {
    id: 'gryffindor',
    nameZh: '格兰芬多',
    nameEn: 'Gryffindor',
    animal: '狮子',
    founder: '戈德里克·格兰芬多',
    trait: '勇敢、气魄、骑士精神',
    primaryColor: '#b91c1c',     // Scarlet
    accentColor: '#f59e0b',      // Gold
    borderColor: '#fca5a5',
    bgLight: '#fef2f2',
    gemColor: '#dc2626',         // Ruby
    mottoZh: '勇气铸就荣耀',
    mottoEn: 'Their daring, nerve, and chivalry set Gryffindors apart.'
  },
  slytherin: {
    id: 'slytherin',
    nameZh: '斯莱特林',
    nameEn: 'Slytherin',
    animal: '蛇',
    founder: '萨拉查·斯莱特林',
    trait: '野心、精明、审时度势',
    primaryColor: '#047857',     // Emerald
    accentColor: '#94a3b8',      // Silver
    borderColor: '#a7f3d0',
    bgLight: '#ecfdf5',
    gemColor: '#059669',         // Emerald
    mottoZh: '精明成就非凡',
    mottoEn: 'Those cunning folk use any means to achieve their ends.'
  },
  ravenclaw: {
    id: 'ravenclaw',
    nameZh: '拉文克劳',
    nameEn: 'Ravenclaw',
    animal: '鹰',
    founder: '罗伊纳·拉文克劳',
    trait: '智慧、机敏、博学审问',
    primaryColor: '#1d4ed8',     // Sapphire Blue
    accentColor: '#d97706',      // Bronze
    borderColor: '#bfdbfe',
    bgLight: '#eff6ff',
    gemColor: '#2563eb',         // Sapphire
    mottoZh: '过人的智慧是人类最大的财富',
    mottoEn: 'Wit beyond measure is man\'s greatest treasure.'
  },
  hufflepuff: {
    id: 'hufflepuff',
    nameZh: '赫奇帕奇',
    nameEn: 'Hufflepuff',
    animal: '獾',
    founder: '赫尔加·赫奇帕奇',
    trait: '忠诚、勤勉、正直坚韧',
    primaryColor: '#d97706',     // Canary Yellow / Warm Amber
    accentColor: '#292524',      // Earth / Black
    borderColor: '#fde68a',
    bgLight: '#fffbeb',
    gemColor: '#eab308',         // Topaz
    mottoZh: '坚忍不拔，正直忠诚',
    mottoEn: 'Unafraid of toil, patient and true.'
  }
};

/**
 * O.W.L.s (Ordinary Wizarding Levels) Examination Grading Scale
 * Maps Leitner SRS Levels 0–5 to Hogwarts Academic Ranks
 */
export const OWLS_GRADES = [
  {
    level: 0,
    grade: 'T',
    nameZh: '巨怪级 (Troll)',
    nameEn: 'Troll',
    color: '#991b1b',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    descriptionZh: '初涉咒语，尚未记忆',
    isPassing: false,
    isMastered: false
  },
  {
    level: 1,
    grade: 'D',
    nameZh: '糟糕级 (Dreadful)',
    nameEn: 'Dreadful',
    color: '#c2410c',
    bgColor: '#ffedd5',
    borderColor: '#fdba74',
    descriptionZh: '记忆模糊，需配魔药',
    isPassing: false,
    isMastered: false
  },
  {
    level: 2,
    grade: 'P',
    nameZh: '勉强级 (Poor)',
    nameEn: 'Poor',
    color: '#b45309',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    descriptionZh: '需看译文，念咒偶卡',
    isPassing: false,
    isMastered: false
  },
  {
    level: 3,
    grade: 'A',
    nameZh: '及格级 (Acceptable)',
    nameEn: 'Acceptable',
    color: '#047857',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    descriptionZh: '听音可辨，顺利通过',
    isPassing: true,
    isMastered: false
  },
  {
    level: 4,
    grade: 'E',
    nameZh: '良好级 (Exceeds Expectations)',
    nameEn: 'Exceeds Expectations',
    color: '#1d4ed8',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    descriptionZh: '熟稔掌握，超出预期',
    isPassing: true,
    isMastered: false
  },
  {
    level: 5,
    grade: 'O',
    nameZh: '杰出级 (Outstanding)',
    nameEn: 'Outstanding',
    color: '#854d0e',
    bgColor: '#fef08a',
    borderColor: '#facc15',
    descriptionZh: '大师级无杖掌握，授予火漆印章',
    isPassing: true,
    isMastered: true
  }
];

export const HOGWARTS_TAXONOMY = {
  navigation: {
    bookshelf: '霍格沃茨图书馆',
    bookshelfSub: '大图书馆馆藏原声书卷',
    player: '魔咒精研室',
    playerSub: '双语精听与逐句研读工坊',
    vocab: '魔法宝典',
    vocabSub: '巫师词汇与咒语手卷',
    analytics: '巫师学籍档案',
    analyticsSub: '霍格沃茨学业数据与 O.W.L.s 追踪'
  },
  audio: {
    sleepTimer: '安眠魔药 (Draught of Peace)',
    pensieve: '冥想盆记忆库 (The Pensieve)',
    manaPoints: '沉浸法力点',
    consecutiveDays: '连贯施法天数'
  },
  dictation: {
    lumos: '荧光闪烁 (Lumos Cloze)',
    auror: '奥罗搜寻 (Auror Full Typing)',
    accio: '飞来咒 (Accio Word Picker)'
  }
};

/**
 * Safely retrieves House configuration with fallback to Gryffindor
 */
export function getHouse(houseId) {
  if (houseId && HOUSES[houseId]) {
    return HOUSES[houseId];
  }
  return HOUSES.gryffindor;
}

/**
 * Safely maps an SRS level number (0~5+) to the O.W.L.s grade object
 */
export function getOwlsGrade(srsLevel) {
  const numericLevel = typeof srsLevel === 'number' && !isNaN(srsLevel) ? srsLevel : 0;
  const clamped = Math.max(0, Math.min(5, numericLevel));
  return OWLS_GRADES[clamped];
}

export default {
  HOUSES,
  OWLS_GRADES,
  HOGWARTS_TAXONOMY,
  getHouse,
  getOwlsGrade
};
