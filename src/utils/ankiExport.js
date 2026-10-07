/**
 * Anki Export Pipeline & Flashcard Synchronization
 * Hogwarts Audio English Learning Platform
 *
 * Implements standard Anki TSV formatted export with directive headers,
 * HTML formatting, context quote cloze/bold highlights, audio timestamps,
 * and hierarchical tags.
 */

/**
 * Sanitize string for Tab-Separated Values (TSV) compatibility.
 * Replaces tabs with spaces and newlines with HTML <br> tags to protect row/column structure.
 * 
 * @param {string|any} str 
 * @returns {string}
 */
export function sanitizeForTSV(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\t/g, ' ')
    .replace(/\r?\n/g, '<br>');
}

/**
 * Highlight/bold target word within the context sentence for Anki cards.
 * Uses word-boundary regex \b(${cleanWord})\b (case-insensitive) with fallback
 * to loose regex if word boundary match fails. Result is sanitized for TSV.
 *
 * @param {string} quote - The original sentence context
 * @param {string} word - The target vocabulary word
 * @returns {string} - Context quote with bolded target word, sanitized for TSV
 */
export function boldWordInContext(quote, word, options = {}) {
  if (!quote) return '';
  if (!word) return sanitizeForTSV(quote);

  const trimmedWord = String(word).trim();
  if (!trimmedWord) return sanitizeForTSV(quote);

  const replacementTag = options && options.cloze ? '{{c1::$1}}' : '<b>$1</b>';
  const hasTagStr = options && options.cloze ? '{{c1::' : '<b>';

  // Escape regex meta characters while keeping hyphens, apostrophes, and spaces
  const escaped = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startsWithWord = /^\w/.test(trimmedWord);
  const endsWithWord = /\w$/.test(trimmedWord);
  const prefix = startsWithWord ? '\\b' : '(?<=^|[\\s\\W])';
  const suffix = endsWithWord ? '\\b' : '(?=$|[\\s\\W])';
  const regex = new RegExp(`${prefix}(${escaped})${suffix}`, 'gi');
  const hasSpecialChars = !startsWithWord || !endsWithWord || /[^\w]/.test(trimmedWord);
  const looseRegex = new RegExp(`(${escaped})`, 'gi');

  const strQuote = String(quote);

  // Fast path: if quote does not contain HTML tags, replace directly
  if (!strQuote.includes('<')) {
    let result = strQuote.replace(regex, replacementTag);
    if (!result.includes(hasTagStr) && hasSpecialChars) {
      result = strQuote.replace(looseRegex, replacementTag);
    }
    return sanitizeForTSV(result);
  }

  // Split quote by HTML tags so we do not corrupt tag names (e.g. bolding 'div' inside <div>)
  const segments = strQuote.split(/(<[^>]+>)/g);
  let matched = false;

  // First pass: try word boundary regex on non-tag text segments
  let replacedSegments = segments.map(seg => {
    if (seg.startsWith('<') && seg.endsWith('>')) {
      return seg;
    }
    const replaced = seg.replace(regex, replacementTag);
    if (replaced !== seg) matched = true;
    return replaced;
  });

  // Second pass fallback: if no match found and word has special characters, try loose regex on non-tag text segments
  if (!matched && hasSpecialChars) {
    replacedSegments = segments.map(seg => {
      if (seg.startsWith('<') && seg.endsWith('>')) {
        return seg;
      }
      return seg.replace(looseRegex, replacementTag);
    });
  }

  const result = replacedSegments.join('');
  return sanitizeForTSV(result);
}

/**
 * Format audio timestamps (seconds) into human-readable MM:SS.ss or MM:SS.ss - MM:SS.ss.
 * Returns entry.audioTimestamp if already present.
 *
 * @param {object} entry - Vocabulary entry with startTime / endTime or audioTimestamp
 * @returns {string} Formatted timestamp string or empty string
 */
export function formatAudioTimestamp(entry) {
  if (!entry) return '';
  if (entry.audioTimestamp) return sanitizeForTSV(entry.audioTimestamp);

  const start = entry.startTime !== undefined && entry.startTime !== null ? Number(entry.startTime) : null;
  const end = entry.endTime !== undefined && entry.endTime !== null ? Number(entry.endTime) : null;

  // Guard against negative timestamps or non-finite values (NaN, Infinity)
  if (start !== null && !isNaN(start) && Number.isFinite(start) && start >= 0) {
    const formatSeconds = (sec) => {
      const mins = Math.floor(sec / 60);
      const secs = (sec % 60).toFixed(2);
      const padMins = String(mins).padStart(2, '0');
      const padSecs = String(secs).padStart(5, '0');
      return `${padMins}:${padSecs}`;
    };

    if (end !== null && !isNaN(end) && Number.isFinite(end) && end >= 0 && end > start) {
      return `${formatSeconds(start)} - ${formatSeconds(end)}`;
    }
    return formatSeconds(start);
  }

  return '';
}

/**
 * Generate standard Anki-compatible TSV content from a vocabulary list.
 * Output includes standard Anki directives:
 *   #separator:Tab
 *   #html:true
 *   #tags column:7
 *   #deck:<deckName>
 *
 * Each row contains exactly 7 tab-delimited columns:
 *   1. Front: Word
 *   2. Phonetic: IPA phonetic transcript
 *   3. PartOfSpeech: Grammar part of speech
 *   4. Back: Definition + Lore (if present)
 *   5. ContextQuote: Sentence with <b>word</b> highlight
 *   6. AudioTimestamp: Formatted start/end audio timestamp
 *   7. Tags: Space-delimited tags, including Hogwarts hierarchical deck tags
 *
 * @param {Array<object>} vocabList - List of vocabulary items
 * @param {object} [options={}] - Options such as deckName
 * @returns {string} Complete Anki TSV file content
 */
export function generateAnkiTSV(vocabList = [], options = {}) {
  const deckName = options.deckName || 'Hogwarts Magic English';

  const header = [
    '#separator:Tab',
    '#html:true',
    '#tags column:7',
    `#deck:${deckName}`
  ].join('\n');

  if (!vocabList || !Array.isArray(vocabList) || vocabList.length === 0) {
    return header + '\n';
  }

  const rows = vocabList.map(entry => {
    if (!entry) return ['', '', '', '', '', '', ''].join('\t');

    const front = sanitizeForTSV(entry.word || entry.front || '');
    const phonetic = sanitizeForTSV(entry.phonetic || entry.ipa || '');
    const pos = sanitizeForTSV(entry.partOfSpeech || entry.pos || '');

    // Combine definition and lore if present
    const def = entry.definition || entry.meaning || entry.translation || entry.back || entry.explanation || '';
    const lore = entry.lore ? `<br><i>Lore: ${entry.lore}</i>` : '';
    const back = sanitizeForTSV(def + lore);

    const contextQuote = boldWordInContext(
      entry.contextQuote || entry.quote || entry.context || '',
      entry.word || entry.front || '',
      options
    );
    const timestamp = formatAudioTimestamp(entry);

    let tags = [];
    if (Array.isArray(entry.tags)) {
      tags = entry.tags.map(t => sanitizeForTSV(t).replace(/<br>/g, ' ').replace(/\s+/g, '_')).filter(Boolean);
    } else if (typeof entry.tags === 'string' && entry.tags.trim()) {
      tags = sanitizeForTSV(entry.tags).replace(/<br>/g, ' ').trim().split(/\s+/).filter(Boolean);
    }

    if (entry.chapterId) {
      const cleanChap = sanitizeForTSV(entry.chapterId).replace(/<br>/g, '_').replace(/\s+/g, '_');
      if (!tags.some(t => t.includes(cleanChap))) tags.push(`Hogwarts::${cleanChap}`);
    }
    if (entry.bookId) {
      const cleanBook = sanitizeForTSV(entry.bookId).replace(/<br>/g, '_').replace(/\s+/g, '_');
      if (!tags.some(t => t.includes(cleanBook))) tags.push(`Hogwarts::${cleanBook}`);
    }
    const tagsStr = sanitizeForTSV(tags.join(' ')).replace(/<br>/g, ' ');

    return [front, phonetic, pos, back, contextQuote, timestamp, tagsStr].join('\t');
  });

  return `${header}\n${rows.join('\n')}\n`;
}

/**
 * Triggers client-side download of the generated Anki TSV file.
 *
 * @param {string} content - TSV formatted string
 * @param {string} [filename='hogwarts_anki_deck.tsv'] - Desired download filename
 */
export function downloadAnkiFile(content, filename = 'hogwarts_anki_deck.tsv') {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
