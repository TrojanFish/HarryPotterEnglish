import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand 
} from '@aws-sdk/client-s3';
import { compileContentFeed } from './content-compiler.js';

dotenv.config();

/**
 * Resolves standard MIME type based on file extension.
 * @param {string} filePath
 * @returns {string}
 */
export function resolveContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg';
    case '.m4a':
      return 'audio/mp4';
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.vtt':
      return 'text/vtt; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Returns cache-control header directive for specific object key.
 * @param {string} key
 * @returns {string}
 */
export function getCacheControl(key) {
  if (key === 'feed.json' || key.endsWith('/feed.json')) {
    return 'public, max-age=60, stale-while-revalidate=120';
  }
  if (/\.(mp3|m4a|mp4|webm|jpg|jpeg|png)$/i.test(key)) {
    return 'public, max-age=2592000, immutable';
  }
  return 'public, max-age=86400';
}

/**
 * Recursively scans directory and collects relative file keys and stats.
 * @param {string} dir
 * @param {string} baseDir
 * @returns {Promise<Array<{ key: string, fullPath: string, size: number }>>}
 */
async function scanLocalFiles(dir, baseDir) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Ignore hidden files and system directories
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await scanLocalFiles(fullPath, baseDir);
      files = files.concat(subFiles);
    } else if (entry.isFile()) {
      const relKey = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const stat = await fs.stat(fullPath);
      files.push({
        key: relKey,
        fullPath,
        size: stat.size
      });
    }
  }

  return files;
}

/**
 * Incrementally syncs local content directory to Cloudflare R2 bucket.
 * @param {string} contentDir - Path to local content/ directory.
 * @param {object} [options]
 * @param {object} [options.s3Client] - Optional injected S3Client instance (for testing).
 * @param {string} [options.bucketName] - Bucket name (defaults to env R2_BUCKET_NAME).
 * @param {boolean} [options.dryRun] - If true, computes diff without executing PutObject.
 * @param {boolean} [options.forceUpload] - If true, re-uploads all files ignoring remote state.
 * @param {string} [options.refreshUrl] - Optional URL to trigger server cache invalidation.
 * @returns {Promise<{ success: boolean, uploadedFiles: string[], skippedFiles: string[], feedUpdated: boolean, errors?: string[] }>}
 */
export async function syncContentToR2(contentDir, options = {}) {
  const resolvedContentDir = path.resolve(contentDir);
  const dryRun = Boolean(options.dryRun);
  const forceUpload = Boolean(options.forceUpload);
  const bucketName = options.bucketName || process.env.R2_BUCKET_NAME || 'fluentfox-podcast';

  // 1. Validate content and build feed.json
  let compileResult;
  try {
    compileResult = await compileContentFeed(resolvedContentDir, { dryRun });
  } catch (err) {
    return {
      success: false,
      uploadedFiles: [],
      skippedFiles: [],
      feedUpdated: false,
      errors: [err.message]
    };
  }

  if (compileResult.errors && compileResult.errors.length > 0) {
    return {
      success: false,
      uploadedFiles: [],
      skippedFiles: [],
      feedUpdated: false,
      errors: compileResult.errors
    };
  }

  // 2. Initialize S3 client
  let s3Client = options.s3Client;
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return {
        success: false,
        uploadedFiles: [],
        skippedFiles: [],
        feedUpdated: false,
        errors: ['R2 credentials not configured: missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY']
      };
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  try {
    // 3. Gather local files under contentDir
    const localFiles = await scanLocalFiles(resolvedContentDir, resolvedContentDir);

    // If dryRun and feed.json was not written to disk, include virtual feed.json in candidate list
    if (dryRun && !localFiles.some(f => f.key === 'feed.json')) {
      const feedJsonString = JSON.stringify(compileResult.feed, null, 2);
      localFiles.push({
        key: 'feed.json',
        fullPath: path.join(resolvedContentDir, 'feed.json'),
        size: Buffer.byteLength(feedJsonString, 'utf-8'),
        virtualContent: feedJsonString
      });
    }

    // 4. Query remote objects in R2
    const remoteObjects = new Map();
    const prefixes = ['podcasts/', 'ted/', 'feed.json'];

    for (const prefix of prefixes) {
      let continuationToken = undefined;
      do {
        const listCmd = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken
        });
        const listRes = await s3Client.send(listCmd);
        if (Array.isArray(listRes.Contents)) {
          for (const item of listRes.Contents) {
            if (item.Key) {
              remoteObjects.set(item.Key, {
                size: item.Size ?? 0,
                etag: item.ETag
              });
            }
          }
        }
        continuationToken = listRes.IsTruncated ? listRes.NextContinuationToken : undefined;
      } while (continuationToken);
    }

    // 5. Partition into uploadedFiles and skippedFiles
    const uploadedFiles = [];
    const skippedFiles = [];
    const localFileMap = new Map();

    for (const file of localFiles) {
      localFileMap.set(file.key, file);
      const remote = remoteObjects.get(file.key);

      if (!forceUpload && remote && remote.size === file.size) {
        skippedFiles.push(file.key);
      } else {
        uploadedFiles.push(file.key);
      }
    }

    // If any media files need to be uploaded, ensure feed.json is also uploaded atomically
    const mediaFilesUploaded = uploadedFiles.filter(k => k !== 'feed.json');
    if (mediaFilesUploaded.length > 0 && !uploadedFiles.includes('feed.json') && localFileMap.has('feed.json')) {
      const skipIdx = skippedFiles.indexOf('feed.json');
      if (skipIdx !== -1) {
        skippedFiles.splice(skipIdx, 1);
      }
      uploadedFiles.push('feed.json');
    }

    let feedUpdated = false;

    // 6. Execute uploads if not in dry-run mode
    if (!dryRun) {
      // Upload media, subtitle, and metadata files first
      for (const key of uploadedFiles) {
        if (key === 'feed.json') continue;

        const fileInfo = localFileMap.get(key);
        const fileBuffer = await fs.readFile(fileInfo.fullPath);

        const putCmd = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: resolveContentType(key),
          CacheControl: getCacheControl(key)
        });
        await s3Client.send(putCmd);
      }

      // Upload feed.json LAST for atomic availability
      if (uploadedFiles.includes('feed.json')) {
        const feedInfo = localFileMap.get('feed.json');
        let feedBuffer;
        if (existsSync(feedInfo.fullPath)) {
          feedBuffer = await fs.readFile(feedInfo.fullPath);
        } else {
          feedBuffer = Buffer.from(JSON.stringify(compileResult.feed, null, 2), 'utf-8');
        }

        const putFeedCmd = new PutObjectCommand({
          Bucket: bucketName,
          Key: 'feed.json',
          Body: feedBuffer,
          ContentType: resolveContentType('feed.json'),
          CacheControl: getCacheControl('feed.json')
        });
        await s3Client.send(putFeedCmd);
        feedUpdated = true;
      }

      // 7. Trigger cache invalidation if refreshUrl provided
      if (options.refreshUrl && feedUpdated) {
        try {
          await fetch(options.refreshUrl);
        } catch (fetchErr) {
          console.warn(`[Content Sync] Refresh URL request failed: ${fetchErr.message}`);
        }
      }
    }

    return {
      success: true,
      uploadedFiles,
      skippedFiles,
      feedUpdated
    };
  } catch (syncErr) {
    return {
      success: false,
      uploadedFiles: [],
      skippedFiles: [],
      feedUpdated: false,
      errors: [syncErr.message]
    };
  }
}

// CLI direct execution entrypoint
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  (async () => {
    let contentDir = path.resolve(process.cwd(), 'content');
    let dryRun = false;
    let forceUpload = false;
    let bucketName = null;
    let refreshUrl = null;

    for (const arg of process.argv.slice(2)) {
      if (arg.startsWith('--content-dir=')) {
        contentDir = path.resolve(arg.split('=')[1]);
      } else if (arg.startsWith('--bucket=')) {
        bucketName = arg.split('=')[1];
      } else if (arg.startsWith('--refresh-url=')) {
        refreshUrl = arg.split('=')[1];
      } else if (arg === '--dry-run') {
        dryRun = true;
      } else if (arg === '--force') {
        forceUpload = true;
      }
    }

    console.log(`[Content Sync] Target directory: ${contentDir}`);
    if (dryRun) console.log('[Content Sync] Running in dry-run mode (no files will be uploaded)');
    if (forceUpload) console.log('[Content Sync] Force upload enabled (ignoring remote cache)');

    const result = await syncContentToR2(contentDir, {
      dryRun,
      forceUpload,
      bucketName,
      refreshUrl
    });

    if (!result.success) {
      console.error('[Content Sync Error] Sync failed:');
      for (const err of (result.errors || [])) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }

    console.log('[Content Sync] Sync completed successfully:');
    console.log(`  - Uploaded: ${result.uploadedFiles.length} files`);
    console.log(`  - Skipped (already in sync): ${result.skippedFiles.length} files`);
    console.log(`  - Feed manifest updated: ${result.feedUpdated}`);
    console.log('[Content Sync] Done.');
    process.exit(0);
  })();
}
