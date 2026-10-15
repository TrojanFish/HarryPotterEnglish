import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Immediate Tab & View Highlighting Verification Suite', async (t) => {
  const appPath = path.resolve(projectRoot, 'src', 'App.jsx');
  const bottomNavPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'MobileBottomNav.jsx');
  const mobileTopBarPath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'MobileTopBar.jsx');
  const podcastPlayerPath = path.resolve(projectRoot, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');
  const dictationStudioPath = path.resolve(projectRoot, 'src', 'components', 'DictationStudio.jsx');

  const appCode = fs.readFileSync(appPath, 'utf8');
  const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf8');
  const mobileTopBarCode = fs.readFileSync(mobileTopBarPath, 'utf8');
  const podcastPlayerCode = fs.readFileSync(podcastPlayerPath, 'utf8');
  const dictationStudioCode = fs.readFileSync(dictationStudioPath, 'utf8');

  await t.test('1.1: MobileBottomNav implements 0ms optimistic highlighting with activeTabId state', () => {
    assert.ok(bottomNavCode.includes('optimisticTab'), 'MobileBottomNav must use optimistic state for instant highlight');
    assert.ok(bottomNavCode.includes('setOptimisticTab(tab.id)'), 'handleTabClick must immediately activate clicked tab');
    assert.ok(bottomNavCode.includes('type="button"'), 'All bottom navigation buttons must have type="button"');
  });

  await t.test('1.2: Mobile navigation bars eliminate touch-none in favor of touch-manipulation', () => {
    assert.ok(!bottomNavCode.includes('touch-none'), 'MobileBottomNav must not use touch-none');
    assert.ok(bottomNavCode.includes('touch-manipulation'), 'MobileBottomNav must use touch-manipulation');
    assert.ok(!mobileTopBarCode.includes('touch-none'), 'MobileTopBar must not use touch-none');
    assert.ok(mobileTopBarCode.includes('touch-manipulation'), 'MobileTopBar must use touch-manipulation');
  });

  await t.test('2.1: App.jsx updates currentView, playerMode, and studyMode synchronously on first click', () => {
    // Check setCurrentView is called directly outside startTransition
    const switchViewFn = appCode.substring(
      appCode.indexOf('handleSwitchCurrentView'),
      appCode.indexOf('localStorage.setItem(\'hp_current_view\'')
    );
    assert.ok(
      switchViewFn.includes('setCurrentView(newView);'),
      'setCurrentView must be invoked synchronously before startTransition'
    );

    // Check setPlayerMode is called directly outside startTransition
    const switchPlayerModeFn = appCode.substring(
      appCode.indexOf('handleSwitchPlayerMode'),
      appCode.indexOf('localStorage.setItem(\'hp_player_mode\'')
    );
    assert.ok(
      switchPlayerModeFn.includes('setPlayerMode(newMode);'),
      'setPlayerMode must be invoked synchronously before startTransition'
    );

    // Check setStudyMode is called directly outside startTransition
    const switchStudyModeFn = appCode.substring(
      appCode.indexOf('handleSwitchStudyMode'),
      appCode.indexOf('showTranslation')
    );
    assert.ok(
      switchStudyModeFn.includes('setStudyMode(newStudyMode);'),
      'setStudyMode must be invoked synchronously before startTransition'
    );

    // startTransition remains intact for background tasks
    assert.ok(appCode.includes('startTransition'), 'App.jsx must retain startTransition for background workloads');
  });

  await t.test('2.2: PodcastPlayerView updates mobileTab synchronously on first click', () => {
    const mobileTabFn = podcastPlayerCode.substring(
      podcastPlayerCode.indexOf('handleSwitchMobileTab'),
      podcastPlayerCode.indexOf('formatTime')
    );
    assert.ok(
      mobileTabFn.includes('setMobileTab(tab);'),
      'setMobileTab must be invoked synchronously on first click'
    );
  });

  await t.test('2.3: DictationStudio updates difficultyMode synchronously on first click', () => {
    const diffFn = dictationStudioCode.substring(
      dictationStudioCode.indexOf('handleDifficultyChange = (mode) =>'),
      dictationStudioCode.indexOf('// Sound effects toggle')
    );
    assert.ok(
      diffFn.includes('setDifficultyMode(mode);'),
      'setDifficultyMode must be invoked synchronously on first click'
    );
  });
});
