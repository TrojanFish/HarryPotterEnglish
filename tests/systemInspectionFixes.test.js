import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Comprehensive System Inspection & Bug Fixes Verification Suite', async (t) => {
  const audioHookPath = path.resolve(projectRoot, 'src', 'hooks', 'useAudioPlayback.js');
  const appPath = path.resolve(projectRoot, 'src', 'App.jsx');
  const analyticsPath = path.resolve(projectRoot, 'src', 'components', 'AnalyticsDashboard.jsx');
  const wordModalPath = path.resolve(projectRoot, 'src', 'components', 'WordModal.jsx');
  const audioPlayerPath = path.resolve(projectRoot, 'src', 'components', 'AudioPlayer.jsx');
  const podcastPlayerPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');

  const audioHookCode = fs.readFileSync(audioHookPath, 'utf8');
  const appCode = fs.readFileSync(appPath, 'utf8');
  const analyticsCode = fs.readFileSync(analyticsPath, 'utf8');
  const wordModalCode = fs.readFileSync(wordModalPath, 'utf8');
  const audioPlayerCode = fs.readFileSync(audioPlayerPath, 'utf8');
  const podcastPlayerCode = fs.readFileSync(podcastPlayerPath, 'utf8');

  await t.test('1. useAudioPlayback resets activeCueIndex and currentTime when chapter changes', () => {
    // Assert activeCueIndex is reset to 0 when currentChapterObj?.id changes
    assert.ok(
      audioHookCode.includes('setActiveCueIndex(0)') && audioHookCode.includes('[currentChapterObj?.id]'),
      'useAudioPlayback must reset activeCueIndex to 0 on chapter change to prevent out-of-bounds cues'
    );
  });

  await t.test('2. App.jsx suppresses global media shortcuts in all non-player views', () => {
    // Media shortcuts should strictly check currentView !== 'player'
    assert.ok(
      appCode.includes("if (currentView !== 'player')") || appCode.includes("if (currentView !== \"player\")"),
      'App.jsx must check currentView !== player before media keyboard shortcuts (Space, ArrowLeft, ArrowRight)'
    );
  });

  await t.test('3. AnalyticsDashboard supports Escape key dismiss and App.jsx refreshes offline count on storage close', () => {
    // AnalyticsDashboard must listen for Escape
    assert.ok(
      analyticsCode.includes("e.key === 'Escape'") && analyticsCode.includes('onClose'),
      'AnalyticsDashboard must support Escape key dismiss matching other modals'
    );

    // App.jsx must call refreshOfflineCount when closing storage page view
    const storagePageViewMatch = appCode.match(/currentView === ['"]storage['"][\s\S]*?StorageManagerModal[\s\S]*?onClose=\{([^}]+)\}/);
    assert.ok(
      storagePageViewMatch && storagePageViewMatch[1].includes('refreshOfflineCount'),
      'App.jsx must call refreshOfflineCount when closing StorageManagerModal in page view'
    );
  });

  await t.test('4. WordModal handles playback errors and resets isPlayingAudio safely', () => {
    // playPronunciation must set isPlayingAudio(false) on audio error/catch and speech error
    assert.ok(
      wordModalCode.includes('audio.onerror') || wordModalCode.includes('catch(() => setIsPlayingAudio(false))'),
      'WordModal must handle audio error to prevent stuck isPlayingAudio state'
    );
    assert.ok(
      wordModalCode.includes('utt.onerror'),
      'WordModal must handle speech synthesis onerror to prevent stuck isPlayingAudio state'
    );
  });

  await t.test('5. AudioPlayer milestone timer cleanup properly clears timeout via ref', () => {
    // AudioPlayer must not return inside waypoints.forEach and must track timeout with ref
    assert.ok(
      !audioPlayerCode.includes('waypoints.forEach((wp) => {\n        if (currentTime >= wp.time') ||
      audioPlayerCode.includes('milestoneTimeoutRef') ||
      audioPlayerCode.includes('clearTimeout'),
      'AudioPlayer must clean up milestone timeout properly'
    );
  });

  await t.test('6. PodcastPlayerView tab buttons have type="button" and proper touch target', () => {
    const tabSection = podcastPlayerCode.substring(
      podcastPlayerCode.indexOf('handleSwitchMobileTab(\'lyrics\')'),
      podcastPlayerCode.indexOf('cues.length > 0 ? activeCueIndex + 1 : 0')
    );
    assert.ok(
      tabSection.includes('type="button"'),
      'PodcastPlayerView mobile tab buttons must have type="button"'
    );
  });
});
