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
});
