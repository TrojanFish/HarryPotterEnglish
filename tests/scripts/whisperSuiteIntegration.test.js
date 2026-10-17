import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { validateVttContent, compileContentFeed } from '../../scripts/content-compiler.js';

const execFileAsync = promisify(execFile);

describe('Whisper Studio Suite Exporter & Content Feed Integration', () => {
  let tmpDir;
  let mockVideoPath;
  let mockAudioPath;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hogwarts-suite-node-test-'));
    mockVideoPath = path.join(tmpDir, 'test_lecture.mp4');
    mockAudioPath = path.join(tmpDir, 'test_chapter.mp3');

    await fs.writeFile(mockVideoPath, 'MOCK_VIDEO_BINARY_DATA');
    await fs.writeFile(mockAudioPath, 'MOCK_AUDIO_BINARY_DATA');
  });

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('exports TED and Podcast suites via suite_exporter and compiles feed with zero errors', async () => {
    const contentRoot = path.join(tmpDir, 'content');

    const pythonScript = `
import sys, os, json
sys.path.insert(0, os.path.abspath('tools/whisper-studio'))
from core.suite_exporter import export_hogwarts_suite

content_root = sys.argv[1]
video_path = sys.argv[2]
audio_path = sys.argv[3]

cues = [
    {
        "start": 0.0,
        "end": 3.8,
        "text": "Welcome to Defense Against the Dark Arts.",
        "translation": "欢迎来到黑魔法防御术课堂。"
    },
    {
        "start": 3.8,
        "end": 7.5,
        "text": "Today we study the Boggart.",
        "translation": "今天我们学习博格特。"
    }
]

res_ted = export_hogwarts_suite(
    media_path=video_path,
    subtitles=cues,
    meta_info={
        "type": "ted",
        "id": "defense-against-dark-arts",
        "title": "Defense Against the Dark Arts",
        "speaker": "Remus Lupin",
        "cefrLevel": "B2"
    },
    content_root=content_root,
    recompile_feed=False
)

res_podcast = export_hogwarts_suite(
    media_path=audio_path,
    subtitles=cues,
    meta_info={
        "type": "podcast",
        "id": "hp-book-1",
        "title": "The Boy Who Lived",
        "chapter": 1,
        "author": "J.K. Rowling",
        "narrator": "Stephen Fry"
    },
    content_root=content_root,
    recompile_feed=False
)

print(json.dumps({"ted": res_ted, "podcast": res_podcast}))
`;

    const { stdout } = await execFileAsync(
      'python',
      ['-c', pythonScript, contentRoot, mockVideoPath, mockAudioPath],
      { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
    );

    const exportResults = JSON.parse(stdout.trim());
    assert.equal(exportResults.ted.success, true, `TED export failed: ${JSON.stringify(exportResults.ted.errors)}`);
    assert.equal(exportResults.podcast.success, true, `Podcast export failed: ${JSON.stringify(exportResults.podcast.errors)}`);

    // Verify VTT validity for TED talk
    const tedVttPath = path.join(contentRoot, 'ted', 'defense-against-dark-arts', 'subtitle.vtt');
    const tedVttRaw = await fs.readFile(tedVttPath, 'utf-8');
    const tedVttValidation = validateVttContent(tedVttRaw);
    assert.equal(tedVttValidation.valid, true, `TED VTT invalid: ${tedVttValidation.error}`);
    assert.equal(tedVttValidation.cuesCount, 2);
    assert.match(tedVttRaw, /Welcome to Defense Against the Dark Arts\.\r?\n欢迎来到黑魔法防御术课堂。/);

    // Verify VTT validity for Podcast chapter
    const podcastVttPath = path.join(contentRoot, 'podcasts', 'hp-book-1', 'episodes', 'ep01', 'subtitles.vtt');
    const podcastVttRaw = await fs.readFile(podcastVttPath, 'utf-8');
    const podcastVttValidation = validateVttContent(podcastVttRaw);
    assert.equal(podcastVttValidation.valid, true, `Podcast VTT invalid: ${podcastVttValidation.error}`);
    assert.equal(podcastVttValidation.cuesCount, 2);

    // Compile content feed using content-compiler.js
    const compileResult = await compileContentFeed(contentRoot, { dryRun: false });

    // Must compile with ZERO errors
    assert.equal(compileResult.errors.length, 0, `Content compiler produced errors: ${compileResult.errors.join('; ')}`);
    assert.equal(compileResult.stats.tedTalksCount, 1);
    assert.equal(compileResult.stats.booksCount, 1);
    assert.equal(compileResult.stats.episodesCount, 1);

    // Check feed data fields
    const compiledTed = compileResult.feed.ted[0];
    assert.equal(compiledTed.speaker, 'Remus Lupin');
    assert.equal(compiledTed.cefrLevel, 'B2');

    const compiledPodcast = compileResult.feed.podcasts[0];
    assert.equal(compiledPodcast.id, 'hp-book-1');
    assert.equal(compiledPodcast.chapters.length, 1);
    assert.equal(compiledPodcast.chapters[0].number, 1);

    // Ensure zero Unicode emojis across all feed data
    const feedJson = JSON.stringify(compileResult.feed);
    const emojiMatch = feedJson.match(/[\p{Extended_Pictographic}\uFE0E\uFE0F]/gu);
    assert.equal(emojiMatch, null, 'Feed JSON contains forbidden Unicode emojis');
  });

  it('handles multi-chapter podcast additions while preserving series metadata', async () => {
    const contentRoot = path.join(tmpDir, 'content');

    const pythonScript = `
import sys, os, json
sys.path.insert(0, os.path.abspath('tools/whisper-studio'))
from core.suite_exporter import export_hogwarts_suite

content_root = sys.argv[1]
audio_path = sys.argv[2]
cues = [{"start": 0.0, "end": 2.0, "text": "Test chapter.", "translation": "测试章节。"}]

# Export Chapter 1
export_hogwarts_suite(
    media_path=audio_path,
    subtitles=cues,
    meta_info={"type": "podcast", "id": "hp-book-2", "chapter": 1, "title": "The Worst Birthday"},
    content_root=content_root,
    recompile_feed=False
)

# Export Chapter 2
res_ch2 = export_hogwarts_suite(
    media_path=audio_path,
    subtitles=cues,
    meta_info={"type": "podcast", "id": "hp-book-2", "chapter": 2, "title": "Dobby's Warning"},
    content_root=content_root,
    recompile_feed=False
)

print(json.dumps(res_ch2))
`;

    const { stdout } = await execFileAsync(
      'python',
      ['-c', pythonScript, contentRoot, mockAudioPath],
      { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
    );

    const ch2Res = JSON.parse(stdout.trim());
    assert.equal(ch2Res.success, true);

    const compileResult = await compileContentFeed(contentRoot, { dryRun: true });
    assert.equal(compileResult.errors.length, 0);
    assert.equal(compileResult.stats.booksCount, 1);
    assert.equal(compileResult.stats.episodesCount, 2);

    const chapters = compileResult.feed.podcasts[0].chapters;
    assert.equal(chapters[0].number, 1);
    assert.equal(chapters[1].number, 2);
    assert.equal(chapters[1].title, "Dobby's Warning");
  });
});
