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
    assert.ok(content.includes('aria-label='), 'Must include aria-label on icon buttons');

    // 1.2 Chapter list play button must not contain text '播放' or '播放中'
    assert.ok(!content.includes("<span>{isCurrent ? '播放中' : '播放'}</span>"), 'Chapter play button must not render text');
    assert.ok(content.includes('min-h-[44px] min-w-[44px]'), 'Chapter play button must adhere to Apple HIG 44px');

    // 1.3 Book list "查看章节" button must not contain text '查看章节'
    assert.ok(!content.includes('<span>查看章节</span>'), 'Book item button must not render text 查看章节');
    assert.ok(content.includes('title="展开章节列表"'), 'Book item button must provide tooltip');
  });

  await t.test('2. BookshelfView.jsx: chapter modal play button is icon-only and dual-channel accessible', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'BookshelfView.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(!content.includes('>精听</span>'), 'Chapter modal play button must not render text 精听');
    assert.ok(content.includes('aria-label="关闭章节选单"'), 'Modal close button must have aria-label');
    assert.ok(content.includes('aria-label="清除搜索内容"'), 'Search clear button must have aria-label');
    assert.ok(content.includes("isCurrent\n                            ? 'bg-amber-500 text-white'") || content.includes("isCurrent ? 'bg-amber-500 text-white'"), 'Modal play button must reflect isCurrent state');
  });

  await t.test('3. DictationStudio.jsx: translation clue and previous sentence buttons are icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'DictationStudio.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 3.1 Translation clue toggle
    assert.ok(!content.includes("{showTranslationClue ? '隐藏译文' : '译文线索'}"), 'Translation clue toggle must not render text');
    assert.ok(content.includes('w-11 h-11 min-w-[44px] min-h-[44px]'), 'Translation toggle must meet 44px HIG');

    // 3.2 Previous sentence nav button
    assert.ok(!content.includes('<span className="hidden sm:inline">上一句</span>'), 'Previous sentence nav button must not render text 上一句');
    assert.ok(content.includes('aria-label="上一句"'), 'Previous sentence button must have aria-label');

    // 3.3 Sound and Trophy buttons have touch target and aria-label
    assert.ok(content.includes('aria-label="魔咒合成音效开关"'), 'Sound toggle must have aria-label');
    assert.ok(content.includes('aria-label="查看全卷成绩单"'), 'Trophy report button must have aria-label');
  });

  await t.test('4. StorageManagerModal.jsx: storage refresh and local play buttons are icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'StorageManagerModal.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 4.1 Storage info refresh
    assert.ok(!content.includes('<span>刷新</span>'), 'Storage refresh button must not render text 刷新');
    assert.ok(content.includes('aria-label="关闭魔法行囊"'), 'Close button must have aria-label');

    // 4.2 Offline chapter play button
    assert.ok(!content.includes('<span>本地播放</span>') && !content.includes('>本地播放</span>'), 'Offline chapter play button must not render text 本地播放');
    assert.ok(content.includes('duo-btn-secondary w-11 h-11 min-w-[44px] min-h-[44px]'), 'Local play button must meet 44px HIG');
  });

  await t.test('5. AnalyticsDashboard.jsx: cloud sync and copy passcode buttons are icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'AnalyticsDashboard.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 5.1 Cloud sync button
    assert.ok(!content.includes('<span>同步</span>'), 'Cloud sync button must not render text 同步');
    assert.ok(content.includes('w-11 h-11'), 'Cloud sync button must meet 44px HIG');

    // 5.2 Copy passcode button
    assert.ok(!content.includes("{copiedSyncCode ? '已复制' : '复制口令'}"), 'Copy passcode button must not render text 复制口令/已复制');
    assert.ok(content.includes('title={copiedSyncCode ?'), 'Copy passcode button must have dynamic tooltip');
  });

  await t.test('6. VocabularyDrawer.jsx: top bar Leitner SRS button is icon-only', () => {
    const filePath = path.resolve(projectRoot, 'src', 'components', 'VocabularyDrawer.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    assert.ok(!content.includes('<span>艾宾浩斯背词</span>'), 'Top bar SRS button must not render text 艾宾浩斯背词');
    assert.ok(content.includes('aria-label="启动艾宾浩斯智能翻转闪卡"'), 'SRS button must have aria-label');
  });
});
