import { defineStore } from 'pinia'
import { cleanWordToken as cleanWord, lookupWord, getCefrLevel } from '../data/dictionaryData.js'

const STORAGE_KEY = 'hp_vocab_list'

const initialSeeds = [
  {
    id: 1,
    word: 'cloak',
    phonetic: '/kləʊk/',
    definition: 'n. 斗篷，披风',
    pos: 'n.',
    tag: '中考核心',
    examTag: '中考核心',
    cefrLevel: 'A2',
    sourceType: 'hp',
    contextQuote: 'He was wearing an emerald-green cloak.',
    box: 1,
    addedAt: 1700000000000,
    lastReviewedAt: 1700000000000,
    errorCount: 0,
    acquisition: { l1: true, l2: true, l3: false, l4: false }
  },
  {
    id: 2,
    word: 'peculiar',
    phonetic: '/pɪˈkjuːliə(r)/',
    definition: 'adj. 奇怪的，古怪的',
    pos: 'adj.',
    tag: '高考重点',
    examTag: '高考重点',
    cefrLevel: 'B1',
    sourceType: 'hp',
    contextQuote: 'It was on the corner that he noticed something peculiar.',
    box: 2,
    addedAt: 1700000000000,
    lastReviewedAt: 1700000000000,
    errorCount: 0,
    acquisition: { l1: true, l2: true, l3: false, l4: false }
  },
  {
    id: 3,
    word: 'quill',
    phonetic: '/kwɪl/',
    definition: 'n. 羽毛笔',
    pos: 'n.',
    tag: '高考重点',
    examTag: '高考重点',
    cefrLevel: 'B1',
    sourceType: 'hp',
    contextQuote: 'He took out a long quill and a roll of parchment.',
    box: 3,
    addedAt: 1700000000000,
    lastReviewedAt: 1700000000000,
    errorCount: 0,
    acquisition: { l1: true, l2: true, l3: true, l4: false }
  }
]

export function migrateVocabEntry(raw) {
  if (!raw || typeof raw !== 'object') return raw
  const rawWord = raw.word || ''
  const clean = cleanWord(rawWord)
  const dict = clean ? lookupWord(clean) : null

  // 1. Exam tag normalization
  const examTag = raw.examTag || raw.tag || dict?.tag || '拓展生词'

  // 2. CEFR level normalization
  const cefrLevel = raw.cefrLevel || getCefrLevel(clean || rawWord, examTag)

  // 3. Four-layer acquisition smooth derivation (compensate based on existing box)
  const defaultAcquisition = {
    l1: true,
    l2: true,
    l3: typeof raw.box === 'number' ? raw.box >= 3 : false,
    l4: typeof raw.box === 'number' ? raw.box >= 4 : false
  }

  const boxNum = typeof raw.box === 'number' ? Math.min(Math.max(raw.box, 1), 5) : 1
  const now = Date.now()

  return {
    id: raw.id || now + Math.floor(Math.random() * 1000),
    word: clean || rawWord,
    phonetic: raw.phonetic || raw.ipa || dict?.phonetic || '',
    pos: raw.pos || dict?.pos || '',
    definition: raw.definition || dict?.definition || '生词本收录',
    definitionEn: raw.definitionEn || '',
    cefrLevel,
    examTag,
    tag: examTag,
    sourceType: raw.sourceType || 'hp',
    sourceId: raw.sourceId || '',
    contextQuote: (raw.contextQuote || '').trim(),
    audioTimestamp: typeof raw.audioTimestamp === 'number' ? raw.audioTimestamp : null,
    box: boxNum,
    addedAt: raw.addedAt || now,
    lastReviewedAt: raw.lastReviewedAt || raw.addedAt || now,
    errorCount: typeof raw.errorCount === 'number' ? raw.errorCount : 0,
    acquisition: {
      l1: Boolean(raw.acquisition?.l1 ?? defaultAcquisition.l1),
      l2: Boolean(raw.acquisition?.l2 ?? defaultAcquisition.l2),
      l3: Boolean(raw.acquisition?.l3 ?? defaultAcquisition.l3),
      l4: Boolean(raw.acquisition?.l4 ?? defaultAcquisition.l4)
    }
  }
}

function loadVocab() {
  if (typeof localStorage === 'undefined') {
    return initialSeeds.map(migrateVocabEntry)
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialSeeds.map(migrateVocabEntry)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(migrateVocabEntry) : initialSeeds.map(migrateVocabEntry)
  } catch (e) {
    return initialSeeds.map(migrateVocabEntry)
  }
}

export const useVocabStore = defineStore('vocab', {
  state: () => ({
    vocabList: loadVocab()
  }),
  getters: {
    totalCount: (state) => (Array.isArray(state.vocabList) ? state.vocabList.length : 0),
    l4Count: (state) =>
      Array.isArray(state.vocabList) ? state.vocabList.filter((w) => w.acquisition?.l4).length : 0
  },
  actions: {
    saveVocab() {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.vocabList))
      }
    },
    hasWord(word) {
      if (!word) return false
      const raw = typeof word === 'string' ? word : word.word
      const clean = cleanWord(raw)
      if (!clean) return false
      return this.vocabList.some((w) => cleanWord(w.word) === clean)
    },
    addWord(wordOrData, contextQuote = '', meta = {}) {
      if (!wordOrData) return false
      const isObj = typeof wordOrData === 'object' && wordOrData !== null
      const rawWord = isObj ? wordOrData.word : wordOrData
      const clean = cleanWord(rawWord)
      if (!clean || clean.length < 2) return false

      // Check duplicate
      if (this.hasWord(clean)) return false

      const quote = (contextQuote || (isObj ? wordOrData.contextQuote : '') || '').trim()
      const dictInfo = lookupWord(clean)
      const examTag = (isObj && (wordOrData.examTag || wordOrData.tag)) || dictInfo?.tag || '拓展生词'
      const cefrLevel = (isObj && wordOrData.cefrLevel) || (meta && meta.cefrLevel) || dictInfo?.cefrLevel || getCefrLevel(clean, examTag)
      const sourceType = (isObj && wordOrData.sourceType) || (meta && meta.sourceType) || 'hp'
      const sourceId = (isObj && wordOrData.sourceId) || (meta && meta.sourceId) || ''
      const audioTimestamp = (isObj && typeof wordOrData.audioTimestamp === 'number')
        ? wordOrData.audioTimestamp
        : ((meta && typeof meta.audioTimestamp === 'number') ? meta.audioTimestamp : null)

      const box = isObj && typeof wordOrData.box === 'number'
        ? Math.min(Math.max(wordOrData.box, 1), 5)
        : 1
      const now = Date.now()

      const newEntry = {
        id: (isObj && wordOrData.id) || (now + Math.floor(Math.random() * 1000)),
        word: clean,
        phonetic: (isObj && wordOrData.phonetic) ? wordOrData.phonetic : (dictInfo?.phonetic || ''),
        definition: (isObj && wordOrData.definition) ? wordOrData.definition : (dictInfo?.definition || '生词本收录'),
        definitionEn: (isObj && wordOrData.definitionEn) ? wordOrData.definitionEn : '',
        pos: (isObj && wordOrData.pos) ? wordOrData.pos : (dictInfo?.pos || ''),
        tag: examTag,
        examTag,
        cefrLevel,
        sourceType,
        sourceId,
        audioTimestamp,
        contextQuote: quote,
        box,
        addedAt: (isObj && wordOrData.addedAt) || now,
        lastReviewedAt: (isObj && wordOrData.lastReviewedAt) || now,
        errorCount: (isObj && typeof wordOrData.errorCount === 'number') ? wordOrData.errorCount : 0,
        acquisition: {
          l1: isObj && wordOrData.acquisition && typeof wordOrData.acquisition.l1 === 'boolean'
            ? wordOrData.acquisition.l1
            : true,
          l2: isObj && wordOrData.acquisition && typeof wordOrData.acquisition.l2 === 'boolean'
            ? wordOrData.acquisition.l2
            : true,
          l3: isObj && wordOrData.acquisition && typeof wordOrData.acquisition.l3 === 'boolean'
            ? wordOrData.acquisition.l3
            : false,
          l4: isObj && wordOrData.acquisition && typeof wordOrData.acquisition.l4 === 'boolean'
            ? wordOrData.acquisition.l4
            : false
        }
      }
      this.vocabList.unshift(newEntry)
      this.saveVocab()
      return true
    },
    removeWord(word) {
      if (!word) return
      const raw = typeof word === 'string' ? word : word.word
      const clean = cleanWord(raw)
      if (!clean) return
      this.vocabList = this.vocabList.filter((w) => cleanWord(w.word) !== clean)
      this.saveVocab()
    },
    toggleWord(wordData, contextQuote = '', meta = {}) {
      if (!wordData) return false
      const rawWord = typeof wordData === 'object' && wordData !== null ? wordData.word : wordData
      const clean = cleanWord(rawWord)
      if (!clean) return false

      if (this.hasWord(clean)) {
        this.removeWord(clean)
        return false
      } else {
        this.addWord(wordData, contextQuote, meta)
        return true
      }
    },
    recordAcquisition(wordOrData, level) {
      if (!wordOrData || !level) return false
      const validLevels = ['l1', 'l2', 'l3', 'l4']
      if (!validLevels.includes(level)) return false

      const raw = typeof wordOrData === 'string' ? wordOrData : wordOrData.word
      const clean = cleanWord(raw)
      if (!clean) return false

      const target = this.vocabList.find((w) => cleanWord(w.word) === clean)
      if (!target) return false

      if (!target.acquisition) {
        target.acquisition = {
          l1: true,
          l2: true,
          l3: typeof target.box === 'number' ? target.box >= 3 : false,
          l4: typeof target.box === 'number' ? target.box >= 4 : false
        }
      }

      target.acquisition[level] = true
      target.lastReviewedAt = Date.now()
      this.saveVocab()
      return true
    },
    /**
     * Promote an item to the next Leitner Box (1 -> 5).
     * - Box 3+: Automatically marks L3 (Recall) acquisition as completed.
     * - Box 4 -> Box 5: Hard-gated by L4 (Production). Blocks promotion if !acquisition.l4.
     * @param {string | object} item
     * @returns {{ promoted: boolean, currentBox?: number, reason?: string, message?: string }}
     */
    promoteBox(item) {
      if (!item) return { promoted: false, reason: 'INVALID_ITEM' }
      const clean = cleanWord(typeof item === 'string' ? item : item.word)
      if (!clean) return { promoted: false, reason: 'INVALID_ITEM' }

      const target = this.vocabList.find((w) => cleanWord(w.word) === clean)
      if (!target) return { promoted: false, reason: 'NOT_FOUND' }

      if (!target.box) target.box = 1

      // Box 4 升 Box 5 刚性门禁：必须满足 L4 (产出能力)
      if (target.box === 4) {
        if (!target.acquisition?.l4) {
          return {
            promoted: false,
            reason: 'NEED_L4_PRODUCTION',
            currentBox: 4,
            message: '需完成听写拼写或造句跟读(L4)方可进入永久记忆盒(Box 5)'
          }
        }
        target.box = 5
        target.lastReviewedAt = Date.now()
        this.saveVocab()
        return { promoted: true, currentBox: 5 }
      }

      if (target.box < 4) {
        target.box += 1
        // Box 3 升级时若尚未标记 L3，自动辅助点亮 L3 (回想成功)
        if (target.box >= 3) {
          if (!target.acquisition) {
            target.acquisition = { l1: true, l2: true, l3: true, l4: false }
          } else {
            target.acquisition.l3 = true
          }
        }
        target.lastReviewedAt = Date.now()
        this.saveVocab()
        return { promoted: true, currentBox: target.box }
      }

      return { promoted: false, reason: 'ALREADY_MAX_BOX', currentBox: 5 }
    },
    deleteWord(item) {
      if (!item) return
      this.removeWord(item)
    },
    clearAll() {
      this.vocabList = []
      this.saveVocab()
    }
  }
})
