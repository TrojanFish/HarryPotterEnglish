import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Podcast Companion Playback Stability & Continuous Play Test Suite', async (t) => {
  const appPath = path.resolve(projectRoot, 'src', 'App.jsx');
  const appCode = fs.readFileSync(appPath, 'utf8');

  const audioHookPath = path.resolve(projectRoot, 'src', 'hooks', 'useAudioPlayback.js');
  const audioHookCode = fs.readFileSync(audioHookPath, 'utf8');

  await t.test('1.1: App.jsx does not pause playback on every isPlaying change in dictation mode', () => {
    // Regression check: If isPlaying is in the dependency array without transition guarding,
    // any play button click immediately triggers audioRef.current.pause()!
    const dangerousPattern = /useEffect\(\s*\(\)\s*=>\s*\{\s*if\s*\(\s*studyMode\s*===\s*'dictation'\s*&&\s*isPlaying\s*\)\s*\{\s*if\s*\(\s*audioRef\.current\s*\)\s*\{\s*audioRef\.current\.pause\(\)/;
    assert.ok(
      !dangerousPattern.test(appCode),
      'App.jsx must not have a raw useEffect that immediately pauses whenever isPlaying becomes true'
    );
  });

  await t.test('1.2: App.jsx restricts dictation cue auto-advance disable to Studio mode', () => {
    // In Podcast mode ('podcast'), cues and audio should flow continuously
    assert.ok(
      appCode.includes("playerMode === 'studio' && studyMode === 'dictation'"),
      'disableCueAutoAdvance must only apply when both playerMode is studio and studyMode is dictation'
    );
  });

  await t.test('1.3: useAudioPlayback clears stopAtCueEnd when user initiates play via togglePlayPause', () => {
    // togglePlayPause when starting audio must reset stopAtCueEnd(false) to ensure continuous playback
    const toggleFnMatch = audioHookCode.match(/togglePlayPause\s*=\s*useCallback\([\s\S]*?\}\s*,\s*\[isPlaying\]\);/);
    assert.ok(toggleFnMatch, 'togglePlayPause must exist in useAudioPlayback');
    assert.ok(
      toggleFnMatch[0].includes('setStopAtCueEnd(false)'),
      'togglePlayPause must reset stopAtCueEnd to false when starting playback'
    );
  });

  await t.test('1.4: App.jsx keeps GlobalPodcastCapsule persistently mounted on non-player views whenever currentChapterObj exists', () => {
    // Regression check: App.jsx must not unmount bottom player bar on (currentTime > 0 || isPlaying),
    // which caused the bar to disappear immediately on play click or when paused at 0:00!
    assert.ok(
      !appCode.includes('(currentTime > 0 || isPlaying) && (\n          <GlobalPodcastCapsule') &&
      !appCode.includes('(currentTime > 0 || isPlaying) && ('),
      'App.jsx must not conditionally unmount GlobalPodcastCapsule on (currentTime > 0 || isPlaying)'
    );
    assert.ok(
      appCode.includes("currentView !== 'player' && Boolean(currentChapterObj) && (") ||
      appCode.includes("currentView !== 'player' && currentChapterObj && ("),
      'App.jsx must mount GlobalPodcastCapsule whenever currentChapterObj exists on non-player views'
    );
  });

  await t.test('1.5: GlobalPodcastCapsule desktop transport buttons include type="button" and stopPropagation', () => {
    const capsulePath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'GlobalPodcastCapsule.jsx');
    const capsuleCode = fs.readFileSync(capsulePath, 'utf8');

    // Desktop play button section
    const desktopPlayMatch = capsuleCode.match(/<button[\s\S]*?onClick=\{[\s\S]*?onPlayPause[\s\S]*?title=\{isPlaying \? '暂停音频/);
    assert.ok(desktopPlayMatch, 'Desktop play button must exist in GlobalPodcastCapsule');
    assert.ok(
      desktopPlayMatch[0].includes('stopPropagation'),
      'Desktop play button must stop event propagation'
    );
    assert.ok(
      desktopPlayMatch[0].includes('type="button"'),
      'Desktop play button must specify type="button"'
    );
  });

  await t.test('1.6: useCatalog initializes audioUrl synchronously for immediate playback readiness', () => {
    const catalogHookPath = path.resolve(projectRoot, 'src', 'hooks', 'useCatalog.js');
    const catalogHookCode = fs.readFileSync(catalogHookPath, 'utf8');

    assert.ok(
      !catalogHookCode.includes("const [audioUrl, setAudioUrl] = useState('');"),
      'useCatalog must not initialize audioUrl with empty string when default book/chapter exists'
    );
  });
});

