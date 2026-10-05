import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';
import { renderToString } from 'react-dom/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Transpile DailyGoalRing.jsx
const ringSrcPath = path.resolve(projectRoot, 'src', 'components', 'DailyGoalRing.jsx');
const ringSrcCode = fs.readFileSync(ringSrcPath, 'utf8');
const transformedRing = esbuild.transformSync(ringSrcCode, { loader: 'jsx', format: 'esm' });
const compiledRingPath = path.resolve(__dirname, 'DailyGoalRing.compiled.js');
fs.writeFileSync(compiledRingPath, transformedRing.code, 'utf8');

// Transpile BookshelfView.jsx
const bookshelfSrcPath = path.resolve(projectRoot, 'src', 'components', 'BookshelfView.jsx');
let bookshelfSrcCode = fs.readFileSync(bookshelfSrcPath, 'utf8');
bookshelfSrcCode = bookshelfSrcCode
  .replace("from '../utils/vttParser'", "from '../src/utils/vttParser.js'")
  .replace("from './DailyGoalRing'", "from './DailyGoalRing.compiled.js'")
  .replace("from '../data/books'", "from '../src/data/books.js'");

const transformedBookshelf = esbuild.transformSync(bookshelfSrcCode, { loader: 'jsx', format: 'esm' });
const compiledBookshelfPath = path.resolve(__dirname, 'BookshelfView.compiled.js');
fs.writeFileSync(compiledBookshelfPath, transformedBookshelf.code, 'utf8');

const { BookshelfView } = await import('./BookshelfView.compiled.js');

test('BookshelfView CEFR & Hero Continue Card Test Suite', async (t) => {
  const mockBooks = [
    {
      id: 'book1',
      title: "Harry Potter and the Philosopher's Stone",
      cnTitle: '哈利·波特与魔法石',
      chapters: [
        { id: 'b1_c01', number: 1, title: 'The Boy Who Lived', cnTitle: '大难不死的男孩' }
      ]
    },
    {
      id: 'book2',
      title: 'Harry Potter and the Chamber of Secrets',
      cnTitle: '哈利·波特与密室',
      chapters: [
        { id: 'b2_c01', number: 1, title: 'The Worst Birthday', cnTitle: '糟糕的生日' }
      ]
    }
  ];

  await t.test('4.1: Book cards render standardized CEFR dual-channel pill badge', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true
      })
    );

    assert.ok(html.includes('cefr-pill'), 'Must contain .cefr-pill class for dual-channel display');
    assert.ok(html.includes('cefr-pill-a2'), 'Book 1 must render cefr-pill-a2 badge');
    assert.ok(html.includes('入门') || html.includes('A2'), 'Must contain text label for CEFR A2');
  });

  await t.test('4.2: Hero Continue Card renders with active CTA', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true,
        isPlaying: false
      })
    );

    assert.ok(html.includes('继续精听'), 'Hero continue card must render primary CTA text');
  });

  await t.test('4.3: Eliminates unstructured middle-dot connectors in main titles and descriptions', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true
      })
    );

    // Check header text doesn't contain the raw AI template pattern
    assert.ok(!html.includes('选一本魔法故事，开启今日听力探险 · 每日 5 分钟'), 'Must eliminate raw middle-dot chained header');
  });

  await t.test('4.4: Desktop action buttons adhere to Apple HIG >=44px touch targets', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true
      })
    );

    // Desktop book action buttons must not use sub-44px min-h-[40px]
    assert.ok(!html.includes('min-h-[40px]'), 'Must eliminate non-compliant min-h-[40px] buttons');
    assert.ok(html.includes('min-h-[44px]'), 'Must enforce min-h-[44px] on action buttons');
  });

  await t.test('4.5: Desktop book card action buttons follow GitHub-style icon-only design', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true
      })
    );

    // Desktop book action buttons should not render redundant text "精听" and "目录"
    assert.ok(!html.includes('>精听<'), 'Book card buttons must be icon-only');
    assert.ok(!html.includes('>目录<'), 'Book card buttons must be icon-only');
  });
});

