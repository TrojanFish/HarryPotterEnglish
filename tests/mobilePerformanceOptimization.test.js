import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Mobile 60fps Performance Optimization Test Suite', async (t) => {
  const cssPath = path.resolve(projectRoot, 'src/index.css');
  const subtitlePath = path.resolve(projectRoot, 'src/components/SubtitleViewer.jsx');
  const lyricsPath = path.resolve(projectRoot, 'src/components/podcast/PodcastLyricsStream.jsx');
  const appPath = path.resolve(projectRoot, 'src/App.jsx');

  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');
  const lyricsContent = fs.readFileSync(lyricsPath, 'utf8');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // =========================================================================
  // TASK 1: CSS GPU Hardware Acceleration
  // =========================================================================
  await t.test('1.1: src/index.css removes background-attachment: fixed to prevent mobile scroll repaint jank', () => {
    assert.ok(
      !cssContent.includes('background-attachment: fixed'),
      'Must eliminate background-attachment: fixed from body to prevent CPU scroll repainting'
    );
  });

  await t.test('1.2: src/index.css isolates body background into GPU-composited body::before layer', () => {
    assert.ok(
      cssContent.includes('body::before') || cssContent.includes('body:before'),
      'Must define body::before pseudo-element for background gradient'
    );
    assert.ok(
      cssContent.includes('translateZ(0)'),
      'Must trigger GPU hardware compositing via transform: translateZ(0)'
    );
  });

  // =========================================================================
  // TASK 2: SubtitleViewer SentenceCard Custom Memo Comparator
  // =========================================================================
  await t.test('2.1: SentenceCard has custom memo comparison function to shield 500+ inactive cards from audio ticks', () => {
    assert.ok(
      subtitleContent.includes('export const SentenceCard = React.memo(') ||
      subtitleContent.includes('export const SentenceCard = memo('),
      'SentenceCard must be wrapped in React.memo'
    );
    // Verify comparator exists
    const memoMatch = subtitleContent.match(/SentenceCard\s*=\s*React\.memo\([\s\S]*?,\s*\((prev|prevProps),\s*(next|nextProps)\)/);
    assert.ok(
      memoMatch,
      'React.memo(SentenceCard, ...) must provide a custom (prev, next) comparator function'
    );
  });

  await t.test('2.2: SentenceCard comparator selectively updates active card and ignores inactive card currentTime ticks', () => {
    assert.ok(
      subtitleContent.includes('prev.isActive !== next.isActive') ||
      subtitleContent.includes('prevProps.isActive !== nextProps.isActive'),
      'Comparator must check active state transition'
    );
    assert.ok(
      subtitleContent.includes('next.isActive') || subtitleContent.includes('nextProps.isActive'),
      'Comparator must only compare currentTime when card is active'
    );
  });

  // =========================================================================
  // TASK 3: PodcastLyricsStream Row Memoization & Light Transitions
  // =========================================================================
  await t.test('3.1: PodcastLyricsStream extracts a React.memo lyric row component', () => {
    const hasRowMemo = /PodcastLyric(Row|Line)\s*=\s*React\.memo\(/.test(lyricsContent);
    assert.ok(
      hasRowMemo,
      'PodcastLyricsStream must define a memoized row component (PodcastLyricRow)'
    );
  });

  await t.test('3.2: PodcastLyricsStream replaces heavy transition-all with lightweight transition-colors', () => {
    assert.ok(
      !lyricsContent.includes('transition-all duration-300'),
      'Must eliminate transition-all duration-300 from lyrics stream items to avoid layout recalculations'
    );
    assert.ok(
      lyricsContent.includes('transition-colors'),
      'Must use lightweight transition-colors for lyrics text transitions'
    );
  });

  // =========================================================================
  // TASK 4: App.jsx Callback Stabilization & Keep-Alive View Preservation
  // =========================================================================
  await t.test('4.1: App.jsx wraps critical callback props in useCallback to maintain child component memoization', () => {
    assert.ok(
      appContent.includes('handleToggleBookmarkSentence = useCallback('),
      'handleToggleBookmarkSentence must be memoized with useCallback'
    );
    assert.ok(
      appContent.includes('handleSaveToVocab = useCallback('),
      'handleSaveToVocab must be memoized with useCallback'
    );
  });

  await t.test('4.2: App.jsx preserves bookshelf and player views in DOM via CSS hidden (Keep-Alive pattern)', () => {
    assert.ok(
      appContent.includes("currentView === 'bookshelf'") &&
      appContent.includes("currentView === 'player'"),
      'Must support both bookshelf and player views'
    );
    // Checks that views are preserved rather than ternary-destroyed
    assert.ok(
      appContent.includes("className={currentView === 'bookshelf'") ||
      appContent.includes("currentView === 'bookshelf' ? 'flex-1") ||
      appContent.includes("currentView === 'bookshelf' ? \"flex-1"),
      'BookshelfView should be preserved in DOM with CSS hidden when inactive'
    );
  });
});
