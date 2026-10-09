import { defineStore } from 'pinia'

const STORAGE_KEY = 'hp_vocab_list'

const initialSeeds = [
  {
    id: 1,
    word: 'cloak',
    phonetic: '/kləʊk/',
    definition: 'n. 斗篷，披风',
    contextQuote: 'He was wearing an emerald-green cloak.',
    box: 1
  },
  {
    id: 2,
    word: 'peculiar',
    phonetic: '/pɪˈkjuːliə(r)/',
    definition: 'adj. 奇怪的，古怪的',
    contextQuote: 'It was on the corner that he noticed something peculiar.',
    box: 2
  },
  {
    id: 3,
    word: 'quill',
    phonetic: '/kwɪl/',
    definition: 'n. 羽毛笔',
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
    addWord(rawWord, contextQuote = '') {
      if (!rawWord) return false
      // Clean punctuation
      const clean = rawWord.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '')
      if (!clean || clean.length < 2) return false

      // Check duplicate
      const exists = this.vocabList.some((w) => w.word.toLowerCase() === clean)
      if (exists) return false

      const newEntry = {
        id: Date.now(),
        word: clean,
        phonetic: '',
        definition: '生词本收录',
        contextQuote: contextQuote ? contextQuote.trim() : '',
        box: 1,
        addedAt: Date.now()
      }
      this.vocabList.unshift(newEntry)
      this.saveVocab()
      return true
    },
    promoteBox(item) {
      const target = this.vocabList.find((w) => w.word === item.word)
      if (target) {
        if (!target.box) target.box = 1
        if (target.box < 5) {
          target.box += 1
          this.saveVocab()
        }
      }
    },
    deleteWord(item) {
      this.vocabList = this.vocabList.filter((w) => w.word !== item.word)
      this.saveVocab()
    },
    clearAll() {
      this.vocabList = []
      this.saveVocab()
    }
  }
})
