import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('App View Routing Spec and Source Integrity Test', async (t) => {
  const appSrcPath = path.resolve(projectRoot, 'src', 'App.jsx');
  assert.ok(fs.existsSync(appSrcPath), 'App.jsx must exist');
  const appCode = fs.readFileSync(appSrcPath, 'utf8');

  await t.test('4.1: App.jsx supports currentView branching for vocab, analytics, and storage', () => {
    // Check that currentView supports 'vocab', 'analytics', 'storage' in content viewport
    assert.ok(appCode.includes("currentView === 'vocab'"), "App.jsx must branch on currentView === 'vocab'");
    assert.ok(appCode.includes("currentView === 'analytics'"), "App.jsx must branch on currentView === 'analytics'");
    assert.ok(appCode.includes("currentView === 'storage'"), "App.jsx must branch on currentView === 'storage'");
  });

  await t.test('4.2: App.jsx passes isPageView=true to inline workspace view instances', () => {
    assert.ok(appCode.includes('isPageView={true}'), 'App.jsx must pass isPageView={true} to page views');
  });

  await t.test('4.3: DesktopSidebar & TabletRail wire onOpen props to currentView switching', () => {
    assert.ok(appCode.includes("handleSwitchCurrentView('vocab')") || appCode.includes("setCurrentView('vocab')"), 'Must wire vocab to currentView switching');
    assert.ok(appCode.includes("handleSwitchCurrentView('analytics')") || appCode.includes("setCurrentView('analytics')"), 'Must wire analytics to currentView switching');
    assert.ok(appCode.includes("handleSwitchCurrentView('storage')") || appCode.includes("setCurrentView('storage')"), 'Must wire storage to currentView switching');
  });
});
