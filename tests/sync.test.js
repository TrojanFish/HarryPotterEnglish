import test from 'node:test';
import assert from 'node:assert/strict';
import { processSync, processPairing, generateSyncCode } from '../server/syncStore.js';
import { syncEngine } from '../src/utils/syncEngine.js';

test('Sync Engine: generateSyncCode generates clean 6-character alphanumeric code', () => {
  const code1 = generateSyncCode('usr_alice_123');
  const code2 = generateSyncCode('usr_bob_456');

  assert.ok(code1.startsWith('HP-'), 'Code should start with HP- prefix');
  assert.equal(code1.length, 7, 'Code should be 7 characters (HP-XXXX)');
  assert.notEqual(code1, code2, 'Different user IDs should produce distinct codes');
  assert.match(code1, /^HP-[2-9A-Z]{4}$/, 'Code should avoid confusing 0/O/1/I characters');
});

test('Sync Store: LWW (Last-Write-Wins) timestamp conflict resolution for vocabulary', () => {
  const userId = 'test_usr_' + Date.now();
  const deviceA = 'dev_phone_' + Date.now();
  const deviceB = 'dev_laptop_' + Date.now();

  const t1 = 1000000;
  const t2 = 2000000;
  const t3 = 1500000; // Older than t2

  // 1. Device A pushes "wand" at t1
  const syncA = processSync({
    userId,
    deviceId: deviceA,
    lastSyncedAt: 0,
    changes: {
      vocab: [
        { word: 'wand', translation: '魔杖 (v1)', srsBox: 1, updatedAt: t1 }
      ]
    }
  });

  assert.equal(syncA.status, 'ok');
  assert.equal(syncA.syncedCount.vocabPushed, 1);

  // 2. Device B pushes "wand" at t2 (newer)
  const syncB = processSync({
    userId,
    deviceId: deviceB,
    lastSyncedAt: 0,
    changes: {
      vocab: [
        { word: 'wand', translation: '魔杖 (v2)', srsBox: 2, updatedAt: t2 }
      ]
    }
  });

  assert.equal(syncB.status, 'ok');
  assert.equal(syncB.syncedCount.vocabPushed, 1);
  const wandB = syncB.serverChanges.vocab.find(v => v.word === 'wand');
  assert.equal(wandB.translation, '魔杖 (v2)');
  assert.equal(wandB.srsBox, 2);

  // 3. Device A tries to push "wand" with older timestamp t3 (< t2)
  const syncAOld = processSync({
    userId,
    deviceId: deviceA,
    lastSyncedAt: 0,
    changes: {
      vocab: [
        { word: 'wand', translation: '魔杖 (stale)', srsBox: 1, updatedAt: t3 }
      ]
    }
  });

  // Stale push should NOT overwrite t2
  assert.equal(syncAOld.syncedCount.vocabPushed, 0, 'Outdated timestamp should not overwrite newer record');
  const wandLatest = syncAOld.serverChanges.vocab.find(v => v.word === 'wand');
  assert.equal(wandLatest.translation, '魔杖 (v2)', 'Server should retain the newer version');
});

test('Sync Store: Soft deletion propagates through LWW', () => {
  const userId = 'test_del_' + Date.now();
  const deviceId = 'dev_del_' + Date.now();

  // 1. Add word
  processSync({
    userId,
    deviceId,
    lastSyncedAt: 0,
    changes: {
      vocab: [{ word: 'potion', translation: '魔药', updatedAt: 1000 }]
    }
  });

  // 2. Soft delete word at t=2000
  const deleteSync = processSync({
    userId,
    deviceId,
    lastSyncedAt: 1500,
    changes: {
      vocab: [{ word: 'potion', isDeleted: 1, updatedAt: 2000 }]
    }
  });

  assert.equal(deleteSync.status, 'ok');
  const deletedItem = deleteSync.serverChanges.vocab.find(v => v.word === 'potion');
  assert.ok(deletedItem);
  assert.equal(deletedItem.isDeleted, 1);
});

test('Sync Engine: Client mergeVocabLww handles additions, updates, and soft deletions', () => {
  const localList = [
    { word: 'lumos', translation: '荧光闪烁', srsBox: 1, updatedAt: 1000 },
    { word: 'nox', translation: '熄灭', srsBox: 1, updatedAt: 1000 }
  ];

  const serverChanges = [
    // Update lumos to Box 3 (newer)
    { word: 'lumos', translation: '荧光闪烁 (精通)', srsBox: 3, updatedAt: 2000 },
    // Soft delete nox
    { word: 'nox', isDeleted: true, updatedAt: 2000 },
    // Add new word alohomora
    { word: 'alohomora', translation: '开锁咒', srsBox: 1, updatedAt: 2000 }
  ];

  const merged = syncEngine.mergeVocabLww(localList, serverChanges);

  assert.equal(merged.length, 2, 'nox should be deleted, alohomora added -> total 2');
  const lumos = merged.find(w => w.word === 'lumos');
  assert.equal(lumos.srsBox, 3);
  assert.equal(lumos.translation, '荧光闪烁 (精通)');

  const nox = merged.find(w => w.word === 'nox');
  assert.equal(nox, undefined, 'nox should have been removed');

  const alohomora = merged.find(w => w.word === 'alohomora');
  assert.ok(alohomora, 'alohomora should be present');
});

test('Sync Store: Device pairing merges vocabulary across accounts', () => {
  const userA = 'usr_pc_' + Date.now();
  const userB = 'usr_mobile_' + Date.now();
  const deviceA = 'dev_pc_' + Date.now();
  const deviceB = 'dev_mobile_' + Date.now();

  // User A on PC adds "wand"
  const syncA = processSync({
    userId: userA,
    deviceId: deviceA,
    lastSyncedAt: 0,
    changes: {
      vocab: [{ word: 'wand', translation: '魔杖', srsBox: 2, updatedAt: 1000 }]
    }
  });
  const passcodeA = syncA.syncCode;

  // User B on mobile adds "cloak"
  processSync({
    userId: userB,
    deviceId: deviceB,
    lastSyncedAt: 0,
    changes: {
      vocab: [{ word: 'cloak', translation: '隐形衣', srsBox: 1, updatedAt: 1000 }]
    }
  });

  // Mobile pairs with PC using Passcode A
  const pairResult = processPairing({
    currentUserId: userB,
    deviceId: deviceB,
    targetSyncCode: passcodeA
  });

  assert.equal(pairResult.status, 'ok');
  assert.equal(pairResult.targetUserId, userA);

  // Syncing under userA now sees both "wand" and "cloak"
  const combinedSync = processSync({
    userId: userA,
    deviceId: deviceB,
    lastSyncedAt: 0,
    changes: {}
  });

  const words = combinedSync.serverChanges.vocab.map(v => v.word);
  assert.ok(words.includes('wand'), 'Combined account should include wand');
  assert.ok(words.includes('cloak'), 'Combined account should include cloak');
});
