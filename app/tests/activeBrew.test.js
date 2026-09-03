import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState, hydrateState, SAVE_SCHEMA_VERSION, serializeStateForSave } from '../src/game/createInitialState.js';
import {
  canOfferActiveBrew,
  claimOfflineProgress,
  createActiveBrewOpportunity,
  getActiveBrewStages,
  simulateTicks,
  startActiveBrew,
  tapActiveBrewStage,
} from '../src/game/simulation.js';

const withOrder = (itemId = 'basic-chai') => {
  const state = createInitialState();
  state.activeBrewCooldown = 0;
  state.activeOrders = [{ id: 'order-1', itemId, remaining: 8, waited: 1, spendMultiplier: 1, customerTypeId: 'regular' }];
  return state;
};

const tapAll = (state, remaining = 1.7) => {
  let next = state;
  while (next.activeBrew) {
    next = tapActiveBrewStage({ ...next, activeBrew: { ...next.activeBrew, stageRemaining: remaining } });
  }
  return next;
};

test('active brew eligibility only selects real chai orders and respects urgent conflicts', () => {
  const snack = withOrder('biscuit-pack');
  assert.equal(canOfferActiveBrew(snack), false);
  const chai = withOrder('basic-chai');
  assert.equal(canOfferActiveBrew(chai), true);
  assert.equal(canOfferActiveBrew({ ...chai, thiefEvent: { id: 'thief', remaining: 5 } }), false);
  assert.equal(canOfferActiveBrew({ ...chai, priorityOffer: { id: 'priority' } }), false);
  assert.equal(canOfferActiveBrew({ ...chai, pendingReward: { id: 'reward' } }), false);
});

test('menu variants receive readable preparation stages while snacks stay ineligible', () => {
  assert.deepEqual(getActiveBrewStages('basic-chai'), ['BOIL', 'ADD TEA', 'POUR', 'SERVE']);
  assert.equal(getActiveBrewStages('masala-chai')[1], 'ADD MASALA');
  assert.equal(getActiveBrewStages('ginger-chai')[1], 'CRUSH GINGER');
  assert.equal(getActiveBrewStages('kulhad-chai')[0], 'WARM KULHAD');
});

test('perfect active brew resolves its real order once with bounded payout, heat, mood, streak, and Tea Run progress', () => {
  let state = createActiveBrewOpportunity(withOrder());
  state = startActiveBrew(state);
  const before = state;
  const resolved = tapAll(state);
  assert.equal(resolved.activeOrders.length, 0);
  assert.equal(resolved.totalServed, before.totalServed + 1);
  assert.equal(resolved.sessionRun.served, before.sessionRun.served + 1);
  assert.equal(resolved.lastActiveBrewOutcome.grade, 'perfect');
  assert.ok(resolved.lastActiveBrewOutcome.bonus >= 1 && resolved.lastActiveBrewOutcome.bonus <= 20);
  assert.equal(resolved.lastActiveBrewOutcome.heatBonus, 14);
  assert.equal(resolved.satisfaction, Math.min(100, before.satisfaction + 2));
  assert.equal(resolved.serviceStreak, before.serviceStreak + 1);
  assert.equal(resolved.activeBrewResolutionLedger.length, 1);

  const replay = tapActiveBrewStage({ ...resolved, activeBrew: before.activeBrew });
  assert.equal(replay.coins, resolved.coins);
  assert.equal(replay.totalServed, resolved.totalServed);
});

test('good and sloppy timing receive smaller, non-punitive rewards', () => {
  const good = tapAll(startActiveBrew(createActiveBrewOpportunity(withOrder())), 3);
  const sloppy = tapAll(startActiveBrew(createActiveBrewOpportunity(withOrder())), 0);
  assert.equal(good.lastActiveBrewOutcome.grade, 'good');
  assert.equal(sloppy.lastActiveBrewOutcome.grade, 'sloppy');
  assert.ok(good.lastActiveBrewOutcome.bonus > sloppy.lastActiveBrewOutcome.bonus);
  assert.ok(good.lastActiveBrewOutcome.heatBonus > sloppy.lastActiveBrewOutcome.heatBonus);
  assert.equal(sloppy.totalServed, 1);
});

test('stove shortens stages, Faster Pouring widens the pour perfect window, and Masala Mix strengthens perfect payout', () => {
  const base = startActiveBrew(createActiveBrewOpportunity(withOrder('masala-chai')));
  const upgradedSeed = withOrder('masala-chai');
  upgradedSeed.levels = { ...upgradedSeed.levels, speed: 4, service: 4, quality: 4 };
  const upgraded = startActiveBrew(createActiveBrewOpportunity(upgradedSeed));
  assert.ok(upgraded.activeBrew.stageDuration < base.activeBrew.stageDuration);

  const toPour = (state) => {
    let next = tapActiveBrewStage({ ...state, activeBrew: { ...state.activeBrew, stageRemaining: 1.7 } });
    next = tapActiveBrewStage({ ...next, activeBrew: { ...next.activeBrew, stageRemaining: 1.7 } });
    return next;
  };
  const basePour = tapActiveBrewStage({ ...toPour(base), activeBrew: { ...toPour(base).activeBrew, stageRemaining: 2.5 } });
  const upgradedAtPour = toPour(upgraded);
  const upgradedPour = tapActiveBrewStage({ ...upgradedAtPour, activeBrew: { ...upgradedAtPour.activeBrew, stageRemaining: 2.5 } });
  assert.equal(basePour.activeBrew.grades.at(-1), 'good');
  assert.equal(upgradedPour.activeBrew.grades.at(-1), 'perfect');
  const baseResult = tapAll(base);
  const qualityResult = tapAll(upgraded);
  assert.ok(qualityResult.lastActiveBrewOutcome.bonus >= baseResult.lastActiveBrewOutcome.bonus);
});

test('active brew survives sanitized storage but boot/offline handling cancels it without failure or reward', () => {
  const brewing = startActiveBrew(createActiveBrewOpportunity(withOrder()));
  const payload = serializeStateForSave(brewing);
  assert.equal(payload.schemaVersion, SAVE_SCHEMA_VERSION);
  const hydrated = hydrateState({ ...payload.state, activeBrewCooldown: -99, activeBrewsCompleted: -4 });
  assert.ok(hydrated.activeBrew);
  assert.equal(hydrated.activeBrewCooldown, 0);
  assert.equal(hydrated.activeBrewsCompleted, 0);
  const resumed = claimOfflineProgress(hydrated, 5000).state;
  assert.equal(resumed.activeBrew, null);
  assert.equal(resumed.totalServed, 0);
  assert.equal(resumed.activeBrewResolutionLedger.length, 0);
});

test('engaged brew freezes only its selected order while automatic service continues', () => {
  let state = startActiveBrew(createActiveBrewOpportunity(withOrder()));
  state.activeOrders.push({ id: 'order-2', itemId: 'basic-chai', remaining: 2, waited: 1, spendMultiplier: 1 });
  state.activeBrewCooldown = 99;
  state.eventCooldown = 99;
  state.priorityOfferCooldown = 99;
  state.thiefCooldown = 99;
  const next = simulateTicks(state, 1);
  assert.ok(next.activeOrders.some((order) => order.id === 'order-1' && order.remaining === 8));
  assert.equal(next.activeOrders.some((order) => order.id === 'order-2'), false);
  assert.equal(next.totalServed, 1);
});
