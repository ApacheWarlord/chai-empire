import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialDailyProgress, createInitialState, getLocalDayKey, hydrateState } from '../src/game/createInitialState.js';
import {
  buyTrackUpgrade,
  claimDailyObjective,
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
