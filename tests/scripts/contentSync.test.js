import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { 
  syncContentToR2, 
  resolveContentType, 
  getCacheControl 
} from '../../scripts/content-sync.js';

describe('R2 Content Sync Tool', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hogwarts-sync-test-'));
  });

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('resolveContentType', () => {
    it('resolves correct MIME types for supported audio, video, subtitle, and image formats', () => {
      assert.equal(resolveContentType('audio.mp3'), 'audio/mpeg');
      assert.equal(resolveContentType('audio.m4a'), 'audio/mp4');
      assert.equal(resolveContentType('video.mp4'), 'video/mp4');
      assert.equal(resolveContentType('video.webm'), 'video/webm');
      assert.equal(resolveContentType('subtitles.vtt'), 'text/vtt; charset=utf-8');
      assert.equal(resolveContentType('manifest.json'), 'application/json; charset=utf-8');
      assert.equal(resolveContentType('cover.jpg'), 'image/jpeg');
      assert.equal(resolveContentType('cover.jpeg'), 'image/jpeg');
      assert.equal(resolveContentType('badge.png'), 'image/png');
      assert.equal(resolveContentType('unknown.bin'), 'application/octet-stream');
    });
  });

  describe('getCacheControl', () => {
    it('resolves appropriate cache headers for feed, media, and subtitles', () => {
      assert.match(getCacheControl('feed.json'), /max-age=60/);
      assert.match(getCacheControl('podcasts/hp1/audio.mp3'), /max-age=2592000/);
      assert.match(getCacheControl('ted/talk/video.mp4'), /max-age=2592000/);
      assert.match(getCacheControl('podcasts/hp1/subtitle.vtt'), /max-age=86400/);
    });
  });

  describe('syncContentToR2', () => {
    // Helper to build a valid mock content folder
    async function setupValidContent(baseDir) {
      const bookDir = path.join(baseDir, 'podcasts', 'hp-book-1');
      const epDir = path.join(bookDir, 'episodes', 'ep01');
      await fs.mkdir(epDir, { recursive: true });

      await fs.writeFile(
        path.join(bookDir, 'book.json'),
        JSON.stringify({
          title: "Harry Potter and the Philosopher's Stone",
          cnTitle: '哈利·波特与魔法石',
          code: 'HP1'
        })
      );
      await fs.writeFile(path.join(bookDir, 'cover.jpg'), 'cover-bytes');
      await fs.writeFile(path.join(epDir, 'audio.mp3'), 'audio-stream-content-12345');
      await fs.writeFile(path.join(epDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:04.000\nHello');
      await fs.writeFile(
        path.join(epDir, 'meta.json'),
        JSON.stringify({
          title: 'The Boy Who Lived',
          episode: 1,
          durationSeconds: 120
        })
      );
    }

    it('fails fast if content compiler detects blocking errors', async () => {
      // Invalid content structure: episode with subtitle but NO audio
      const invalidEpDir = path.join(tmpDir, 'podcasts', 'broken-book', 'episodes', 'ep01');
      await fs.mkdir(invalidEpDir, { recursive: true });
      await fs.writeFile(path.join(invalidEpDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:02.000\nBroken');

      const result = await syncContentToR2(tmpDir, { dryRun: true });
      assert.equal(result.success, false);
      assert.ok(result.errors && result.errors.length > 0);
      assert.match(result.errors[0], /Missing audio/);
    });

    it('returns error if R2 credentials and s3Client are missing', async () => {
      await setupValidContent(tmpDir);

      const oldEnv = { ...process.env };
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;

      try {
        const result = await syncContentToR2(tmpDir);
        assert.equal(result.success, false);
        assert.ok(result.errors && result.errors.length > 0);
        assert.match(result.errors[0], /R2 credentials not configured/i);
      } finally {
        process.env = oldEnv;
      }
    });

    it('performs incremental upload skipping unchanged remote objects', async () => {
      await setupValidContent(tmpDir);

      // Measure local audio size to simulate matching remote object
      const audioPath = path.join(tmpDir, 'podcasts', 'hp-book-1', 'episodes', 'ep01', 'audio.mp3');
      const audioStat = await fs.stat(audioPath);

      const uploadedCommands = [];
      const mockS3 = {
        send: async (cmd) => {
          const cmdName = cmd.constructor?.name;
          if (cmd.input?.Prefix !== undefined) {
            // ListObjectsV2Command mock
            if (cmd.input.Prefix === 'podcasts/') {
              return {
                Contents: [
                  {
                    Key: 'podcasts/hp-book-1/episodes/ep01/audio.mp3',
                    Size: audioStat.size,
                    ETag: '"matched-audio-etag"'
                  }
                ],
                IsTruncated: false
              };
            }
            return { Contents: [], IsTruncated: false };
          }

          if (cmd.input?.Key) {
            // PutObjectCommand mock
            uploadedCommands.push({
              key: cmd.input.Key,
              contentType: cmd.input.ContentType,
              cacheControl: cmd.input.CacheControl
            });
            return { ETag: '"put-success"' };
          }

          throw new Error('Unexpected command input');
        }
      };

      const result = await syncContentToR2(tmpDir, {
        s3Client: mockS3,
        bucketName: 'test-bucket'
      });

      assert.equal(result.success, true);
      // Audio had identical size and should be skipped
      assert.ok(result.skippedFiles.includes('podcasts/hp-book-1/episodes/ep01/audio.mp3'));
      // Other files (cover, subtitle, meta, book.json, feed.json) should be uploaded
      assert.ok(result.uploadedFiles.includes('podcasts/hp-book-1/cover.jpg'));
      assert.ok(result.uploadedFiles.includes('podcasts/hp-book-1/episodes/ep01/subtitle.vtt'));
      assert.ok(result.uploadedFiles.includes('feed.json'));
      assert.equal(result.feedUpdated, true);

      // Verify feed.json was uploaded LAST
      const lastUpload = uploadedCommands[uploadedCommands.length - 1];
      assert.equal(lastUpload.key, 'feed.json');
      assert.equal(lastUpload.contentType, 'application/json; charset=utf-8');
      assert.match(lastUpload.cacheControl, /max-age=60/);
    });

    it('forces upload of all files when forceUpload is true', async () => {
      await setupValidContent(tmpDir);

      const audioPath = path.join(tmpDir, 'podcasts', 'hp-book-1', 'episodes', 'ep01', 'audio.mp3');
      const audioStat = await fs.stat(audioPath);

      const putKeys = [];
      const mockS3 = {
        send: async (cmd) => {
          if (cmd.input?.Prefix !== undefined) {
            return {
              Contents: [
                {
                  Key: 'podcasts/hp-book-1/episodes/ep01/audio.mp3',
                  Size: audioStat.size
                }
              ],
              IsTruncated: false
            };
          }
          if (cmd.input?.Key) {
            putKeys.push(cmd.input.Key);
            return { ETag: '"forced"' };
          }
          return {};
        }
      };

      const result = await syncContentToR2(tmpDir, {
        s3Client: mockS3,
        forceUpload: true
      });

      assert.equal(result.success, true);
      assert.equal(result.skippedFiles.length, 0);
      assert.ok(result.uploadedFiles.includes('podcasts/hp-book-1/episodes/ep01/audio.mp3'));
      assert.ok(putKeys.includes('podcasts/hp-book-1/episodes/ep01/audio.mp3'));
    });

    it('supports dry-run mode without issuing PutObject commands', async () => {
      await setupValidContent(tmpDir);

      let putCount = 0;
      const mockS3 = {
        send: async (cmd) => {
          if (cmd.input?.Prefix !== undefined) {
            return { Contents: [], IsTruncated: false };
          }
          if (cmd.input?.Key) {
            putCount++;
            return {};
          }
          return {};
        }
      };

      const result = await syncContentToR2(tmpDir, {
        s3Client: mockS3,
        dryRun: true
      });

      assert.equal(result.success, true);
      assert.equal(putCount, 0, 'No PutObject command should execute during dry run');
      assert.ok(result.uploadedFiles.length > 0);
      assert.equal(result.feedUpdated, false);
    });

    it('triggers refreshUrl cache invalidation on successful sync', async () => {
      await setupValidContent(tmpDir);

      let refreshedUrl = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url) => {
        refreshedUrl = url;
        return { ok: true, status: 200 };
      };

      try {
        const mockS3 = {
          send: async (cmd) => {
            if (cmd.input?.Prefix !== undefined) {
              return { Contents: [], IsTruncated: false };
            }
            return { ETag: '"ok"' };
          }
        };

        const targetRefresh = 'http://127.0.0.1:3001/api/catalog?refresh=1';
        const result = await syncContentToR2(tmpDir, {
          s3Client: mockS3,
          refreshUrl: targetRefresh
        });

        assert.equal(result.success, true);
        assert.equal(refreshedUrl, targetRefresh);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('handles refreshUrl failure gracefully without failing sync operation', async () => {
      await setupValidContent(tmpDir);

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        throw new Error('Connection refused to backend refresh endpoint');
      };

      try {
        const mockS3 = {
          send: async () => ({ Contents: [], IsTruncated: false })
        };

        const result = await syncContentToR2(tmpDir, {
          s3Client: mockS3,
          refreshUrl: 'http://127.0.0.1:9999/api/catalog?refresh=1'
        });

        // Sync operation itself succeeded even if optional refresh notification warned
        assert.equal(result.success, true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
