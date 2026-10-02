/**
 * Reference Oracle for R1 Speech Scoring Engine.
 * Strictly adheres to PROJECT.md § Speech Scoring Engine Contract.
 */

function cleanWord(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9']/g, '');
}

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function wordSimilarity(w1, w2) {
  if (w1 === w2) return 1.0;
  const maxLen = Math.max(w1.length, w2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(w1, w2);
  return 1 - dist / maxLen;
}

export function evaluatePronunciation(targetSentence, spokenText) {
  const startTime = performance.now();

  const isFallback = !spokenText || spokenText.trim().length === 0;
  const targetTokens = (targetSentence || '')
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);

  // If target sentence is empty, return 0 score and empty words
  if (targetTokens.length === 0) {
    return {
      score: 0,
      words: [],
      transcript: spokenText || '',
      isFallback,
      latencyMs: Math.round(performance.now() - startTime)
    };
  }

  const spokenTokens = (spokenText || '')
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);

  let spokenIndex = 0;
  let totalScoreSum = 0;

  const words = targetTokens.map((rawWord) => {
    // Strip trailing punctuation from word display or keep word
    const cleanedTarget = cleanWord(rawWord);
    if (!cleanedTarget) {
      totalScoreSum += 1.0;
      return {
        word: rawWord,
        status: 'matched',
        score: 1.0
      };
    }

    if (spokenIndex >= spokenTokens.length) {
      return {
        word: rawWord,
        status: 'inaccurate',
        score: 0.0
      };
    }

    // Try finding match in spoken window
    let bestMatch = null;
    let bestScore = -1;
    let bestOffset = -1;

    for (let offset = 0; offset <= 3 && (spokenIndex + offset) < spokenTokens.length; offset++) {
      const candidate = cleanWord(spokenTokens[spokenIndex + offset]);
      const sim = wordSimilarity(cleanedTarget, candidate);
      if (sim > bestScore) {
        bestScore = sim;
        bestMatch = candidate;
        bestOffset = offset;
      }
      if (sim === 1.0) break;
    }

    if (cleanedTarget === bestMatch) {
      spokenIndex += bestOffset + 1;
      totalScoreSum += 1.0;
      return {
        word: rawWord,
        status: 'matched',
        score: 1.0,
        matchedSpokenWord: bestMatch
      };
    } else if (bestScore >= 0.55) {
      spokenIndex += bestOffset + 1;
      totalScoreSum += 0.6;
      return {
        word: rawWord,
        status: 'partial',
        score: 0.6,
        matchedSpokenWord: bestMatch
      };
    } else {
      return {
        word: rawWord,
        status: 'inaccurate',
        score: 0.0
      };
    }
  });

  const normalizedScore = Math.min(100, Math.max(0, Math.round((totalScoreSum / words.length) * 100)));
  const latencyMs = Math.round(performance.now() - startTime);

  return {
    score: normalizedScore,
    words,
    transcript: spokenText || '',
    isFallback,
    latencyMs
  };
}
