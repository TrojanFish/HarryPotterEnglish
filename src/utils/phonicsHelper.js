/**
 * phonicsHelper.js
 * Kid-friendly Syllable Splitter and Natural Phonics (自然拼读) Scaffolding
 * Designed specifically for primary and junior high school English learners.
 */

// Common prefix patterns
const PREFIXES = [
  'trans', 'inter', 'super', 'under', 'over', 'anti',
  'dis', 'mis', 'pre', 'pro', 'sub', 'non', 'con', 'com', 'per', 'for'
];

// Common suffix patterns
const SUFFIXES = [
  'action', 'ation', 'ition', 'ution', 'sion', 'tion',
  'able', 'ible', 'fully', 'less', 'ment', 'ness',
  'ship', 'hood', 'ward', 'like', 'wise',
  'ing', 'ful', 'ous', 'ive', 'est', 'ity', 'cal'
];

/**
 * Split an English word into syllables for student pronunciation scaffolding
 * @param {string} word 
 * @returns {string[]} Syllables
 */
export function splitSyllables(word) {
  if (!word) return [];
  const clean = word.trim();
  if (clean.length <= 3) return [clean];

  // Specific common Harry Potter & classical words lookup
  const KNOWN_MAP = {
    'quidditch': ['quid', 'ditch'],
    'quaffle': ['quaf', 'fle'],
    'bludger': ['blud', 'ger'],
    'snitch': ['snitch'],
    'hogwarts': ['hog', 'warts'],
    'gryffindor': ['gryf', 'fin', 'dor'],
    'ravenclaw': ['ra', 'ven', 'claw'],
    'hufflepuff': ['huf', 'fle', 'puff'],
    'slytherin': ['sly', 'the', 'rin'],
    'dumbledore': ['dum', 'ble', 'dore'],
    'voldemort': ['vol', 'de', 'mort'],
    'wand': ['wand'],
    'cauldron': ['caul', 'dron'],
    'potion': ['po', 'tion'],
    'magical': ['mag', 'i', 'cal'],
    'wizard': ['wiz', 'ard'],
    'muggle': ['mug', 'gle'],
    'muggles': ['mug', 'gles'],
    'hedwig': ['hed', 'wig'],
    'hagrid': ['hag', 'rid'],
    'mcgonagall': ['mc', 'gon', 'a', 'gall'],
    'snape': ['snape'],
    'hermione': ['her', 'mi', 'o', 'ne'],
    'weasley': ['weas', 'ley'],
    'albus': ['al', 'bus'],
    'severus': ['se', 've', 'rus'],
    'invisibility': ['in', 'vis', 'i', 'bil', 'i', 'ty'],
    'philosopher': ['phi', 'los', 'o', 'pher'],
    'sorcerer': ['sor', 'cer', 'er'],
    'diagon': ['di', 'a', 'gon'],
    'privet': ['priv', 'et'],
    'dursley': ['durs', 'ley'],
    'butterbeer': ['but', 'ter', 'beer']
  };

  const lower = clean.toLowerCase();
  if (KNOWN_MAP[lower]) {
    // Preserve original casing of the first syllable
    const parts = [...KNOWN_MAP[lower]];
    if (clean[0] === clean[0].toUpperCase()) {
      parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return parts;
  }

  // Fallback heuristic syllable separation for general vocabulary
  // 1. Separate double consonants (e.g. let-ter, hap-py, rab-bit)
  let processed = clean.replace(/([bcdfghjklmnpqrstvwxyz])\1/gi, '$1-$1');

  // 2. Separate compound suffixes
  for (const sfx of SUFFIXES) {
    const regex = new RegExp(`([a-z]{3,})(${sfx})$`, 'i');
    if (regex.test(processed)) {
      processed = processed.replace(regex, '$1-$2');
      break;
    }
  }

  // 3. Separate common prefixes
  for (const pfx of PREFIXES) {
    const regex = new RegExp(`^(${pfx})([a-z]{3,})`, 'i');
    if (regex.test(processed)) {
      processed = processed.replace(regex, '$1-$2');
      break;
    }
  }

  // 4. Split V-CV pattern where appropriate
  processed = processed.replace(/([aeiouy]{1,2})([bcdfghjklmnpqrstvwxyz])([aeiouy])/gi, '$1-$2$3');

  const rawParts = processed.split('-').filter(Boolean);
  return rawParts.length > 0 ? rawParts : [clean];
}

/**
 * Format syllables with readable magical dots: "mag · i · cal"
 * @param {string} word 
 * @returns {string}
 */
export function formatSyllables(word) {
  const parts = splitSyllables(word);
  return parts.join(' · ');
}

/**
 * Generate kid-friendly natural phonics tips (自然拼读助记规律)
 * @param {string} word 
 * @param {string} [phonetic] 
 * @returns {{ rule: string, tip: string } | null}
 */
export function getPhonicsTip(word, phonetic = '') {
  if (!word) return null;
  const lower = word.toLowerCase();

  // Pattern rules
  if (lower.endsWith('tion') || lower.endsWith('sion')) {
    return {
      rule: '经典后缀 -tion / -sion',
      tip: '结尾的 -tion 读作 /ʃən/，重音通常落在它的前一个音节上（如 po-tion）。'
    };
  }

  if (lower.includes('qu')) {
    return {
      rule: '字母组合 qu',
      tip: '在英语中 q 和 u 总是形影不离，组合在一起读作 /kw/（如 Quick, Quidditch）。'
    };
  }

  if (lower.endsWith('ous')) {
    return {
      rule: '形容词后缀 -ous',
      tip: '词尾 -ous 读作轻弱读 /əs/，表示“充满...特征的”（如 dangerous, famous）。'
    };
  }

  if (lower.endsWith('cal')) {
    return {
      rule: '复合后缀 -cal',
      tip: '由 -ic + -al 组成，末尾 -al 舌尖轻抵上齿龈发暗 /l/ 读音（如 mag-i-cal）。'
    };
  }

  if (lower.endsWith('le') && lower.length >= 4 && !/[aeiou]le$/.test(lower)) {
    return {
      rule: '成音节辅音 + le',
      tip: '辅音加 le（如 -ble, -gle, -tle）构成独立音节，读作 /əl/（如 mug-gle, cas-tle）。'
    };
  }

  if (lower.includes('ph')) {
    return {
      rule: '希腊词根组合 ph',
      tip: '字母组合 ph 通常发 /f/ 音（如 philosopher, phone）。'
    };
  }

  if (/([aeiou])[bcdfghjklmnpqrstvwxyz]e$/i.test(lower) && lower.length >= 4) {
    return {
      rule: 'Magic E (相对开音节)',
      tip: '末尾不发音的字母 e 让前面的元音字母发其字母本音（如 stone 读作 /stəʊn/）。'
    };
  }

  if (/ar|er|ir|or|ur/i.test(lower)) {
    return {
      rule: 'R-控制元音组合',
      tip: '元音字母紧跟 r 时会变成卷舌或长元音（如 wand /wɒnd/, park, bird）。'
    };
  }

  // Default fallback guidance based on syllable count
  const syllables = splitSyllables(word);
  if (syllables.length > 1) {
    return {
      rule: `${syllables.length} 音节进阶词`,
      tip: `按照音节 [ ${syllables.join(' - ')} ] 分段拼读记忆，听音辨字更加轻松！`
    };
  }

  return {
    rule: '单音节核心词',
    tip: '短小精悍的核心基础词，建议结合有声书原声反复跟读模仿英音语调。'
  };
}

export default {
  splitSyllables,
  formatSyllables,
  getPhonicsTip
};
