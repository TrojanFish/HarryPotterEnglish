import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  S3Client, 
  GetObjectCommand, 
  ListObjectsV2Command 
} from '@aws-sdk/client-s3';
import { processSync, processPairing } from './syncStore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Trust reverse proxy (Cloudflare, Nginx, Vercel)
app.set('trust proxy', 1);

// Security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Enable gzip/deflate compression for JSON, VTT, HTML
app.use(compression());

// Configurable CORS: allow local dev or restrict to ALLOWED_ORIGINS in production
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const configuredOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map(s => s.trim().toLowerCase())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!configuredOrigins || configuredOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    const lowerOrigin = origin.toLowerCase();
    if (configuredOrigins.includes(lowerOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Blocked by CORS policy: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

// Lightweight in-memory rate limiter (zero external dependencies)
function createRateLimiter({ windowMs = 60 * 1000, max = 60, message = '请求过于频繁，请稍候再试' }) {
  const requests = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) requests.delete(ip);
    }
  }, 2 * 60 * 1000);

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    let record = requests.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requests.set(ip, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: retryAfterSec
      });
    }
    next();
  };
}

const syncLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60, message: '同步请求频次过高，请 1 分钟后重试' });
const catalogLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120, message: '书目请求频次过高，请稍后刷新' });

// Initialize Cloudflare R2 Client (S3-compatible)
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'fluentfox-podcast';

let s3Client = null;
const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey);

if (isConfigured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
  console.log(`[R2] S3 Client initialized for bucket: ${bucketName}`);
} else {
  console.warn(`[R2] Missing R2 credentials in .env.`);
}

// ==========================================
// In-Memory High-Speed Caches for Multi-User
// ==========================================
let catalogCache = null;
let catalogCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds auto-revalidation

// Hot Cache for Subtitles & JSON text (sub-1ms response!)
const subtitleCache = new Map();
const textFileCache = new Map();

// Helper to read text from S3 with memory caching
async function getS3TextCached(key, bypassCache = false) {
  if (!bypassCache && textFileCache.has(key)) {
    return textFileCache.get(key);
  }
  try {
    const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const res = await s3Client.send(cmd);
    const content = await res.Body.transformToString();
    textFileCache.set(key, content);
    return content;
  } catch (e) {
    return null;
  }
}

// Known Chinese Title and House Mapping for Harry Potter series & classical stories
const KNOWN_TITLE_MAP = {
  'hp-book-1': { cnTitle: '哈利·波特与魔法石', code: 'HP1', color: '#740001' },
  'hp-book-2': { cnTitle: '哈利·波特与密室', code: 'HP2', color: '#1a472a' },
  'hp-book-3': { cnTitle: '哈利·波特与阿兹卡班的囚徒', code: 'HP3', color: '#0e1a40' },
  'hp-book-4': { cnTitle: '哈利·波特与火焰杯', code: 'HP4', color: '#740001' },
  'hp-book-5': { cnTitle: '哈利·波特与凤凰社', code: 'HP5', color: '#0e1a40' },
  'hp-book-6': { cnTitle: '哈利·波特与混血王子', code: 'HP6', color: '#1a472a' },
  'hp-book-7': { cnTitle: '哈利·波特与死亡圣器', code: 'HP7', color: '#740001' },
  'the-little-prince': { cnTitle: '小王子', code: 'TLP', color: '#b8860b' },
  'tiny-tales': { cnTitle: '经典童话故事', code: 'TALES', color: '#4a7c59' },
  'adventure-time': { cnTitle: '探险时光', code: 'ADV', color: '#2a52be' },
  'epic-stories': { cnTitle: '史诗传奇', code: 'EPIC', color: '#6a0dad' },
};

// ==========================================
// R2 Auto-Discovery Scanner
// ==========================================
// Audio extension regex
const AUDIO_REGEX = /\.(mp3|m4a|wav|aac|ogg|flac)$/i;

function stripEmojis(str) {
  if (!str) return '';
  return str
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\b([A-Za-z]+)\s+([stmd]|ll|ve|re)\b/g, "$1'$2")
    .replace(/\s+/g, ' ')
    .trim();
}

async function scanR2Catalog(bypassCache = false) {
  if (!s3Client) return [];
  console.log(`[R2 Scanner] Scanning R2 bucket for podcasts... (bypass: ${bypassCache})`);

  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'podcasts/',
      MaxKeys: 1000,
    });
    const listRes = await s3Client.send(listCmd);
    const keys = (listRes.Contents || []).map(c => c.Key);

    // Identify all audio keys in R2
    const audioKeys = new Set(keys.filter(k => AUDIO_REGEX.test(k)));

    // Find all distinct podcast show IDs under podcasts/
    // Exclude hidden folders like .alist
    const showIds = [...new Set(keys.map(k => {
      const parts = k.split('/');
      return parts.length >= 2 ? parts[1] : null;
    }))].filter(id => id && !id.startsWith('.'));

    const books = (await Promise.all(showIds.map(async (showId) => {
      const showDir = `podcasts/${showId}`;

      // Strictly verify if this folder contains at least one audio file in R2
      const folderHasAudio = [...audioKeys].some(k => k.startsWith(`${showDir}/`));
      if (!folderHasAudio) {
        // No audio files in this folder -> Do NOT display!
        console.log(`[R2 Scanner] Skipping folder "${showDir}" (no audio files found).`);
        return null;
      }

      // Read show.json if it exists
      const showKey = `${showDir}/show.json`;
      const showJsonRaw = await getS3TextCached(showKey, bypassCache);
      let showInfo = {};
      try {
        if (showJsonRaw) showInfo = JSON.parse(showJsonRaw);
      } catch (e) {}

      // Discover episodes under this show
      const metaKeys = keys.filter(k => k.startsWith(`${showDir}/episodes/`) && k.endsWith('/meta.json'));

      let episodes = [];
      if (metaKeys.length > 0) {
        episodes = (await Promise.all(metaKeys.map(async (metaKey) => {
          const epDir = metaKey.replace('/meta.json', '');
          const epId = epDir.split('/').pop();

          // Verify if audio exists for this specific episode
          const directAudioKey = `${epDir}/audio.mp3`;
          const actualAudioKey = audioKeys.has(directAudioKey)
            ? directAudioKey
            : [...audioKeys].find(k => k.startsWith(`${epDir}/`));

          if (!actualAudioKey) {
            // Episode has no audio file in R2 -> filter out
            return null;
          }

          const metaRaw = await getS3TextCached(metaKey, bypassCache);
          let epMeta = {};
          try {
            if (metaRaw) epMeta = JSON.parse(metaRaw);
          } catch (e) {}

          const epNum = parseInt(epMeta.episode || epId.replace('ep', ''), 10) || 1;
          const rawTitle = epMeta.title || `Chapter ${epNum}`;

          return {
            id: `${showId}_${epId}`,
            epId,
            number: epNum,
            title: stripEmojis(rawTitle),
            cnTitle: epMeta.cnTitle ? stripEmojis(epMeta.cnTitle) : '',
            description: epMeta.description || '',
            duration: epMeta.duration || '',
            durationSeconds: epMeta.durationSeconds || 0,
            audioKey: actualAudioKey,
            subtitleKey: `${epDir}/subtitle.vtt`,
            showId: showId,
          };
        }))).filter(Boolean);
      } else {
        // If no meta.json, auto-discover episodes directly from audio files under this show
        const showAudioList = [...audioKeys].filter(k => k.startsWith(`${showDir}/`));
        episodes = showAudioList.map((aKey, idx) => {
          const filename = aKey.split('/').pop().replace(AUDIO_REGEX, '');
          const epNum = idx + 1;
          return {
            id: `${showId}_ep${String(epNum).padStart(2, '0')}`,
            epId: `ep${String(epNum).padStart(2, '0')}`,
            number: epNum,
            title: `Chapter ${epNum} (${filename})`,
            description: '',
            duration: '',
            durationSeconds: 0,
            audioKey: aKey,
            subtitleKey: aKey.replace(AUDIO_REGEX, '.vtt'),
            showId: showId,
          };
        });
      }

      // Sort episodes numerically
      episodes.sort((a, b) => a.number - b.number);

      // If after checking episodes, zero episodes have audio, do NOT display this book!
      if (episodes.length === 0) {
        return null;
      }

      // Smart title resolution
      const metaExtra = KNOWN_TITLE_MAP[showId] || { 
        cnTitle: stripEmojis(showInfo.title) || showId, 
        code: 'BOOK', 
        color: '#cba358' 
      };

      return {
        id: showId,
        title: stripEmojis(showInfo.title) || showId,
        cnTitle: stripEmojis(metaExtra.cnTitle),
        code: metaExtra.code || 'BOOK',
        cover: '',
        color: metaExtra.color,
        description: showInfo.description || '',
        coverPath: showInfo.coverPath || null,
        chapters: episodes,
      };
    }))).filter(Boolean);

    // Sort books: Harry Potter series in order first, then others
    books.sort((a, b) => {
      const order = [
        'hp-book-1', 'hp-book-2', 'hp-book-3', 'hp-book-4', 
        'hp-book-5', 'hp-book-6', 'hp-book-7', 
        'the-little-prince', 'tiny-tales'
      ];
      const aIdx = order.indexOf(a.id);
      const bIdx = order.indexOf(b.id);
      return (aIdx !== -1 ? aIdx : 99) - (bIdx !== -1 ? bIdx : 99);
    });

    catalogCache = books;
    catalogCacheTime = Date.now();
    console.log(`[R2 Scanner] Done! ${books.length} shows with audio discovered.`);
    return books;
  } catch (err) {
    console.error('[R2 Scanner Error]', err);
    return catalogCache || [];
  }
}

// Background auto-refresh poller (Every 60 seconds)
setInterval(async () => {
  if (s3Client) {
    try {
      await scanR2Catalog(true);
    } catch (e) {
      console.warn('Background scan warning:', e.message);
    }
  }
}, 60 * 1000);

// ==========================================
// API Endpoints
// ==========================================

// 0. Operations & Observability: Health Check Probe
app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    r2Configured: isConfigured,
    r2Connected: Boolean(s3Client),
    cachedShowsCount: catalogCache ? catalogCache.length : 0,
    subtitleCacheSize: subtitleCache.size,
    version: '1.3.0'
  });
});

// 1. Dynamic Catalog API with auto-discovery & ?refresh=1 support
app.get('/api/catalog', catalogLimiter, async (req, res) => {
  if (!s3Client) {
    return res.status(503).json({ error: 'R2 not configured' });
  }

  const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
  const now = Date.now();

  if (!forceRefresh && catalogCache && (now - catalogCacheTime < CACHE_TTL_MS)) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return res.json({ books: catalogCache, cached: true });
  }

  const books = await scanR2Catalog(forceRefresh);
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json({ books, cached: false });
});

// 2. High-speed Subtitle VTT endpoint (In-Memory Hot Cache < 1ms)
app.get('/api/subtitles/*', async (req, res) => {
  if (!s3Client) {
    return res.status(503).json({ error: 'R2 not configured' });
  }

  let key = req.params[0];
  if (!key.endsWith('.vtt')) key = `${key}.vtt`;

  // Memory Cache Hit
  if (subtitleCache.has(key)) {
    res.set({
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      'X-Cache': 'HIT-MEMORY',
    });
    return res.send(subtitleCache.get(key));
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3Client.send(command);
    const vttContent = await response.Body.transformToString();

    // Store in hot memory cache
    subtitleCache.set(key, vttContent);

    res.set({
      'Content-Type': 'text/vtt; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      'X-Cache': 'MISS',
    });
    res.send(vttContent);
  } catch (err) {
    console.error(`[R2 Error] Failed to fetch subtitle ${key}:`, err);
    res.status(err.$metadata?.httpStatusCode || 500).json({ 
      error: 'Subtitle file not found in R2', 
      key 
    });
  }
});

// 3. Audio streaming endpoint with Range support, anti-sniffing & inline protection
app.get(['/api/stream/audio/*', '/api/media/*'], async (req, res) => {
  if (!s3Client) {
    return res.status(503).json({ error: 'R2 storage credentials not configured' });
  }

  let key = req.params[0];
  // Auto-append .mp3 if not already present in the key
  if (!AUDIO_REGEX.test(key)) {
    key = `${key}.mp3`;
  }

  // Anti-leech: verify Referer header if present
  const referer = req.headers.referer || req.headers.origin;
  if (referer) {
    try {
      const refUrl = new URL(referer);
      const host = req.headers.host;
      const isAllowed = !host || refUrl.host === host || refUrl.hostname === 'localhost' || refUrl.hostname === '127.0.0.1';
      if (!isAllowed) {
        return res.status(403).json({ error: 'Forbidden: unauthorized media referer' });
      }
    } catch {}
  }

  try {
    const range = req.headers.range;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      Range: range,
    });

    const response = await s3Client.send(command);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="stream.dat"',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'Content-Length': response.ContentLength,
      'Content-Range': response.ContentRange,
      'Cache-Control': 'private, no-transform, max-age=604800',
    });

    res.status(range ? 206 : 200);

    // Stream audio body with connection cleanup
    const stream = response.Body;
    stream.pipe(res);

    // If client cancels/disconnects early, destroy stream to free resources immediately
    res.on('close', () => {
      if (stream.destroy) stream.destroy();
    });
  } catch (err) {
    console.error(`[R2 Error] Audio stream error ${key}:`, err.message);
    res.status(err.$metadata?.httpStatusCode || 500).json({ 
      error: 'Audio not found in R2', 
      key 
    });
  }
});

// 4. Generic raw media endpoint (cover.jpg, png) with strong browser cache
app.get('/api/raw/*', async (req, res) => {
  const key = req.params[0];
  const fallbackCover = path.resolve(__dirname, '../public/icon.svg');

  if (!s3Client) {
    if (key.includes('cover') && fs.existsSync(fallbackCover)) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.sendFile(fallbackCover);
    }
    return res.status(503).json({ error: 'R2 not configured' });
  }

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    const response = await s3Client.send(command);

    if (key.endsWith('.jpg') || key.endsWith('.jpeg')) res.set('Content-Type', 'image/jpeg');
    else if (key.endsWith('.png')) res.set('Content-Type', 'image/png');
    else if (key.endsWith('.json')) res.set('Content-Type', 'application/json');

    res.set('Cache-Control', 'public, max-age=604800, immutable');
    response.Body.pipe(res);

    res.on('close', () => {
      if (response.Body.destroy) response.Body.destroy();
    });
  } catch (err) {
    if (key.includes('cover') && fs.existsSync(fallbackCover)) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.sendFile(fallbackCover);
    }
    res.status(404).json({ error: err.message });
  }
});

// 5. Local-First Incremental Sync API (LWW Timestamp Protocol)
app.post('/api/sync', syncLimiter, (req, res) => {
  try {
    const payload = req.body || {};
    const result = processSync(payload);
    res.json(result);
  } catch (err) {
    console.error('[Sync API] Error processing sync:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 6. Device Pairing API (Cross-Device Cloud Profile Linking)
app.post('/api/sync/pair', syncLimiter, (req, res) => {
  try {
    const payload = req.body || {};
    const result = processPairing(payload);
    if (result.status === 'error') {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[Sync Pair API] Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 7. Serve production static assets from dist/ if built (Docker / Production mode)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`[Static Assets] Serving production build from ${distPath}`);
  // Immutable 1-year cache for Vite hashed assets
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true
  }));
  // Standard cache for root assets
  app.use(express.static(distPath, {
    maxAge: '1h'
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/assets/') || path.extname(req.path)) {
      return res.status(404).type('text/plain').send('Asset not found');
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start HTTP server only if not running in serverless environment (Vercel)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Hogwarts R2 High-Concurrency Server running at http://localhost:${port}`);
    // Initial scan on boot
    scanR2Catalog(false);
  });
}

export { app, scanR2Catalog };
export default app;
