/**
 * Parse WebVTT subtitle text into structured cue items
 * @param {string} vttText 
 * @returns {Array<{id: number, startTime: number, endTime: number, text: string, translation?: string}>}
 */
export function parseVTT(vttText) {
  if (!vttText) return [];

  // Normalize line endings
  const lines = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues = [];
  let currentCue = null;
  let cueId = 0;

  // Regex for VTT timestamp: (hh:)?mm:ss.mmm --> (hh:)?mm:ss.mmm
  const timeRegex = /((?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3}))\s*-->\s*((?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3}))/;

  function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.replace(',', '.').split(':');
    if (parts.length === 3) {
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const minutes = parseFloat(parts[0]);
      const seconds = parseFloat(parts[1]);
      return minutes * 60 + seconds;
    }
    return 0;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
      continue;
    }

    // Skip cue sequence numbers (e.g., "1", "2", "3")
    if (/^\d+$/.test(line)) {
      let isCueIndex = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (!nextLine) continue;
        if (timeRegex.test(nextLine)) {
          isCueIndex = true;
        }
        break;
      }
      if (isCueIndex) {
        continue;
      }
    }

    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      const startTime = timeToSeconds(timeMatch[1]);
      const endTime = timeToSeconds(timeMatch[6]);

      currentCue = {
        id: cueId++,
        startTime,
        endTime,
        textLines: []
      };
      cues.push(currentCue);
    } else if (currentCue) {
      // Clean HTML tags like <b>, <i>, <v Narrator>
      const cleanLine = line.replace(/<\/?[^>]+(>|$)/g, '').trim();
      // Do not append standalone digit lines (cue numbers) to subtitle text
      if (cleanLine && !/^\d+$/.test(cleanLine)) {
        currentCue.textLines.push(cleanLine);
      }
    }
  }

  return cues.map(cue => {
    // Filter out any purely numeric lines that might have slipped into textLines
    const filteredLines = cue.textLines.filter(l => !/^\d+$/.test(l.trim()));
    let text = filteredLines.join(' ');
    let translation = '';

    // Check if there is dual subtitle separated by Chinese characters
    if (filteredLines.length >= 2) {
      const lastLine = filteredLines[filteredLines.length - 1];
      const hasChinese = /[\u4e00-\u9fa5]/.test(lastLine);
      if (hasChinese) {
        translation = filteredLines.pop();
        text = filteredLines.join(' ');
      }
    }

    // Ensure no trailing standalone cue index at the end of sentence (e.g. "something. 2" -> "something.", "(1)", "[1]")
    const trailingNumRegex = /\s*[\(\[\{＃#]?\d+[\)\]\}]?\s*$/;
    text = text.replace(trailingNumRegex, '').replace(/\s+([.,!?;:])/g, '$1').replace(/\s+/g, ' ').trim();
    if (translation) {
      translation = translation.replace(trailingNumRegex, '').trim();
    }

    return {
      id: cue.id,
      startTime: cue.startTime,
      endTime: cue.endTime,
      text: text,
      translation: translation
    };
  });
}

/**
 * Tokenize sentence text into words and punctuation
 * @param {string} text 
 * @returns {Array<{text: string, isWord: boolean}>}
 */
export function tokenizeSentence(text) {
  if (!text) return [];
  // Match English words (including contractions like don't / didn’t, and hyphenated compound words like good-for-nothing) or non-word symbols
  const regex = /([a-zA-Z]+(?:(?:['’|-])[a-zA-Z]+)*)|([^a-zA-Z]+)/g;
  const tokens = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ text: match[1], isWord: true });
    } else if (match[2]) {
      tokens.push({ text: match[2], isWord: false });
    }
  }
  return tokens;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  if (mins < 60) {
    return `${mins < 10 ? '0' : ''}${mins}:${formattedSecs}`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}:${remMins < 10 ? '0' : ''}${remMins}:${formattedSecs}`;
}
