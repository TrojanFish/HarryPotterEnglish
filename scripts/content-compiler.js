import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AUDIO_REGEX = /\.(mp3|m4a|wav|aac|ogg|flac)$/i;
const VIDEO_REGEX = /\.(mp4|webm|m4v|mov)$/i;
const IMAGE_REGEX = /\.(jpg|jpeg|png|webp)$/i;

const KNOWN_TITLE_MAP = {
  'hp-book-1': { title: "Harry Potter and the Philosopher's Stone", cnTitle: '哈利·波特与魔法石', code: 'HP1', color: '#740001' },
  'hp-book-2': { title: 'Harry Potter and the Chamber of Secrets', cnTitle: '哈利·波特与密室', code: 'HP2', color: '#1a472a' },
  'hp-book-3': { title: 'Harry Potter and the Prisoner of Azkaban', cnTitle: '哈利·波特与阿兹卡班的囚徒', code: 'HP3', color: '#0e1a40' },
  'hp-book-4': { title: 'Harry Potter and the Goblet of Fire', cnTitle: '哈利·波特与火焰杯', code: 'HP4', color: '#740001' },
  'hp-book-5': { title: 'Harry Potter and the Order of the Phoenix', cnTitle: '哈利·波特与凤凰社', code: 'HP5', color: '#0e1a40' },
  'hp-book-6': { title: 'Harry Potter and the Half-Blood Prince', cnTitle: '哈利·波特与混血王子', code: 'HP6', color: '#1a472a' },
  'hp-book-7': { title: 'Harry Potter and the Deathly Hallows', cnTitle: '哈利·波特与死亡圣器', code: 'HP7', color: '#740001' },
  'the-little-prince': { title: 'The Little Prince', cnTitle: '小王子', code: 'TLP', color: '#b8860b' },
  'tiny-tales': { title: 'Tiny Tales', cnTitle: '经典童话故事', code: 'TALES', color: '#4a7c59' },
};

/**
 * Validates WebVTT subtitle text content.
 * @param {string} vttText
 * @returns {{ valid: boolean, error?: string, cuesCount: number }}
 */
export function validateVttContent(vttText) {
  if (typeof vttText !== 'string' || !vttText.trim()) {
    return { valid: false, error: 'Invalid or empty VTT content', cuesCount: 0 };
  }

  // Strip leading UTF-8 BOM if present
  const cleanText = vttText.replace(/^\uFEFF/, '');

  // Verify text starts with WEBVTT signature
  if (!/^WEBVTT(?:\s|$)/.test(cleanText)) {
    return { valid: false, error: 'Missing WEBVTT signature', cuesCount: 0 };
  }

  // Count valid timestamp cues
  const cueRegex = /(\d{2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(\d{2}:)?\d{2}:\d{2}[.,]\d{3}/g;
  const cues = cleanText.match(cueRegex) || [];

  return {
    valid: true,
    cuesCount: cues.length
  };
}

/**
 * Strips Unicode emoji pictographics from text.
 * @param {string} str
 * @returns {string}
 */
export function stripEmojis(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\p{Extended_Pictographic}\uFE0E\uFE0F]/gu, '')
    .replace(/\b([A-Za-z]+)\s+([stmd]|ll|ve|re)\b/g, "$1'$2")
    .replace(/\s+/g, ' ')
    .trim();
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(p) {
  try {
    const stat = await fs.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Compiles content directory into feed.json manifest.
 * @param {string} contentDir - Absolute or relative path to content/
 * @param {{ dryRun?: boolean, outputPath?: string }} [options]
 * @returns {Promise<{ feed: object, stats: { booksCount: number, episodesCount: number, tedTalksCount: number }, errors: string[] }>}
 */
export async function compileContentFeed(contentDir, options = {}) {
  const resolvedContentDir = path.resolve(contentDir);
  const errors = [];
  const podcasts = [];
  const ted = [];

  // 1. Scan podcasts directory
  const podcastsDir = path.join(resolvedContentDir, 'podcasts');
  if (await isDirectory(podcastsDir)) {
    const bookEntries = await fs.readdir(podcastsDir, { withFileTypes: true });

    for (const bookEntry of bookEntries) {
      if (!bookEntry.isDirectory() || bookEntry.name.startsWith('.')) continue;

      const bookId = bookEntry.name;
      const bookDirPath = path.join(podcastsDir, bookId);

      // Read book metadata if present
      let bookMeta = {};
      const bookJsonPath = path.join(bookDirPath, 'book.json');
      const showJsonPath = path.join(bookDirPath, 'show.json');
      let targetMetaPath = null;

      if (await pathExists(bookJsonPath)) targetMetaPath = bookJsonPath;
      else if (await pathExists(showJsonPath)) targetMetaPath = showJsonPath;

      if (targetMetaPath) {
        try {
          const raw = await fs.readFile(targetMetaPath, 'utf-8');
          bookMeta = JSON.parse(raw);
        } catch (err) {
          errors.push(`[Podcast ${bookId}] Failed to parse book metadata (${path.basename(targetMetaPath)}): ${err.message}`);
        }
      }

      // Discover cover image
      let coverKey = `podcasts/${bookId}/cover.jpg`;
      try {
        const bookFiles = await fs.readdir(bookDirPath);
        const coverFile = bookFiles.find(f => IMAGE_REGEX.test(f) && /(cover|thumb)/i.test(f)) ||
                          bookFiles.find(f => IMAGE_REGEX.test(f));
        if (coverFile) {
          coverKey = `podcasts/${bookId}/${coverFile}`;
        }
      } catch (err) {
        errors.push(`[Podcast ${bookId}] Failed to read directory files: ${err.message}`);
      }

      // Discover chapters under episodes/
      const episodesDir = path.join(bookDirPath, 'episodes');
      const chapters = [];

      if (await isDirectory(episodesDir)) {
        const epEntries = await fs.readdir(episodesDir, { withFileTypes: true });
        for (const epEntry of epEntries) {
          if (!epEntry.isDirectory() || epEntry.name.startsWith('.')) continue;

          const epId = epEntry.name;
          const epDirPath = path.join(episodesDir, epId);
          let epFiles = [];
          try {
            epFiles = await fs.readdir(epDirPath);
          } catch (err) {
            errors.push(`[Podcast ${bookId}/${epId}] Cannot read directory: ${err.message}`);
            continue;
          }

          const audioFile = epFiles.find(f => AUDIO_REGEX.test(f));
          const subtitleFile = epFiles.find(f => f.toLowerCase().endsWith('.vtt'));
          const metaFile = epFiles.find(f => f.toLowerCase() === 'meta.json');

          if (!audioFile) {
            errors.push(`[Podcast ${bookId}/${epId}] Missing audio file in ${epDirPath}`);
            continue;
          }

          let epMeta = {};
          if (metaFile) {
            try {
              const raw = await fs.readFile(path.join(epDirPath, metaFile), 'utf-8');
              epMeta = JSON.parse(raw);
            } catch (err) {
              errors.push(`[Podcast ${bookId}/${epId}] Failed to parse meta.json: ${err.message}`);
            }
          }

          if (subtitleFile) {
            try {
              const vttRaw = await fs.readFile(path.join(epDirPath, subtitleFile), 'utf-8');
              const vttCheck = validateVttContent(vttRaw);
              if (!vttCheck.valid) {
                errors.push(`[Podcast ${bookId}/${epId}] Subtitle validation failed (${subtitleFile}): ${vttCheck.error}`);
              }
            } catch (err) {
              errors.push(`[Podcast ${bookId}/${epId}] Failed to read subtitle file (${subtitleFile}): ${err.message}`);
            }
          }

          const epNum = parseInt(epMeta.episode || epId.replace(/^[^\d]*/, ''), 10) || (chapters.length + 1);
          const rawTitle = epMeta.title || `Chapter ${epNum}`;

          chapters.push({
            id: `${bookId}_${epId}`,
            epId,
            number: epNum,
            title: stripEmojis(rawTitle),
            cnTitle: stripEmojis(epMeta.cnTitle || ''),
            audioKey: `podcasts/${bookId}/episodes/${epId}/${audioFile}`,
            subtitleKey: subtitleFile 
              ? `podcasts/${bookId}/episodes/${epId}/${subtitleFile}` 
              : `podcasts/${bookId}/episodes/${epId}/subtitle.vtt`,
            durationSeconds: typeof epMeta.durationSeconds === 'number' ? epMeta.durationSeconds : 0
          });
        }
      }

      // Filter out books with 0 valid audio chapters
      if (chapters.length === 0) {
        continue;
      }

      chapters.sort((a, b) => a.number - b.number);

      const known = KNOWN_TITLE_MAP[bookId] || {};
      podcasts.push({
        id: bookId,
        title: stripEmojis(bookMeta.title) || known.title || bookId,
        cnTitle: stripEmojis(bookMeta.cnTitle) || known.cnTitle || '',
        code: bookMeta.code || known.code || 'BOOK',
        color: bookMeta.color || known.color || '#740001',
        coverKey,
        chapters
      });
    }

    // Sort podcasts: canonical HP order first, then others
    const order = [
      'hp-book-1', 'hp-book-2', 'hp-book-3', 'hp-book-4',
      'hp-book-5', 'hp-book-6', 'hp-book-7',
      'the-little-prince', 'tiny-tales'
    ];
    podcasts.sort((a, b) => {
      const aIdx = order.indexOf(a.id);
      const bIdx = order.indexOf(b.id);
      return (aIdx !== -1 ? aIdx : 99) - (bIdx !== -1 ? bIdx : 99);
    });
  }

  // 2. Scan ted directory
  const tedDir = path.join(resolvedContentDir, 'ted');
  if (await isDirectory(tedDir)) {
    const talkEntries = await fs.readdir(tedDir, { withFileTypes: true });

    for (const talkEntry of talkEntries) {
      if (!talkEntry.isDirectory() || talkEntry.name.startsWith('.')) continue;

      const talkId = talkEntry.name;
      const talkDirPath = path.join(tedDir, talkId);
      let talkFiles = [];
      try {
        talkFiles = await fs.readdir(talkDirPath);
      } catch (err) {
        errors.push(`[TED ${talkId}] Cannot read directory: ${err.message}`);
        continue;
      }

      // Check primary video file
      const videoFile = talkFiles.find(f => /(video\.mp4|video\.webm)$/i.test(f)) ||
                        talkFiles.find(f => VIDEO_REGEX.test(f));

      if (!videoFile) {
        errors.push(`[TED ${talkId}] Missing video file in ${talkDirPath}`);
        continue;
      }

      const subtitleFile = talkFiles.find(f => /(subtitle\.vtt)$/i.test(f)) ||
                           talkFiles.find(f => f.toLowerCase().endsWith('.vtt'));

      if (subtitleFile) {
        try {
          const vttRaw = await fs.readFile(path.join(talkDirPath, subtitleFile), 'utf-8');
          const vttCheck = validateVttContent(vttRaw);
          if (!vttCheck.valid) {
            errors.push(`[TED ${talkId}] Subtitle validation failed (${subtitleFile}): ${vttCheck.error}`);
          }
        } catch (err) {
          errors.push(`[TED ${talkId}] Failed to read subtitle file (${subtitleFile}): ${err.message}`);
        }
      }

      const thumbFile = talkFiles.find(f => /(cover|thumb)\.(jpg|jpeg|png|webp)$/i.test(f)) ||
                        talkFiles.find(f => IMAGE_REGEX.test(f));

      const metaFile = talkFiles.find(f => /(meta|talk)\.json$/i.test(f));
      let talkMeta = {};

      if (metaFile) {
        try {
          const raw = await fs.readFile(path.join(talkDirPath, metaFile), 'utf-8');
          talkMeta = JSON.parse(raw);
        } catch (err) {
          errors.push(`[TED ${talkId}] Failed to parse ${metaFile}: ${err.message}`);
        }
      }

      // Auto derivation if missing fields
      const cleanRawName = talkId.replace(/^ted-/, '').replace(/[-_]+/g, ' ').trim();
      const capitalizedTitle = cleanRawName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const normalizedId = talkId.startsWith('ted-') ? talkId : `ted-${talkId}`;
      const derivedYear = parseInt(talkId.match(/\b(19\d\d|20\d\d)\b/)?.[0], 10) || new Date().getFullYear();

      ted.push({
        id: talkMeta.id || normalizedId,
        title: stripEmojis(talkMeta.title) || capitalizedTitle || 'TED Talk',
        titleCn: stripEmojis(talkMeta.titleCn || ''),
        speaker: stripEmojis(talkMeta.speaker) || 'TED Speaker',
        year: typeof talkMeta.year === 'number' ? talkMeta.year : derivedYear,
        durationSeconds: typeof talkMeta.durationSeconds === 'number' ? talkMeta.durationSeconds : 0,
        cefrLevel: talkMeta.cefrLevel || 'B1',
        wpm: typeof talkMeta.wpm === 'number' ? talkMeta.wpm : 140,
        videoKey: `ted/${talkId}/${videoFile}`,
        vttKey: subtitleFile ? `ted/${talkId}/${subtitleFile}` : (talkMeta.vttKey || `ted/${talkId}/subtitle.vtt`),
        thumbnailKey: thumbFile ? `ted/${talkId}/${thumbFile}` : (talkMeta.thumbnailKey || `ted/${talkId}/cover.jpg`),
        vocabSet: Array.isArray(talkMeta.vocabSet) ? talkMeta.vocabSet : [],
        tasks: talkMeta.tasks && typeof talkMeta.tasks === 'object' ? talkMeta.tasks : { cloze: [], matching: [] },
        shadowingSegments: Array.isArray(talkMeta.shadowingSegments) ? talkMeta.shadowingSegments : []
      });
    }

    // Sort TED talks by year descending
    ted.sort((a, b) => (b.year || 0) - (a.year || 0));
  }

  const stats = {
    booksCount: podcasts.length,
    episodesCount: podcasts.reduce((sum, b) => sum + (b.chapters ? b.chapters.length : 0), 0),
    tedTalksCount: ted.length
  };

  const feed = {
    version: 'hogwarts-feed-v1',
    generatedAt: new Date().toISOString(),
    stats,
    podcasts,
    ted
  };

  if (!options.dryRun) {
    const outPath = options.outputPath 
      ? path.resolve(options.outputPath) 
      : path.join(resolvedContentDir, 'feed.json');
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(feed, null, 2), 'utf-8');
  }

  return {
    feed,
    stats,
    errors
  };
}

// CLI direct execution entrypoint
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  (async () => {
    let contentDir = path.resolve(process.cwd(), 'content');
    let dryRun = false;
    let outputPath = null;

    for (const arg of process.argv.slice(2)) {
      if (arg.startsWith('--content-dir=')) {
        contentDir = path.resolve(arg.split('=')[1]);
      } else if (arg.startsWith('--output=')) {
        outputPath = path.resolve(arg.split('=')[1]);
      } else if (arg === '--dry-run') {
        dryRun = true;
      }
    }

    console.log(`[Content Compiler] Target directory: ${contentDir}`);
    if (dryRun) console.log('[Content Compiler] Running in dry-run mode (no files will be written)');

    try {
      const result = await compileContentFeed(contentDir, { dryRun, outputPath });

      console.log(`[Content Compiler] Scan completed successfully:`);
      console.log(`  - Books: ${result.stats.booksCount}`);
      console.log(`  - Episodes: ${result.stats.episodesCount}`);
      console.log(`  - TED Talks: ${result.stats.tedTalksCount}`);

      if (result.errors.length > 0) {
        console.warn(`[Content Compiler] Warnings and errors (${result.errors.length}):`);
        for (const err of result.errors) {
          console.warn(`  - ${err}`);
        }
        process.exit(1);
      }

      console.log('[Content Compiler] Done.');
      process.exit(0);
    } catch (fatalErr) {
      console.error(`[Content Compiler Fatal Error] ${fatalErr.message}`);
      process.exit(1);
    }
  })();
}
