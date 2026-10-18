import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set environment flags before importing server
process.env.NODE_ENV = 'test';
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_bytes_long';
process.env.ADMIN_SECRET_KEY = 'test_admin_secret_super_secure';

const { app, scanR2TedCatalog, _setS3ClientForTest } = await import('../../server/index.js');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (typeof _setS3ClientForTest === 'function') {
    _setS3ClientForTest(null);
  }
});

describe('TED R2 Auto-Discovery and Routes', () => {
  it('GET /api/ted/talks route is registered on Express server', async () => {
    const res = await fetch(`${baseUrl}/api/ted/talks`);
    // Should respond with 200 (or 503 if R2 client is completely unconfigured)
    assert.ok([200, 503].includes(res.status), `Unexpected status: ${res.status}`);
  });

  it('scanR2TedCatalog scans R2 bucket, parses metadata, and filters out folders without video', async () => {
    // Create mock S3 client
    const mockS3Keys = [
      'ted/simon-sinek-2009/video.mp4',
      'ted/simon-sinek-2009/subtitle.vtt',
      'ted/simon-sinek-2009/meta.json',
      'ted/brene-brown-vulnerability/video.webm',
      'ted/brene-brown-vulnerability/subtitle.vtt',
      'ted/no-video-here/notes.txt',
      'ted/flat-speaker-2024.mp4',
      'ted/flat-speaker-2024.vtt'
    ];

    const mockMetaJson = JSON.stringify({
      title: 'How Great Leaders Inspire Action',
      titleCn: '伟大领袖如何激励行动',
      speaker: 'Simon Sinek',
      year: 2009,
      durationSeconds: 1088,
      cefrLevel: 'B1',
      wpm: 142,
      topicTags: ['leadership', 'motivation']
    });

    const mockClient = {
      send: async (cmd) => {
        // ListObjectsV2Command
        if (cmd.constructor?.name === 'ListObjectsV2Command' || cmd.input?.Prefix === 'ted/') {
          return {
            Contents: mockS3Keys.map((k) => ({ Key: k }))
          };
        }
        // GetObjectCommand for meta.json
        if (cmd.input?.Key === 'ted/simon-sinek-2009/meta.json') {
          return {
            Body: {
              transformToString: async () => mockMetaJson
            }
          };
        }
        throw new Error(`NoSuchKey: ${cmd.input?.Key}`);
      }
    };

    if (typeof _setS3ClientForTest === 'function') {
      _setS3ClientForTest(mockClient);
    }

    assert.equal(typeof scanR2TedCatalog, 'function', 'scanR2TedCatalog must be exported');
    const talks = await scanR2TedCatalog(true);

    assert.ok(Array.isArray(talks), 'talks must be an array');
    assert.equal(talks.length, 3, 'Must discover exactly 3 talks with video files');

    // 1. Structured talk with meta.json
    const simonTalk = talks.find((t) => t.id.includes('simon-sinek-2009'));
    assert.ok(simonTalk, 'Must discover simon-sinek-2009');
    assert.equal(simonTalk.title, 'How Great Leaders Inspire Action');
    assert.equal(simonTalk.titleCn, '伟大领袖如何激励行动');
    assert.equal(simonTalk.speaker, 'Simon Sinek');
    assert.equal(simonTalk.videoKey, 'ted/simon-sinek-2009/video.mp4');
    assert.equal(simonTalk.vttKey, 'ted/simon-sinek-2009/subtitle.vtt');

    // 2. Structured talk without meta.json (auto-generated info)
    const breneTalk = talks.find((t) => t.id.includes('brene-brown-vulnerability'));
    assert.ok(breneTalk, 'Must discover brene-brown-vulnerability');
    assert.equal(breneTalk.videoKey, 'ted/brene-brown-vulnerability/video.webm');
    assert.equal(breneTalk.vttKey, 'ted/brene-brown-vulnerability/subtitle.vtt');
    assert.ok(breneTalk.title.length > 0);

    // 3. Flat video
    const flatTalk = talks.find((t) => t.id.includes('flat-speaker-2024'));
    assert.ok(flatTalk, 'Must discover flat-speaker-2024');
    assert.equal(flatTalk.videoKey, 'ted/flat-speaker-2024.mp4');
    assert.equal(flatTalk.vttKey, 'ted/flat-speaker-2024.vtt');

    // 4. Folder without video is excluded
    const noVideoTalk = talks.find((t) => t.id.includes('no-video-here'));
    assert.equal(noVideoTalk, undefined, 'Folders without video must be excluded');
  });

  it('GET /api/ted/talks returns 200 and discovered talks when mock client is active', async () => {
    const res = await fetch(`${baseUrl}/api/ted/talks?refresh=1`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.talks));
    assert.equal(data.talks.length, 3);
  });

  it('GET /api/subtitles/* returns VTT with no-cache and revalidation headers for fresh bilingual delivery', async () => {
    const res = await fetch(`${baseUrl}/api/subtitles/ted/20260106-how-japan-saved-its-biggest-city-from-collapse-roman/subtitle.vtt?_t=${Date.now()}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/vtt; charset=utf-8');
    const cacheControl = res.headers.get('cache-control') || '';
    assert.ok(cacheControl.includes('no-cache'), `Cache-Control must contain no-cache, got: ${cacheControl}`);
    const body = await res.text();
    assert.ok(body.includes('WEBVTT'), 'Response must be valid WebVTT');
    assert.ok(/[\u4e00-\u9fff]/.test(body), 'Response must contain Chinese characters');
  });
});
