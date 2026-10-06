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

// Transpile PodcastLyricsStream.jsx
const lyricsSrcPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastLyricsStream.jsx');

// Ensure source file exists or can be imported
test('PodcastLyricsStream Component Test Suite', async (t) => {
  assert.ok(fs.existsSync(lyricsSrcPath), 'Source file PodcastLyricsStream.jsx must exist');
  let lyricsSrcCode = fs.readFileSync(lyricsSrcPath, 'utf8');
  lyricsSrcCode = lyricsSrcCode.replace("from '../../utils/vttParser'", "from '../src/utils/vttParser.js'");

  const transformed = esbuild.transformSync(lyricsSrcCode, { loader: 'jsx', format: 'esm' });
  const compiledPath = path.resolve(__dirname, 'PodcastLyricsStream.compiled.js');
  fs.writeFileSync(compiledPath, transformed.code, 'utf8');

  const { PodcastLyricsStream } = await import('./PodcastLyricsStream.compiled.js');

  const sampleCues = [
    { id: 'c1', start: 0, end: 5, text: 'Mr and Mrs Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much.', translation: '家住女贞路4号的德思礼夫妇总是得意地说他们是非常规矩的人，拜托，多谢了。' },
    { id: 'c2', start: 5, end: 10, text: 'They were the last people you’d expect to be involved in anything strange or mysterious, because they just didn’t hold with such nonsense.', translation: '他们是最不可能卷入任何古怪或神秘事情的人，因为他们压根不相信那些无稽之谈。' },
    { id: 'c3', start: 10, end: 15, text: 'Mr Dursley was the director of a firm called Grunnings, which made drills.', translation: '德思礼先生是一家名为格朗宁斯钻机制造公司的董事。' }
  ];

  await t.test('1.1: Renders cues with flowing lyrics typography', () => {
    const html = renderToString(
      React.createElement(PodcastLyricsStream, {
        cues: sampleCues,
        activeCueIndex: 0,
        showTranslation: true,
        onSeekToCue: () => {}
      })
    );

    assert.ok(html.includes('Mr and Mrs Dursley'), 'Must render first sentence text');
    assert.ok(html.includes('女贞路4号'), 'Must render translation when showTranslation is true');
    assert.ok(html.includes('font-reading') || html.includes('text-lg') || html.includes('text-xl'), 'Must use large readable typography');
  });

  await t.test('1.2: Highlights active cue while dimming inactive lines', () => {
    const html = renderToString(
      React.createElement(PodcastLyricsStream, {
        cues: sampleCues,
        activeCueIndex: 1,
        showTranslation: false,
        onSeekToCue: () => {}
      })
    );

    // Should indicate active state on cue index 1
    assert.ok(html.includes('active-lyric-cue') || html.includes('text-amber-950') || html.includes('font-bold'), 'Active cue must have prominent styling');
    assert.ok(html.includes('opacity-') || html.includes('text-stone-400') || html.includes('inactive-lyric-cue'), 'Inactive cues must have dimmed styling');
    assert.ok(!html.includes('女贞路4号'), 'Must hide translation when showTranslation is false');
  });

  await t.test('1.3: Renders bookmark action with comfortable touch target', () => {
    const bookmarkedSet = new Set(['c1']);
    const html = renderToString(
      React.createElement(PodcastLyricsStream, {
        cues: sampleCues,
        activeCueIndex: 0,
        bookmarkedCueIds: bookmarkedSet,
        onToggleBookmarkCue: () => {}
      })
    );

    assert.ok(html.includes('收录') || html.includes('星标') || html.includes('bookmark'), 'Must render bookmark action affordance');
    assert.ok(html.includes('min-h-[') || html.includes('w-10') || html.includes('w-11') || html.includes('p-'), 'Must have comfortable touch target');
  });
});
