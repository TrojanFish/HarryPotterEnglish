import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { HP_BOOKS } from '../src/data/chapters.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const AUDIO_REGEX = /\.(mp3|m4a|wav|aac|ogg|flac)$/i;

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
};

function stripEmojis(str) {
  if (!str) return '';
  return str
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\b([A-Za-z]+)\s+([stmd]|ll|ve|re)\b/g, "$1'$2")
    .replace(/\s+/g, ' ')
    .trim();
}

async function scanFromR2(s3Client, bucketName) {
  console.log(`[Catalog Generator] Scanning R2 bucket: ${bucketName}...`);
  const listCmd = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'podcasts/',
    MaxKeys: 1000,
  });
  const listRes = await s3Client.send(listCmd);
  const keys = (listRes.Contents || []).map(c => c.Key);
  const audioKeys = new Set(keys.filter(k => AUDIO_REGEX.test(k)));

  const showIds = [...new Set(keys.map(k => {
    const parts = k.split('/');
    return parts.length >= 2 ? parts[1] : null;
  }))].filter(id => id && !id.startsWith('.'));

  const books = (await Promise.all(showIds.map(async (showId) => {
    const showDir = `podcasts/${showId}`;
    const folderHasAudio = [...audioKeys].some(k => k.startsWith(`${showDir}/`));
    if (!folderHasAudio) return null;

    let showInfo = {};
    try {
      const showObj = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: `${showDir}/show.json` }));
      const showText = await showObj.Body.transformToString();
      if (showText) showInfo = JSON.parse(showText);
    } catch {}

    const metaKeys = keys.filter(k => k.startsWith(`${showDir}/episodes/`) && k.endsWith('/meta.json'));
    let episodes = [];

    if (metaKeys.length > 0) {
      episodes = (await Promise.all(metaKeys.map(async (metaKey) => {
        const epDir = metaKey.replace('/meta.json', '');
        const epId = epDir.split('/').pop();
        const directAudioKey = `${epDir}/audio.mp3`;
        const actualAudioKey = audioKeys.has(directAudioKey) ? directAudioKey : [...audioKeys].find(k => k.startsWith(`${epDir}/`));
        if (!actualAudioKey) return null;

        let epMeta = {};
        try {
          const epObj = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: metaKey }));
          const metaText = await epObj.Body.transformToString();
          if (metaText) epMeta = JSON.parse(metaText);
        } catch {}

        const epNum = parseInt(epMeta.episode || epId.replace('ep', ''), 10) || 1;
        return {
          id: `${showId}_${epId}`,
          epId,
          number: epNum,
          title: stripEmojis(epMeta.title) || `Chapter ${epNum}`,
          cnTitle: epMeta.cnTitle ? stripEmojis(epMeta.cnTitle) : '',
          description: stripEmojis(epMeta.description) || '',
          duration: epMeta.duration || '',
          durationSeconds: epMeta.durationSeconds || 0,
          audioKey: actualAudioKey,
          subtitleKey: `${epDir}/subtitle.vtt`,
          showId
        };
      }))).filter(Boolean);
    } else {
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
          showId
        };
      });
    }

    episodes.sort((a, b) => a.number - b.number);
    if (episodes.length === 0) return null;

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
      description: stripEmojis(showInfo.description) || '',
      coverPath: showInfo.coverPath || null,
      chapters: episodes
    };
  }))).filter(Boolean);

  books.sort((a, b) => {
    const order = ['hp-book-1', 'hp-book-2', 'hp-book-3', 'hp-book-4', 'hp-book-5', 'hp-book-6', 'hp-book-7', 'the-little-prince', 'tiny-tales'];
    const aIdx = order.indexOf(a.id);
    const bIdx = order.indexOf(b.id);
    return (aIdx !== -1 ? aIdx : 99) - (bIdx !== -1 ? bIdx : 99);
  });

  return books;
}

async function main() {
  console.log('[Catalog Generator] Generating static catalog.json for Cloudflare Pages / R2...');

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'fluentfox-podcast';

  let books = [];
  let s3 = null;

  if (accountId && accessKeyId && secretAccessKey) {
    try {
      s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey }
      });
      books = await scanFromR2(s3, bucketName);
      console.log(`[Catalog Generator] Scanned ${books.length} shows from Cloudflare R2.`);
    } catch (err) {
      console.warn('[Catalog Generator] Notice: R2 scanning encountered error:', err.message);
    }
  }

  if (!books || books.length === 0) {
    console.log('[Catalog Generator] Falling back to default HP_BOOKS catalog.');
    books = HP_BOOKS;
  }

  const catalogData = {
    generatedAt: Date.now(),
    generatedDate: new Date().toISOString(),
    totalBooks: books.length,
    books
  };

  const jsonContent = JSON.stringify(catalogData, null, 2);

  // 1. Write to public/catalog.json
  const publicPath = path.resolve(projectRoot, 'public', 'catalog.json');
  fs.writeFileSync(publicPath, jsonContent, 'utf8');
  console.log(`[Catalog Generator] Wrote static catalog to ${publicPath}`);

  // 2. Write to dist/catalog.json if dist exists
  const distDir = path.resolve(projectRoot, 'dist');
  if (fs.existsSync(distDir)) {
    const distPath = path.resolve(distDir, 'catalog.json');
    fs.writeFileSync(distPath, jsonContent, 'utf8');
    console.log(`[Catalog Generator] Wrote static catalog to ${distPath}`);
  }

  // 3. Publish to Cloudflare R2 bucket at podcasts/catalog.json if s3 available
  if (s3) {
    try {
      console.log(`[Catalog Generator] Uploading podcasts/catalog.json to R2 bucket: ${bucketName}...`);
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'podcasts/catalog.json',
        Body: jsonContent,
        ContentType: 'application/json',
        CacheControl: 'public, max-age=3600, stale-while-revalidate=86400'
      }));
      console.log('[Catalog Generator] Successfully published podcasts/catalog.json to Cloudflare R2!');
    } catch (uploadErr) {
      console.warn('[Catalog Generator] Notice: R2 upload skipped or failed:', uploadErr.message);
    }
  }

  console.log('[Catalog Generator] Completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Catalog Generator] Fatal error:', err);
  process.exit(1);
});
