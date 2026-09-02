import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, hydrateState, serializeStateForSave } from '../src/game/createInitialState.js';
import { claimOfflineProgress, shooThief, simulateTicks } from '../src/game/simulation.js';

const liveThief = (overrides = {}) => ({
  id: 'thief-7',
  remaining: 7,
  duration: 7,
  stealAmount: 12,
  ...overrides,
});

test('thief waits for its uncommon cooldown and then spawns deterministically', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const state = { ...createInitialState(), eventCooldown: 999, priorityOfferCooldown: 999, thiefCooldown: 2 };
    const waiting = simulateTicks(state, 1);
    assert.equal(waiting.thiefEvent, null);
    assert.equal(waiting.thiefCooldown, 1);
    const spawned = simulateTicks(waiting, 1);
    assert.deepEqual(spawned.thiefEvent, { id: 'thief-1', remaining: 7, duration: 7, stealAmount: 6 });
  } finally {
    Math.random = originalRandom;
  }
});

test('urgent prompts block thief spawns', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const state = { ...createInitialState(), eventCooldown: 999, priorityOfferCooldown: 999, thiefCooldown: 0, priorityOffer: { id: 'priority', itemId: 'basic-chai', remaining: 5, customerTypeId: 'regular', customerEmoji: '☕', customerName: 'Guest', spendMultiplier: 2 } };
    assert.equal(simulateTicks(state, 1).thiefEvent, null);
  } finally {
    Math.random = originalRandom;
  }
});

test('shooing a thief prevents loss, awards small Heat, and resolves only once', () => {
  const state = { ...createInitialState(), coins: 100, heatMeter: 10, thiefEvent: liveThief() };
  const shooed = shooThief(state);
  assert.equal(shooed.coins, 100);
  assert.equal(shooed.heatMeter, 16);
  assert.equal(shooed.thievesShooed, 1);
  assert.equal(shooed.lastThiefOutcome.type, 'shooed');
  assert.deepEqual(shooed.thiefResolutionLedger, ['thief-7']);
  assert.strictEqual(shooThief(shooed), shooed);
});

test('an ignored thief steals a bounded amount exactly once', () => {
  const state = { ...createInitialState(), coins: 100, eventCooldown: 999, priorityOfferCooldown: 999, thiefEvent: liveThief({ remaining: 1 }) };
  const stolen = simulateTicks(state, 1);
  assert.equal(stolen.coins, 88);
  assert.equal(stolen.thiefThefts, 1);
  assert.equal(stolen.lastThiefOutcome.type, 'stolen');
  assert.equal(stolen.lastThiefOutcome.amount, 12);
  const next = simulateTicks(stolen, 1);
  assert.equal(next.coins, 88);
  assert.equal(next.thiefThefts, 1);
});

test('save hydration preserves and sanitizes thief state', () => {
  const restored = hydrateState({
    ...createInitialState(),
    thiefEvent: liveThief({ remaining: 999, stealAmount: 999 }),
    thiefCooldown: -10,
    thiefSequence: 3.9,
    thievesShooed: -2,
    thiefThefts: 4.8,
    thiefResolutionLedger: ['thief-1', 'thief-1', 3],
    lastThiefOutcome: { id: 'thief-1', type: 'stolen', amount: 999, sequence: 2.9 },
  });
  assert.equal(restored.thiefEvent.remaining, 7);
  assert.equal(restored.thiefEvent.stealAmount, 35);
  assert.equal(restored.thiefCooldown, 0);
  assert.equal(restored.thiefSequence, 3);
  assert.equal(restored.thievesShooed, 0);
  assert.equal(restored.thiefThefts, 4);
  assert.deepEqual(restored.thiefResolutionLedger, ['thief-1']);
  assert.equal(restored.lastThiefOutcome.amount, 35);
  assert.equal(serializeStateForSave(restored).state.thiefEvent.id, 'thief-7');
});

test('hydration removes already-resolved or conflicting urgent thief state', () => {
  const replay = hydrateState({ ...createInitialState(), thiefEvent: liveThief(), thiefResolutionLedger: ['thief-7'] });
  assert.equal(replay.thiefEvent, null);
  const conflict = hydrateState({ ...createInitialState(), thiefEvent: liveThief(), priorityOffer: { id: 'priority', itemId: 'basic-chai', remaining: 5 }, activeEvent: { id: 'rush', remaining: 20 } });
  assert.equal(conflict.priorityOffer, null);
  assert.equal(conflict.activeEvent, null);
});

test('background and offline time dismisses a thief without charging the player', () => {
  const state = { ...createInitialState(), coins: 100, thiefCooldown: 0, thiefEvent: liveThief() };
  const result = claimOfflineProgress(state, 10_000);
  assert.equal(result.offlineCoins, 0);
  assert.equal(result.state.coins, 100);
  assert.equal(result.state.thiefEvent, null);
  assert.equal(result.state.thiefCooldown, 75);
  assert.equal(result.state.thiefThefts, 0);
});
