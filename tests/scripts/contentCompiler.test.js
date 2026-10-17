import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { 
  validateVttContent, 
  stripEmojis, 
  compileContentFeed 
} from '../../scripts/content-compiler.js';

describe('Content Compiler & Validator', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hogwarts-content-test-'));
  });

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('validateVttContent', () => {
    it('validates WebVTT content syntax and counts cues correctly', () => {
      const vtt = 'WEBVTT\n\n00:01.000 --> 00:03.000\nHello World\n\n00:04.500 --> 00:07.000\nSecond Cue';
      const result = validateVttContent(vtt);
      assert.equal(result.valid, true);
      assert.equal(result.cuesCount, 2);
      assert.equal(result.error, undefined);
    });

    it('strips leading UTF-8 BOM before validating signature', () => {
      const vttWithBom = '\uFEFFWEBVTT\n\n00:01.000 --> 00:03.000\nHello with BOM';
      const result = validateVttContent(vttWithBom);
      assert.equal(result.valid, true);
      assert.equal(result.cuesCount, 1);
    });

    it('rejects corrupted subtitle missing WEBVTT signature', () => {
      const invalidVtt = '00:01.000 --> 00:03.000\nMissing signature';
      const result = validateVttContent(invalidVtt);
      assert.equal(result.valid, false);
      assert.equal(result.cuesCount, 0);
      assert.match(result.error, /Missing WEBVTT signature/);
    });

    it('handles hour-formatted and comma-separated timestamps', () => {
      const vtt = 'WEBVTT\n\n01:12:03,123 --> 01:12:05,456\nLong cue';
      const result = validateVttContent(vtt);
      assert.equal(result.valid, true);
      assert.equal(result.cuesCount, 1);
    });

    it('handles empty or non-string inputs safely', () => {
      assert.equal(validateVttContent('').valid, false);
      assert.equal(validateVttContent(null).valid, false);
      assert.equal(validateVttContent(undefined).valid, false);
    });
  });

  describe('stripEmojis', () => {
    it('strips Unicode emoji pictographics from text', () => {
      // Use Unicode escapes to keep codebase strictly zero-emoji
      const emojiText = 'Chapter 1 \u{1F4DA} The Magic Boy \u{1F9D9}';
      const cleaned = stripEmojis(emojiText);
      assert.equal(cleaned, 'Chapter 1 The Magic Boy');
    });

    it('preserves clean text without modification', () => {
      const plain = 'Harry Potter and the Chamber of Secrets';
      assert.equal(stripEmojis(plain), plain);
    });

    it('handles non-string or falsy values gracefully', () => {
      assert.equal(stripEmojis(null), '');
      assert.equal(stripEmojis(undefined), '');
      assert.equal(stripEmojis(123), '');
    });
  });

  describe('compileContentFeed', () => {
    it('scans mock content directory and compiles valid feed.json manifest', async () => {
      // Setup podcasts folder
      const bookDir = path.join(tmpDir, 'podcasts', 'hp-book-1');
      const epDir = path.join(bookDir, 'episodes', 'ep01');
      await fs.mkdir(epDir, { recursive: true });

      await fs.writeFile(
        path.join(bookDir, 'book.json'),
        JSON.stringify({
          title: "Harry Potter and the Philosopher's Stone",
          cnTitle: '哈利·波特与魔法石',
          code: 'HP1',
          color: '#740001'
        })
      );
      await fs.writeFile(path.join(bookDir, 'cover.jpg'), 'fake-image-bytes');
      await fs.writeFile(path.join(epDir, 'audio.mp3'), 'fake-audio-bytes');
      await fs.writeFile(path.join(epDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:04.000\nThe Boy Who Lived');
      await fs.writeFile(
        path.join(epDir, 'meta.json'),
        JSON.stringify({
          title: 'The Boy Who Lived',
          cnTitle: '大难不死的男孩',
          episode: 1,
          durationSeconds: 920
        })
      );

      // Setup TED folder
      const tedDir = path.join(tmpDir, 'ted', 'simon-sinek-2009');
      await fs.mkdir(tedDir, { recursive: true });
      await fs.writeFile(path.join(tedDir, 'video.mp4'), 'fake-video-bytes');
      await fs.writeFile(path.join(tedDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:05.000\nHow Leaders Inspire');
      await fs.writeFile(path.join(tedDir, 'cover.jpg'), 'fake-thumb-bytes');
      await fs.writeFile(
        path.join(tedDir, 'meta.json'),
        JSON.stringify({
          title: 'How Great Leaders Inspire Action',
          titleCn: '伟大领袖如何激励行动',
          speaker: 'Simon Sinek',
          year: 2009,
          durationSeconds: 1088,
          cefrLevel: 'B1',
          wpm: 142
        })
      );

      const result = await compileContentFeed(tmpDir);

      assert.equal(result.errors.length, 0);
      assert.equal(result.stats.booksCount, 1);
      assert.equal(result.stats.episodesCount, 1);
      assert.equal(result.stats.tedTalksCount, 1);

      // Verify feed.json was written to disk
      const feedPath = path.join(tmpDir, 'feed.json');
      const feedRaw = await fs.readFile(feedPath, 'utf-8');
      const feed = JSON.parse(feedRaw);

      assert.equal(feed.version, 'hogwarts-feed-v1');
      assert.equal(feed.podcasts.length, 1);
      assert.equal(feed.podcasts[0].id, 'hp-book-1');
      assert.equal(feed.podcasts[0].coverKey, 'podcasts/hp-book-1/cover.jpg');
      assert.equal(feed.podcasts[0].chapters.length, 1);
      assert.equal(feed.podcasts[0].chapters[0].id, 'hp-book-1_ep01');
      assert.equal(feed.podcasts[0].chapters[0].audioKey, 'podcasts/hp-book-1/episodes/ep01/audio.mp3');
      assert.equal(feed.podcasts[0].chapters[0].subtitleKey, 'podcasts/hp-book-1/episodes/ep01/subtitle.vtt');
      assert.equal(feed.podcasts[0].chapters[0].durationSeconds, 920);

      assert.equal(feed.ted.length, 1);
      assert.equal(feed.ted[0].id, 'ted-simon-sinek-2009');
      assert.equal(feed.ted[0].speaker, 'Simon Sinek');
      assert.equal(feed.ted[0].videoKey, 'ted/simon-sinek-2009/video.mp4');
      assert.equal(feed.ted[0].vttKey, 'ted/simon-sinek-2009/subtitle.vtt');
      assert.equal(feed.ted[0].thumbnailKey, 'ted/simon-sinek-2009/cover.jpg');
    });

    it('filters out episodes and books with no audio files', async () => {
      // Book with episode having only subtitle but NO audio
      const emptyBookDir = path.join(tmpDir, 'podcasts', 'hp-book-empty', 'episodes', 'ep01');
      await fs.mkdir(emptyBookDir, { recursive: true });
      await fs.writeFile(path.join(emptyBookDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:02.000\nNo audio');

      const result = await compileContentFeed(tmpDir);
      assert.equal(result.stats.booksCount, 0);
      assert.equal(result.feed.podcasts.length, 0);
      assert.ok(result.errors.length > 0);
      assert.match(result.errors[0], /Missing audio/);
    });

    it('filters out TED talks with no video file', async () => {
      const emptyTedDir = path.join(tmpDir, 'ted', 'no-video-talk');
      await fs.mkdir(emptyTedDir, { recursive: true });
      await fs.writeFile(path.join(emptyTedDir, 'subtitle.vtt'), 'WEBVTT\n\n00:01.000 --> 00:02.000\nNo video');

      const result = await compileContentFeed(tmpDir);
      assert.equal(result.stats.tedTalksCount, 0);
      assert.equal(result.feed.ted.length, 0);
      assert.ok(result.errors.length > 0);
      assert.match(result.errors[0], /Missing video/);
    });

    it('captures errors for corrupted subtitle files', async () => {
      const bookDir = path.join(tmpDir, 'podcasts', 'hp-corrupt', 'episodes', 'ep01');
      await fs.mkdir(bookDir, { recursive: true });
      await fs.writeFile(path.join(bookDir, 'audio.mp3'), 'audio');
      await fs.writeFile(path.join(bookDir, 'subtitle.vtt'), 'CORRUPTED FILE NOT WEBVTT');

      const result = await compileContentFeed(tmpDir);
      assert.ok(result.errors.length > 0);
      assert.ok(result.errors.some(e => e.includes('Missing WEBVTT signature')));
    });

    it('auto-generates title, speaker, and year for TED talk when meta.json is absent', async () => {
      const tedDir = path.join(tmpDir, 'ted', 'brene-brown-2010');
      await fs.mkdir(tedDir, { recursive: true });
      await fs.writeFile(path.join(tedDir, 'video.mp4'), 'video');

      const result = await compileContentFeed(tmpDir);
      assert.equal(result.feed.ted.length, 1);
      const talk = result.feed.ted[0];
      assert.equal(talk.id, 'ted-brene-brown-2010');
      assert.equal(talk.title, 'Brene Brown 2010');
      assert.equal(talk.year, 2010);
      assert.equal(talk.speaker, 'TED Speaker');
      assert.equal(talk.cefrLevel, 'B1');
    });

    it('supports dryRun option and custom outputPath', async () => {
      const bookDir = path.join(tmpDir, 'podcasts', 'dry-book', 'episodes', 'ep01');
      await fs.mkdir(bookDir, { recursive: true });
      await fs.writeFile(path.join(bookDir, 'audio.mp3'), 'audio');

      // Test dryRun
      const dryResult = await compileContentFeed(tmpDir, { dryRun: true });
      assert.equal(dryResult.stats.booksCount, 1);
      const defaultFeedExists = await fs.access(path.join(tmpDir, 'feed.json')).then(() => true).catch(() => false);
      assert.equal(defaultFeedExists, false);

      // Test custom outputPath
      const customOut = path.join(tmpDir, 'custom', 'out-feed.json');
      await compileContentFeed(tmpDir, { outputPath: customOut });
      const customExists = await fs.access(customOut).then(() => true).catch(() => false);
      assert.equal(customExists, true);
    });
  });
});
