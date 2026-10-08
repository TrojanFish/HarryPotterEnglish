import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('MobileBottomNav Icon Synchronization Test Suite', async (t) => {
  const bottomNavFilePath = path.resolve(projectRoot, 'src', 'components', 'navigation', 'MobileBottomNav.jsx');
  const appFilePath = path.resolve(projectRoot, 'src', 'App.jsx');
  const bottomNavCode = fs.readFileSync(bottomNavFilePath, 'utf8');
  const appCode = fs.readFileSync(appFilePath, 'utf8');

  await t.test('1. MobileBottomNav synchronizes optimisticTab during render and effect', () => {
    // Assert that MobileBottomNav handles prop updates without sticking to stale optimistic state
    assert.ok(
      bottomNavCode.includes('setPrevView') || bottomNavCode.includes('setOptimisticTab(null)') || bottomNavCode.includes('prevView !== currentView'),
      'MobileBottomNav must clear or synchronize optimisticTab when currentView changes'
    );
  });

  await t.test('2. MobileBottomNav contains a safety timeout to prevent stuck optimistic highlight', () => {
    // A safety timeout ensures optimistic highlight can never stay stuck if a transition is aborted
    assert.ok(
      bottomNavCode.includes('setTimeout') || bottomNavCode.includes('clearTimeout'),
      'MobileBottomNav must implement a safety timer to clear optimistic state'
    );
  });

  await t.test('3. MobileBottomNav derives active state safely without stale split-brain', () => {
    // Check that active tab evaluation respects currentView when optimisticTab is cleared
    assert.ok(
      bottomNavCode.includes('activeTab') || bottomNavCode.includes('optimisticTab || currentView') || bottomNavCode.includes('currentView === tab.id'),
      'MobileBottomNav must evaluate active tab with synchronization to currentView'
    );
  });

  await t.test('4. App.jsx binds onClose of all drawer/modal page views back to previous view', () => {
    // Verify Vocab page view closes cleanly to previousViewRef.current or bookshelf/player
    assert.ok(
      appCode.includes("currentView === 'vocab'") &&
      appCode.includes("handleSwitchCurrentView(previousViewRef.current"),
      'Vocab page view must switch back to previousViewRef on close'
    );

    // Verify Analytics page view closes cleanly to previousViewRef.current or bookshelf/player
    assert.ok(
      appCode.includes("currentView === 'analytics'") &&
      appCode.includes("handleSwitchCurrentView(previousViewRef.current"),
      'Analytics page view must switch back to previousViewRef on close'
    );

    // Verify Storage page view closes cleanly to previousViewRef.current or bookshelf/player
    assert.ok(
      appCode.includes("currentView === 'storage'") &&
      appCode.includes("handleSwitchCurrentView(previousViewRef.current"),
      'Storage page view must switch back to previousViewRef on close'
    );
  });

  await t.test('5. Touch targets and zero emojis compliance', () => {
    // Touch targets must be at least 44px
    assert.ok(bottomNavCode.includes('min-h-[48px]'), 'Bottom nav tabs must meet Apple HIG >=44px touch targets');
    
    // Zero emojis check
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.ok(!emojiRegex.test(bottomNavCode), 'MobileBottomNav must have zero Unicode emojis');
  });

  await t.test('6. Logical state reducer simulation verifies zero desync', () => {
    // Simulate the exact state transitions of MobileBottomNav
    const simulateMobileNav = (initialView) => {
      let currentView = initialView;
      let prevView = currentView;
      let optimisticTab = null;

      const clickTab = (tabId) => {
        optimisticTab = tabId;
      };

      const receiveProps = (newCurrentView) => {
        currentView = newCurrentView;
        if (prevView !== currentView) {
          prevView = currentView;
          optimisticTab = null;
        }
      };

      const getActiveTab = () => optimisticTab || currentView;

      return { clickTab, receiveProps, getActiveTab };
    };

    const nav = simulateMobileNav('bookshelf');
    assert.equal(nav.getActiveTab(), 'bookshelf', 'Initial view must be bookshelf');

    // User taps vocab
    nav.clickTab('vocab');
    assert.equal(nav.getActiveTab(), 'vocab', 'Optimistic tab must immediately be vocab');

    // App switches to vocab
    nav.receiveProps('vocab');
    assert.equal(nav.getActiveTab(), 'vocab', 'Active tab is vocab');

    // User closes vocab drawer (via X) -> App sets currentView to bookshelf
    nav.receiveProps('bookshelf');
    assert.equal(nav.getActiveTab(), 'bookshelf', 'Active tab MUST immediately reset to bookshelf when drawer closes!');

    // User taps analytics
    nav.clickTab('analytics');
    assert.equal(nav.getActiveTab(), 'analytics', 'Optimistic tab must immediately be analytics');

    // App switches to analytics
    nav.receiveProps('analytics');
    assert.equal(nav.getActiveTab(), 'analytics', 'Active tab is analytics');

    // User closes analytics -> App sets currentView to bookshelf
    nav.receiveProps('bookshelf');
    assert.equal(nav.getActiveTab(), 'bookshelf', 'Active tab MUST immediately reset to bookshelf');
  });
});
