import { defineStore } from 'pinia'
import { DEFAULT_CATALOG } from '../data/catalogData.js'
import { HP_BOOKS } from '../data/chapters.js'

const BOOK_STORAGE_KEY = 'hp_last_played_book'
const CHAPTER_STORAGE_KEY = 'hp_last_played_chapter'

/**
 * Resolves the streaming audio URL for an R2 key.
 * Hierarchy:
 * 1. Custom CDN domain (if supplied or via environment variable)
 * 2. Express/Vite streaming proxy (/api/stream/audio/:key)
 *
 * @param {string} audioKey - e.g. "podcasts/hp-book-1/episodes/ep01/audio.mp3"
 * @param {string} [apiBase=''] - Optional base URL prefix
 * @param {string} [customCdnDomain] - Optional CDN domain
 * @returns {string} Resolved audio URL
 */
export function resolveAudioStreamUrl(audioKey, apiBase = '', customCdnDomain = null) {
  if (!audioKey) return ''

  const cdn =
    customCdnDomain ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_R2_PUBLIC_DOMAIN) ||
    (typeof window !== 'undefined' && window.__HP_CDN_DOMAIN__) ||
    ''

  if (cdn) {
    const cleanDomain = cdn.replace(/\/+$/, '')
    const cleanKey = audioKey.replace(/^\/+/, '')
    const prefix = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`
    return `${prefix}/${cleanKey}`
  }

  const streamKey = audioKey.replace(/\.(mp3|m4a|wav|aac|ogg|flac)$/i, '')
  const cleanApiBase = apiBase ? apiBase.replace(/\/+$/, '') : ''
  const cleanKey = streamKey.replace(/^\/+/, '')
  return `${cleanApiBase}/api/stream/audio/${cleanKey}`
}

/**
 * Resolves the WebVTT subtitle URL for an R2 key.
 *
 * @param {string} subtitleKey - e.g. "podcasts/hp-book-1/episodes/ep01/subtitle.vtt"
 * @param {string} [apiBase=''] - Optional base URL prefix
 * @returns {string} Resolved VTT URL
 */
export function resolveSubtitleUrl(subtitleKey, apiBase = '') {
  if (!subtitleKey) return ''
  const cleanApiBase = apiBase ? apiBase.replace(/\/+$/, '') : ''
  const cleanKey = subtitleKey.replace(/^\/+/, '')
  return `${cleanApiBase}/api/subtitles/${cleanKey}`
}

function getInitialBookId(books) {
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(BOOK_STORAGE_KEY)
      if (saved && books.some((b) => b.id === saved)) return saved
    } catch {}
  }
  return books[0]?.id || 'hp-book-1'
}

function getInitialChapterId(books, bookId) {
  const book = books.find((b) => b.id === bookId) || books[0]
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(CHAPTER_STORAGE_KEY)
      if (saved && book?.chapters?.some((c) => c.id === saved)) return saved
    } catch {}
  }
  return book?.chapters?.[0]?.id || 'hp-book-1_ep01'
}

export const useCatalogStore = defineStore('catalog', {
  state: () => {
    const initialBooks =
      DEFAULT_CATALOG?.books && DEFAULT_CATALOG.books.length > 0
        ? DEFAULT_CATALOG.books
        : HP_BOOKS

    const bookId = getInitialBookId(initialBooks)
    const chapterId = getInitialChapterId(initialBooks, bookId)

    return {
      books: initialBooks,
      selectedBookId: bookId,
      selectedChapterId: chapterId,
      isLoadingCatalog: false,
      catalogSource: 'local',
      isOfflinePlayback: false
    }
  },

  getters: {
    currentBook: (state) => {
      return (
        state.books.find((b) => b.id === state.selectedBookId) ||
        state.books[0] ||
        null
      )
    },

    currentChapter: (state) => {
      const b =
        state.books.find((book) => book.id === state.selectedBookId) ||
        state.books[0]
      if (!b || !b.chapters || b.chapters.length === 0) return null
      return (
        b.chapters.find((c) => c.id === state.selectedChapterId) ||
        b.chapters[0]
      )
    },

    audioUrl: (state) => {
      const b =
        state.books.find((book) => book.id === state.selectedBookId) ||
        state.books[0]
      const c =
        b?.chapters?.find((ch) => ch.id === state.selectedChapterId) ||
        b?.chapters?.[0]
      if (!c) return ''
      const key =
        c.audioKey ||
        `podcasts/${b.id}/episodes/${c.epId || 'ep01'}/audio.mp3`
      return resolveAudioStreamUrl(key)
    },

    subtitleUrl: (state) => {
      const b =
        state.books.find((book) => book.id === state.selectedBookId) ||
        state.books[0]
      const c =
        b?.chapters?.find((ch) => ch.id === state.selectedChapterId) ||
        b?.chapters?.[0]
      if (!c) return ''
      const key =
        c.subtitleKey ||
        `podcasts/${b.id}/episodes/${c.epId || 'ep01'}/subtitle.vtt`
      return resolveSubtitleUrl(key)
    }
  },

  actions: {
    selectBook(bookId) {
      const b = this.books.find((x) => x.id === bookId)
      if (!b) return
      this.selectedBookId = bookId
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(BOOK_STORAGE_KEY, bookId)
        } catch {}
      }

      if (b.chapters && b.chapters.length > 0) {
        this.selectChapter(b.chapters[0].id)
      }
    },

    selectChapter(chapterId) {
      this.selectedChapterId = chapterId
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(CHAPTER_STORAGE_KEY, chapterId)
        } catch {}
      }
    },

    async fetchRemoteCatalog() {
      if (typeof fetch === 'undefined') return
      this.isLoadingCatalog = true
      try {
        const res = await fetch('/api/catalog')
        if (res.ok) {
          const data = await res.json()
          if (data.books && data.books.length > 0) {
            this.books = data.books
            this.catalogSource = 'api'
          }
        }
      } catch (err) {
        // Silently preserve local catalog
      } finally {
        this.isLoadingCatalog = false
      }
    }
  }
})
