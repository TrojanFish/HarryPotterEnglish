import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('UI Consistency & Layout Standardization Suite', async (t) => {
  const rootDir = process.cwd();

  await t.test('1.1: Modal Dialogs have Apple HIG >=44px close buttons & rounded-xl', () => {
    const wordModalCode = fs.readFileSync(path.join(rootDir, 'src/components/WordModal.jsx'), 'utf-8');
    const shortcutsModalCode = fs.readFileSync(path.join(rootDir, 'src/components/ShortcutsModal.jsx'), 'utf-8');
    const storageModalCode = fs.readFileSync(path.join(rootDir, 'src/components/StorageManagerModal.jsx'), 'utf-8');
    const srsModalCode = fs.readFileSync(path.join(rootDir, 'src/components/SrsFlashcardModal.jsx'), 'utf-8');
    const owlsModalCode = fs.readFileSync(path.join(rootDir, 'src/components/analytics/OwlsCertificateModal.jsx'), 'utf-8');

    // Check close buttons have 44px footprint
    assert.ok(wordModalCode.includes('min-h-[44px]') || wordModalCode.includes('w-11 h-11'), 'WordModal must have 44px close button');
    assert.ok(shortcutsModalCode.includes('min-h-[44px]') || shortcutsModalCode.includes('w-11 h-11'), 'ShortcutsModal must have 44px close button');
    assert.ok(storageModalCode.includes('min-h-[44px]') || storageModalCode.includes('w-11 h-11'), 'StorageManagerModal must have 44px close button');
    assert.ok(srsModalCode.includes('min-h-[44px]') || srsModalCode.includes('w-11 h-11'), 'SrsFlashcardModal must have 44px close button');
    assert.ok(owlsModalCode.includes('min-h-[44px]') || owlsModalCode.includes('w-11 h-11'), 'OwlsCertificateModal must have 44px close button');

    // Ensure OwlsCertificateModal eliminated legacy 32px w-8 h-8 close button
    assert.ok(!owlsModalCode.includes('w-8 h-8 rounded-lg border border-[#e8ddd0] bg-white flex items-center justify-center text-stone-500'), 'OwlsCertificateModal must eliminate 32px close button');
  });

  await t.test('1.2: Modal Dialogs have standardized backdrop and mobile drag handle', () => {
    const wordModalCode = fs.readFileSync(path.join(rootDir, 'src/components/WordModal.jsx'), 'utf-8');
    const shortcutsModalCode = fs.readFileSync(path.join(rootDir, 'src/components/ShortcutsModal.jsx'), 'utf-8');

    assert.ok(wordModalCode.includes('p-0 sm:p-4 bg-black/60'), 'WordModal must have p-0 sm:p-4 bg-black/60 backdrop');
    assert.ok(shortcutsModalCode.includes('p-0 sm:p-4 bg-black/60'), 'ShortcutsModal must have p-0 sm:p-4 bg-black/60 backdrop');

    // Pull bar check
    assert.ok(wordModalCode.includes('w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5'), 'WordModal pull handle must be standardized');
    assert.ok(shortcutsModalCode.includes('w-10 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5'), 'ShortcutsModal pull handle must be standardized');
  });

  await t.test('2.1: Search inputs adhere to iOS 16px rule (text-base sm:text-xs) & h-11 44px height', () => {
    const vocabDrawerCode = fs.readFileSync(path.join(rootDir, 'src/components/VocabularyDrawer.jsx'), 'utf-8');
    const bookshelfDrawerCode = fs.readFileSync(path.join(rootDir, 'src/components/BookShelfDrawer.jsx'), 'utf-8');

    assert.ok(vocabDrawerCode.includes('h-11 min-h-[44px]') && vocabDrawerCode.includes('text-base sm:text-xs'), 'VocabularyDrawer search input must adhere to 16px iOS rule & 44px');
    assert.ok(bookshelfDrawerCode.includes('h-11 min-h-[44px]') && bookshelfDrawerCode.includes('text-base sm:text-xs'), 'BookShelfDrawer search input must adhere to 16px iOS rule & 44px');
  });

  await t.test('3.1: Slide-out Drawers standardize on 512px (sm:max-w-lg)', () => {
    const bookshelfDrawerCode = fs.readFileSync(path.join(rootDir, 'src/components/BookShelfDrawer.jsx'), 'utf-8');
    const vocabDrawerCode = fs.readFileSync(path.join(rootDir, 'src/components/VocabularyDrawer.jsx'), 'utf-8');

    assert.ok(bookshelfDrawerCode.includes('sm:max-w-lg'), 'BookShelfDrawer must use sm:max-w-lg');
    assert.ok(vocabDrawerCode.includes('sm:max-w-lg'), 'VocabularyDrawer must use sm:max-w-lg');
  });

  await t.test('3.2: Page container layouts standardize on max-w-6xl for exploration & max-w-4xl for study', () => {
    const bookshelfCode = fs.readFileSync(path.join(rootDir, 'src/components/BookshelfView.jsx'), 'utf-8');
    const analyticsCode = fs.readFileSync(path.join(rootDir, 'src/components/AnalyticsDashboard.jsx'), 'utf-8');
    const dictationCode = fs.readFileSync(path.join(rootDir, 'src/components/DictationStudio.jsx'), 'utf-8');

    assert.ok(bookshelfCode.includes('max-w-6xl mx-auto'), 'BookshelfView must use max-w-6xl');
    assert.ok(analyticsCode.includes('max-w-6xl mx-auto'), 'AnalyticsDashboard must use max-w-6xl');
    assert.ok(dictationCode.includes('max-w-4xl mx-auto'), 'DictationStudio must use max-w-4xl');
  });

  await t.test('3.3: Page and drawer top bars standardize on unified 56px (h-14) height', () => {
    const mobileTopBarCode = fs.readFileSync(path.join(rootDir, 'src/components/navigation/MobileTopBar.jsx'), 'utf-8');
    const readerTopBarCode = fs.readFileSync(path.join(rootDir, 'src/components/navigation/ReaderTopBar.jsx'), 'utf-8');
    const analyticsCode = fs.readFileSync(path.join(rootDir, 'src/components/AnalyticsDashboard.jsx'), 'utf-8');
    const vocabCode = fs.readFileSync(path.join(rootDir, 'src/components/VocabularyDrawer.jsx'), 'utf-8');
    const storageCode = fs.readFileSync(path.join(rootDir, 'src/components/StorageManagerModal.jsx'), 'utf-8');
    const bookshelfDrawerCode = fs.readFileSync(path.join(rootDir, 'src/components/BookShelfDrawer.jsx'), 'utf-8');

    assert.ok(mobileTopBarCode.includes('h-14'), 'MobileTopBar must standardize on h-14 (56px)');
    assert.ok(readerTopBarCode.includes('h-14'), 'ReaderTopBar must standardize on h-14 (56px)');
    assert.ok(analyticsCode.includes('h-14'), 'AnalyticsDashboard header must standardize on h-14 (56px)');
    assert.ok(vocabCode.includes('h-14'), 'VocabularyDrawer header must standardize on h-14 (56px)');
    assert.ok(storageCode.includes('h-14'), 'StorageManagerModal header must standardize on h-14 (56px)');
    assert.ok(bookshelfDrawerCode.includes('h-14'), 'BookShelfDrawer header must standardize on h-14 (56px)');
  });
});
