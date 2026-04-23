import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, serializeStateForSave } from '../src/game/createInitialState.js';
import { bootGameState } from '../src/game/bootGameState.js';
import { LEGACY_SAVE_KEY, SAVE_BACKUP_KEY, SAVE_KEY, SAVE_RECOVERY_META_KEY } from '../src/game/saveRecovery.js';

const createStorage = (seed = {}) => {
  const store = new Map(Object.entries(seed));
  const removed = [];
  const written = [];

  return {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setItem(key, value) {
      store.set(key, value);
      written.push([key, value]);
    },
    async removeItem(key) {
      store.delete(key);
      removed.push(key);
    },
    removed,
    written,
    store,
  };
};

test('boots from backup save when primary and legacy data are unreadable', async () => {
  const saved = createInitialState();
  saved.coins = 320;
  saved.totalServed = 11;
  saved.lastTickAt = 1000;

  const storage = createStorage({
    [SAVE_KEY]: '{bad json',
    [LEGACY_SAVE_KEY]: JSON.stringify({ schemaVersion: 999, state: {} }),
    [SAVE_BACKUP_KEY]: JSON.stringify(serializeStateForSave(saved)),
  });

  const result = await bootGameState({ storage, now: () => 1000 });

  assert.equal(result.state.coins, 320);
  assert.equal(result.state.totalServed, 11);
  assert.equal(result.offlineCoins, 0);
  assert.equal(result.recoveryNotice, 'Recovered from backup save.');
  assert.deepEqual(storage.removed, []);
  assert.deepEqual(storage.written, []);
});

test('boots cleanly with a fresh state when no save data exists', async () => {
  const storage = createStorage();

  const result = await bootGameState({ storage, now: () => 5000 });

  assert.equal(result.offlineCoins, 0);
  assert.equal(result.recoveryNotice, '');
  assert.equal(result.state.coins, 80);
  assert.equal(result.state.lastTickAt <= Date.now(), true);
  assert.deepEqual(storage.removed, []);
  assert.deepEqual(storage.written, []);
});

test('recovers to a fresh state and records recovery metadata when all save slots are broken', async () => {
  const storage = createStorage({
    [SAVE_KEY]: '{broken',
    [LEGACY_SAVE_KEY]: JSON.stringify({ schemaVersion: 999, state: {} }),
  });

  const result = await bootGameState({ storage, now: () => 1234567890 });

  assert.equal(result.offlineCoins, 0);
  assert.equal(result.recoveryNotice, 'Save data was unreadable, so a fresh kettle was started.');
  assert.equal(result.state.coins, 80);
  assert.deepEqual(storage.removed, [SAVE_KEY, LEGACY_SAVE_KEY]);
  assert.deepEqual(storage.written, [
    [
      SAVE_RECOVERY_META_KEY,
      JSON.stringify({
        corruptedAt: 1234567890,
        reason: 'Error: Save schema 999 is newer than supported schema 2',
      }),
    ],
  ]);
});
