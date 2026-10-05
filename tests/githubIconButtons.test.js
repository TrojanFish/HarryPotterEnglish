import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('GitHub-style icon buttons: eliminates redundant text across all approved components', async (t) => {
  await t.test('1. BookShelfDrawer.jsx: icon-only buttons for catalog refresh, chapter play, and book expand', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'BookShelfDrawer.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 1.1 Refresh catalog button must not contain text '刷新藏书' or '扫描中...'
    assert.ok(!content.includes("'刷新藏书'"), 'Refresh catalog button must not render text 刷新藏书');
    assert.ok(!content.includes("'扫描中...'"), 'Refresh catalog button must not render text 扫描中...');
    assert.ok(content.includes('RotateCw'), 'Refresh catalog button must include RotateCw icon');

    // 1.2 Chapter list play button must not contain text '播放' or '播放中'
    assert.ok(!content.includes("<span>{isCurrent ? '播放中' : '播放'}</span>"), 'Chapter play button must not render text');

    // 1.3 Book list "查看章节" button must not contain text '查看章节'
    assert.ok(!content.includes('<span>查看章节</span>'), 'Book item button must not render text 查看章节');
  });

  await t.test('2. BookshelfView.jsx: chapter modal play button is icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'BookshelfView.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(!content.includes('>精听</span>'), 'Chapter modal play button must not render text 精听');
  });

  await t.test('3. DictationStudio.jsx: translation clue and previous sentence buttons are icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'DictationStudio.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 3.1 Translation clue toggle
    assert.ok(!content.includes("{showTranslationClue ? '隐藏译文' : '译文线索'}"), 'Translation clue toggle must not render text');

    // 3.2 Previous sentence nav button
    assert.ok(!content.includes('<span className="hidden sm:inline">上一句</span>'), 'Previous sentence nav button must not render text 上一句');
  });

  await t.test('4. StorageManagerModal.jsx: storage refresh and local play buttons are icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'StorageManagerModal.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 4.1 Storage info refresh
    assert.ok(!content.includes('<span>刷新</span>'), 'Storage refresh button must not render text 刷新');

    // 4.2 Offline chapter play button
    assert.ok(!content.includes('<span>本地播放</span>') && !content.includes('>本地播放</span>'), 'Offline chapter play button must not render text 本地播放');
  });

  await t.test('5. AnalyticsDashboard.jsx: cloud sync and copy passcode buttons are icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'AnalyticsDashboard.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 5.1 Cloud sync button
    assert.ok(!content.includes('<span>同步</span>'), 'Cloud sync button must not render text 同步');

    // 5.2 Copy passcode button
    assert.ok(!content.includes("{copiedSyncCode ? '已复制' : '复制口令'}"), 'Copy passcode button must not render text 复制口令/已复制');
  });

  await t.test('6. VocabularyDrawer.jsx: top bar Leitner SRS button is icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'VocabularyDrawer.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(!content.includes('<span>艾宾浩斯背词</span>'), 'Top bar SRS button must not render text 艾宾浩斯背词');
  });
});
