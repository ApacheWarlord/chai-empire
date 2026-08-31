import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, SAVE_SCHEMA_VERSION, serializeStateForSave } from '../src/game/createInitialState.js';
import {
  buildCorruptedSaveRecovery,
  parseStoredSaveCandidates,
  SAVE_KEY,
  LEGACY_SAVE_KEY,
  SAVE_BACKUP_KEY,
} from '../src/game/saveRecovery.js';

test('migrates legacy saves and restores sanitized state', () => {
  const legacyState = {
    coins: 425,
    satisfaction: 150,
    venueTier: 3,
    unlockedMenu: ['basic-chai', 'masala-chai'],
    staffOwned: [1, 2],
    tutorial: { active: false, dismissedStepIds: ['welcome'] },
  };

  const restored = parseStoredSaveCandidates([
    { source: 'legacy', raw: JSON.stringify(legacyState) },
  ]);

  assert.equal(restored.source, 'legacy');
  assert.equal(restored.state.coins, 425);
  assert.equal(restored.state.satisfaction, 100);
  assert.equal(restored.state.venueTier, 3);
  assert.deepEqual(restored.state.unlockedMenu, ['basic-chai', 'masala-chai']);
  assert.deepEqual(restored.state.staffOwned, [1, 2]);
  assert.equal(restored.state.tutorial.active, false);
  assert.deepEqual(restored.state.tutorial.dismissedStepIds, ['welcome']);
});

test('falls back to backup when primary and legacy saves are corrupted', () => {
  const backupState = createInitialState();
  backupState.coins = 777;
  backupState.totalServed = 42;

  const restored = parseStoredSaveCandidates([
    { source: 'primary', raw: '{not valid json' },
    { source: 'legacy', raw: JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION + 1, state: {} }) },
    { source: 'backup', raw: JSON.stringify(serializeStateForSave(backupState)) },
  ]);

  assert.equal(restored.source, 'backup');
  assert.equal(restored.state.coins, 777);
  assert.equal(restored.state.totalServed, 42);
});

test('throws when every available save candidate is unreadable', () => {
  assert.throws(
    () =>
      parseStoredSaveCandidates([
        { source: 'primary', raw: '{bad json' },
        { source: 'legacy', raw: JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION + 5, state: {} }) },
      ]),
    /newer than supported schema/
  );
});

test('builds recovery metadata and clears every corrupted save slot', () => {
  const recovery = buildCorruptedSaveRecovery(new Error('broken save'), 1234567890);

  assert.deepEqual(recovery.recoveryMeta, {
    corruptedAt: 1234567890,
    reason: 'Error: broken save',
  });
  assert.deepEqual(recovery.keysToRemove, [SAVE_KEY, LEGACY_SAVE_KEY, SAVE_BACKUP_KEY]);
});


test('save hydration clamps impossible progression values', () => {
  const legacyState = {
    coins: 100,
    venueTier: 999,
    unlockedMenu: ['basic-chai', 'not-a-real-item', 'masala-chai'],
    staffOwned: [1, 2, 4, 99],
    levels: {
      speed: 999,
      service: -5,
      quality: 'broken',
      reputation: 3.8,
    },
  };

  const restored = parseStoredSaveCandidates([
    { source: 'legacy', raw: JSON.stringify(legacyState) },
  ]).state;

  assert.equal(restored.venueTier, 5);
  assert.deepEqual(restored.unlockedMenu, ['basic-chai', 'masala-chai']);
  assert.deepEqual(restored.staffOwned, [1, 2]);
  assert.equal(restored.levels.speed, 12);
  assert.equal(restored.levels.service, 0);
  assert.equal(restored.levels.quality, 0);
  assert.equal(restored.levels.reputation, 3);
});
