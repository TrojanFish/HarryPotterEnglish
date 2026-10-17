import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// Set test environment flags
process.env.NODE_ENV = 'test';
process.env.VERCEL = '1';
process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_bytes_long';
process.env.ADMIN_SECRET_KEY = 'test_admin_secret_super_secure';

const { 
  app, 
  loadR2Feed, 
  scanR2Catalog, 
  scanR2TedCatalog, 
  _setS3ClientForTest, 
  _clearFeedCacheForTest 
} = await import('../../server/index.js');
const { r2DevPlugin } = await import('../../server/viteR2Plugin.js');

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

describe('R2 Content Feed Ingestion & Dual-Mode Fallback', () => {
  beforeEach(() => {
    if (typeof _clearFeedCacheForTest === 'function') {
      _clearFeedCacheForTest();
    }
  });

  const mockValidFeed = {
    version: '2.0.0',
    generatedAt: '2026-10-17T08:00:00Z',
    stats: { totalPodcasts: 1, totalTedTalks: 1 },
    podcasts: [
      {
        id: 'hp-book-1',
        title: 'Harry Potter and the Sorcerers Stone',
        cnTitle: '哈利·波特与魔法石',
        code: 'HP1',
        chapters: [
          {
            id: 'hp-book-1_ep01',
            epId: 'ep01',
            number: 1,
            title: 'The Boy Who Lived',
            audioKey: 'podcasts/hp-book-1/episodes/ep01/audio.mp3',
            subtitleKey: 'podcasts/hp-book-1/episodes/ep01/subtitle.vtt'
          }
        ]
      }
    ],
    ted: [
      {
        id: 'ted-simon-sinek-2009',
        title: 'How Great Leaders Inspire Action',
        titleCn: '伟大领袖如何激励行动',
        speaker: 'Simon Sinek',
        year: 2009,
        videoKey: 'ted/simon-sinek-2009/video.mp4',
        vttKey: 'ted/simon-sinek-2009/subtitle.vtt'
      }
    ]
  };

  it('loads both podcasts and ted talks when feed.json is present in R2', async () => {
    const mockClient = {
      send: async (cmd) => {
        if (cmd.input?.Key === 'feed.json') {
          return {
            ETag: '"test-feed-etag-001"',
            Body: {
              transformToString: async () => JSON.stringify(mockValidFeed)
            }
          };
        }
        throw new Error(`Unexpected S3 key: ${cmd.input?.Key}`);
      }
    };

    _setS3ClientForTest(mockClient);

    // 1. Direct function call
    assert.equal(typeof loadR2Feed, 'function', 'loadR2Feed must be exported');
    const feedResult = await loadR2Feed(true);
    assert.ok(feedResult, 'loadR2Feed should return parsed feed result');
    assert.equal(feedResult.fromFeed, true);
    assert.equal(feedResult.podcasts.length, 1);
    assert.equal(feedResult.ted.length, 1);

    // 2. GET /api/catalog?refresh=1
    const catRes = await fetch(`${baseUrl}/api/catalog?refresh=1`);
    assert.equal(catRes.status, 200);
    const catData = await catRes.json();
    assert.equal(catData.source, 'feed');
    assert.equal(catData.cached, false);
    assert.equal(catData.books.length, 1);
    assert.equal(catData.books[0].id, 'hp-book-1');

    // 3. GET /api/ted/talks?refresh=1
    const tedRes = await fetch(`${baseUrl}/api/ted/talks?refresh=1`);
    assert.equal(tedRes.status, 200);
    const tedData = await tedRes.json();
    assert.equal(tedData.source, 'feed');
    assert.equal(tedData.cached, false);
    assert.equal(tedData.talks.length, 1);
    assert.equal(tedData.talks[0].id, 'ted-simon-sinek-2009');
  });

  it('falls back seamlessly to directory scanner when feed.json is missing (NoSuchKey)', async () => {
    const mockScannerAudioKey = 'podcasts/hp-book-2/episodes/ep01/audio.mp3';
    const mockScannerShowJson = JSON.stringify({ title: 'Chamber of Secrets' });
    const mockScannerMetaJson = JSON.stringify({ title: 'The Worst Birthday', episode: '1' });
    const mockTedVideoKey = 'ted/brene-brown-vulnerability/video.webm';

    const mockClient = {
      send: async (cmd) => {
        const key = cmd.input?.Key;
        const prefix = cmd.input?.Prefix;

        // feed.json -> NoSuchKey
        if (key === 'feed.json') {
          const err = new Error('The specified key does not exist.');
          err.name = 'NoSuchKey';
          err.$metadata = { httpStatusCode: 404 };
          throw err;
        }

        // List podcast directory
        if (prefix === 'podcasts/') {
          return {
            Contents: [
              { Key: 'podcasts/hp-book-2/show.json' },
              { Key: mockScannerAudioKey },
              { Key: 'podcasts/hp-book-2/episodes/ep01/meta.json' }
            ]
          };
        }

        // List TED directory
        if (prefix === 'ted/') {
          return {
            Contents: [
              { Key: mockTedVideoKey },
              { Key: 'ted/brene-brown-vulnerability/subtitle.vtt' }
            ]
          };
        }

        // GetObjectCommand for podcast show.json & meta.json
        if (key === 'podcasts/hp-book-2/show.json') {
          return { Body: { transformToString: async () => mockScannerShowJson } };
        }
        if (key === 'podcasts/hp-book-2/episodes/ep01/meta.json') {
          return { Body: { transformToString: async () => mockScannerMetaJson } };
        }

        throw new Error(`NoSuchKey: ${key}`);
      }
    };

    _setS3ClientForTest(mockClient);

    // Direct function call returns null
    const feedResult = await loadR2Feed(true);
    assert.equal(feedResult, null, 'loadR2Feed should return null on NoSuchKey');

    // /api/catalog?refresh=1 returns scanner results
    const catRes = await fetch(`${baseUrl}/api/catalog?refresh=1`);
    assert.equal(catRes.status, 200);
    const catData = await catRes.json();
    assert.equal(catData.source, 'scanner');
    assert.equal(catData.cached, false);
    assert.ok(Array.isArray(catData.books));
    assert.equal(catData.books.length, 1);
    assert.equal(catData.books[0].id, 'hp-book-2');

    // /api/ted/talks?refresh=1 returns scanner results
    const tedRes = await fetch(`${baseUrl}/api/ted/talks?refresh=1`);
    assert.equal(tedRes.status, 200);
    const tedData = await tedRes.json();
    assert.equal(tedData.source, 'scanner');
    assert.equal(tedData.cached, false);
    assert.ok(Array.isArray(tedData.talks));
    assert.equal(tedData.talks.length, 1);
    assert.equal(tedData.talks[0].id, 'ted-brene-brown-vulnerability');
  });

  it('handles corrupt feed.json by safely falling back without 500 error', async () => {
    const mockScannerAudioKey = 'podcasts/tiny-tales/audio.mp3';
    const mockClient = {
      send: async (cmd) => {
        const key = cmd.input?.Key;
        const prefix = cmd.input?.Prefix;

        if (key === 'feed.json') {
          return {
            Body: {
              transformToString: async () => '<html><body>502 Bad Gateway</body></html>'
            }
          };
        }

        if (prefix === 'podcasts/') {
          return {
            Contents: [
              { Key: mockScannerAudioKey }
            ]
          };
        }

        if (prefix === 'ted/') {
          return {
            Contents: []
          };
        }

        throw new Error(`NoSuchKey: ${key}`);
      }
    };

    _setS3ClientForTest(mockClient);

    const feedResult = await loadR2Feed(true);
    assert.equal(feedResult, null, 'loadR2Feed should catch parse errors and return null');

    const catRes = await fetch(`${baseUrl}/api/catalog?refresh=1`);
    assert.equal(catRes.status, 200);
    const catData = await catRes.json();
    assert.equal(catData.source, 'scanner');
    assert.ok(Array.isArray(catData.books));

    const tedRes = await fetch(`${baseUrl}/api/ted/talks?refresh=1`);
    assert.equal(tedRes.status, 200);
    const tedData = await tedRes.json();
    assert.equal(tedData.source, 'scanner');
    assert.ok(Array.isArray(tedData.talks));
  });

  it('viteR2Plugin prioritizes local content/feed.json when present and falls back when absent', async () => {
    const plugin = r2DevPlugin();
    assert.equal(typeof plugin.configureServer, 'function');

    // Create a mock server to extract middleware
    let capturedMiddleware;
    plugin.configureServer({
      middlewares: {
        use: (fn) => { capturedMiddleware = fn; }
      }
    });
    assert.equal(typeof capturedMiddleware, 'function');

    const testContentDir = path.resolve(process.cwd(), 'content');
    const testFeedPath = path.resolve(testContentDir, 'feed.json');
    const originalFeedExisted = fs.existsSync(testFeedPath);
    let originalFeedContent = null;
    if (originalFeedExisted) {
      originalFeedContent = fs.readFileSync(testFeedPath, 'utf8');
    }

    try {
      // 1. Without content/feed.json -> fallback to DEFAULT_CATALOG & TALKS
      if (fs.existsSync(testFeedPath)) {
        fs.unlinkSync(testFeedPath);
      }

      const createMockRes = () => {
        let statusCode = 200;
        const headers = {};
        let body = '';
        return {
          statusCode,
          setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
          end: (data) => { body = data; },
          get body() { return body; },
          get parsed() { return JSON.parse(body); }
        };
      };

      const resCatFallback = createMockRes();
      await capturedMiddleware({ url: '/api/catalog' }, resCatFallback, () => {});
      const fallbackCatData = resCatFallback.parsed;
      assert.ok(Array.isArray(fallbackCatData.books));
      assert.equal(fallbackCatData.cached, true);
      assert.equal(fallbackCatData.source, undefined);

      const resTedFallback = createMockRes();
      await capturedMiddleware({ url: '/api/ted/talks' }, resTedFallback, () => {});
      const fallbackTedData = resTedFallback.parsed;
      assert.ok(Array.isArray(fallbackTedData.talks));
      assert.equal(fallbackTedData.cached, true);
      assert.equal(fallbackTedData.source, undefined);

      // 2. With content/feed.json -> returns local-feed
      if (!fs.existsSync(testContentDir)) {
        fs.mkdirSync(testContentDir, { recursive: true });
      }
      fs.writeFileSync(testFeedPath, JSON.stringify(mockValidFeed), 'utf8');

      const resCatLocal = createMockRes();
      await capturedMiddleware({ url: '/api/catalog' }, resCatLocal, () => {});
      const localCatData = resCatLocal.parsed;
      assert.equal(localCatData.source, 'local-feed');
      assert.equal(localCatData.books.length, 1);
      assert.equal(localCatData.books[0].id, 'hp-book-1');

      const resTedLocal = createMockRes();
      await capturedMiddleware({ url: '/api/ted/talks' }, resTedLocal, () => {});
      const localTedData = resTedLocal.parsed;
      assert.equal(localTedData.source, 'local-feed');
      assert.equal(localTedData.talks.length, 1);
      assert.equal(localTedData.talks[0].id, 'ted-simon-sinek-2009');
    } finally {
      // Clean up test feed.json
      if (fs.existsSync(testFeedPath)) {
        fs.unlinkSync(testFeedPath);
      }
      if (originalFeedExisted && originalFeedContent) {
        fs.writeFileSync(testFeedPath, originalFeedContent, 'utf8');
      }
    }
  });
});
