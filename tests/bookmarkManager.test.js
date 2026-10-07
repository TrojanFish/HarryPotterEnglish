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
    assert.equal(item.start, 12.5);
    assert.equal(item.end, 18.0);
    assert.ok(item.id, 'Must generate unique id');
    assert.ok(item.createdAt, 'Must have timestamp');

    // Test with real VTT parser cue containing startTime and endTime
    const vttCue = {
      id: 5,
      startTime: 34.2,
      endTime: 39.8,
      text: 'The Dursleys had a small son called Dudley.',
      translation: '德思礼夫妇有一个名叫达力的幼子。'
    };
    const vttItem = normalizeSentenceBookmark(vttCue, 'book1', 'ch1');
    assert.equal(vttItem.start, 34.2, 'Must map startTime to start seconds');
    assert.equal(vttItem.end, 39.8, 'Must map endTime to end seconds');
    assert.equal(vttItem.cueId, '5');
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

  await t.test('1.4: toggleBookmarkInList prevents cross-chapter collision for same cueId', () => {
    const cue0 = { id: 0, text: 'Sentence 0', translation: '句子 0' };
    // Bookmark cue 0 in book1 ch1
    const list1 = toggleBookmarkInList([], cue0, 'book1', 'ch1');
    assert.equal(list1.length, 1);
    assert.equal(list1[0].chapterId, 'ch1');

    // Bookmark cue 0 in book1 ch2 (same book, same cue ID 0, different chapter)
    const list2 = toggleBookmarkInList(list1, cue0, 'book1', 'ch2');
    assert.equal(list2.length, 2, 'Must keep both bookmarks for ch1 and ch2');

    // Toggle cue 0 in ch2 should remove ch2 only, keeping ch1 intact
    const list3 = toggleBookmarkInList(list2, cue0, 'book1', 'ch2');
    assert.equal(list3.length, 1);
    assert.equal(list3[0].chapterId, 'ch1', 'ch1 bookmark must remain intact');
  });

  await t.test('1.5: getChapterBookmarkedCueIds scopes bookmarks strictly to chapter', async () => {
    const { getChapterBookmarkedCueIds } = await import('../src/hooks/useBookmarkManager.js');
    const mockList = [
      { id: 'b1', bookId: 'book1', chapterId: 'ch1', cueId: '0' },
      { id: 'b2', bookId: 'book1', chapterId: 'ch1', cueId: '1' },
      { id: 'b3', bookId: 'book1', chapterId: 'ch2', cueId: '0' },
      { id: 'b4', bookId: 'book2', chapterId: 'ch1', cueId: '0' }
    ];

    const ch1Set = getChapterBookmarkedCueIds(mockList, 'book1', 'ch1');
    assert.ok(ch1Set.has('0'));
    assert.ok(ch1Set.has('1'));
    assert.equal(ch1Set.size, 2);

    const ch2Set = getChapterBookmarkedCueIds(mockList, 'book1', 'ch2');
    assert.ok(ch2Set.has('0'));
    assert.ok(!ch2Set.has('1'), 'ch2 must not have cue 1 from ch1');
    assert.equal(ch2Set.size, 1);

    const book2Ch1Set = getChapterBookmarkedCueIds(mockList, 'book2', 'ch1');
    assert.ok(book2Ch1Set.has('0'));
    assert.equal(book2Ch1Set.size, 1);
  });
});
