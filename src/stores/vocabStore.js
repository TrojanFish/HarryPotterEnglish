import { defineStore } from 'pinia'
import { cleanWordToken as cleanWord } from '../data/dictionaryData.js'

const STORAGE_KEY = 'hp_vocab_list'

const initialSeeds = [
  {
    id: 1,
    word: 'cloak',
    phonetic: '/kləʊk/',
    definition: 'n. 斗篷，披风',
    pos: 'n.',
    tag: '服饰魔法',
    contextQuote: 'He was wearing an emerald-green cloak.',
    box: 1
  },
  {
    id: 2,
    word: 'peculiar',
    phonetic: '/pɪˈkjuːliə(r)/',
    definition: 'adj. 奇怪的，古怪的',
    pos: 'adj.',
    tag: '核心生词',
    contextQuote: 'It was on the corner that he noticed something peculiar.',
    box: 2
  },
  {
    id: 3,
    word: 'quill',
    phonetic: '/kwɪl/',
    definition: 'n. 羽毛笔',
    pos: 'n.',
    tag: '书写文具',
    contextQuote: 'He took out a long quill and a roll of parchment.',
    box: 3
  }
]


function loadVocab() {
  if (typeof localStorage === 'undefined') return JSON.parse(JSON.stringify(initialSeeds))
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(initialSeeds))
  } catch (e) {
    return JSON.parse(JSON.stringify(initialSeeds))
  }
}

export const useVocabStore = defineStore('vocab', {
  state: () => ({
    vocabList: loadVocab()
  }),
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
    addWord(wordOrData, contextQuote = '') {
      if (!wordOrData) return false
      const isObj = typeof wordOrData === 'object' && wordOrData !== null
      const rawWord = isObj ? wordOrData.word : wordOrData
      const clean = cleanWord(rawWord)
      if (!clean || clean.length < 2) return false

      // Check duplicate
      if (this.hasWord(clean)) return false

      const quote = (contextQuote || (isObj ? wordOrData.contextQuote : '') || '').trim()
      const newEntry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        word: clean,
        phonetic: isObj && wordOrData.phonetic ? wordOrData.phonetic : '',
        definition: isObj && wordOrData.definition ? wordOrData.definition : '生词本收录',
        pos: isObj && wordOrData.pos ? wordOrData.pos : '',
        tag: isObj && wordOrData.tag ? wordOrData.tag : '拓展生词',
        contextQuote: quote,
        box: isObj && typeof wordOrData.box === 'number' ? wordOrData.box : 1,
        addedAt: Date.now()
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
    toggleWord(wordData, contextQuote = '') {
      if (!wordData) return false
      const rawWord = typeof wordData === 'object' && wordData !== null ? wordData.word : wordData
      const clean = cleanWord(rawWord)
      if (!clean) return false

      if (this.hasWord(clean)) {
        this.removeWord(clean)
        return false
      } else {
        this.addWord(wordData, contextQuote)
        return true
      }
    },
    promoteBox(item) {
      if (!item) return
      const clean = cleanWord(typeof item === 'string' ? item : item.word)
      const target = this.vocabList.find((w) => cleanWord(w.word) === clean)
      if (target) {
        if (!target.box) target.box = 1
        if (target.box < 5) {
          target.box += 1
          this.saveVocab()
        }
      }
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
