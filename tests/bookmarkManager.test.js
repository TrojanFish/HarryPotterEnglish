import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const hookSrcPath = path.resolve(projectRoot, 'src', 'hooks', 'useBookmarkManager.js');

test('useBookmarkManager Logic & Helpers Test Suite', async (t) => {
  assert.ok(fs.existsSync(hookSrcPath), 'Source file useBookmarkManager.js must exist');

  const {
    toggleBookmarkInList,
    getChapterBookmarkCount,
    normalizeSentenceBookmark
  } = await import('../src/hooks/useBookmarkManager.js');

  const sampleCue = {
    id: 'cue-101',
    start: 12.5,
    end: 18.0,
    text: 'He was a big, beefy man with hardly any neck.',
    translation: '他是一个高大魁梧的男人，几乎没有脖子。'
  };

  await t.test('1.1: normalizeSentenceBookmark shapes cue into structured bookmark record', () => {
    const item = normalizeSentenceBookmark(sampleCue, 'book1', 'chapter1');
    assert.equal(item.cueId, 'cue-101');
    assert.equal(item.bookId, 'book1');
    assert.equal(item.chapterId, 'chapter1');
    assert.equal(item.text, sampleCue.text);
    assert.equal(item.translation, sampleCue.translation);
    assert.ok(item.id, 'Must generate unique id');
    assert.ok(item.createdAt, 'Must have timestamp');
  });

  await t.test('1.2: toggleBookmarkInList adds if missing and removes if present', () => {
    const list1 = toggleBookmarkInList([], sampleCue, 'book1', 'chapter1');
    assert.equal(list1.length, 1);
    assert.equal(list1[0].cueId, 'cue-101');

    // Toggle again should remove it
    const list2 = toggleBookmarkInList(list1, sampleCue, 'book1', 'chapter1');
    assert.equal(list2.length, 0);
  });

  await t.test('1.3: getChapterBookmarkCount accurately filters by bookId and chapterId', () => {
    const mockList = [
      { id: 'b1', bookId: 'book1', chapterId: 'ch1', cueId: 'c1' },
      { id: 'b2', bookId: 'book1', chapterId: 'ch1', cueId: 'c2' },
      { id: 'b3', bookId: 'book1', chapterId: 'ch2', cueId: 'c3' },
      { id: 'b4', bookId: 'book2', chapterId: 'ch1', cueId: 'c4' }
    ];

    assert.equal(getChapterBookmarkCount(mockList, 'book1', 'ch1'), 2);
    assert.equal(getChapterBookmarkCount(mockList, 'book1', 'ch2'), 1);
    assert.equal(getChapterBookmarkCount(mockList, 'book1', 'ch99'), 0);
  });
});
