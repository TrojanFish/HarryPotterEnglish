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

test('Studio Mode & Capsule Switchers Rectification Suite', async (t) => {
  await t.test('1: SubtitleViewer must explicitly import Bookmark icon and render with onToggleBookmarkCue', async () => {
    const viewerSrcPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
    assert.ok(fs.existsSync(viewerSrcPath), 'SubtitleViewer.jsx must exist');
    let viewerSrcCode = fs.readFileSync(viewerSrcPath, 'utf8');

    // Verify import line includes Bookmark
    const lucideImportMatch = viewerSrcCode.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    assert.ok(lucideImportMatch, 'Must import from lucide-react');
    const importedIcons = lucideImportMatch[1].split(',').map(s => s.trim());
    assert.ok(importedIcons.includes('Bookmark'), 'SubtitleViewer.jsx must import Bookmark from lucide-react');

    viewerSrcCode = viewerSrcCode
      .replace(/from '(\.\.\/)+utils\/([^']+)'/g, "from '../src/utils/$2.js'")
      .replace(/from '(\.\.\/)+data\/([^']+)'/g, "from '../src/data/$2.js'");

    const transformed = esbuild.transformSync(viewerSrcCode, { loader: 'jsx', format: 'esm' });
    const compiledPath = path.resolve(__dirname, 'SubtitleViewerFix.compiled.js');
    fs.writeFileSync(compiledPath, transformed.code, 'utf8');

    try {
      const { SubtitleViewer } = await import('./SubtitleViewerFix.compiled.js');
      const mockCues = [
        {
          id: 'cue-test-1',
          startTime: 1.0,
          endTime: 4.0,
          text: 'The boy who lived came to Hogwarts.',
          translation: '大难不死的男孩来到了霍格沃茨。'
        }
      ];

      // Rendering with onToggleBookmarkCue should NOT throw Bookmark is not defined
      let renderedHtml = '';
      assert.doesNotThrow(() => {
        renderedHtml = renderToString(
          React.createElement(SubtitleViewer, {
            cues: mockCues,
            activeCueIndex: 0,
            studyMode: 'normal',
            showTranslation: true,
            isParchment: true,
            onSeekToCue: () => {},
            onWordClick: () => {},
            onRecordCue: () => {},
            bookmarkedCueIds: new Set(['cue-test-1']),
            onToggleBookmarkCue: () => {}
          })
        );
      }, 'Rendering SubtitleViewer with bookmark callbacks must not throw ReferenceError');

      assert.ok(renderedHtml.includes('已星标'), 'Should render bookmarked badge when cue is bookmarked');
    } finally {
      try { fs.unlinkSync(compiledPath); } catch {}
    }
  });

  await t.test('2: PodcastPlayerView eliminates duplicate redundant Studio switch buttons', async () => {
    const podcastSrcPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');
    assert.ok(fs.existsSync(podcastSrcPath), 'PodcastPlayerView.jsx must exist');
    const podcastSrcCode = fs.readFileSync(podcastSrcPath, 'utf8');

    // Must NOT contain duplicate "进入精研" buttons
    assert.ok(!podcastSrcCode.includes('进入精研研学工坊'), 'Should remove duplicate desktop studio CTA');
    assert.ok(!podcastSrcCode.includes('<span>进入精研</span>'), 'Should remove duplicate mobile studio CTA');
  });

  await t.test('3: DesktopSidebar & TabletRail route study modes to Studio playerMode', async () => {
    const sidebarSrcPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'DesktopSidebar.jsx');
    const sidebarCode = fs.readFileSync(sidebarSrcPath, 'utf8');

    assert.ok(sidebarCode.includes('playerMode'), 'DesktopSidebar must accept playerMode prop');
    assert.ok(sidebarCode.includes('onSwitchPlayerMode'), 'DesktopSidebar must accept onSwitchPlayerMode prop');

    const railSrcPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'TabletRail.jsx');
    const railCode = fs.readFileSync(railSrcPath, 'utf8');

    assert.ok(railCode.includes('playerMode'), 'TabletRail must accept playerMode prop');
    assert.ok(railCode.includes('onSwitchPlayerMode'), 'TabletRail must accept onSwitchPlayerMode prop');
  });
});
