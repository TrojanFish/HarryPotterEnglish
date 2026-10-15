import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateSyncCode, processSync, processPairing } from '../server/syncStore.js';

test('Pre-Launch Remediation: Task 1 - Sync Code High Entropy & Collision Protection', async (t) => {
  await t.test('1.1: generateSyncCode scales beyond 32 codes and delivers >950 unique codes for 1,000 users', () => {
    const codes = new Set();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const code = generateSyncCode(`usr_simulated_learner_${i}`);
      assert.match(code, /^HP-[2-9A-Z]{4}$/, `Code ${code} must adhere to HP-XXXX Base32 format`);
      codes.add(code);
    }

    // In a space of 32^4 = 1,048,576 combinations, 1,000 items should have >950 distinct values
    assert.ok(
      codes.size > 950,
      `Expected >950 unique codes out of 1000 users to prevent account hijacking, but got only ${codes.size}`
    );
  });

  await t.test('1.2: processSync maintains stable sync code per user without overwriting foreign users', () => {
    const userA = 'usr_alice_' + Date.now();
    const userB = 'usr_bob_' + Date.now();
    const devA = 'dev_phone_a_' + Date.now();
    const devB = 'dev_phone_b_' + Date.now();

    const syncA = processSync({ userId: userA, deviceId: devA, changes: {} });
    const syncB = processSync({ userId: userB, deviceId: devB, changes: {} });

    assert.equal(syncA.status, 'ok');
    assert.equal(syncB.status, 'ok');
    assert.notEqual(syncA.syncCode, syncB.syncCode, 'Different users must receive distinct sync codes');

    // Repeated sync for user A on same device keeps code stable
    const syncA2 = processSync({ userId: userA, deviceId: devA, changes: {} });
    assert.equal(syncA2.syncCode, syncA.syncCode, 'User A code must remain stable across sync cycles');
  });
});

test('Pre-Launch Remediation: Task 2 - Legal Disclaimer & COPPA Compliance Modal Spec', async (t) => {
  const modalPath = path.resolve('src/components/LegalDisclaimerModal.jsx');
  
  await t.test('2.1: LegalDisclaimerModal.jsx exists and exports component', () => {
    assert.ok(fs.existsSync(modalPath), 'LegalDisclaimerModal.jsx must exist in src/components');
  });

  await t.test('2.2: Modal source contains 4 core legal/compliance pillars and zero emojis', () => {
    if (!fs.existsSync(modalPath)) {
      assert.fail('Modal file missing');
      return;
    }
    const content = fs.readFileSync(modalPath, 'utf8');

    // 1. Fair use & SLA research
    assert.ok(content.includes('合理使用') || content.includes('Fair Use'), 'Must declare Academic Fair Use');
    assert.ok(content.includes('非商业'), 'Must declare non-commercial status');

    // 2. Warner Bros / JK Rowling IP
    assert.ok(content.includes('J.K. Rowling') && content.includes('Warner Bros'), 'Must acknowledge J.K. Rowling and Warner Bros');

    // 3. COPPA adolescent protection & zero PII
    assert.ok(content.includes('COPPA') || content.includes('儿童在线隐私保护'), 'Must declare COPPA compliance');
    assert.ok(content.includes('个人信息') || content.includes('PII'), 'Must state zero PII collection');

    // 4. DMCA contact email
    assert.ok(content.includes('feedback@') || content.includes('legal@') || content.includes('mailto:'), 'Must provide DMCA takedown email');

    // 5. Apple HIG >=44px close target
    assert.ok(content.includes('min-h-[44px]') || content.includes('h-11') || content.includes('min-w-[44px]'), 'Close target must meet Apple HIG >=44px');

    // 6. Zero unicode emojis
    const emojiRegex = /\p{Extended_Pictographic}/u;
    assert.ok(!emojiRegex.test(content), 'LegalDisclaimerModal must contain zero unicode emojis');
  });

  await t.test('2.3: App.jsx and navigation components wire LegalDisclaimerModal', () => {
    const appContent = fs.readFileSync(path.resolve('src/App.jsx'), 'utf8');
    const sidebarContent = fs.readFileSync(path.resolve('src/components/navigation/DesktopSidebar.jsx'), 'utf8');
    const bookshelfContent = fs.readFileSync(path.resolve('src/components/BookshelfView.jsx'), 'utf8');

    assert.ok(appContent.includes('LegalDisclaimerModal'), 'App.jsx must import and render LegalDisclaimerModal');
    assert.ok(sidebarContent.includes('onOpenLegal') || sidebarContent.includes('法律声明'), 'DesktopSidebar must offer legal entry point');
    assert.ok(bookshelfContent.includes('onOpenLegal') || bookshelfContent.includes('法律声明'), 'BookshelfView must offer legal entry point');
  });
});

test('Pre-Launch Remediation: Task 3 - Vocabulary Soft-Delete Tombstone Cloud Sync', async (t) => {
  await t.test('3.1: syncEngine provides markVocabDeleted and saves tombstones to hp_deleted_vocab', async () => {
    // Setup mock localStorage in globalThis if in Node environment
    if (!globalThis.localStorage) {
      const store = new Map();
      globalThis.localStorage = {
        getItem: (k) => store.get(k) || null,
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear()
      };
    }

    const { syncEngine } = await import('../src/utils/syncEngine.js');
    assert.equal(typeof syncEngine.markVocabDeleted, 'function', 'syncEngine must export markVocabDeleted function');

    syncEngine.markVocabDeleted('alohomora');
    const savedDeleted = JSON.parse(globalThis.localStorage.getItem('hp_deleted_vocab') || '[]');
    assert.ok(Array.isArray(savedDeleted), 'hp_deleted_vocab must be an array');
    const record = savedDeleted.find(d => d.word === 'alohomora');
    assert.ok(record, 'alohomora must be present in hp_deleted_vocab');
    assert.equal(record.isDeleted, true, 'Tombstone must mark isDeleted: true');
    assert.ok(typeof record.updatedAt === 'number', 'Tombstone must carry updatedAt timestamp');
  });

  await t.test('3.2: useVocabManager invokes markVocabDeleted on removal', () => {
    const vocabHookContent = fs.readFileSync(path.resolve('src/hooks/useVocabManager.js'), 'utf8');
    assert.ok(
      vocabHookContent.includes('markVocabDeleted'),
      'useVocabManager must call markVocabDeleted upon word removal or un-saving'
    );
  });
});
