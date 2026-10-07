/**
 * AI Speech Pronunciation Scoring Engine
 * Evaluates spoken speech against reference sentence cues.
 * Strictly adheres to PROJECT.md § Speech Scoring Engine Contract.
 */

// 1. Soundex Phonetic Encoder with Cache
const soundexCache = new Map();
const MAX_SOUNDEX_CACHE = 1000;

export function soundex(str) {
  if (!str || typeof str !== 'string') return '';
  const cached = soundexCache.get(str);
  if (cached !== undefined) return cached;

  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '';

  const table = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  let code = s[0];
  let prevDigit = table[s[0]] || '';

  for (let i = 1; i < s.length && code.length < 4; i++) {
    const char = s[i];
    const digit = table[char];

    if (digit) {
      if (digit !== prevDigit) {
        code += digit;
      }
      prevDigit = digit;
    } else if (char === 'H' || char === 'W') {
      // H and W do not separate consonants with the same code: keep prevDigit unchanged
    } else {
      // Vowels (A, E, I, O, U, Y) separate consonants: reset prevDigit to empty
      prevDigit = '';
    }
  }

  while (code.length < 4) code += '0';
  const result = code.slice(0, 4);

  if (soundexCache.size >= MAX_SOUNDEX_CACHE) {
    const firstKey = soundexCache.keys().next().value;
    soundexCache.delete(firstKey);
  }
  soundexCache.set(str, result);
  return result;
}

// 2. Space-Optimized Levenshtein Distance (Thread/Re-entrant Safe)
export function levenshteinDistance(s1, s2) {
  if (!s1) return s2 ? s2.length : 0;
  if (!s2) return s1.length;
  if (s1 === s2) return 0;

  const m = s1.length;
  const n = s2.length;

  const prev = new Int32Array(n + 1);
  const curr = new Int32Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const c1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const c2 = s2.charCodeAt(j - 1);
      const cost = c1 === c2 ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
    }
  }
  return prev[n];
}

// 3. Known Equivalences & Contractions
export const EQUIVALENCES = {
  '0': 'zero', 'zero': '0',
  '1': 'one', 'one': '1',
  '2': 'two', 'two': '2',
  '3': 'three', 'three': '3',
  '4': 'four', 'four': '4',
  '5': 'five', 'five': '5',
  '6': 'six', 'six': '6',
  '7': 'seven', 'seven': '7',
  '8': 'eight', 'eight': '8',
  '9': 'nine', 'nine': '9',
  '10': 'ten', 'ten': '10',
  'mr': 'mister', 'mister': 'mr',
  'mrs': 'missus', 'missus': 'mrs',
  'dr': 'doctor', 'doctor': 'dr',
  'st': 'saint', 'saint': 'st',
  'their': 'there', 'there': 'their',
  'theyre': 'there',
  'hear': 'here', 'here': 'hear',
  'knight': 'night', 'night': 'knight',
  'witch': 'which', 'which': 'witch',
  'to': 'too', 'too': 'to',
  'no': 'know', 'know': 'no',
  'buy': 'by', 'by': 'buy',
  // British vs American spelling equivalences
  'colour': 'color', 'color': 'colour',
  'favour': 'favor', 'favor': 'favour',
  'honour': 'honor', 'honor': 'honour',
  'neighbour': 'neighbor', 'neighbor': 'neighbour',
  'theatre': 'theater', 'theater': 'theatre',
  'centre': 'center', 'center': 'centre',
  'grey': 'gray', 'gray': 'grey',
  'programme': 'program', 'program': 'programme',
  'travelling': 'traveling', 'traveling': 'travelling'
};

export const CONTRACTIONS = {
  "didn't": "did not",
  "don't": "do not",
  "doesn't": "does not",
  "can't": "can not",
  "couldn't": "could not",
  "won't": "will not",
  "wouldn't": "would not",
  "shouldn't": "should not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "it's": "it is",
  "that's": "that is",
  "what's": "what is",
  "there's": "there is",
  "here's": "here is",
  "who's": "who is",
  "he's": "he is",
  "she's": "she is",
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will",
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would"
};

// 4. Word Normalization & Tokenization
export function cleanWord(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
}

// 5. Word Comparison
export function compareWords(targetClean, spokenClean) {
  if (!targetClean || !spokenClean) {
    return { status: 'inaccurate', score: 0.0 };
  }

  const t = targetClean.toLowerCase();
  const s = spokenClean.toLowerCase();

  // 1. Exact string match
  if (t === s) {
    return { status: 'matched', score: 1.0 };
  }

  // 2. Homophone / Number / UK-US spelling equivalence
  if (EQUIVALENCES[t] === s || EQUIVALENCES[s] === t) {
    return { status: 'matched', score: 1.0 };
  }

  // 3. Contraction apostrophe tolerance (e.g., "didn't" vs "didnt")
  const tNoApostrophe = t.replace(/'/g, '');
  const sNoApostrophe = s.replace(/'/g, '');
  if (tNoApostrophe === sNoApostrophe) {
    return { status: 'matched', score: 1.0 };
  }

  // 4. Edit distance & phonetic similarity
  const dist = levenshteinDistance(tNoApostrophe, sNoApostrophe);
  const maxLen = Math.max(tNoApostrophe.length, sNoApostrophe.length);
  const similarity = maxLen > 0 ? (1 - dist / maxLen) : 0;

  // Criteria for partial match (amber, 60% credit):
  // - Small edit distance (<= 2) while being strictly less than word length (avoids matching 1-letter words)
  // - High character similarity (>= 0.70)
  // - Soundex phonetic match
  const isPartial = (dist <= 2 && dist < maxLen) ||
                    similarity >= 0.70 ||
                    (soundex(tNoApostrophe) === soundex(sNoApostrophe) && soundex(tNoApostrophe) !== '');

  if (isPartial) {
    return { status: 'partial', score: 0.6, dist, similarity };
  }

  return { status: 'inaccurate', score: 0.0, dist, similarity };
}

// 6. Main Evaluation Function
export function evaluatePronunciation(targetSentence, spokenText, isFallback = false) {
  const startTime = performance.now();

  const isExplicitOrEmptyFallback = Boolean(isFallback || !spokenText || spokenText.trim().length === 0);

  if (!targetSentence || typeof targetSentence !== 'string') {
    return {
      score: 0,
      words: [],
      transcript: spokenText || '',
      isFallback: isExplicitOrEmptyFallback,
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  // Normalize em-dashes and smart quotes in target text
  const normalizedTarget = targetSentence
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  // Split tokens preserving original word forms
  const targetTokens = normalizedTarget
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);

  if (targetTokens.length === 0) {
    return {
      score: 0,
      words: [],
      transcript: spokenText || '',
      isFallback: isExplicitOrEmptyFallback,
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  // Pre-clean target tokens
  const tClean = targetTokens.map(t => cleanWord(t));

  // If user spoken text is empty, return 0 score and mark all words inaccurate
  if (!spokenText || spokenText.trim().length === 0) {
    const words = targetTokens.map(rawWord => ({
      word: rawWord,
      status: 'inaccurate',
      score: 0.0
    }));
    return {
      score: 0,
      words,
      transcript: '',
      isFallback: true,
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  const normalizedSpoken = (spokenText || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  const spokenTokens = normalizedSpoken
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);

  const sClean = spokenTokens.map(s => cleanWord(s));

  const N = targetTokens.length;
  const M = spokenTokens.length;

  // 2D DP Table for Global Monotonic Sequence Alignment
  // dp[i][j]: best alignment score between prefix target[0..i-1] and prefix spoken[0..j-1]
  const dp = Array.from({ length: N + 1 }, () => new Float32Array(M + 1));
  const traceback = Array.from({ length: N + 1 }, () => new Uint8Array(M + 1));
  // Traceback directions:
  // 1: 1-to-1 match/mismatch
  // 2: target omission (skip target word)
  // 3: spoken insertion (skip extra spoken word)
  // 4: 1-to-2 contraction (target 1 word -> spoken 2 words, e.g. you'd -> you would)
  // 5: 2-to-1 contraction (target 2 words -> spoken 1 word, e.g. did not -> didn't)
  // 6: pure punctuation target skip (no spoken speech needed)

  const GAP_TARGET = -0.2;
  const GAP_SPOKEN = -0.1;

  for (let i = 1; i <= N; i++) {
    if (tClean[i - 1] === '') {
      dp[i][0] = dp[i - 1][0];
      traceback[i][0] = 6;
    } else {
      dp[i][0] = dp[i - 1][0] + GAP_TARGET;
      traceback[i][0] = 2;
    }
  }
  for (let j = 1; j <= M; j++) {
    dp[0][j] = dp[0][j - 1] + GAP_SPOKEN;
    traceback[0][j] = 3;
  }

  const compCache = new Map();
  const getComp = (tc, sc) => {
    const key = tc + '\0' + sc;
    let cached = compCache.get(key);
    if (cached === undefined) {
      cached = compareWords(tc, sc);
      compCache.set(key, cached);
    }
    return cached;
  };

  for (let i = 1; i <= N; i++) {
    const tc = tClean[i - 1];

    for (let j = 1; j <= M; j++) {
      if (tc === '') {
        // Pure punctuation token in target (e.g. "—", "...")
        dp[i][j] = dp[i - 1][j];
        traceback[i][j] = 6;
        continue;
      }

      const sc = sClean[j - 1];
      const comp = getComp(tc, sc);

      let matchScore = -0.6;
      if (comp.status === 'matched') {
        matchScore = 2.0;
      } else if (comp.status === 'partial') {
        matchScore = 1.0;
      }

      let bestScore = dp[i - 1][j - 1] + matchScore;
      let bestDir = 1;

      // Check 1-to-2 contraction: target "you'd" -> spoken "you would"
      if (j >= 2) {
        const spokenPair = (sClean[j - 2] + ' ' + sClean[j - 1]).trim();
        const expandedTarget = CONTRACTIONS[tc];
        if (expandedTarget && expandedTarget === spokenPair) {
          const score1to2 = dp[i - 1][j - 2] + 2.5;
          if (score1to2 > bestScore) {
            bestScore = score1to2;
            bestDir = 4;
          }
        }
      }

      // Check 2-to-1 contraction: target "did not" -> spoken "didn't"
      if (i >= 2) {
        const targetPair = (tClean[i - 2] + ' ' + tClean[i - 1]).trim();
        const expandedSpoken = CONTRACTIONS[sc];
        if (expandedSpoken && expandedSpoken === targetPair) {
          const score2to1 = dp[i - 2][j - 1] + 4.5;
          if (score2to1 > bestScore) {
            bestScore = score2to1;
            bestDir = 5;
          }
        }
      }

      // Target omission
      const scoreOmit = dp[i - 1][j] + GAP_TARGET;
      if (scoreOmit > bestScore) {
        bestScore = scoreOmit;
        bestDir = 2;
      }

      // Spoken insertion
      const scoreInsert = dp[i][j - 1] + GAP_SPOKEN;
      if (scoreInsert > bestScore) {
        bestScore = scoreInsert;
        bestDir = 3;
      }

      dp[i][j] = bestScore;
      traceback[i][j] = bestDir;
    }
  }

  // Backtracking
  let i = N;
  let j = M;
  const targetMap = new Map();

  while (i > 0 || j > 0) {
    let dir;
    if (i > 0 && j > 0) {
      dir = traceback[i][j];
    } else if (i > 0) {
      dir = (tClean[i - 1] === '') ? 6 : 2;
    } else {
      dir = 3;
    }

    if (dir === 1 && i >= 1 && j >= 1) {
      targetMap.set(i - 1, { spokenWords: [spokenTokens[j - 1]], type: '1-1' });
      i--;
      j--;
    } else if (dir === 4 && i >= 1 && j >= 2) {
      targetMap.set(i - 1, { spokenWords: [spokenTokens[j - 2], spokenTokens[j - 1]], type: '1-2' });
      i--;
      j -= 2;
    } else if (dir === 5 && i >= 2 && j >= 1) {
      targetMap.set(i - 1, { spokenWords: [spokenTokens[j - 1]], type: '2-1-second' });
      targetMap.set(i - 2, { spokenWords: [spokenTokens[j - 1]], type: '2-1-first' });
      i -= 2;
      j--;
    } else if (dir === 6 && i >= 1) {
      targetMap.set(i - 1, { spokenWords: [], type: 'punct' });
      i--;
    } else if (dir === 2) {
      targetMap.set(i - 1, { spokenWords: [], type: 'omission' });
      i--;
    } else {
      // dir === 3: spoken insertion, skip spoken token
      j--;
    }
  }

  // Score accumulation and word status construction
  let totalCredit = 0;
  const words = targetTokens.map((rawWord, idx) => {
    const mapping = targetMap.get(idx);

    if (!mapping || mapping.type === 'omission') {
      return {
        word: rawWord,
        status: 'inaccurate',
        score: 0.0
      };
    }

    if (mapping.type === 'punct') {
      totalCredit += 1.0;
      return {
        word: rawWord,
        status: 'matched',
        score: 1.0
      };
    }

    if (mapping.type === '1-2') {
      totalCredit += 1.0;
      return {
        word: rawWord,
        status: 'matched',
        score: 1.0,
        matchedSpokenWord: mapping.spokenWords.join(' ')
      };
    }

    if (mapping.type === '2-1-first' || mapping.type === '2-1-second') {
      totalCredit += 1.0;
      return {
        word: rawWord,
        status: 'matched',
        score: 1.0,
        matchedSpokenWord: mapping.spokenWords[0]
      };
    }

    const sWord = mapping.spokenWords[0];
    const comp = compareWords(tClean[idx], cleanWord(sWord));
    totalCredit += comp.score;

    return {
      word: rawWord,
      status: comp.status,
      score: comp.score,
      matchedSpokenWord: sWord
    };
  });

  const normalizedScore = N > 0 ? Math.min(100, Math.max(0, Math.round((totalCredit / N) * 100))) : 0;
  const latencyMs = Number((performance.now() - startTime).toFixed(2));

  return {
    score: normalizedScore,
    words,
    transcript: spokenText,
    isFallback: false,
    latencyMs
  };
}

// 7. Speech Recognition Browser Support Check
export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
