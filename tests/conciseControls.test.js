import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function compileJsx(filePath, outPath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code
    .replace(/from '(\.\.\/)+utils\/([^']+)'/g, (m, p1, p2) => `from '../src/utils/${p2.replace(/\.js$/, '')}.js'`)
    .replace(/from '(\.\.\/)+data\/([^']+)'/g, (m, p1, p2) => `from '../src/data/${p2.replace(/\.js$/, '')}.js'`)
    .replace("from './PodcastLyricsStream'", "from './PodcastLyricsStream.concise.compiled.js'")
    .replace("from '../common/GoldenSnitchScrubber.jsx'", "from './GoldenSnitchScrubber.concise.compiled.js'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(outPath, transformed.code, 'utf8');
}

test('Concise Controls (Sleep Timer, Translation, Font Size) Test Suite', async (t) => {
  // Transpile GoldenSnitchScrubber.jsx
  const snitchPath = path.resolve(projectRoot, 'src', 'components', 'common', 'GoldenSnitchScrubber.jsx');
  const transformedSnitch = esbuild.transformSync(fs.readFileSync(snitchPath, 'utf8'), { loader: 'jsx', format: 'esm' });
  const snitchCompiled = path.resolve(__dirname, 'GoldenSnitchScrubber.concise.compiled.js');
  fs.writeFileSync(snitchCompiled, transformedSnitch.code, 'utf8');

  // Transpile PodcastLyricsStream.jsx first
  const lyricsPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastLyricsStream.jsx');
  let lyricsCode = fs.readFileSync(lyricsPath, 'utf8')
    .replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'");
  const transformedLyrics = esbuild.transformSync(lyricsCode, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(path.resolve(__dirname, 'PodcastLyricsStream.concise.compiled.js'), transformedLyrics.code, 'utf8');

  // 1. PodcastPlayerView concise timer & translation
  const podcastPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');
  let podcastCode = fs.readFileSync(podcastPath, 'utf8')
    .replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'")
    .replace("from '../../utils/magicalSound.js'", "from '../src/utils/magicalSound.js'")
    .replace("from './PodcastLyricsStream'", "from './PodcastLyricsStream.concise.compiled.js'")
    .replace("from '../common/GoldenSnitchScrubber.jsx'", "from './GoldenSnitchScrubber.concise.compiled.js'");
  const transformedPodcast = esbuild.transformSync(podcastCode, { loader: 'jsx', format: 'esm' });
  const podcastCompiled = path.resolve(__dirname, 'PodcastPlayerView.concise.compiled.js');
  fs.writeFileSync(podcastCompiled, transformedPodcast.code, 'utf8');
  const { PodcastPlayerView } = await import('./PodcastPlayerView.concise.compiled.js');

  const mockBook = { id: 'book1', title: 'Philosopher Stone', cnTitle: '哈利·波特' };
  const mockChapter = { id: 'c1', title: 'The Boy Who Lived', cnTitle: '第1章' };

  await t.test('1.1: PodcastPlayerView sleep timer button is icon-only when inactive without 定时 text', () => {
    const htmlInactive = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        sleepTimerMode: null,
        onToggleSleepTimer: () => {}
      })
    );
    assert.ok(!htmlInactive.includes('>定时<'), 'Inactive sleep timer button must not contain text 定时');
    assert.ok(htmlInactive.includes('aria-label="睡眠定时"'), 'Must have aria-label for accessibility');
  });

  await t.test('1.2: PodcastPlayerView eliminates duplicate translation button while avoiding 译文开/译文关 text clutter', () => {
    const htmlWithTrans = renderToString(
      React.createElement(PodcastPlayerView, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        showTranslation: true,
        onToggleTranslation: () => {}
      })
    );
    assert.ok(!htmlWithTrans.includes('译文开'), 'Must not render 译文开');
    assert.ok(!htmlWithTrans.includes('译文关'), 'Must not render 译文关');
    assert.ok(!htmlWithTrans.includes('中英双语切换'), 'PodcastPlayerView must eliminate duplicate translation button (centralized in ReaderTopBar)');
  });

  // 2. SubtitleViewer single cycle font size button
  const viewerPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
  const viewerCompiled = path.resolve(__dirname, 'SubtitleViewer.concise.compiled.js');
  compileJsx(viewerPath, viewerCompiled);
  const { SubtitleViewer } = await import('./SubtitleViewer.concise.compiled.js');

  await t.test('2.1: SubtitleViewer font size uses single compact cycle button instead of 3 pill buttons', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: [{ id: 'cue-1', startTime: 0, endTime: 5, text: 'Hello Harry', translation: '你好哈利' }],
        activeCueIndex: 0
      })
    );
    // Should NOT have simultaneous 3 pill buttons with '标准' and '超大'
    assert.ok(!html.includes('>标准<') || !html.includes('>超大<'), 'Must not render 3 simultaneous pill buttons');
    assert.ok(html.includes('aria-label="调节字号"') || html.includes('aria-label="字体大小"') || html.includes('title="切换字体大小"'), 'Must have font size control affordance');
  });

  // 3. AudioPlayer & GlobalPodcastCapsule concise sleep timer
  const audioPlayerPath = path.resolve(projectRoot, 'src', 'components', 'AudioPlayer.jsx');
  const audioPlayerCompiled = path.resolve(__dirname, 'AudioPlayer.concise.compiled.js');
  compileJsx(audioPlayerPath, audioPlayerCompiled);
  const { AudioPlayer } = await import('./AudioPlayer.concise.compiled.js');

  await t.test('3.1: AudioPlayer sleep timer button is icon-only when inactive', () => {
    const html = renderToString(
      React.createElement(AudioPlayer, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        currentTime: 10,
        duration: 100,
        isPlaying: false,
        sleepTimerMode: null,
        sleepTimerRemaining: '',
        onToggleSleepTimer: () => {}
      })
    );
    assert.ok(!html.includes('>定时<'), 'Desktop AudioPlayer must not contain hardcoded 定时 text when inactive');
  });

  const capsulePath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'GlobalPodcastCapsule.jsx');
  const capsuleCompiled = path.resolve(__dirname, 'GlobalPodcastCapsule.concise.compiled.js');
  compileJsx(capsulePath, capsuleCompiled);
  const { GlobalPodcastCapsule } = await import('./GlobalPodcastCapsule.concise.compiled.js');

  await t.test('3.2: GlobalPodcastCapsule sleep timer button is icon-only when inactive', () => {
    const html = renderToString(
      React.createElement(GlobalPodcastCapsule, {
        currentBook: mockBook,
        currentChapter: mockChapter,
        isPlaying: false,
        sleepTimerMode: null,
        sleepTimerRemaining: '',
        onToggleSleepTimer: () => {}
      })
    );
    assert.ok(!html.includes('>定时<'), 'GlobalPodcastCapsule must not contain 定时 text when inactive');
  });

  t.after(() => {
    try {
      [podcastCompiled, viewerCompiled, audioPlayerCompiled, capsuleCompiled, snitchCompiled].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
      const stray = path.resolve(__dirname, 'PodcastLyricsStream.concise.compiled.js');
      if (fs.existsSync(stray)) fs.unlinkSync(stray);
    } catch {}
  });
});

