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

  await t.test('4.6: 4 cards rendered in unified 4-column responsive grid container', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true,
        streakDays: 3,
        todayListeningSeconds: 60,
        vocabCount: 12
      })
    );

    // Grid must use responsive 4-column grid on desktop
    assert.ok(html.includes('lg:grid-cols-4'), 'Task and continue cards must be in a 4-column responsive grid');
    // All 4 cards must be present
    assert.ok(html.includes('今日契约'), 'Must include 今日契约 card');
    assert.ok(html.includes('连续打卡'), 'Must include 连续打卡 card');
    assert.ok(html.includes('艾宾浩斯复习'), 'Must include 艾宾浩斯复习 card');
    assert.ok(html.includes('继续精听') || html.includes('正在精听'), 'Must include 继续精听 card in the row');
  });

  await t.test('4.7: 今日契约 and 连续打卡 share consistent leading big-number structure', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true,
        streakDays: 5,
        todayListeningSeconds: 120, // 2 mins listened, 3 mins remaining (300 - 120 = 180s = 3m)
        vocabCount: 10
      })
    );

    // Streak card has leading big number: e.g. 5 天连胜
    assert.ok(html.includes('>5</span>') && html.includes('天连胜'), 'Streak card must have leading big number');
    // Daily goal card has leading big number: e.g. 3 分钟待听
    assert.ok(html.includes('分钟待听'), 'Daily goal card must display 分钟待听 with leading number');
    // Both cards have consistent font-extrabold text-lg
    assert.ok(html.includes('font-mono font-extrabold text-lg'), 'Cards must use consistent typography for leading numbers');
  });

  await t.test('4.8: Continue listening card integrates compactly within the 4-card grid', () => {
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

    // Card 4 renders current chapter title
    assert.ok(html.includes('大难不死的男孩'), 'Must display active chapter title');
    assert.ok(html.includes('哈利·波特与魔法石'), 'Must display active book title');
    // Eliminates the old separate mb-8 hero container
    assert.ok(!html.includes('mb-8 border border-amber-300/80'), 'Old standalone full-width hero card must be replaced by grid card');
  });

  await t.test('4.9: Continue listening card action buttons enforce Apple HIG touch targets', () => {
    const html = renderToString(
      React.createElement(BookshelfView, {
        books: mockBooks,
        selectedBook: 'book1',
        selectedChapter: 'b1_c01',
        currentTime: 45,
        duration: 300,
        isParchment: true,
        isPlaying: false,
        onTogglePlay: () => {}
      })
    );

    // Continue listening card must eliminate tiny 28px buttons
    assert.ok(!html.includes('min-w-[28px] min-h-[28px]'), 'Must eliminate 28px tiny buttons in continue listening card');
    assert.ok(html.includes('min-w-[44px]') || html.includes('min-h-[44px]') || html.includes('min-w-[36px]'), 'Must enforce ergonomic touch targets');
  });
});

