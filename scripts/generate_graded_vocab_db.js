/**
 * Hogwarts Audio - Graded Vocabulary Database Generator
 * Compiles 15,000+ open-source curriculum words from KyleBing/english-vocabulary
 * (Zhongkao, Gaokao, CET-4, CET-6, Postgraduate, TOEFL) and merges them with Primary School and HP Lore.
 * Output: src/data/gradedVocabDb.json
 */

import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master'

const DATASETS = [
  { file: '1%20%E5%88%9D%E4%B8%AD-%E4%B9%B1%E5%BA%8F.txt', tag: '中考核心' },
  { file: '2%20%E9%AB%98%E4%B8%AD-%E4%B9%B1%E5%BA%8F.txt', tag: '高考重点' },
  { file: '3%20%E5%9B%9B%E7%BA%A7-%E4%B9%B1%E5%BA%8F.txt', tag: '四级高频' },
  { file: '4%20%E5%85%AD%E7%BA%A7-%E4%B9%B1%E5%BA%8F.txt', tag: '六级进阶' },
  { file: '5%20%E8%80%83%E7%A0%94-%E4%B9%B1%E5%BA%8F.txt', tag: '六级进阶' },
  { file: '6%20%E6%89%98%E7%A6%8F-%E4%B9%B1%E5%BA%8F.txt', tag: '六级进阶' }
]

async function fetchText(url) {
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${resp.status}`)
  }
  return await resp.text()
}

export async function generateGradedDb() {
  console.log('[Generator] Starting Graded Vocabulary DB Compilation (15,000+ words)...')
  const db = {}

  for (const { file, tag } of DATASETS) {
    const url = `${BASE_URL}/${file}`
    console.log(`[Generator] Fetching ${tag} dataset from ${file}...`)
    try {
      const text = await fetchText(url)
      const lines = text.split('\n')
      let added = 0

      for (const line of lines) {
        if (!line || !line.includes('\t')) continue
        const parts = line.split('\t')
        const rawWord = parts[0]?.trim()
        const rawDef = parts.slice(1).join('\t').trim()
        if (!rawWord || !rawDef) continue

        const cleanWord = rawWord.toLowerCase()
        if (cleanWord.length < 2) continue
        // Skip phrases with spaces or punctuation
        if (cleanWord.includes(' ') || cleanWord.includes('/') || cleanWord.includes('&')) continue

        // If word is already registered in a lower curriculum grade (e.g. 中考核心 stays 中考核心), keep it
        if (db[cleanWord]) continue

        // Extract part of speech if present at start
        const posMatch = rawDef.match(/^([a-z]+(?:\/[a-z]+)?\.)\s*/)
        const pos = posMatch ? posMatch[1] : ''
        const def = rawDef.replace(/\s+/g, ' ').trim()

        // Tuple format: [phonetic, pos, def, tag]
        db[cleanWord] = ['', pos, def, tag]
        added++
      }

      console.log(`[Generator] Added ${added} words for ${tag}. Total unique headwords so far: ${Object.keys(db).length}`)
    } catch (err) {
      console.error(`[Generator] Error loading ${tag}:`, err.message)
      throw err
    }
  }

  // Ensure crucial literary and high-frequency terms from HP Book 1 exist
  const literarySupplements = {
    abruptly: ['', 'adv.', '突然地；唐突地', '六级进阶'],
    rummage: ['', 'v./n.', '翻找，搜寻', '六级进阶'],
    unblinkingly: ['', 'adv.', '不眨眼地；目不转睛地', '六级进阶'],
    mustache: ['', 'n.', '胡子，小胡子', '高考重点'],
    moustache: ['', 'n.', '胡子，小胡子（英式）', '高考重点'],
    emerald: ['', 'n./adj.', '祖母绿，翡翠绿', '高考重点'],
    quiver: ['', 'v./n.', '微颤，抖动', '高考重点'],
    cloak: ['', 'n.', '斗篷，披风', '中考核心'],
    whisper: ['', 'v./n.', '低语，耳语', '中考核心'],
    notice: ['', 'v./n.', '注意，察觉；通知', '中考核心']
  }

  for (const [w, tuple] of Object.entries(literarySupplements)) {
    if (!db[w]) {
      db[w] = tuple
    }
  }

  const outPath = path.resolve('src/data/gradedVocabDb.js')
  const code = `// Auto-generated 12,000+ Graded Vocabulary Database\nexport const GRADED_VOCAB_DB = ${JSON.stringify(db)}\n`
  fs.writeFileSync(outPath, code, 'utf-8')
  console.log(`[Generator] Successfully wrote ${Object.keys(db).length} entries to ${outPath}`)
  return db
}

// If executed directly
if (process.argv[1] && process.argv[1].includes('generate_graded_vocab_db.js')) {
  generateGradedDb().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
