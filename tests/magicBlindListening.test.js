import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  extractKeywordRadar,
  formatSentenceMetrics,
  calculateBlindMastery
} from '../src/utils/blindListeningEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function compileJsx(filePath, outPath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code
    .replace(/from '(\.\.\/)+utils\/([^']+)'/g, "from '../src/utils/$2.js'")
    .replace(/from '(\.\.\/)+data\/([^']+)'/g, "from '../src/data/$2.js'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(outPath, transformed.code, 'utf8');
}

test('Magic Blind Listening Engine & Component Suite', async (t) => {
  // 1. Engine unit tests
  await t.test('1.1: extractKeywordRadar extracts Hogwarts lore terms with highest priority', () => {
    const text = 'The boy who lived met many strange Muggles in London.';
    const radar = extractKeywordRadar(text);
    assert.ok(radar.length > 0, 'Must extract at least one radar keyword');
    assert.ok(radar.some(r => r.word.toLowerCase() === 'muggles'), 'Must prioritize Hogwarts lore term Muggles');
    assert.ok(radar.find(r => r.word.toLowerCase() === 'muggles').isHpLore, 'Must flag Muggles as isHpLore');
  });

  await t.test('1.2: extractKeywordRadar filters common stop words and returns max 2 focus words', () => {
    const text = 'The boy who lived had come to Hogwarts to learn magic.';
    const radar = extractKeywordRadar(text);
    assert.ok(radar.length <= 2, 'Must return at most 2 focus words');
    assert.ok(!radar.some(r => ['the', 'who', 'had', 'to'].includes(r.word.toLowerCase())), 'Must filter out stop words');
  });

  await t.test('1.3: formatSentenceMetrics accurately formats word count and duration', () => {
    const cue = {
      startTime: 10.0,
      endTime: 14.5,
      text: 'Harry Potter was a very unusual boy in many ways.'
    };
    const metrics = formatSentenceMetrics(cue);
    assert.strictEqual(metrics.wordCount, 10);
    assert.strictEqual(metrics.durationSeconds, 4.5);
    assert.strictEqual(metrics.label, '10 词 · 4.5s');
  });

  await t.test('1.4: calculateBlindMastery accurately calculates mastery percentage', () => {
    assert.strictEqual(calculateBlindMastery(0, 0), 100);
    assert.strictEqual(calculateBlindMastery(8, 10), 80);
    assert.strictEqual(calculateBlindMastery(17, 17), 100);
    assert.strictEqual(calculateBlindMastery(1, 3), 33);
  });

  // 2. SSR Component Integration Tests
  const viewerPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
  const viewerCompiled = path.resolve(__dirname, 'SubtitleViewer.blind.compiled.js');
  compileJsx(viewerPath, viewerCompiled);
  const { SubtitleViewer, SentenceCard } = await import('./SubtitleViewer.blind.compiled.js');

  const sampleCues = [
    {
      id: 'cue-1',
      startTime: 12.0,
      endTime: 16.5,
      text: 'Mr and Mrs Dursley of number four Privet Drive were proud to say.',
      translation: '家住女贞路4号的德思礼夫妇总是得意地夸口。'
    },
    {
      id: 'cue-2',
      startTime: 16.6,
      endTime: 21.0,
      text: 'They were perfectly normal thank you very much.',
      translation: '他们是非常规矩正派的人，拜托你别来打扰。'
    }
  ];

  await t.test('2.1: In blind mode, active unrevealed card displays Lumos reveal, soundwave, and keyword radar', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: sampleCues,
        activeCueIndex: 0,
        studyMode: 'blind',
        showTranslation: true,
        isPlaying: true
      })
    );

    // Identity badge
    assert.ok(html.includes('魔法磨耳朵'), 'Must show 魔法磨耳朵 mode identity');
    assert.ok(html.includes('脱字幕听力自测'), 'Must show 脱字幕听力自测 badge');

    // Active unrevealed station
    assert.ok(html.includes('Lumos 破雾对答案'), 'Must render Lumos reveal button');
    assert.ok(html.includes('Space'), 'Must render Space shortcut prompt');
    assert.ok(html.includes('听辨焦点雷达:'), 'Must render Keyword Radar focus title');
    assert.ok(html.includes('声音波形'), 'Must render animated soundwave container');

    // Anti-cheat blindfold check: Unveiled English text area must NOT be present
    assert.ok(!html.includes('点击查看释义'), 'Veiled card must not render interactive word lookups');
    assert.ok(!html.includes('德思礼夫妇总是得意地夸口'), 'Veiled card must not reveal Chinese translation');

    // Inactive card check
    assert.ok(html.includes('迷雾遮罩 · 点击跳转播放'), 'Inactive card must render mist placeholder');
  });

  await t.test('2.2: When card is revealed in blind mode, displays tokens, translation, and self-assessment controls', () => {
    const htmlRevealed = renderToString(
      React.createElement(SentenceCard, {
        cue: sampleCues[0],
        idx: 0,
        isActive: true,
        isRevealed: true,
        studyMode: 'blind',
        showTranslation: true,
        fontSizeClass: 'text-lg',
        isParchment: true,
        onSeekToCue: () => {},
        onWordClick: () => {},
        onRecordCue: () => {},
        onCopySentence: () => {},
        onToggleReveal: () => {},
        onAssessSentence: () => {}
      })
    );

    // English text and translation must now be revealed
    assert.ok(htmlRevealed.includes('Privet') && htmlRevealed.includes('Dursley'), 'Revealed card must render English tokens');
    assert.ok(htmlRevealed.includes('德思礼夫妇总是得意地夸口'), 'Revealed card must render Chinese translation');

    // Self-assessment feedback loop buttons
    assert.ok(htmlRevealed.includes('没听清 (0.8x 慢速重听)'), 'Must render 0.8x replay button');
    assert.ok(htmlRevealed.includes('听懂了 (下一句)'), 'Must render mastered next sentence button');
    assert.ok(htmlRevealed.includes('重新遮罩'), 'Must render re-veil toggle');
  });

  await t.test('2.3: In normal mode (双语精听), blindfold and self-assessment controls are NOT rendered', () => {
    const htmlNormal = renderToString(
      React.createElement(SubtitleViewer, {
        cues: sampleCues,
        activeCueIndex: 0,
        studyMode: 'normal',
        showTranslation: true
      })
    );

    assert.ok(htmlNormal.includes('双语精听'), 'Must show 双语精听 mode identity');
    assert.ok(htmlNormal.includes('正在朗读'), 'Must show 正在朗读 status');
    assert.ok(htmlNormal.includes('Privet') && htmlNormal.includes('Dursley'), 'Must show English text directly');
    assert.ok(htmlNormal.includes('德思礼夫妇总是得意地夸口'), 'Must show Chinese translation');

    // Must NOT show blind mode elements
    assert.ok(!htmlNormal.includes('Lumos 破雾对答案'), 'Normal mode must not show Lumos reveal button');
    assert.ok(!htmlNormal.includes('没听清 (0.8x 慢速重听)'), 'Normal mode must not show self-assessment replay button');
    assert.ok(!htmlNormal.includes('迷雾遮罩'), 'Normal mode must not show mist veil');
  });
});
