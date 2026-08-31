import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialDailyProgress, createInitialState, hydrateState } from '../src/game/createInitialState.js';
import {
  buyTrackUpgrade,
  claimDailyObjective,
  claimOfflineProgress,
  getDailyObjectives,
  getDerivedStats,
  simulateTicks,
} from '../src/game/simulation.js';

const todayKey = () => new Date().toISOString().slice(0, 10);

const makeObjective = ({ id, metric, target = 1, reward = 50 }) => ({
  id,
  label: id,
  metric,
  target,
  reward,
});

test('save hydration preserves numeric CPM samples and drops invalid entries', () => {
  const state = createInitialState();
  const restored = hydrateState({
    ...state,
    cpmWindow: [0, 2, Number.NaN, -4, 3.5, '6', null],
  });

  assert.deepEqual(restored.cpmWindow, [0, 2, 3.5]);
});

test('offline earnings annualize partial CPM windows correctly', () => {
  const state = createInitialState();
  state.cpmWindow = Array(30).fill(2);

  const result = claimOfflineProgress(state, 10 * 60 * 1000);

  assert.equal(result.offlineCoins, 240);
  assert.equal(result.state.dailyObjectives.progress.businessRevenue, 240);
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
