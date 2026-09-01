import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialDailyProgress, createInitialState, getLocalDayKey, hydrateState } from '../src/game/createInitialState.js';
import {
  activateKettleBoost,
  buyTrackUpgrade,
  claimDailyObjective,
  claimMilestoneReward,
  claimOfflineProgress,
  getDailyObjectives,
  getDerivedStats,
  simulateTicks,
} from '../src/game/simulation.js';

const todayKey = () => getLocalDayKey();

const makeObjective = ({ id, metric, target = 1, reward = 50 }) => ({
  id,
  label: id,
  metric,
  target,
  reward,
});


test('local day keys follow the device calendar day', () => {
  const localDate = new Date(2026, 7, 31, 0, 5, 0);
  assert.equal(getLocalDayKey(localDate), '2026-08-31');
});

test('save hydration preserves numeric CPM samples and drops invalid entries', () => {
  const state = createInitialState();
  const restored = hydrateState({
    ...state,
    cpmWindow: [0, 2, Number.NaN, -4, 3.5, '6', null],
  });

  assert.deepEqual(restored.cpmWindow, [0, 2, 3.5]);
});

test('save hydration enforces current venue worker and menu caps', () => {
  const state = createInitialState();
  const restored = hydrateState({
    ...state,
    venueTier: 1,
    staffOwned: [1, 2, 3, 4],
    unlockedMenu: ['basic-chai', 'masala-chai', 'biscuit-pack', 'coffee', 'kulhad-chai'],
    queue: [
      { id: 'valid', itemId: 'basic-chai', patience: 10 },
      { id: 'future', itemId: 'coffee', patience: 10 },
    ],
    activeOrders: [{ id: 'future-order', itemId: 'kulhad-chai', remaining: 2 }],
  });

  assert.deepEqual(restored.staffOwned, [1, 2]);
  assert.deepEqual(restored.unlockedMenu, ['basic-chai', 'masala-chai', 'biscuit-pack']);
  assert.deepEqual(restored.queue.map((customer) => customer.id), ['valid']);
  assert.deepEqual(restored.activeOrders, []);
});

test('offline earnings annualize partial CPM windows without auto-completing daily revenue', () => {
  const state = createInitialState();
  state.cpmWindow = Array(30).fill(2);

  const result = claimOfflineProgress(state, 10 * 60 * 1000);

  assert.equal(result.offlineCoins, 240);
  assert.equal(result.state.dailyObjectives.progress.businessRevenue, 0);
});

test('a new day resets objective progress instead of using lifetime totals', () => {
  const state = createInitialState();
  state.totalServed = 999;
  state.lifetimeCoins = 99999;
  state.premiumServed = 500;
  state.dailyObjectives = {
    key: '2000-01-01',
    claimedIds: ['old-objective'],
    objectives: [makeObjective({ id: 'old-objective', metric: 'totalServed' })],
    progress: {
      totalServed: 999,
      businessRevenue: 99999,
      premiumServed: 500,
      upgradeCount: 99,
    },
  };

  const reset = simulateTicks(state, 0);
  const objectives = getDailyObjectives(reset);

  assert.equal(reset.dailyObjectives.key, todayKey());
  assert.deepEqual(reset.dailyObjectives.progress, createInitialDailyProgress());
  assert.deepEqual(reset.dailyObjectives.claimedIds, []);
  assert.equal(objectives.every((objective) => objective.current === 0), true);
});

test('daily objective rewards do not count as business revenue', () => {
  const state = createInitialState();
  state.dailyObjectives = {
    key: todayKey(),
    claimedIds: [],
    objectives: [makeObjective({ id: 'earn-test', metric: 'businessRevenue', target: 100, reward: 75 })],
    progress: {
      ...createInitialDailyProgress(),
      businessRevenue: 100,
    },
  };

  const claimed = claimDailyObjective(state, 'earn-test');
  const objective = getDailyObjectives(claimed)[0];

  assert.equal(objective.claimed, true);
  assert.equal(objective.current, 100);
  assert.equal(claimed.dailyObjectives.progress.businessRevenue, 100);
  assert.equal(claimed.coins, state.coins + 75);
});

test('purchased upgrades advance the daily upgrade counter exactly once', () => {
  const state = createInitialState();
  state.coins = 1000;
  state.dailyObjectives = {
    key: todayKey(),
    claimedIds: [],
    objectives: [makeObjective({ id: 'upgrade-test', metric: 'upgradeCount', target: 2 })],
    progress: createInitialDailyProgress(),
  };

  const upgraded = buyTrackUpgrade(state, 'speed');
  const objective = getDailyObjectives(upgraded)[0];

  assert.equal(upgraded.levels.speed, 1);
  assert.equal(objective.current, 1);
});

test('displayed CPM uses weighted demand and is arrival-limited at game start', () => {
  const stats = getDerivedStats(createInitialState());

  assert.ok(stats.coinsPerMinute > 67);
  assert.ok(stats.coinsPerMinute < 69);
  assert.equal(stats.arrivalPerMinute, 8);
});


test('spawned customers retain their original patience ceiling for UI meters', () => {
  const state = {
    ...createInitialState(),
    staffOwned: [],
    spawnProgress: 0.99,
    eventCooldown: 999,
  };

  const next = simulateTicks(state, 1);
  assert.equal(next.queue.length, 1);
  assert.ok(Number.isFinite(next.queue[0].maxPatience));
  assert.ok(next.queue[0].maxPatience > next.queue[0].patience);
});

test('an event that expires this tick no longer boosts the next arrival calculation', () => {
  const state = {
    ...createInitialState(),
    staffOwned: [],
    spawnProgress: 0.8,
    activeEvent: {
      id: 'expiring-test',
      name: 'Expiring Test',
      remaining: 1,
      duration: 1,
      arrivalBoost: 1,
      payoutBoost: 0,
      patienceDelta: 0,
      featuredCustomerTypeId: null,
    },
    eventCooldown: 999,
  };

  const next = simulateTicks(state, 1);
  assert.equal(next.activeEvent, null);
  assert.equal(next.queue.length, 0);
  assert.ok(next.spawnProgress < 1);
});


test('milestone rewards can be claimed exactly once without inflating lifetime revenue', () => {
  const state = createInitialState();
  state.totalServed = 25;
  const startingCoins = state.coins;
  const startingLifetime = state.lifetimeCoins;

  const claimed = claimMilestoneReward(state, 'serve-25');
  const duplicate = claimMilestoneReward(claimed, 'serve-25');

  assert.equal(claimed.coins, startingCoins + 120);
  assert.equal(claimed.lifetimeCoins, startingLifetime);
  assert.deepEqual(claimed.claimedMilestoneIds, ['serve-25']);
  assert.equal(duplicate.coins, claimed.coins);
});

test('save hydration removes duplicate and unknown milestone claims', () => {
  const state = createInitialState();
  const restored = hydrateState({
    ...state,
    claimedMilestoneIds: ['serve-25', 'serve-25', 'not-a-real-goal', 42],
  });

  assert.deepEqual(restored.claimedMilestoneIds, ['serve-25']);
});



test('Kettle Boost spends heat once and enforces its active/cooldown gates', () => {
  const state = createInitialState();
  const blocked = activateKettleBoost(state);
  assert.equal(blocked, state);

  state.heatMeter = 70;
  const boosted = activateKettleBoost(state);
  assert.equal(boosted.heatMeter, 30);
  assert.equal(boosted.kettleBoostRemaining, 12);
  assert.equal(boosted.kettleBoostCooldown, 28);
  assert.equal(boosted.kettleBoostUses, 1);

  const duplicate = activateKettleBoost(boosted);
  assert.equal(duplicate, boosted);
});

test('Kettle Boost raises displayed capacity, speeds live brews, and shields queue patience', () => {
  const base = createInitialState();
  base.heatMeter = 70;
  base.eventCooldown = 999;
  base.spawnProgress = 0;
  base.queue = [{
    id: 'waiting',
    itemId: 'basic-chai',
    wait: 2,
    patience: 10,
    maxPatience: 20,
    customerTypeId: 'student',
    customerEmoji: '🎒',
    customerName: 'Student',
    spendMultiplier: 1,
  }];
  base.activeOrders = [{
    id: 'brewing',
    itemId: 'basic-chai',
    remaining: 8,
    waited: 2,
    customerTypeId: 'office-worker',
    customerEmoji: '💼',
    customerName: 'Office Worker',
    spendMultiplier: 1,
  }];

  const normalStats = getDerivedStats(base);
  const boosted = activateKettleBoost(base);
  const boostedStats = getDerivedStats(boosted);
  assert.equal(boostedStats.kettleBoostActive, true);
  assert.ok(boostedStats.averageServiceTime < normalStats.averageServiceTime);

  const next = simulateTicks(boosted, 1);
  assert.ok(Math.abs(next.activeOrders[0].remaining - 6.55) < 0.001);
  assert.equal(next.queue[0].patience, 9.5);
  assert.equal(next.kettleBoostRemaining, 11);
  assert.equal(next.kettleBoostCooldown, 27);
});

test('save hydration clamps malformed Kettle Boost state', () => {
  const restored = hydrateState({
    ...createInitialState(),
    kettleBoostRemaining: 999,
    kettleBoostCooldown: -4,
    kettleBoostUses: 3.9,
  });

  assert.equal(restored.kettleBoostRemaining, 12);
  assert.equal(restored.kettleBoostCooldown, 0);
  assert.equal(restored.kettleBoostUses, 3);
});
