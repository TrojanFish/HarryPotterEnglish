/**
 * CEFR English Language Proficiency Scale & Books Catalog
 * Complies with Anthropic frontend-design & theme-factory specifications.
 * Provides dual-channel accessibility (text label + color token) for all ratings.
 */

export const CEFR_LEVELS = {
  A2: {
    code: 'A2',
    label: '入门',
    badgeText: 'CEFR A2 入门',
    description: '魔法学徒 — 基础词汇与日常句型',
    bgVar: '--c-cefr-a2',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-300'
  },
  B1: {
    code: 'B1',
    label: '进阶',
    badgeText: 'CEFR B1 进阶',
    description: '魔法探索 — 故事叙述与复合语境',
    bgVar: '--c-cefr-b1',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-300'
  },
  B2: {
    code: 'B2',
    label: '独立',
    badgeText: 'CEFR B2 独立',
    description: '魔法进阶 — 复杂论述与丰富文学表达',
    bgVar: '--c-cefr-b2',
    badgeClass: 'bg-blue-50 text-blue-800 border border-blue-300/60 dark:bg-blue-950/40 dark:text-blue-300'
  },
  C1: {
    code: 'C1',
    label: '熟练',
    badgeText: 'CEFR C1 熟练',
    description: '傲罗精通 — 高阶小说原版流利阅读',
    bgVar: '--c-cefr-c1',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-300/60 dark:bg-purple-950/40 dark:text-purple-300'
  }
};

export const BOOKS = [
  {
    id: 'book1',
    altIds: ['hp1', 'hp-book-1', 'book-1'],
    code: 'HP1',
    title: "Harry Potter and the Philosopher's Stone",
    titleZh: '哈利·波特与魔法石',
    cefr: 'A2',
    cefrLabel: '入门',
    cefrDescription: '魔法学徒 — 基础词汇与日常句型',
    color: '#740001',
    chaptersCount: 17
  },
  {
    id: 'book2',
    altIds: ['hp2', 'hp-book-2', 'book-2'],
    code: 'HP2',
    title: 'Harry Potter and the Chamber of Secrets',
    titleZh: '哈利·波特与密室',
    cefr: 'B1',
    cefrLabel: '进阶',
    cefrDescription: '魔法探索 — 悬疑对话与情节展开',
    color: '#1a472a',
    chaptersCount: 18
  },
  {
    id: 'book3',
    altIds: ['hp3', 'hp-book-3', 'book-3'],
    code: 'HP3',
    title: 'Harry Potter and the Prisoner of Azkaban',
    titleZh: '哈利·波特与阿兹卡班的囚徒',
    cefr: 'B1',
    cefrLabel: '进阶',
    cefrDescription: '时间法则 — 复杂时态与情感描写',
    color: '#0e1a40',
    chaptersCount: 22
  },
  {
    id: 'book4',
    altIds: ['hp4', 'hp-book-4', 'book-4'],
    code: 'HP4',
    title: 'Harry Potter and the Goblet of Fire',
    titleZh: '哈利·波特与火焰杯',
    cefr: 'B2',
    cefrLabel: '独立',
    cefrDescription: '三强争霸 — 宏大场景与多元口音',
    color: '#b85d19',
    chaptersCount: 37
  },
  {
    id: 'book5',
    altIds: ['hp5', 'hp-book-5', 'book-5'],
    code: 'HP5',
    title: 'Harry Potter and the Order of the Phoenix',
    titleZh: '哈利·波特与凤凰社',
    cefr: 'B2',
    cefrLabel: '独立',
    cefrDescription: '傲罗集结 — 心理博弈与政治词汇',
    color: '#5c1d38',
    chaptersCount: 38
  },
  {
    id: 'book6',
    altIds: ['hp6', 'hp-book-6', 'book-6'],
    code: 'HP6',
    title: 'Harry Potter and the Half-Blood Prince',
    titleZh: '哈利·波特与混血王子',
    cefr: 'B2',
    cefrLabel: '独立',
    cefrDescription: '冥想盆记忆 — 历史线索与高级隐喻',
    color: '#1e3a2f',
    chaptersCount: 30
  },
  {
    id: 'book7',
    altIds: ['hp7', 'hp-book-7', 'book-7'],
    code: 'HP7',
    title: 'Harry Potter and the Deathly Hallows',
    titleZh: '哈利·波特与死亡圣器',
    cefr: 'C1',
    cefrLabel: '熟练',
    cefrDescription: '终局对决 — 哲学思辨与全书高潮',
    color: '#2a1a3e',
    chaptersCount: 36
  }
];

/**
 * Resolve CEFR level info for a book ID, book object, or fallback safely
 * @param {string|object} bookOrId
 * @returns {object} CEFR level details
 */
export function getCefrInfo(bookOrId) {
  if (!bookOrId) return { ...CEFR_LEVELS.B1 };

  let id = '';
  let title = '';

  if (typeof bookOrId === 'string') {
    id = bookOrId.toLowerCase();
  } else if (typeof bookOrId === 'object') {
    id = (bookOrId.id || '').toLowerCase();
    title = (bookOrId.title || '').toLowerCase();
  }

  // 1. Direct match by BOOKS list
  const matched = BOOKS.find(b => {
    if (b.id === id) return true;
    if (b.altIds && b.altIds.some(alt => id.includes(alt) || alt === id)) return true;
    if (title && b.title.toLowerCase().includes(title)) return true;
    return false;
  });

  if (matched && CEFR_LEVELS[matched.cefr]) {
    return {
      ...CEFR_LEVELS[matched.cefr],
      bookCefr: matched.cefr,
      bookCefrLabel: matched.cefrLabel,
      bookDescription: matched.cefrDescription
    };
  }

  // 2. Keyword fallback
  if (id.includes('1') || title.includes('philosopher') || title.includes('sorcerer')) {
    return { ...CEFR_LEVELS.A2 };
  }
  if (id.includes('2') || title.includes('chamber')) {
    return { ...CEFR_LEVELS.B1 };
  }
  if (id.includes('3') || title.includes('azkaban')) {
    return { ...CEFR_LEVELS.B1 };
  }
  if (id.includes('4') || title.includes('goblet')) {
    return { ...CEFR_LEVELS.B2 };
  }
  if (id.includes('5') || title.includes('phoenix')) {
    return { ...CEFR_LEVELS.B2 };
  }
  if (id.includes('6') || title.includes('prince')) {
    return { ...CEFR_LEVELS.B2 };
  }
  if (id.includes('7') || title.includes('hallows')) {
    return { ...CEFR_LEVELS.C1 };
  }

  // Default fallback
  return { ...CEFR_LEVELS.B1 };
}
