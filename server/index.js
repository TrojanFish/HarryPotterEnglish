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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Enable gzip/deflate compression for JSON, VTT, HTML
app.use(compression());
app.use(cors());
app.use(express.json());

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

    const showJsonKeys = keys.filter(k => k.endsWith('/show.json'));

    const books = await Promise.all(showJsonKeys.map(async (showKey) => {
      const showDir = showKey.replace('/show.json', '');
      const showId = showDir.split('/').pop();

      // Read show.json
      const showJsonRaw = await getS3TextCached(showKey, bypassCache);
      let showInfo = {};
      try {
        if (showJsonRaw) showInfo = JSON.parse(showJsonRaw);
      } catch (e) {}

      // Discover all episodes under this show
      const metaKeys = keys.filter(k => k.startsWith(`${showDir}/episodes/`) && k.endsWith('/meta.json'));

      // Parallel fetch for episode metadata
      const episodes = await Promise.all(metaKeys.map(async (metaKey) => {
        const epDir = metaKey.replace('/meta.json', '');
        const epId = epDir.split('/').pop();
        const metaRaw = await getS3TextCached(metaKey, bypassCache);
        let epMeta = {};
        try {
          if (metaRaw) epMeta = JSON.parse(metaRaw);
        } catch (e) {}

        const epNum = parseInt(epMeta.episode || epId.replace('ep', ''), 10) || 1;
        return {
          id: `${showId}_${epId}`,
          epId,
          number: epNum,
          title: epMeta.title || `Chapter ${epNum}`,
          description: epMeta.description || '',
          duration: epMeta.duration || '',
          durationSeconds: epMeta.durationSeconds || 0,
          audioKey: `${epDir}/audio.mp3`,
          subtitleKey: `${epDir}/subtitle.vtt`,
          showId: showId,
        };
      }));

      // Sort episodes numerically
      episodes.sort((a, b) => a.number - b.number);

      // Smart title resolution
      const metaExtra = KNOWN_TITLE_MAP[showId] || { 
        cnTitle: showInfo.title || showId, 
        code: 'BOOK', 
        color: '#cba358' 
      };

      return {
        id: showId,
        title: showInfo.title || showId,
        cnTitle: metaExtra.cnTitle,
        code: metaExtra.code || 'BOOK',
        cover: '',
        color: metaExtra.color,
        description: showInfo.description || '',
        coverPath: showInfo.coverPath || null,
        chapters: episodes,
      };
    }));

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
    console.log(`[R2 Scanner] Done! ${books.length} shows discovered.`);
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

// 1. Dynamic Catalog API with auto-discovery & ?refresh=1 support
app.get('/api/catalog', async (req, res) => {
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

// 3. Audio streaming endpoint with Range support & backpressure disconnection handling
app.get('/api/media/*', async (req, res) => {
  if (!s3Client) {
    return res.status(503).json({ error: 'R2 storage credentials not configured' });
  }

  let key = req.params[0];
  if (!key.endsWith('.mp3')) key = `${key}.mp3`;

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
      'Accept-Ranges': 'bytes',
      'Content-Length': response.ContentLength,
      'Content-Range': response.ContentRange,
      'Cache-Control': 'public, max-age=604800, immutable',
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
  if (!s3Client) return res.status(503).json({ error: 'R2 not configured' });
  const key = req.params[0];

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
    res.status(404).json({ error: err.message });
  }
});

// 5. Serve production static assets from dist/ if built (Docker / Production mode)
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`[Static Assets] Serving production build from ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
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
