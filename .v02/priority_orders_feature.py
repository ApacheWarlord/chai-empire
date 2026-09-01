from pathlib import Path

ROOT = Path('.')

def patch(path, old, new, count=1):
    file_path = ROOT / path
    text = file_path.read_text()
    if old not in text:
        raise SystemExit(f"Missing patch context in {path}: {old[:140]!r}")
    file_path.write_text(text.replace(old, new, count))

patch('app/src/game/createInitialState.js', 'export const SAVE_SCHEMA_VERSION = 5;', 'export const SAVE_SCHEMA_VERSION = 6;')
patch('app/src/game/createInitialState.js', "  kettleBoostUses: 0,\n  venueUnlockedToast: null,", "  kettleBoostUses: 0,\n  priorityOffer: null,\n  priorityOfferCooldown: 22,\n  priorityOrdersAccepted: 0,\n  priorityOrdersCompleted: 0,\n  priorityOrdersMissed: 0,\n  venueUnlockedToast: null,")
patch('app/src/game/createInitialState.js', "const sanitizeCustomerList = (value) => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []);\n", """const sanitizeCustomerList = (value) => (Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object') : []);

const sanitizePriorityOffer = (value) => {
  if (!value || typeof value !== 'object') return null;
  const itemId = typeof value.itemId === 'string' && validMenuIds.has(value.itemId) ? value.itemId : null;
  const remaining = Math.min(8, Math.max(0, toFiniteNumber(value.remaining, 0)));
  if (!itemId || remaining <= 0) return null;
  return {
    id: typeof value.id === 'string' ? value.id : 'priority-offer',
    itemId,
    remaining,
    customerTypeId: typeof value.customerTypeId === 'string' ? value.customerTypeId : 'regular',
    customerEmoji: typeof value.customerEmoji === 'string' ? value.customerEmoji : '⚡',
    customerName: typeof value.customerName === 'string' ? value.customerName : 'Priority Guest',
    spendMultiplier: Math.min(4, Math.max(1, toFiniteNumber(value.spendMultiplier, 2.2))),
  };
};
""")
patch('app/src/game/createInitialState.js', "    kettleBoostUses: Math.max(0, Math.floor(toFiniteNumber(saved.kettleBoostUses, base.kettleBoostUses))),\n    claimedMilestoneIds:", """    kettleBoostUses: Math.max(0, Math.floor(toFiniteNumber(saved.kettleBoostUses, base.kettleBoostUses))),
    priorityOffer: sanitizePriorityOffer(saved.priorityOffer),
    priorityOfferCooldown: Math.min(90, Math.max(0, toFiniteNumber(saved.priorityOfferCooldown, base.priorityOfferCooldown))),
    priorityOrdersAccepted: Math.max(0, Math.floor(toFiniteNumber(saved.priorityOrdersAccepted, base.priorityOrdersAccepted))),
    priorityOrdersCompleted: Math.max(0, Math.floor(toFiniteNumber(saved.priorityOrdersCompleted, base.priorityOrdersCompleted))),
    priorityOrdersMissed: Math.max(0, Math.floor(toFiniteNumber(saved.priorityOrdersMissed, base.priorityOrdersMissed))),
    claimedMilestoneIds:""")
patch('app/src/game/createInitialState.js', "  sanitized.activeOrders = sanitized.activeOrders.filter((order) => allowedMenuIds.has(order.itemId));\n\n  return sanitized;", """  sanitized.activeOrders = sanitized.activeOrders.filter((order) => allowedMenuIds.has(order.itemId));
  if (sanitized.priorityOffer && !allowedMenuIds.has(sanitized.priorityOffer.itemId)) {
    sanitized.priorityOffer = null;
  }

  return sanitized;""")

patch('app/src/game/simulation.js', "const KETTLE_BOOST_PATIENCE_LOSS = 0.5;\n", """const KETTLE_BOOST_PATIENCE_LOSS = 0.5;
const PRIORITY_OFFER_DURATION_SECONDS = 8;
const PRIORITY_OFFER_COOLDOWN_SECONDS = 42;
const PRIORITY_ORDER_PAYOUT_MULTIPLIER = 2.2;
const PRIORITY_ORDER_HEAT_BONUS = 12;
""")
patch('app/src/game/simulation.js', """  {
    id: 'venue-goal',
    title: 'Aim for the next stall',""", """  {
    id: 'priority-orders',
    title: 'Express tickets can jump the queue',
    body: 'Priority Orders pay much more, but they take a real worker slot. Accept them when your queue can survive the detour.',
    condition: (state) => Boolean(state.priorityOffer) && (state.priorityOrdersAccepted || 0) === 0,
  },
  {
    id: 'venue-goal',
    title: 'Aim for the next stall',""")
patch('app/src/game/simulation.js', """const pickItemForCustomerType = (entries, customerType) => {
  const weightedEntries = entries.map((item) => ({
    ...item,
    demandWeight: Math.round(item.demandWeight * (customerType.preferences?.[item.id] || 1)),
  }));
  return randomWeightedItem(weightedEntries);
};

const maybeStartEvent = (state) => {""", """const pickItemForCustomerType = (entries, customerType) => {
  const weightedEntries = entries.map((item) => ({
    ...item,
    demandWeight: Math.round(item.demandWeight * (customerType.preferences?.[item.id] || 1)),
  }));
  return randomWeightedItem(weightedEntries);
};

const createPriorityOffer = (state) => {
  const entries = getUnlockedMenuEntries(state);
  if (!entries.length) return state;
  const customerType = randomWeightedCustomerTypeForState(state);
  const item = pickItemForCustomerType(entries, customerType);
  return {
    ...state,
    priorityOffer: {
      id: `priority-${Date.now()}-${Math.random()}`,
      itemId: item.id,
      remaining: PRIORITY_OFFER_DURATION_SECONDS,
      customerTypeId: customerType.id,
      customerEmoji: customerType.emoji,
      customerName: customerType.name,
      spendMultiplier:
        customerType.spendMultiplier *
        (1 + (state.activeEvent?.payoutBoost || 0)) *
        PRIORITY_ORDER_PAYOUT_MULTIPLIER,
    },
    priorityOfferCooldown: 0,
  };
};

const tickPriorityOffer = (state) => {
  if (state.priorityOffer) {
    const remaining = state.priorityOffer.remaining - TICK_SECONDS;
    if (remaining <= 0) {
      return {
        ...state,
        priorityOffer: null,
        priorityOfferCooldown: PRIORITY_OFFER_COOLDOWN_SECONDS,
        priorityOrdersMissed: (state.priorityOrdersMissed || 0) + 1,
      };
    }
    return { ...state, priorityOffer: { ...state.priorityOffer, remaining } };
  }

  const cooldown = Math.max(0, (state.priorityOfferCooldown || 0) - TICK_SECONDS);
  if (cooldown > 0 || state.activeEvent) {
    return { ...state, priorityOfferCooldown: cooldown };
  }
  return createPriorityOffer({ ...state, priorityOfferCooldown: 0 });
};

const maybeStartEvent = (state) => {""")
patch('app/src/game/simulation.js', "    state = tickEvent(maybeStartEvent(state));", "    state = tickPriorityOffer(tickEvent(maybeStartEvent(state)));")
patch('app/src/game/simulation.js', """        customerName: customer.customerName || 'Regular',
        spendMultiplier: customer.spendMultiplier || 1,
      });""", """        customerName: customer.customerName || 'Regular',
        spendMultiplier: customer.spendMultiplier || 1,
        priorityOrder: Boolean(customer.priorityOrder),
      });""")
patch('app/src/game/simulation.js', "    let premiumServed = 0;\n    let serviceStreak = state.serviceStreak || 0;", "    let premiumServed = 0;\n    let priorityServed = 0;\n    let serviceStreak = state.serviceStreak || 0;")
patch('app/src/game/simulation.js', """        heatMeter = clamp(
          heatMeter + (servedFast ? HEAT_GAIN_FAST_SERVICE : order.waited <= 8 ? HEAT_GAIN_NORMAL_SERVICE : -HEAT_LOSS_SLOW_SERVICE),
          0,
          100
        );
        coinsGained += payout;
        servedCount += 1;
        if (item.price >= 20) premiumServed += 1;""", """        const baseHeatDelta = servedFast
          ? HEAT_GAIN_FAST_SERVICE
          : order.waited <= 8
            ? HEAT_GAIN_NORMAL_SERVICE
            : -HEAT_LOSS_SLOW_SERVICE;
        heatMeter = clamp(
          heatMeter + baseHeatDelta + (order.priorityOrder ? PRIORITY_ORDER_HEAT_BONUS : 0),
          0,
          100
        );
        coinsGained += payout;
        servedCount += 1;
        if (order.priorityOrder) priorityServed += 1;
        if (item.price >= 20) premiumServed += 1;""")
patch('app/src/game/simulation.js', """      kettleBoostRemaining: Math.max(0, (state.kettleBoostRemaining || 0) - TICK_SECONDS),
      kettleBoostCooldown: Math.max(0, (state.kettleBoostCooldown || 0) - TICK_SECONDS),
    };""", """      kettleBoostRemaining: Math.max(0, (state.kettleBoostRemaining || 0) - TICK_SECONDS),
      kettleBoostCooldown: Math.max(0, (state.kettleBoostCooldown || 0) - TICK_SECONDS),
      priorityOrdersCompleted: (state.priorityOrdersCompleted || 0) + priorityServed,
    };""")
patch('app/src/game/simulation.js', "export const activateKettleBoost = (state) => {", """export const acceptPriorityOrder = (state) => {
  const offer = state.priorityOffer;
  if (!offer || offer.remaining <= 0 || !state.unlockedMenu.includes(offer.itemId)) return state;

  const customerType = getCustomerTypeById(offer.customerTypeId);
  const maxPatience = Math.max(16, customerType.patience);
  const priorityCustomer = {
    id: `accepted-${offer.id}`,
    itemId: offer.itemId,
    wait: 0,
    patience: maxPatience,
    maxPatience,
    customerTypeId: offer.customerTypeId,
    customerEmoji: offer.customerEmoji,
    customerName: offer.customerName,
    spendMultiplier: offer.spendMultiplier,
    priorityOrder: true,
  };

  return {
    ...state,
    priorityOffer: null,
    priorityOfferCooldown: PRIORITY_OFFER_COOLDOWN_SECONDS,
    priorityOrdersAccepted: (state.priorityOrdersAccepted || 0) + 1,
    queue: [priorityCustomer, ...state.queue],
  };
};

export const activateKettleBoost = (state) => {""")
patch('app/src/game/simulation.js', """export const claimOfflineProgress = (state, elapsedMs) => {
  state = ensureDailyObjectives(state);
  const elapsedMinutes = Math.min(OFFLINE_CAP_MINUTES, Math.floor(elapsedMs / 60000));
  if (elapsedMinutes <= 0) return { state, offlineCoins: 0 };

  const recentSamples = state.cpmWindow.filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const averageCpm = recentSamples.length
    ? (recentSamples.reduce((sum, value) => sum + value, 0) * 60) / recentSamples.length
    : getDerivedStats(state).coinsPerMinute;
  const offlineCoins = Math.round(averageCpm * elapsedMinutes * OFFLINE_EFFICIENCY);

  return {
    offlineCoins,
    state: {
      ...state,
      coins: state.coins + offlineCoins,
      lifetimeCoins: state.lifetimeCoins + offlineCoins,
      kettleBoostRemaining: 0,
      kettleBoostCooldown: Math.max(0, (state.kettleBoostCooldown || 0) - elapsedMinutes * 60),
    },
  };
};""", """export const claimOfflineProgress = (state, elapsedMs) => {
  state = ensureDailyObjectives(state);
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const elapsedMinutes = Math.min(OFFLINE_CAP_MINUTES, Math.floor(elapsedMs / 60000));
  const timedState = {
    ...state,
    kettleBoostRemaining: 0,
    kettleBoostCooldown: Math.max(0, (state.kettleBoostCooldown || 0) - elapsedSeconds),
    priorityOffer: null,
    priorityOfferCooldown: state.priorityOffer
      ? PRIORITY_OFFER_COOLDOWN_SECONDS
      : Math.max(0, (state.priorityOfferCooldown || 0) - elapsedSeconds),
  };

  if (elapsedMinutes <= 0) return { state: timedState, offlineCoins: 0 };

  const recentSamples = timedState.cpmWindow.filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  const averageCpm = recentSamples.length
    ? (recentSamples.reduce((sum, value) => sum + value, 0) * 60) / recentSamples.length
    : getDerivedStats(timedState).coinsPerMinute;
  const offlineCoins = Math.round(averageCpm * elapsedMinutes * OFFLINE_EFFICIENCY);

  return {
    offlineCoins,
    state: {
      ...timedState,
      coins: timedState.coins + offlineCoins,
      lifetimeCoins: timedState.lifetimeCoins + offlineCoins,
    },
  };
};""")

patch('app/src/hooks/useGameState.js', "  activateKettleBoost,\n  buyTrackUpgrade,", "  acceptPriorityOrder,\n  activateKettleBoost,\n  buyTrackUpgrade,")
patch('app/src/hooks/useGameState.js', "  const useKettleBoost = useCallback(() => setState((current) => activateKettleBoost(current)), []);", """  const acceptPriority = useCallback(() => setState((current) => acceptPriorityOrder(current)), []);
  const useKettleBoost = useCallback(() => setState((current) => activateKettleBoost(current)), []);""")
patch('app/src/hooks/useGameState.js', "    dismissRecoveryNotice,\n    useKettleBoost,", "    dismissRecoveryNotice,\n    acceptPriority,\n    useKettleBoost,")

patch('app/App.js', "import { GameFeedback } from './src/components/GameFeedback';\n", "import { GameFeedback } from './src/components/GameFeedback';\nimport { PriorityOrderPrompt } from './src/components/PriorityOrderPrompt';\n")
patch('app/App.js', "    dismissRecoveryNotice,\n    useKettleBoost,", "    dismissRecoveryNotice,\n    acceptPriority,\n    useKettleBoost,")
patch('app/App.js', """            {state.activeEvent ? (
              <View style={styles.eventRibbon}>
                <Text style={styles.eventText}>⚡ {state.activeEvent.name.toUpperCase()} · {state.activeEvent.remaining}s</Text>
              </View>
            ) : null}

            <View style={styles.stallRoof}>""", """            {state.activeEvent ? (
              <View style={styles.eventRibbon}>
                <Text style={styles.eventText}>⚡ {state.activeEvent.name.toUpperCase()} · {state.activeEvent.remaining}s</Text>
              </View>
            ) : null}

            <PriorityOrderPrompt
              offer={state.priorityOffer}
              menuItems={menuItems}
              queuePressure={queuePressure}
              topOffset={state.activeEvent ? 34 : 6}
              onAccept={acceptPriority}
            />

            <View style={styles.stallRoof}>""")

Path('app/src/components/PriorityOrderPrompt.js').write_text("""import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PriorityOrderPrompt({ offer, menuItems, queuePressure, topOffset = 6, onAccept }) {
  if (!offer) return null;
  const item = menuItems.find((entry) => entry.id === offer.itemId);
  const risky = queuePressure >= 0.7;

  return (
    <View style={[styles.card, { top: topOffset }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>⚡ PRIORITY ORDER · {Math.ceil(offer.remaining)}s</Text>
        <Text style={styles.title}>{offer.customerEmoji || '⚡'} {item?.name || 'Express Chai'}</Text>
        <Text style={styles.copy}>{risky ? 'QUEUE HOT · accepting this ticket may delay regulars' : 'JUMPS THE LINE · premium payout + bonus Heat'}</Text>
      </View>
      <TouchableOpacity style={[styles.button, risky && styles.buttonRisky]} onPress={onAccept} accessibilityRole="button" accessibilityLabel={`Accept priority order for ${item?.name || 'chai'}`}>
        <Text style={styles.buttonText}>ACCEPT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 8, right: 8, zIndex: 18, minHeight: 64, padding: 7, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#40200F', borderWidth: 3, borderColor: '#F6B93B' },
  eyebrow: { color: '#F6B93B', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  title: { color: '#FFF0BF', fontSize: 11, fontWeight: '900', marginTop: 2 },
  copy: { color: '#DDBD83', fontSize: 7, fontWeight: '800', marginTop: 2 },
  button: { backgroundColor: '#5F9D22', borderWidth: 3, borderColor: '#315912', paddingVertical: 8, paddingHorizontal: 10 },
  buttonRisky: { backgroundColor: '#D95F17', borderColor: '#7E2E0C' },
  buttonText: { color: '#FFF4CB', fontSize: 8, fontWeight: '900' },
});
""")

patch('app/tests/stabilization.test.js', "  activateKettleBoost,\n  buyTrackUpgrade,", "  acceptPriorityOrder,\n  activateKettleBoost,\n  buyTrackUpgrade,")
with open('app/tests/stabilization.test.js', 'a') as f:
    f.write("""

test('Priority Offers appear on schedule and expire into the missed counter', () => {
  const state = { ...createInitialState(), eventCooldown: 999, priorityOfferCooldown: 0 };
  const offered = simulateTicks(state, 1);
  assert.ok(offered.priorityOffer);
  assert.equal(offered.priorityOffer.remaining, 8);
  const expiring = { ...offered, priorityOffer: { ...offered.priorityOffer, remaining: 1 } };
  const missed = simulateTicks(expiring, 1);
  assert.equal(missed.priorityOffer, null);
  assert.equal(missed.priorityOrdersMissed, 1);
  assert.equal(missed.priorityOfferCooldown, 42);
});

test('accepting a Priority Order inserts a real premium customer at the front of the queue', () => {
  const state = createInitialState();
  state.queue = [{ id: 'regular', itemId: 'basic-chai', patience: 10 }];
  state.priorityOffer = { id: 'offer-1', itemId: 'basic-chai', remaining: 6, customerTypeId: 'student', customerEmoji: '🎒', customerName: 'Student', spendMultiplier: 2.2 };
  const accepted = acceptPriorityOrder(state);
  assert.equal(accepted.priorityOffer, null);
  assert.equal(accepted.priorityOrdersAccepted, 1);
  assert.equal(accepted.priorityOfferCooldown, 42);
  assert.equal(accepted.queue[0].priorityOrder, true);
  assert.equal(accepted.queue[0].spendMultiplier, 2.2);
  assert.equal(accepted.queue[1].id, 'regular');
});

test('completed Priority Orders pay the premium and grant bonus Heat', () => {
  const state = { ...createInitialState(), eventCooldown: 999, priorityOfferCooldown: 999, activeOrders: [{ id: 'priority-brew', itemId: 'basic-chai', remaining: 2, waited: 0, customerTypeId: 'student', customerEmoji: '🎒', customerName: 'Student', spendMultiplier: 2.2, priorityOrder: true }] };
  const next = simulateTicks(state, 1);
  assert.equal(next.priorityOrdersCompleted, 1);
  assert.equal(next.totalServed, 1);
  assert.equal(next.coins - state.coins, 18);
  assert.ok(next.heatMeter > 25);
});

test('sub-minute offline time clears live tactical states and advances cooldowns', () => {
  const state = createInitialState();
  state.kettleBoostRemaining = 9;
  state.kettleBoostCooldown = 20;
  state.priorityOffer = { id: 'offline-offer', itemId: 'basic-chai', remaining: 5, customerTypeId: 'student', customerEmoji: '🎒', customerName: 'Student', spendMultiplier: 2.2 };
  state.priorityOfferCooldown = 0;
  const result = claimOfflineProgress(state, 10 * 1000);
  assert.equal(result.offlineCoins, 0);
  assert.equal(result.state.kettleBoostRemaining, 0);
  assert.equal(result.state.kettleBoostCooldown, 10);
  assert.equal(result.state.priorityOffer, null);
  assert.equal(result.state.priorityOfferCooldown, 42);
});

test('save hydration clamps Priority Order state', () => {
  const restored = hydrateState({ ...createInitialState(), priorityOffer: { id: 'saved-offer', itemId: 'basic-chai', remaining: 999, customerTypeId: 'student', customerEmoji: '🎒', customerName: 'Student', spendMultiplier: 99 }, priorityOfferCooldown: -5, priorityOrdersAccepted: 3.9, priorityOrdersCompleted: -2, priorityOrdersMissed: 4.7 });
  assert.equal(restored.priorityOffer.remaining, 8);
  assert.equal(restored.priorityOffer.spendMultiplier, 4);
  assert.equal(restored.priorityOfferCooldown, 0);
  assert.equal(restored.priorityOrdersAccepted, 3);
  assert.equal(restored.priorityOrdersCompleted, 0);
  assert.equal(restored.priorityOrdersMissed, 4);
});
""")

patch('app/tests/bootGameState.test.js', "reason: 'Error: Save schema 999 is newer than supported schema 5',", "reason: 'Error: Save schema 999 is newer than supported schema 6',")
