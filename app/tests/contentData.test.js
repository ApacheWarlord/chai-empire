import assert from 'node:assert/strict';
import test from 'node:test';
import { customerTypes, gameEvents, milestoneGoals } from '../src/data/gameData.js';

const customerIds = new Set(customerTypes.map((customer) => customer.id));

test('event content stays simulation-safe', () => {
  assert.ok(gameEvents.length >= 8);
  assert.equal(new Set(gameEvents.map((event) => event.id)).size, gameEvents.length);

  for (const event of gameEvents) {
    assert.ok(event.duration > 0, `${event.id} needs a positive duration`);
    assert.ok(event.arrivalBoost >= 0, `${event.id} arrival boost cannot be negative`);
    assert.ok(event.payoutBoost >= 0, `${event.id} payout boost cannot be negative`);
    assert.ok(Number.isFinite(event.patienceDelta), `${event.id} needs a finite patience delta`);
    assert.ok(customerIds.has(event.featuredCustomerTypeId), `${event.id} references an unknown customer type`);
  }
});

test('Empire milestones are unique and form a longer progression ladder', () => {
  assert.ok(milestoneGoals.length >= 7);
  assert.equal(new Set(milestoneGoals.map((goal) => goal.id)).size, milestoneGoals.length);

  for (const goal of milestoneGoals) {
    assert.ok(goal.target > 0, `${goal.id} needs a positive target`);
    assert.ok(goal.reward > 0, `${goal.id} needs a positive reward`);
    assert.ok(['totalServed', 'lifetimeCoins', 'premiumServed'].includes(goal.metric), `${goal.id} uses an unsupported metric`);
  }

  const servedTargets = milestoneGoals
    .filter((goal) => goal.metric === 'totalServed')
    .map((goal) => goal.target);
  assert.deepEqual(servedTargets, [...servedTargets].sort((a, b) => a - b));
});
