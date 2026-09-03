import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, hydrateState, serializeStateForSave } from '../src/game/createInitialState.js';
import {
  chooseServiceAction,
  getServiceChoices,
  prepareSessionReward,
  resolvePendingReward,
  simulateTicks,
} from '../src/game/simulation.js';

test('completed Tea Runs can be doubled once through the prototype reward flow', () => {
  const state = createInitialState();
  state.sessionRun.served = state.sessionRun.target;
  const offered = prepareSessionReward(state);
  const claimed = resolvePendingReward(offered, offered.pendingReward.id, 2);

  assert.equal(claimed.coins, state.coins + state.sessionRun.reward * 2);
  assert.deepEqual(claimed.rewardLedger, ['session-1']);
  assert.equal(claimed.sessionRun.run, 2);
  assert.equal(claimed.sessionRun.served, 0);
  assert.equal(claimed.pendingReward, null);
});

test('reward resolution rejects stale ids and duplicate attempts', () => {
  const state = createInitialState();
  state.sessionRun.served = state.sessionRun.target;
  const offered = prepareSessionReward(state);
  const stale = resolvePendingReward(offered, 'not-this-reward', 2);
  assert.equal(stale, offered);

  const claimed = resolvePendingReward(offered, 'session-1', 2);
  const forgedReplay = resolvePendingReward({ ...claimed, pendingReward: offered.pendingReward }, 'session-1', 2);
  assert.equal(forgedReplay.coins, claimed.coins);
  assert.equal(forgedReplay.rewardLedger.length, 1);
});

test('save hydration preserves valid reward state and clears already-paid pending rewards', () => {
  const state = createInitialState();
  state.sessionRun = { run: 4, served: 7, target: 8, reward: 135, rewardId: 'session-4' };
  state.rewardLedger = ['session-2', 'session-3'];
  state.pendingReward = { id: 'session-4', source: 'session-run', label: 'Tea Run 4', amount: 135 };
  const restored = hydrateState(serializeStateForSave(state).state);
  assert.deepEqual(restored.sessionRun, state.sessionRun);
  assert.deepEqual(restored.rewardLedger, state.rewardLedger);
  assert.deepEqual(restored.pendingReward, state.pendingReward);

  const replay = hydrateState({ ...state, rewardLedger: ['session-4'] });
  assert.equal(replay.pendingReward, null);
});

test('service choices enforce cooldown and apply distinct tactical effects', () => {
  const base = createInitialState();
  base.serviceChoice.cooldown = 0;
  base.heatMeter = 50;
  base.activeOrders = [{ id: 'brew', itemId: 'basic-chai', remaining: 8, waited: 0 }];
  const poured = chooseServiceAction(base, 'quick-pour');
  assert.equal(poured.heatMeter, 32);
  assert.equal(poured.activeOrders[0].remaining, 1.5);
  assert.equal(poured.serviceChoice.cooldown, 12);
  assert.equal(chooseServiceAction(poured, 'quick-pour'), poured);

  const waiting = createInitialState();
  waiting.serviceChoice.cooldown = 0;
  waiting.queue = [{ id: 'guest', itemId: 'basic-chai', patience: 5, maxPatience: 20 }];
  const welcomed = chooseServiceAction(waiting, 'warm-welcome');
  assert.equal(welcomed.queue[0].patience, 11);
  assert.equal(welcomed.satisfaction, 85);
});

test('Tea Run progress follows served customers and service choices become ready on schedule', () => {
  const state = createInitialState();
  state.eventCooldown = 999;
  state.priorityOfferCooldown = 999;
  state.serviceChoice.cooldown = 1;
  state.activeOrders = [{ id: 'done', itemId: 'basic-chai', remaining: 2, waited: 0, spendMultiplier: 1 }];
  const next = simulateTicks(state, 1);
  assert.equal(next.sessionRun.served, 1);
  assert.equal(getServiceChoices(next).every((choice) => choice.ready), true);
});
