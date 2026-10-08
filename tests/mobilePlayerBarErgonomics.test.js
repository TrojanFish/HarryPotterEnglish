import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatSleepTimerRemaining, SLEEP_TIMER_OPTIONS } from '../src/utils/sleepTimer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Mobile Player Bar UX & Close Redirection Ergonomics Suite', async (t) => {
  await t.test('1.1: formatSleepTimerRemaining returns concise "本集" for end_of_chapter to eliminate 44px button text overflow', () => {
    assert.strictEqual(formatSleepTimerRemaining(null, 'end_of_chapter'), '本集');
    assert.strictEqual(formatSleepTimerRemaining(899, 15), '14:59');
    assert.strictEqual(formatSleepTimerRemaining(null, null), '');
  });

  await t.test('1.2: App.jsx tracks previousViewRef and returns to originating view upon closing modals', () => {
    const appPath = path.join(rootDir, 'src', 'App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');

    // Asserts previousViewRef is declared and updated
    assert.ok(content.includes('previousViewRef.current = currentView'), 'handleSwitchCurrentView must record previousViewRef');
    
    // Asserts AnalyticsDashboard onClose returns to previousViewRef.current
    assert.ok(
      content.includes('previousViewRef.current || (selectedChapter ? \'player\' : \'bookshelf\')'),
      'Analytics and drawers onClose must return to previousViewRef'
    );

    // Asserts AudioPlayer receives showTranslation and onToggleTranslation
    assert.ok(content.includes('showTranslation={showTranslation}'), 'AudioPlayer must receive showTranslation');
    assert.ok(content.includes('onToggleTranslation='), 'AudioPlayer must receive onToggleTranslation');
  });

  await t.test('1.3: PodcastPlayerView skip 15s controls use enlarged size 22 icons and centered bold mono 15', () => {
    const podcastPath = path.join(rootDir, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');
    const content = fs.readFileSync(podcastPath, 'utf8');

    // Desktop & Mobile skip 15s icons must be enlarged to size={22}
    assert.ok(content.includes('<RotateCcw size={22}'), 'RotateCcw must be size 22');
    assert.ok(content.includes('<RotateCw size={22}'), 'RotateCw must be size 22');

    // Inner 15 digits must use font-black font-mono tracking-tighter
    assert.ok(
      content.includes('text-[9px] font-black font-mono leading-none tracking-tighter'),
      '15 digits must use compact bold typography with breathing room'
    );
  });

  await t.test('1.4: PodcastPlayerView mobile layer 1 integrates Languages translation toggle with sleep and speed', () => {
    const podcastPath = path.join(rootDir, 'src', 'components', 'podcast', 'PodcastPlayerView.jsx');
    const content = fs.readFileSync(podcastPath, 'utf8');

    // Asserts Languages is imported
    assert.ok(content.includes('Languages'), 'PodcastPlayerView must import Languages');

    // Asserts Mobile Layer 1 renders onToggleTranslation
    assert.ok(
      content.includes('onToggleTranslation ? (') && content.includes('<Languages size={18}'),
      'Mobile Layer 1 must render Languages toggle button'
    );
  });

  await t.test('1.5: AudioPlayer mobile layer 1 harmonizes layout and eliminates negative margins', () => {
    const audioPlayerPath = path.join(rootDir, 'src', 'components', 'AudioPlayer.jsx');
    const content = fs.readFileSync(audioPlayerPath, 'utf8');

    // Asserts negative margins -my-2 are eliminated from Mobile Layer 1
    assert.ok(!content.includes('-my-2'), 'AudioPlayer must have zero negative -my-2 margins');

    // Asserts Languages toggle is present in Mobile Layer 1
    assert.ok(content.includes('<Languages size={17}'), 'AudioPlayer must render Languages icon');

    // Asserts time is combined in left cluster
    assert.ok(content.includes('formatTime(currentTime)'), 'AudioPlayer must render currentTime');
    assert.ok(content.includes('formatTime(duration)'), 'AudioPlayer must render duration');
  });

  await t.test('1.6: ReaderTopBar hides translation button on mobile to save header space', () => {
    const topBarPath = path.join(rootDir, 'src', 'components', 'navigation', 'ReaderTopBar.jsx');
    const content = fs.readFileSync(topBarPath, 'utf8');

    assert.ok(
      content.includes('hidden sm:flex w-10 h-10') && content.includes('<Languages size={17}'),
      'ReaderTopBar must hide translation button on mobile viewport (hidden sm:flex)'
    );
  });
});
