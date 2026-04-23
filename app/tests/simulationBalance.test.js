import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from '../src/game/createInitialState.js';
import {
  buyTrackUpgrade,
  getRecommendation,
  simulateTicks,
  unlockMenuItem,
  unlockNextVenue,
  unlockStaff,
} from '../src/game/simulation.js';

const getBusinessLevel = (state) =>
  Object.values(state.levels).reduce((sum, value) => sum + value, 0) + state.unlockedMenu.length + (state.staffOwned.length - 1) * 3;

const canUnlockVenue = (state) => {
  const nextTier = state.venueTier + 1;
  if (nextTier === 2) {
    return state.coins >= 400 && getBusinessLevel(state) >= 8 && state.levels.reputation >= 2;
  }
  if (nextTier === 3) {
    return state.coins >= 1900 && getBusinessLevel(state) >= 15 && state.levels.reputation >= 3;
  }
  return false;
};

test('mid-game recommendation points players to reputation gate when venue is blocked', () => {
  let state = createInitialState();
  state = {
    ...state,
    venueTier: 2,
    coins: 1400,
    lifetimeCoins: 2200,
    unlockedMenu: ['basic-chai', 'masala-chai', 'biscuit-pack', 'ginger-chai', 'bun-maska'],
    staffOwned: [1, 2],
    levels: {
      speed: 3,
      service: 2,
      quality: 1,
      reputation: 2,
    },
  };

  const recommendation = getRecommendation(state);

  assert.equal(recommendation.type, 'quality');
  assert.match(recommendation.label, /Signboard/);
  assert.match(recommendation.label, /Small Tea Shop/);
});

test('recommended pacing path can reach Small Tea Shop within a focused session', () => {
  const plan = ['speed', 'masala', 'reputation', 'speed', 'helper', 'biscuit', 'quality', 'reputation', 'venue', 'ginger', 'bun', 'speed', 'service', 'quality', 'reputation', 'venue'];

  const actions = {
    speed: (state) => buyTrackUpgrade(state, 'speed'),
    service: (state) => buyTrackUpgrade(state, 'service'),
    quality: (state) => buyTrackUpgrade(state, 'quality'),
    reputation: (state) => buyTrackUpgrade(state, 'reputation'),
    masala: (state) => unlockMenuItem(state, 'masala-chai'),
    biscuit: (state) => unlockMenuItem(state, 'biscuit-pack'),
    ginger: (state) => unlockMenuItem(state, 'ginger-chai'),
    bun: (state) => unlockMenuItem(state, 'bun-maska'),
    helper: (state) => unlockStaff(state, 'helper'),
    venue: (state) => (canUnlockVenue(state) ? unlockNextVenue(state) : state),
  };

  let state = createInitialState();
  let actionIndex = 0;

  for (let second = 0; second < 30 * 60 && state.venueTier < 3; second += 1) {
    state = simulateTicks(state, 1);
    if (actionIndex < plan.length) {
      const nextState = actions[plan[actionIndex]](state);
      if (nextState !== state) {
        state = nextState;
        actionIndex += 1;
      }
    }
  }

  assert.equal(state.venueTier, 3);
  assert.ok(state.lifetimeCoins >= 1900);
  assert.ok(state.levels.reputation >= 3);
  assert.ok(getBusinessLevel(state) >= 15);
});
