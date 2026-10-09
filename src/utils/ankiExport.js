/**
 * Anki TSV/CSV Export Pipeline
 * Strictly adheres to Anki formatting standards and directives.
 */

function sanitizeForTSV(str) {
  if (!str) return ''
  return String(str)
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, '<br>')
}

function boldWordInContext(quote, word) {
  if (!quote) return ''
  if (!word) return sanitizeForTSV(quote)

  const cleanWord = word.trim().replace(/[^a-zA-Z0-9]/g, '')
  if (!cleanWord) return sanitizeForTSV(quote)

  const regex = new RegExp(`\\b(${cleanWord})\\b`, 'gi')
  let result = quote.replace(regex, '<b>$1</b>')

  if (!result.includes('<b>')) {
    const looseRegex = new RegExp(`(${cleanWord})`, 'gi')
    result = quote.replace(looseRegex, '<b>$1</b>')
  }

  return sanitizeForTSV(result)
}

function formatAudioTimestamp(entry) {
  if (entry.audioTimestamp) return sanitizeForTSV(entry.audioTimestamp)

  const start = entry.startTime !== undefined ? Number(entry.startTime) : null
  const end = entry.endTime !== undefined ? Number(entry.endTime) : null

  if (start !== null) {
    const formatSeconds = (sec) => {
      const mins = Math.floor(sec / 60)
      const secs = (sec % 60).toFixed(2)
      const padMins = String(mins).padStart(2, '0')
      const padSecs = String(secs).padStart(5, '0')
      return `${padMins}:${padSecs}`
    }

    if (end !== null && end > start) {
      return `${formatSeconds(start)} - ${formatSeconds(end)}`
    }
    return formatSeconds(start)
  }

  return ''
}

export function generateAnkiTSV(vocabList = [], options = {}) {
  const deckName = options.deckName || 'Hogwarts Magic English'

  const header = [
    '#separator:Tab',
    '#html:true',
    '#tags column:7',
    `#deck:${deckName}`
  ].join('\n')

  if (!vocabList || !Array.isArray(vocabList) || vocabList.length === 0) {
    return header + '\n'
  }

  const rows = vocabList.map((entry) => {
    const front = sanitizeForTSV(entry.word || entry.front || '')
    const phonetic = sanitizeForTSV(entry.phonetic || entry.ipa || '')
    const pos = sanitizeForTSV(entry.partOfSpeech || entry.pos || '')

    const def = entry.definition || entry.meaning || entry.back || ''
    const lore = entry.lore ? `<br><i>Lore: ${entry.lore}</i>` : ''
    const back = sanitizeForTSV(def + lore)

    const contextQuote = boldWordInContext(entry.contextQuote || entry.quote || '', entry.word || entry.front || '')
    const timestamp = formatAudioTimestamp(entry)

    let tags = entry.tags || []
    if (typeof tags === 'string') {
      tags = tags.split(/\s+/).filter(Boolean)
    }
    if (entry.chapterId && !tags.some((t) => t.includes(entry.chapterId))) {
      tags.push(`Hogwarts::${entry.chapterId}`)
    }
    if (entry.bookId && !tags.some((t) => t.includes(entry.bookId))) {
      tags.push(`Hogwarts::${entry.bookId}`)
    }
    const tagsStr = tags.join(' ')

    return [front, phonetic, pos, back, contextQuote, timestamp, tagsStr].join('\t')
  })

  return `${header}\n${rows.join('\n')}\n`
}

export function downloadAnkiFile(content, filename = 'hogwarts_anki_deck.txt') {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
