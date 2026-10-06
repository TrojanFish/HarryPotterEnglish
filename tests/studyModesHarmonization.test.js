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
    .replace(/from '(\.\.\/)+utils\/([^']+)'/g, "from '../src/utils/$2.js'")
    .replace(/from '(\.\.\/)+data\/([^']+)'/g, "from '../src/data/$2.js'")
    .replace(/from '\.\/dictation\/([^']+)'/g, "from '../src/components/dictation/$1.jsx'")
    .replace("from './PodcastLyricsStream'", "from '../src/components/podcast/PodcastLyricsStream.jsx'");
  const transformed = esbuild.transformSync(code, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(outPath, transformed.code, 'utf8');
}

test('Study Modes Visual & Scrollbar Harmonization Test Suite', async (t) => {
  // 1. SubtitleViewer tests
  const viewerPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
  const viewerCompiled = path.resolve(__dirname, 'SubtitleViewer.harmonize.compiled.js');
  compileJsx(viewerPath, viewerCompiled);
  const { SubtitleViewer } = await import('./SubtitleViewer.harmonize.compiled.js');

  await t.test('1.1: SubtitleViewer scrollbar is full-width (not constrained by max-w-4xl on overflow-y-auto)', () => {
    const html = renderToString(
      React.createElement(SubtitleViewer, {
        cues: [{ id: 'cue-1', startTime: 0, endTime: 5, text: 'Hello Harry', translation: '你好哈利' }],
        activeCueIndex: 0,
        studyMode: 'normal'
      })
    );
    // The element with overflow-y-auto must NOT have max-w-4xl directly on it
    const scrollContainerMatch = html.match(/class="([^"]*overflow-y-auto[^"]*)"/);
    assert.ok(scrollContainerMatch, 'Must find element with overflow-y-auto');
    const scrollClasses = scrollContainerMatch[1];
    assert.ok(
      !scrollClasses.includes('max-w-4xl'),
      `overflow-y-auto container must be full width without max-w-4xl, but found: ${scrollClasses}`
    );
    assert.ok(scrollClasses.includes('w-full'), 'overflow-y-auto container must have w-full');
  });

  await t.test('1.2: SubtitleViewer sub-header renders unified mode identity badge and sentence progress', () => {
    const htmlNormal = renderToString(
      React.createElement(SubtitleViewer, {
        cues: [{ id: 'cue-1', startTime: 0, endTime: 5, text: 'Hello Harry', translation: '你好哈利' }],
        activeCueIndex: 0,
        studyMode: 'normal'
      })
    );
    assert.ok(htmlNormal.includes('双语精听'), 'Normal mode must show 双语精听 mode identity badge');
    assert.ok(htmlNormal.includes('第 1 / 1 句'), 'Must show unified sentence progress 第 1 / 1 句');

    const htmlBlind = renderToString(
      React.createElement(SubtitleViewer, {
        cues: [{ id: 'cue-1', startTime: 0, endTime: 5, text: 'Hello Harry', translation: '你好哈利' }],
        activeCueIndex: 0,
        studyMode: 'blind'
      })
    );
    assert.ok(htmlBlind.includes('魔法磨耳朵'), 'Blind mode must show 魔法磨耳朵 mode identity badge');
    assert.ok(htmlBlind.includes('迷雾'), 'Blind mode must show 迷雾 indicator');
  });

  // 2. ReaderTopBar right buttons continuity
  const topBarPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'ReaderTopBar.jsx');
  const topBarCompiled = path.resolve(__dirname, 'ReaderTopBar.harmonize.compiled.js');
  compileJsx(topBarPath, topBarCompiled);
  const { ReaderTopBar } = await import('./ReaderTopBar.harmonize.compiled.js');

  await t.test('2.1: ReaderTopBar maintains translation button across normal, blind, and dictation modes', () => {
    const htmlNormal = renderToString(
      React.createElement(ReaderTopBar, {
        currentBook: { title: 'HP1' },
        currentChapter: { title: 'Ch1' },
        playerMode: 'studio',
        studyMode: 'normal'
      })
    );
    const htmlDictation = renderToString(
      React.createElement(ReaderTopBar, {
        currentBook: { title: 'HP1' },
        currentChapter: { title: 'Ch1' },
        playerMode: 'studio',
        studyMode: 'dictation'
      })
    );
    assert.ok(htmlNormal.includes('aria-label="中英双语切换"'), 'Normal mode must have translation toggle');
    assert.ok(
      htmlDictation.includes('aria-label="中英双语切换"') || htmlDictation.includes('aria-label="双语线索切换"'),
      'Dictation mode must also maintain translation toggle in top bar to prevent layout shift'
    );
  });

  // 3. DictationStudio sub-header & container harmonization
  const dictationPath = path.resolve(projectRoot, 'src', 'components', 'DictationStudio.jsx');
  const dictationCompiled = path.resolve(__dirname, 'DictationStudio.harmonize.compiled.js');
  let dictationCode = fs.readFileSync(dictationPath, 'utf8')
    .replace(/from '(\.\.\/)+utils\/([^']+)'/g, "from '../src/utils/$2.js'")
    .replace(/import { AccioWordPicker } from [^;]+;/, "const AccioWordPicker = () => null;")
    .replace(/import { LumosClozeInput } from [^;]+;/, "const LumosClozeInput = () => null;")
    .replace(/import { AurorFullTyping } from [^;]+;/, "const AurorFullTyping = () => null;")
    .replace(/import { DuelingSurvivalBar } from [^;]+;/, "const DuelingSurvivalBar = () => null;")
    .replace(/import { DictationSummaryModal } from [^;]+;/, "const DictationSummaryModal = () => null;");
  const transformedDictation = esbuild.transformSync(dictationCode, { loader: 'jsx', format: 'esm' });
  fs.writeFileSync(dictationCompiled, transformedDictation.code, 'utf8');
  const { DictationStudio } = await import('./DictationStudio.harmonize.compiled.js');

  await t.test('3.1: DictationStudio renders harmonized sub-header with max-w-4xl and sentence progress', () => {
    const html = renderToString(
      React.createElement(DictationStudio, {
        cues: [{ id: 'cue-1', startTime: 0, endTime: 5, text: 'Hello Harry', translation: '你好哈利' }],
        activeCueIndex: 0
      })
    );
    assert.ok(html.includes('拼写大闯关'), 'Must render 拼写大闯关 mode title');
    assert.ok(html.includes('第 1 / 1 句'), 'Must render unified progress 第 1 / 1 句');
    assert.ok(html.includes('max-w-4xl'), 'Must use max-w-4xl inner container');
  });

  t.after(() => {
    try {
      [viewerCompiled, topBarCompiled, dictationCompiled].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
    } catch {}
  });
});
