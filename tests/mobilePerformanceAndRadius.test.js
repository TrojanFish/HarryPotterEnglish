import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Mobile PWA Performance & Border Radius Standardization Test Suite', async (t) => {
  const audioHookPath = path.resolve(projectRoot, 'src/hooks/useAudioPlayback.js');
  const audioHookSrc = fs.readFileSync(audioHookPath, 'utf8');

  // =========================================================================
  // TASK 1: Throttled LocalStorage Breakpoint Persistence
  // =========================================================================
  await t.test('1.1: useAudioPlayback throttles localStorage breakpoint saves to avoid mobile flash I/O blocking', () => {
    // Must NOT write directly on every single raw currentTime update without a throttle guard
    assert.ok(
      audioHookSrc.includes('lastPositionSaveRef') || audioHookSrc.includes('lastSavedTimeRef'),
      'useAudioPlayback must use a ref timestamp to throttle localStorage.setItem writes'
    );
    assert.ok(
      audioHookSrc.includes('5000') || audioHookSrc.includes('THROTTLE'),
      'useAudioPlayback must throttle playback position persistence by at least 5000ms'
    );
  });

  // =========================================================================
  // TASK 2: Eliminate Heavy GPU Backdrop-Blur on Mobile Navigation & Player Consoles
  // =========================================================================
  await t.test('2.1: Mobile navigation bars and player consoles do not use expensive backdrop-blur GPU shaders', () => {
    const filesToCheck = [
      'src/components/navigation/ReaderTopBar.jsx',
      'src/components/navigation/MobileTopBar.jsx',
      'src/components/navigation/GlobalPodcastCapsule.jsx',
      'src/components/podcast/PodcastPlayerView.jsx',
      'src/components/navigation/MobileBottomNav.jsx'
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(projectRoot, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        !content.includes('backdrop-blur'),
        `${relPath} must not contain GPU-expensive 'backdrop-blur-*' classes`
      );
    }
  });

  // =========================================================================
  // TASK 3: React.memo View Boundary Isolation
  // =========================================================================
  await t.test('3.1: High-frequency views and navigation bars are protected with React.memo to isolate audio tick re-renders', () => {
    const memoViews = [
      'src/components/BookshelfView.jsx',
      'src/components/podcast/PodcastPlayerView.jsx',
      'src/components/navigation/DesktopSidebar.jsx',
      'src/components/navigation/TabletRail.jsx',
      'src/components/navigation/ReaderTopBar.jsx',
      'src/components/navigation/MobileTopBar.jsx',
      'src/components/navigation/GlobalPodcastCapsule.jsx'
    ];

    for (const relPath of memoViews) {
      const fullPath = path.resolve(projectRoot, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasMemo = /React\.memo\(|\bmemo\(/.test(content);
      assert.ok(
        hasMemo,
        `${relPath} must be wrapped in React.memo to prevent unnecessary re-rendering during audio ticks`
      );
    }
  });

  // =========================================================================
  // TASK 4: 4-Tier Border Radius Standardization & Desktop Docked Bottom Bar (Scheme A)
  // =========================================================================
  await t.test('4.1: PodcastPlayerView transport buttons standardize to rounded-xl (12px) and play CTA to rounded-full', () => {
    const fullPath = path.resolve(projectRoot, 'src/components/podcast/PodcastPlayerView.jsx');
    const content = fs.readFileSync(fullPath, 'utf8');

    const anchoredConsoleMatch = content.match(/podcast-anchored-console[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    assert.ok(anchoredConsoleMatch, 'Must find anchored console section');
    const anchoredConsole = anchoredConsoleMatch[0];

    assert.ok(
      !anchoredConsole.includes('rounded-2xl border'),
      'Anchored console transport buttons must use rounded-xl instead of rounded-2xl'
    );
    assert.ok(
      anchoredConsole.includes('rounded-full bg-amber-500'),
      'Center Play CTA must remain rounded-full'
    );
  });

  await t.test('4.2: GlobalPodcastCapsule adheres to unified workspace-width docked bottom bar', () => {
    const fullPath = path.resolve(projectRoot, 'src/components/navigation/GlobalPodcastCapsule.jsx');
    const content = fs.readFileSync(fullPath, 'utf8');

    assert.ok(
      content.includes('w-full') && content.includes('border-t'),
      'Desktop capsule must dock across workspace width with border-t'
    );
    assert.ok(
      !content.includes('bottom-5 left-1/2 -translate-x-1/2'),
      'Desktop capsule must eliminate floating bottom-5 centered translate pill'
    );
  });
});
