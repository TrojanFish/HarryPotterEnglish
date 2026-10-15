/**
 * Hogwarts Audio - Offline Dictionary Data & Lookup Service
 * Zero-emoji, local-first vocabulary lookup tailored for Harry Potter reader.
 */

import { GRADED_DICTIONARY } from './gradedDictionaryData.js'
import { HP_LORE_DICTIONARY } from './hpDictionary.js'

export const DICTIONARY = {
  cloak: {
    word: 'cloak',
    phonetic: '/kləʊk/',
    pos: 'n.',
    definition: '斗篷，披风；遮蔽物',
    tag: '服饰魔法'
  },
  peculiar: {
    word: 'peculiar',
    phonetic: '/pɪˈkjuːliə(r)/',
    pos: 'adj.',
    definition: '奇怪的，古怪的；特殊的',
    tag: '核心生词'
  },
  quill: {
    word: 'quill',
    phonetic: '/kwɪl/',
    pos: 'n.',
    definition: '羽毛笔；（刺猬等的）刺',
    tag: '书写文具'
  },
  wand: {
    word: 'wand',
    phonetic: '/wɒnd/',
    pos: 'n.',
    definition: '魔杖，魔法棒',
    tag: '高频魔法'
  },
  muggle: {
    word: 'muggle',
    phonetic: '/ˈmʌɡl/',
    pos: 'n.',
    definition: '麻瓜（不会魔法的普通人）',
    tag: '专有名词'
  },
  fantasy: {
    word: 'fantasy',
    phonetic: '/ˈfæntəsi/',
    pos: 'n.',
    definition: '幻想，魔幻小说；奇想',
    tag: '核心主题'
  },
  classic: {
    word: 'classic',
    phonetic: '/ˈklæsɪk/',
    pos: 'adj./n.',
    definition: '经典的，第一流的；经典作品，名著',
    tag: '高频核心'
  },
  discovery: {
    word: 'discovery',
    phonetic: '/dɪˈskʌvəri/',
    pos: 'n.',
    definition: '发现，被发掘的事物',
    tag: '高频核心'
  },
  friendship: {
    word: 'friendship',
    phonetic: '/ˈfrendʃɪp/',
    pos: 'n.',
    definition: '友谊，朋友情谊',
    tag: '核心主题'
  },
  narrate: {
    word: 'narrate',
    phonetic: '/nəˈreɪt/',
    pos: 'v.',
    definition: '讲述，叙述，为…作旁白',
    tag: '文学用词'
  },
  author: {
    word: 'author',
    phonetic: '/ˈɔːθə(r)/',
    pos: 'n.',
    definition: '作者，作家',
    tag: '身份称谓'
  },
  edit: {
    word: 'edit',
    phonetic: '/ˈedɪt/',
    pos: 'v.',
    definition: '编辑，剪辑，校订',
    tag: '常用动词'
  },
  mystery: {
    word: 'mystery',
    phonetic: '/ˈmɪstri/',
    pos: 'n.',
    definition: '神秘，奥秘，悬疑',
    tag: '文学主题'
  },
  mysterious: {
    word: 'mysterious',
    phonetic: '/mɪˈstɪəriəs/',
    pos: 'adj.',
    definition: '神秘的，不可思议的',
    tag: '高频形容词'
  },
  secret: {
    word: 'secret',
    phonetic: '/ˈsiːkrət/',
    pos: 'n./adj.',
    definition: '秘密，机密；秘密的',
    tag: '剧情线索'
  },
  sorcerer: {
    word: 'sorcerer',
    phonetic: '/ˈsɔːsərə(r)/',
    pos: 'n.',
    definition: '巫师，魔法师',
    tag: '魔法身份'
  },
  stone: {
    word: 'stone',
    phonetic: '/stəʊn/',
    pos: 'n.',
    definition: '石头，魔法石',
    tag: '核心道具'
  },
  philosopher: {
    word: 'philosopher',
    phonetic: '/fəˈlɒsəfə(r)/',
    pos: 'n.',
    definition: '哲人，哲学家，魔法学者',
    tag: '核心概念'
  },
  privet: {
    word: 'privet',
    phonetic: '/ˈprɪvɪt/',
    pos: 'n.',
    definition: '女贞（常绿灌木，女贞路原意）',
    tag: '场景地点'
  },
  dursley: {
    word: 'dursley',
    phonetic: '/ˈdɜːzli/',
    pos: 'n.',
    definition: '德思礼一家（哈利的姨夫姨妈一家）',
    tag: '专有人物'
  },
  proud: {
    word: 'proud',
    phonetic: '/praʊd/',
    pos: 'adj.',
    definition: '骄傲的，自豪的，引以为傲的',
    tag: '高频词汇'
  },
  perfectly: {
    word: 'perfectly',
    phonetic: '/ˈpɜːfɪktli/',
    pos: 'adv.',
    definition: '完全地，极度地；无可挑剔地',
    tag: '高频副词'
  },
  cat: {
    word: 'cat',
    phonetic: '/kæt/',
    pos: 'n.',
    definition: '猫（麦格教授的变形形态）',
    tag: '常见生物'
  },
  owl: {
    word: 'owl',
    phonetic: '/aʊl/',
    pos: 'n.',
    definition: '猫头鹰（巫师界的信使）',
    tag: '魔法生物'
  },
  witch: {
    word: 'witch',
    phonetic: '/wɪtʃ/',
    pos: 'n.',
    definition: '女巫，巫婆',
    tag: '核心身份'
  },
  wizard: {
    word: 'wizard',
    phonetic: '/ˈwɪzəd/',
    pos: 'n.',
    definition: '男巫，巫师',
    tag: '核心身份'
  },
  magic: {
    word: 'magic',
    phonetic: '/ˈmædʒɪk/',
    pos: 'n./adj.',
    definition: '魔法，魔力；有魔力的',
    tag: '核心概念'
  },
  letter: {
    word: 'letter',
    phonetic: '/ˈletə(r)/',
    pos: 'n.',
    definition: '信件，信函；字母',
    tag: '剧情线索'
  },
  whisper: {
    word: 'whisper',
    phonetic: '/ˈwɪspə(r)/',
    pos: 'v./n.',
    definition: '耳语，低声说话，窃窃私语',
    tag: '行为动作'
  },
  notice: {
    word: 'notice',
    phonetic: '/ˈnəʊtɪs/',
    pos: 'v./n.',
    definition: '注意，察觉；通知，布告',
    tag: '高频动词'
  },
  stare: {
    word: 'stare',
    phonetic: '/steə(r)/',
    pos: 'v.',
    definition: '凝视，注视，盯视',
    tag: '高频动词'
  },
  drive: {
    word: 'drive',
    phonetic: '/draɪv/',
    pos: 'n./v.',
    definition: '车道，街道；驾驶，驱使',
    tag: '日常场景'
  },
  normal: {
    word: 'normal',
    phonetic: '/ˈnɔːml/',
    pos: 'adj.',
    definition: '正常的，普通的，标准的',
    tag: '高频形容词'
  },
  snitch: {
    word: 'snitch',
    phonetic: '/snɪtʃ/',
    pos: 'n.',
    definition: '金色飞贼（魁地奇关键比赛道具）',
    tag: '魁地奇'
  },
  nimbus: {
    word: 'nimbus',
    phonetic: '/ˈnɪmbəs/',
    pos: 'n.',
    definition: '光轮（经典飞天扫帚系列）',
    tag: '魁地奇'
  },
  parchment: {
    word: 'parchment',
    phonetic: '/ˈpɑːtʃmənt/',
    pos: 'n.',
    definition: '羊皮纸，羊皮纸卷',
    tag: '书写文具'
  },
  potter: {
    word: 'potter',
    phonetic: '/ˈpɒtə(r)/',
    pos: 'n.',
    definition: '波特（哈利·波特）',
    tag: '专有人物'
  },
  harry: {
    word: 'harry',
    phonetic: '/ˈhæri/',
    pos: 'n.',
    definition: '哈利（故事主角）',
    tag: '专有人物'
  },
  hogwarts: {
    word: 'hogwarts',
    phonetic: '/ˈhɒɡwɔːts/',
    pos: 'n.',
    definition: '霍格沃茨魔法学校',
    tag: '专有地名'
  },
  albus: {
    word: 'albus',
    phonetic: '/ˈælbəs/',
    pos: 'n.',
    definition: '阿不思（邓布利多的名字）',
    tag: '专有人物'
  },
  dumbledore: {
    word: 'dumbledore',
    phonetic: '/ˈdʌmbəldɔː(r)/',
    pos: 'n.',
    definition: '邓布利多（霍格沃茨校长）',
    tag: '专有人物'
  },
  mcgonagall: {
    word: 'mcgonagall',
    phonetic: '/məkˈɡɒnəɡəl/',
    pos: 'n.',
    definition: '麦格教授（变形术教授，格兰芬多院长）',
    tag: '专有人物'
  },
  hagrid: {
    word: 'hagrid',
    phonetic: '/ˈhæɡrɪd/',
    pos: 'n.',
    definition: '海格（霍格沃茨钥匙保管员兼猎场看守）',
    tag: '专有人物'
  },
  spell: {
    word: 'spell',
    phonetic: '/spel/',
    pos: 'n.',
    definition: '咒语，法术，符咒',
    tag: '核心魔法'
  },
  cauldron: {
    word: 'cauldron',
    phonetic: '/ˈkɔːldrən/',
    pos: 'n.',
    definition: '大坩埚，大铁锅（熬制魔药用）',
    tag: '魔药道具'
  },
  potion: {
    word: 'potion',
    phonetic: '/ˈpəʊʃn/',
    pos: 'n.',
    definition: '魔药，魔剂',
    tag: '魔药学'
  },
  secret: {
    word: 'secret',
    phonetic: '/ˈsiːkrət/',
    pos: 'adj./n.',
    definition: '秘密的，隐秘的；秘密',
    tag: '重点生词'
  },
  mysterious: {
    word: 'mysterious',
    phonetic: '/mɪˈstɪəriəs/',
    pos: 'adj.',
    definition: '神秘的，难以解释的',
    tag: '核心生词'
  },
  emerald: {
    word: 'emerald',
    phonetic: '/ˈemərəld/',
    pos: 'adj./n.',
    definition: '祖母绿色的，翠绿的；翡翠',
    tag: '色彩描写'
  },
  strange: {
    word: 'strange',
    phonetic: '/streɪndʒ/',
    pos: 'adj.',
    definition: '奇怪的，反常的；陌生的',
    tag: '高频形容词'
  },
  shout: {
    word: 'shout',
    phonetic: '/ʃaʊt/',
    pos: 'v./n.',
    definition: '大声喊叫，呼喊',
    tag: '动作表达'
  },
  crowd: {
    word: 'crowd',
    phonetic: '/kraʊd/',
    pos: 'n.',
    definition: '人群，拥挤的人群',
    tag: '场景描写'
  },
  excitement: {
    word: 'excitement',
    phonetic: '/ɪkˈsaɪtmənt/',
    pos: 'n.',
    definition: '激动，兴奋，刺激',
    tag: '情感表达'
  },
  rumour: {
    word: 'rumour',
    phonetic: '/ˈruːmə(r)/',
    pos: 'n.',
    definition: '谣言，传闻',
    tag: '日常词汇'
  },
  rumor: {
    word: 'rumor',
    phonetic: '/ˈruːmə(r)/',
    pos: 'n.',
    definition: '谣言，传闻（美式拼写）',
    tag: '日常词汇'
  },
  fear: {
    word: 'fear',
    phonetic: '/fɪə(r)/',
    pos: 'n./v.',
    definition: '害怕，恐惧，畏惧',
    tag: '情感表达'
  },
  dark: {
    word: 'dark',
    phonetic: '/dɑːk/',
    pos: 'adj.',
    definition: '黑暗的，阴暗的，黑魔法的',
    tag: '氛围描写'
  },
  scar: {
    word: 'scar',
    phonetic: '/skɑː(r)/',
    pos: 'n.',
    definition: '伤疤（额头的闪电伤痕）',
    tag: '关键线索'
  },
  lightning: {
    word: 'lightning',
    phonetic: '/ˈlaɪtnɪŋ/',
    pos: 'n.',
    definition: '闪电',
    tag: '关键线索'
  },
  forehead: {
    word: 'forehead',
    phonetic: '/ˈfɔːhed/',
    pos: 'n.',
    definition: '前额，额头',
    tag: '身体部位'
  },
  motorcycle: {
    word: 'motorcycle',
    phonetic: '/ˈməʊtəsaɪkl/',
    pos: 'n.',
    definition: '摩托车（海格的飞天巨型摩托）',
    tag: '道具场景'
  },
  blanket: {
    word: 'blanket',
    phonetic: '/ˈblæŋkɪt/',
    pos: 'n.',
    definition: '毛毯，毯子',
    tag: '日常物品'
  },
  survive: {
    word: 'survive',
    phonetic: '/səˈvaɪv/',
    pos: 'v.',
    definition: '幸存，存活，生还',
    tag: '核心主题'
  }
}

/**
 * Clean a word token by removing leading/trailing punctuation and quotes.
 * Supports ASCII punctuation and smart unicode quotation marks.
 * @param {string} rawWord
 * @returns {string}
 */
export function cleanWordToken(rawWord) {
  if (!rawWord || typeof rawWord !== 'string') return ''
  return rawWord
    .trim()
    .toLowerCase()
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
}

/**
 * Generate candidate lemmas for inflection reduction (-s, -es, -ed, -ing, -ly).
 * @param {string} word
 * @returns {string[]}
 */
export function getLemmaCandidates(word) {
  const candidates = []
  if (!word || word.length < 3) return candidates

  // 1. Plural / 3rd-person -s / -es / -ies
  if (word.endsWith('ies') && word.length > 4) {
    candidates.push(word.slice(0, -3) + 'y')
  }
  if (word.endsWith('es') && word.length > 3) {
    candidates.push(word.slice(0, -2)) // witches -> witch, boxes -> box
    candidates.push(word.slice(0, -1)) // drives -> drive
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 2) {
    candidates.push(word.slice(0, -1)) // cloaks -> cloak, cats -> cat
  }

  // 2. Past tense -ed / -ied
  if (word.endsWith('ied') && word.length > 4) {
    candidates.push(word.slice(0, -3) + 'y')
  }
  if (word.endsWith('ed') && word.length > 3) {
    candidates.push(word.slice(0, -1)) // noticed -> notice, stared -> stare
    candidates.push(word.slice(0, -2)) // shouted -> shout
    // Doubled consonant, e.g. stopped -> stop
    if (word.length > 5 && word[word.length - 3] === word[word.length - 4]) {
      candidates.push(word.slice(0, -3))
    }
  }

  // 3. Present participle -ing
  if (word.endsWith('ing') && word.length > 4) {
    candidates.push(word.slice(0, -3)) // whispering -> whisper
    candidates.push(word.slice(0, -3) + 'e') // staring -> stare
    // Doubled consonant, e.g. running -> run
    if (word.length > 6 && word[word.length - 4] === word[word.length - 5]) {
      candidates.push(word.slice(0, -4))
    }
  }

  // 4. Adverb -ly / -ily
  if (word.endsWith('ily') && word.length > 4) {
    candidates.push(word.slice(0, -3) + 'y')
  }
  if (word.endsWith('ly') && word.length > 3) {
    candidates.push(word.slice(0, -2)) // proudly -> proud
  }

  return candidates
}

/**
 * Lookup a word in the offline dictionary.
 * Cleans punctuation, attempts inflection reduction, and returns entry or fallback.
 * @param {string} rawWord
 * @returns {{ word: string, phonetic: string, pos: string, definition: string, tag: string }}
 */
export function lookupWord(rawWord) {
  const clean = cleanWordToken(rawWord)

  if (!clean) {
    return {
      word: typeof rawWord === 'string' ? rawWord.trim() : '',
      phonetic: '',
      pos: '',
      definition: '点击收录至生词本',
      tag: '拓展生词'
    }
  }

  // 1. Exact match in DICTIONARY (overlay graded tag if available)
  if (DICTIONARY[clean]) {
    const graded = GRADED_DICTIONARY[clean]
    return {
      ...DICTIONARY[clean],
      tag: graded ? graded[3] : DICTIONARY[clean].tag
    }
  }

  // 2. Exact match in GRADED_DICTIONARY
  if (GRADED_DICTIONARY[clean]) {
    const tuple = GRADED_DICTIONARY[clean]
    return {
      word: clean,
      phonetic: tuple[0] || '',
      pos: tuple[1] || '',
      definition: tuple[2] || '',
      tag: tuple[3] || '拓展生词'
    }
  }

  // 3. Inflection candidate matches in DICTIONARY and GRADED_DICTIONARY
  const candidates = getLemmaCandidates(clean)
  for (const cand of candidates) {
    if (DICTIONARY[cand]) {
      const graded = GRADED_DICTIONARY[cand]
      return {
        ...DICTIONARY[cand],
        word: DICTIONARY[cand].word || cand,
        tag: graded ? graded[3] : DICTIONARY[cand].tag
      }
    }
    if (GRADED_DICTIONARY[cand]) {
      const tuple = GRADED_DICTIONARY[cand]
      return {
        word: cand,
        phonetic: tuple[0] || '',
        pos: tuple[1] || '',
        definition: tuple[2] || '',
        tag: tuple[3] || '拓展生词'
      }
    }
  }

  // 4. Exact match in HP_LORE_DICTIONARY
  if (HP_LORE_DICTIONARY[clean]) {
    const lore = HP_LORE_DICTIONARY[clean]
    return {
      word: lore.word || clean,
      phonetic: lore.phonetic || '',
      pos: 'n.',
      definition: lore.translation || lore.explanation || '',
      tag: '魔法专有'
    }
  }

  // 5. Inflection candidate matches in HP_LORE_DICTIONARY
  for (const cand of candidates) {
    if (HP_LORE_DICTIONARY[cand]) {
      const lore = HP_LORE_DICTIONARY[cand]
      return {
        word: lore.word || cand,
        phonetic: lore.phonetic || '',
        pos: 'n.',
        definition: lore.translation || lore.explanation || '',
        tag: '魔法专有'
      }
    }
  }

  // 6. Fallback for unknown word
  return {
    word: clean,
    phonetic: '',
    pos: '',
    definition: '点击收录至生词本',
    tag: '拓展生词'
  }
}

/**
 * Common English function and stop words to exclude from core vocabulary keyword cards.
 */
export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out', 'off', 'over', 'under',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'done',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
  'as', 'if', 'then', 'than', 'because', 'while', 'where', 'when', 'how', 'why',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'there', 'here'
])

/**
 * Extract key content vocabulary from a sentence for listening focus and vocabulary learning.
 * Normalizes punctuation, strips stop words, prioritizes dictionary entries and lemmas.
 *
 * @param {string} sentence - Subtitle or cue sentence text
 * @param {number} [maxCount=6] - Maximum number of core keywords to return
 * @returns {Array<{ word: string, rawToken: string, phonetic: string, pos: string, definition: string, tag: string, isInDict: boolean }>}
 */
export function extractSentenceKeywords(sentence, maxCount = 6) {
  if (!sentence || typeof sentence !== 'string') return []
  const tokens = sentence.trim().split(/\s+/)
  if (tokens.length === 0) return []

  const seen = new Set()
  const candidates = []

  for (const token of tokens) {
    const clean = cleanWordToken(token)
    if (!clean || clean.length < 2) continue
    if (STOP_WORDS.has(clean)) continue
    if (seen.has(clean)) continue
    seen.add(clean)

    const dictResult = lookupWord(clean)
    const isDirectMatch =
      !!HP_LORE_DICTIONARY[clean] || !!GRADED_DICTIONARY[clean] || !!DICTIONARY[clean]
    const isLemmaMatch =
      !isDirectMatch &&
      getLemmaCandidates(clean).some(
        (c) => !!HP_LORE_DICTIONARY[c] || !!GRADED_DICTIONARY[c] || !!DICTIONARY[c]
      )
    const isInDict = isDirectMatch || isLemmaMatch

    candidates.push({
      word: dictResult.word || clean,
      rawToken: token,
      phonetic: dictResult.phonetic || '',
      pos: dictResult.pos || '',
      definition: dictResult.definition || '点击收录至生词本',
      tag: dictResult.tag || '拓展生词',
      isInDict
    })
  }

  // Prioritize dictionary matches first, then longer content words
  candidates.sort((a, b) => {
    if (a.isInDict && !b.isInDict) return -1
    if (!a.isInDict && b.isInDict) return 1
    return b.word.length - a.word.length
  })

  return candidates.slice(0, maxCount)
}

