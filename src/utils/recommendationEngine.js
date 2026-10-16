/**
 * recommendationEngine.js
 * SLA Weighted Next-Step Pedagogical Recommendation Engine
 *
 * Implements Krashen's i+1 Comprehensible Input Hypothesis & SLA Acquisition Model.
 * Evaluates candidate HP chapters and TED talks based on:
 *   Score(item) = 0.45 * S_cefr + 0.35 * S_prog + 0.20 * S_vocab
 *
 * Fully compliant with:
 * - Zero Unicode emojis
 * - Warm parchment design system & Apple HIG standards
 * - Defensive fault-tolerant input handling
 */

import { HP_BOOKS } from '../data/chapters.js'
import { BOOKS } from '../data/books.js'
import { TALKS } from '../data/tedData.js'

export const CEFR_ORDER = ['A2', 'B1', 'B2', 'C1']

// Core vocabulary for Chapter 1 fallback reinforcement
const HP1_CORE_KEYWORDS = [
  'cloak', 'peculiar', 'wand', 'owl', 'quill', 'cat', 'drill', 'whisper', 'mirror', 'cup',
  'boy', 'live', 'lived', 'proud', 'normal', 'secret', 'fear', 'discover', 'sister', 'street',
  'letter', 'door', 'magic', 'wizard'
]

// Extended book chapters for higher CEFR tiers defined in BOOKS catalog
const EXTENDED_BOOK_CHAPTERS = {
  book4: [
    { id: 'b4_c01', number: 1, title: 'The Riddle House', cnTitle: '里德尔府', r2Key: 'book4/ch01' }
  ],
  book5: [
    { id: 'b5_c01', number: 1, title: 'Dudley Demented', cnTitle: '摄魂怪的袭击', r2Key: 'book5/ch01' }
  ],
  book6: [
    { id: 'b6_c01', number: 1, title: 'The Other Minister', cnTitle: '另一位部长', r2Key: 'book6/ch01' }
  ],
  book7: [
    { id: 'b7_c01', number: 1, title: 'The Dark Lord Ascending', cnTitle: '黑魔头登势', r2Key: 'book7/ch01' }
  ]
}

/**
 * Computes S_cefr score (0 - 100)
 * - Exact match: 100
 * - Challenge match (next level): 85
 * - Review match (lower level): 70
 * - Other: 40
 */
export function computeCefrScore(itemCefr, userCefr) {
  const normItem = String(itemCefr || 'A2').trim().toUpperCase()
  const normUser = String(userCefr || 'A2').trim().toUpperCase()

  if (normItem === normUser) return 100

  const userIdx = CEFR_ORDER.indexOf(normUser)
  const itemIdx = CEFR_ORDER.indexOf(normItem)

  if (userIdx !== -1 && itemIdx === userIdx + 1) {
    return 85
  }
  if (userIdx !== -1 && itemIdx !== -1 && itemIdx < userIdx) {
    return 70
  }
  return 40
}

/**
 * Normalizes and checks if a given chapter is in the completedChapters list
 */
export function isChapterCompleted(chapter, book, completedChapters) {
  if (!Array.isArray(completedChapters) || completedChapters.length === 0) return false

  const targetId = String(chapter.id || '').trim().toLowerCase()
  const r2Key = String(chapter.r2Key || '').trim().toLowerCase()
  const num = chapter.number
  const bookNumMatch = String(book.id || '').match(/\d+/) || String(book.code || '').match(/\d+/)
  const bookNum = bookNumMatch ? bookNumMatch[0] : ''

  return completedChapters.some(c => {
    if (!c) return false
    const str = String(c).trim().toLowerCase()
    if (str === targetId || str === r2Key) return true

    // Matches identifiers like "hp1_ch1", "b1_c01", "hp-book-1_ep01", "book1/ch01"
    const match = str.match(/(?:hp|book|b)?-?(\d+)?[_/](?:ch|c|ep)?-?(\d+)/)
    if (match) {
      const matchBook = match[1]
      const matchCh = parseInt(match[2], 10)
      if (matchBook && bookNum && matchBook === bookNum && matchCh === num) {
        return true
      }
      if (!matchBook && matchCh === num && (str.includes(`b${bookNum}`) || str.includes(`book${bookNum}`) || str.includes(`hp${bookNum}`))) {
        return true
      }
    }
    return false
  })
}

/**
 * Extracts set of words currently in user's L1~L3 acquisition stage
 */
export function getL1ToL3Words(vocabList) {
  if (!Array.isArray(vocabList)) return new Set()
  const set = new Set()

  for (const entry of vocabList) {
    if (!entry) continue
    if (typeof entry === 'string') {
      const w = entry.trim().toLowerCase()
      if (w) set.add(w)
    } else if (typeof entry === 'object' && entry.word) {
      const w = String(entry.word).trim().toLowerCase()
      const isL4 = Boolean(entry.acquisition && entry.acquisition.l4 === true)
      if (w && !isL4) {
        set.add(w)
      }
    }
  }

  return set
}

/**
 * Calculates vocabulary overlap score (0 - 100)
 */
export function computeVocabScore(words, l1ToL3Words) {
  if (!Array.isArray(words) || words.length === 0 || l1ToL3Words.size === 0) {
    return 0
  }

  let matchCount = 0
  for (const w of words) {
    if (l1ToL3Words.has(String(w).toLowerCase())) {
      matchCount++
    }
  }

  if (matchCount === 0) return 0
  const ratio = matchCount / words.length
  return Math.min(100, Math.round(ratio * 100))
}

/**
 * Extract words associated with a chapter
 */
function getChapterVocabWords(chapter) {
  if (Array.isArray(chapter.vocabSet) && chapter.vocabSet.length > 0) {
    return chapter.vocabSet.map(w => typeof w === 'string' ? w : (w.word || '')).filter(Boolean)
  }
  if (chapter.id === 'b1_c01') {
    return HP1_CORE_KEYWORDS
  }
  return []
}

/**
 * Primary Recommendation Engine API
 *
 * @param {Object} userState
 * @param {string} [userState.cefrLevel='A2'] - Learner current CEFR tier
 * @param {number} [userState.totalListeningSeconds=0] - Cumulative listening time
 * @param {number} [userState.shadowingAverage=0] - Average shadowing accuracy score
 * @param {Array} [userState.vocabList=[]] - User vocabulary list
 * @param {Array} [userState.completedChapters=[]] - IDs of finished chapters
 * @returns {Object} { hpChapter, tedTalk, rationale, category }
 */
export function computeNextStepRecommendation(userState = {}) {
  const safeState = userState && typeof userState === 'object' ? userState : {}
  const rawCefr = String(safeState.cefrLevel || '').trim().toUpperCase()
  const userCefr = CEFR_ORDER.includes(rawCefr) ? rawCefr : 'A2'
  const totalListeningSeconds = Math.max(0, Number(safeState.totalListeningSeconds) || 0)
  const shadowingAverage = Math.max(0, Number(safeState.shadowingAverage) || 0)
  const vocabList = Array.isArray(safeState.vocabList) ? safeState.vocabList : []
  const completedChapters = Array.isArray(safeState.completedChapters) ? safeState.completedChapters : []

  // Safe fallback candidate book 1 chapter 1
  const defaultHpChapter = {
    bookId: 'book1',
    bookCode: 'HP1',
    bookTitle: "Harry Potter and the Philosopher's Stone",
    bookTitleZh: '哈利·波特与魔法石',
    chapterId: 'b1_c01',
    chapterNumber: 1,
    title: 'The Boy Who Lived',
    titleZh: '大难不死的男孩',
    cefr: 'A2',
    color: '#740001',
    score: 100
  }

  // Safe fallback first TED talk
  const firstTalk = Array.isArray(TALKS) && TALKS.length > 0 ? TALKS[0] : null
  const defaultTedTalk = {
    id: firstTalk?.id || 'ted-simon-sinek-2009',
    title: firstTalk?.title || 'How Great Leaders Inspire Action',
    titleCn: firstTalk?.titleCn || '伟大领袖如何激励行动',
    speaker: firstTalk?.speaker || 'Simon Sinek',
    durationSeconds: firstTalk?.durationSeconds || 1088,
    cefr: firstTalk?.cefrLevel || firstTalk?.cefr || 'B1',
    wpm: firstTalk?.wpm || 142,
    topicTags: firstTalk?.topicTags || ['leadership', 'motivation'],
    score: 100
  }

  // Cold-Start Fallback: zero listening history and empty completed chapters
  if (totalListeningSeconds === 0 && completedChapters.length === 0) {
    return {
      hpChapter: defaultHpChapter,
      tedTalk: defaultTedTalk,
      rationale: '欢迎来到霍格沃茨！从第一部第一章开启你的原声魔法之旅。',
      category: 'starter'
    }
  }

  const l1ToL3Words = getL1ToL3Words(vocabList)

  // 1. Prepare and score HP chapter candidates across full BOOKS catalog
  const allChapterCandidates = []
  const booksCatalog = Array.isArray(BOOKS) && BOOKS.length > 0 ? BOOKS : []
  const hpBooksMap = new Map((Array.isArray(HP_BOOKS) ? HP_BOOKS : []).map(b => [b.id, b]))

  for (const bookMeta of booksCatalog) {
    const hpBook = hpBooksMap.get(bookMeta.id)
    const bookCefr = bookMeta.cefr || 'A2'
    const bookColor = bookMeta.color || hpBook?.color || '#740001'
    const bookCode = bookMeta.code || hpBook?.code || 'HP1'
    const bookTitle = bookMeta.title || hpBook?.title || "Harry Potter and the Philosopher's Stone"
    const bookTitleZh = bookMeta.titleZh || hpBook?.cnTitle || '哈利·波特与魔法石'

    let chapters = hpBook?.chapters
    if (!Array.isArray(chapters) || chapters.length === 0) {
      chapters = EXTENDED_BOOK_CHAPTERS[bookMeta.id] || [
        { id: `${bookMeta.id}_c01`, number: 1, title: 'Chapter 1', cnTitle: '第一章', r2Key: `${bookMeta.id}/ch01` }
      ]
    }

    for (const ch of chapters) {
      allChapterCandidates.push({
        chapter: ch,
        book: hpBook || bookMeta,
        bookMeta,
        bookId: bookMeta.id,
        bookCode,
        bookTitle,
        bookTitleZh,
        chapterId: ch.id,
        chapterNumber: ch.number,
        title: ch.title,
        titleZh: ch.cnTitle || ch.title,
        cefr: bookCefr,
        color: bookColor,
        isCompleted: isChapterCompleted(ch, hpBook || bookMeta, completedChapters)
      })
    }
  }

  // Determine progression index and last completed book code
  const completedIndices = []
  let lastCompletedBookCode = ''

  allChapterCandidates.forEach((cand, idx) => {
    if (cand.isCompleted) {
      completedIndices.push(idx)
      lastCompletedBookCode = cand.bookCode
    }
  })

  let immediateNextIndex = 0
  if (completedIndices.length > 0) {
    immediateNextIndex = Math.max(...completedIndices) + 1
  }

  for (let i = 0; i < allChapterCandidates.length; i++) {
    const cand = allChapterCandidates[i]
    // S_cefr
    cand.sCefr = computeCefrScore(cand.cefr, userCefr)

    // S_prog
    if (cand.isCompleted) {
      cand.sProg = 50
    } else if (i === immediateNextIndex) {
      cand.sProg = 100
    } else {
      cand.sProg = 80
    }

    // S_vocab
    const words = getChapterVocabWords(cand.chapter)
    cand.sVocab = computeVocabScore(words, l1ToL3Words)

    // Weighted Score
    cand.score = Math.round((0.45 * cand.sCefr + 0.35 * cand.sProg + 0.20 * cand.sVocab) * 10) / 10
  }

  allChapterCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    return a.chapterNumber - b.chapterNumber
  })

  const topChapterCandidate = allChapterCandidates[0] || {
    ...defaultHpChapter,
    sCefr: 100,
    sProg: 100,
    sVocab: 0
  }

  const selectedHpChapter = {
    bookId: topChapterCandidate.bookId,
    bookCode: topChapterCandidate.bookCode,
    bookTitle: topChapterCandidate.bookTitle,
    bookTitleZh: topChapterCandidate.bookTitleZh,
    chapterId: topChapterCandidate.chapterId,
    chapterNumber: topChapterCandidate.chapterNumber,
    title: topChapterCandidate.title,
    titleZh: topChapterCandidate.titleZh,
    cefr: topChapterCandidate.cefr,
    color: topChapterCandidate.color,
    score: topChapterCandidate.score
  }

  // 2. Prepare and score TED talk candidates
  const allTalkCandidates = []
  const talksSource = Array.isArray(TALKS) && TALKS.length > 0 ? TALKS : []

  const completedTalkIndices = []
  talksSource.forEach((talk, idx) => {
    const isCompleted = completedChapters.includes(talk.id) || (Array.isArray(safeState.completedTalks) && safeState.completedTalks.includes(talk.id))
    if (isCompleted) {
      completedTalkIndices.push(idx)
    }
  })

  let immediateNextTalkIndex = 0
  if (completedTalkIndices.length > 0) {
    immediateNextTalkIndex = Math.max(...completedTalkIndices) + 1
  }

  for (let i = 0; i < talksSource.length; i++) {
    const talk = talksSource[i]
    const talkCefr = talk.cefrLevel || talk.cefr || 'B1'
    const isCompleted = completedChapters.includes(talk.id) || (Array.isArray(safeState.completedTalks) && safeState.completedTalks.includes(talk.id))

    const sCefr = computeCefrScore(talkCefr, userCefr)
    const sProg = isCompleted ? 50 : (i === immediateNextTalkIndex ? 100 : 80)
    const talkWords = Array.isArray(talk.vocabSet)
      ? talk.vocabSet.map(v => typeof v === 'string' ? v : (v.word || '')).filter(Boolean)
      : []
    const sVocab = computeVocabScore(talkWords, l1ToL3Words)
    const score = Math.round((0.45 * sCefr + 0.35 * sProg + 0.20 * sVocab) * 10) / 10

    allTalkCandidates.push({
      id: talk.id,
      title: talk.title,
      titleCn: talk.titleCn || talk.titleZh || talk.title,
      speaker: talk.speaker,
      durationSeconds: talk.durationSeconds || 0,
      cefr: talkCefr,
      wpm: talk.wpm || 0,
      topicTags: Array.isArray(talk.topicTags) ? talk.topicTags : [],
      isCompleted,
      sCefr,
      sProg,
      sVocab,
      score
    })
  }

  allTalkCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    return 0
  })

  const topTalkCandidate = allTalkCandidates[0] || {
    ...defaultTedTalk,
    sCefr: 100,
    sProg: 100,
    sVocab: 0
  }

  const selectedTedTalk = {
    id: topTalkCandidate.id,
    title: topTalkCandidate.title,
    titleCn: topTalkCandidate.titleCn,
    speaker: topTalkCandidate.speaker,
    durationSeconds: topTalkCandidate.durationSeconds,
    cefr: topTalkCandidate.cefr,
    wpm: topTalkCandidate.wpm,
    topicTags: topTalkCandidate.topicTags,
    score: topTalkCandidate.score
  }

  // 3. Determine rationale and category based on highest scoring pedagogical dimension
  let category = 'progress'
  let rationale = ''

  const userIdx = CEFR_ORDER.indexOf(userCefr)
  const chIdx = CEFR_ORDER.indexOf(selectedHpChapter.cefr)
  const isHpChallenge = chIdx > userIdx
  const hasVocabOverlap = (topTalkCandidate.sVocab > 0 || topChapterCandidate.sVocab > 0) && l1ToL3Words.size > 0

  if (hasVocabOverlap && (topTalkCandidate.sVocab >= 25 || topChapterCandidate.sVocab >= 25)) {
    category = 'vocab'
    rationale = '本内容包含你生词本中的核心考纲词汇，推荐在原版原声语境中强化记忆。'
  } else if (topChapterCandidate.sProg === 100) {
    category = 'progress'
    if (completedIndices.length > 0) {
      const bookCode = lastCompletedBookCode || selectedHpChapter.bookCode || 'HP1'
      rationale = `承接上一章（${bookCode}）的学习进度，趁热打铁开启新篇章。`
    } else {
      const bookCode = selectedHpChapter.bookCode || 'HP1'
      rationale = `从${bookCode}第一章开启原版听说之旅，循序渐进打牢听力与语感基础。`
    }
  } else if (isHpChallenge || shadowingAverage >= 85) {
    category = 'challenge'
    const targetCefr = selectedHpChapter.cefr !== userCefr ? selectedHpChapter.cefr : selectedTedTalk.cefr
    rationale = `鉴于你在前期学习中展现出的优异能力，推荐向更高阶的 CEFR ${targetCefr} 目标挑战！`
  } else {
    category = 'progress'
    if (completedIndices.length > 0) {
      const bookCode = lastCompletedBookCode || selectedHpChapter.bookCode || 'HP1'
      rationale = `承接上一章（${bookCode}）的学习进度，趁热打铁开启新篇章。`
    } else {
      const bookCode = selectedHpChapter.bookCode || 'HP1'
      rationale = `从${bookCode}第一章开启原版听说之旅，循序渐进打牢听力与语感基础。`
    }
  }


  return {
    hpChapter: selectedHpChapter,
    tedTalk: selectedTedTalk,
    rationale,
    category
  }
}
