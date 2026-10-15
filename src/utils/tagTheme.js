/**
 * Hogwarts Audio - Dual-Channel Tag Theme Utility
 * Provides accessible, zero-emoji, distinct border + background styles for curriculum grade tags.
 */

export const TAG_THEMES = {
  '小学基础': {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  '中考核心': {
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500'
  },
  '高考重点': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500'
  },
  '四级高频': {
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500'
  },
  '六级进阶': {
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500'
  },
  '魔法专有': {
    badge: 'bg-amber-50/80 text-[#b45309] border-amber-300',
    dot: 'bg-[#d97706]'
  }
}

/**
 * Returns Tailwind class names for a given vocabulary tag badge.
 * @param {string} tag
 * @returns {string} Tailwind classes
 */
export function getTagBadgeClass(tag) {
  if (!tag) return 'bg-zinc-100 text-zinc-700 border-zinc-200'
  const found = TAG_THEMES[tag]
  if (found) return found.badge
  // Fuzzy match
  if (tag.includes('小学')) return TAG_THEMES['小学基础'].badge
  if (tag.includes('中考')) return TAG_THEMES['中考核心'].badge
  if (tag.includes('高考')) return TAG_THEMES['高考重点'].badge
  if (tag.includes('四级')) return TAG_THEMES['四级高频'].badge
  if (tag.includes('六级')) return TAG_THEMES['六级进阶'].badge
  if (tag.includes('魔法') || tag.includes('专有')) return TAG_THEMES['魔法专有'].badge
  return 'bg-zinc-100 text-zinc-700 border-zinc-200'
}
