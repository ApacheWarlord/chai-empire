from pathlib import Path

ROOT = Path('.')


def patch(path, old, new, count=1):
    file_path = ROOT / path
    text = file_path.read_text()
    if old not in text:
        raise SystemExit(f'Missing patch context in {path}: {old[:120]!r}')
    file_path.write_text(text.replace(old, new, count))


# --- Save schema v5: persist the interactive rush mechanic safely. ---
patch('app/src/game/createInitialState.js', 'export const SAVE_SCHEMA_VERSION = 4;', 'export const SAVE_SCHEMA_VERSION = 5;')
patch(
    'app/src/game/createInitialState.js',
    "  heatMeter: 0,\n  venueUnlockedToast: null,",
    "  heatMeter: 0,\n  kettleBoostRemaining: 0,\n  kettleBoostCooldown: 0,\n  kettleBoostUses: 0,\n  venueUnlockedToast: null,",
)
patch(
    'app/src/game/createInitialState.js',
    "    heatMeter: Math.min(100, Math.max(0, toFiniteNumber(saved.heatMeter, base.heatMeter))),\n    claimedMilestoneIds:",
    "    heatMeter: Math.min(100, Math.max(0, toFiniteNumber(saved.heatMeter, base.heatMeter))),\n    kettleBoostRemaining: Math.min(12, Math.max(0, toFiniteNumber(saved.kettleBoostRemaining, base.kettleBoostRemaining))),\n    kettleBoostCooldown: Math.min(28, Math.max(0, toFiniteNumber(saved.kettleBoostCooldown, base.kettleBoostCooldown))),\n    kettleBoostUses: Math.max(0, Math.floor(toFiniteNumber(saved.kettleBoostUses, base.kettleBoostUses))),\n    claimedMilestoneIds:",
)

# --- Core Kettle Boost simulation. ---
patch(
    'app/src/game/simulation.js',
    "const HEAT_LOSS_SLOW_SERVICE = 16;\n",
    "const HEAT_LOSS_SLOW_SERVICE = 16;\nconst KETTLE_BOOST_HEAT_COST = 40;\nconst KETTLE_BOOST_DURATION_SECONDS = 12;\nconst KETTLE_BOOST_COOLDOWN_SECONDS = 28;\nconst KETTLE_BOOST_SPEED_MULTIPLIER = 1.45;\nconst KETTLE_BOOST_PATIENCE_LOSS = 0.5;\n",
)
patch(
    'app/src/game/simulation.js',
    "  {\n    id: 'venue-goal',",
    "  {\n    id: 'kettle-boost',\n    title: 'Spend heat when the queue bites',\n    body: 'At 40 Heat, open Rush Control and fire Kettle Boost for a short service surge. Save it for real pressure.',\n    condition: (state) => (state.heatMeter || 0) >= KETTLE_BOOST_HEAT_COST && (state.kettleBoostUses || 0) === 0,\n  },\n  {\n    id: 'venue-goal',",
)
patch(
    'app/src/game/simulation.js',
    "  const prepMultiplier = 1 + state.levels.speed * 0.15;\n  const serviceMultiplier = 1 + state.levels.service * 0.1;",
    "  const kettleBoostActive = (state.kettleBoostRemaining || 0) > 0;\n  const kettleBoostMultiplier = kettleBoostActive ? KETTLE_BOOST_SPEED_MULTIPLIER : 1;\n  const prepMultiplier = 1 + state.levels.speed * 0.15;\n  const serviceMultiplier = (1 + state.levels.service * 0.1) * kettleBoostMultiplier;",
)
patch(
    'app/src/game/simulation.js',
    "    customerMix: customerTypes,\n    rushBonus,\n  };",
    "    customerMix: customerTypes,\n    rushBonus,\n    kettleBoostActive,\n    kettleBoostMultiplier,\n    kettleBoostHeatCost: KETTLE_BOOST_HEAT_COST,\n    kettleBoostDuration: KETTLE_BOOST_DURATION_SECONDS,\n    kettleBoostCooldown: KETTLE_BOOST_COOLDOWN_SECONDS,\n  };",
)
patch(
    'app/src/game/simulation.js',
    "    const agedQueue = queue\n      .map((customer) => ({ ...customer, wait: customer.wait + 1, patience: customer.patience - 1 }))",
    "    const patienceLoss = stats.kettleBoostActive ? KETTLE_BOOST_PATIENCE_LOSS : 1;\n    const agedQueue = queue\n      .map((customer) => ({ ...customer, wait: customer.wait + 1, patience: customer.patience - patienceLoss }))",
)
patch(
    'app/src/game/simulation.js',
    "    const activeOrders = state.activeOrders\n      .map((order) => ({ ...order, remaining: order.remaining - 1 }))",
    "    const activeOrders = state.activeOrders\n      .map((order) => ({ ...order, remaining: order.remaining - stats.kettleBoostMultiplier }))",
)
patch(
    'app/src/game/simulation.js',
    "      bestServiceStreak,\n      heatMeter,\n    };",
    "      bestServiceStreak,\n      heatMeter,\n      kettleBoostRemaining: Math.max(0, (state.kettleBoostRemaining || 0) - TICK_SECONDS),\n      kettleBoostCooldown: Math.max(0, (state.kettleBoostCooldown || 0) - TICK_SECONDS),\n    };",
)
patch(
    'app/src/game/simulation.js',
    "export const getBottleneck = (state) => {",
    "export const activateKettleBoost = (state) => {\n  const heat = state.heatMeter || 0;\n  if (\n    heat < KETTLE_BOOST_HEAT_COST ||\n    (state.kettleBoostRemaining || 0) > 0 ||\n    (state.kettleBoostCooldown || 0) > 0\n  ) {\n    return state;\n  }\n\n  return {\n    ...state,\n    heatMeter: Math.max(0, heat - KETTLE_BOOST_HEAT_COST),\n    kettleBoostRemaining: KETTLE_BOOST_DURATION_SECONDS,\n    kettleBoostCooldown: KETTLE_BOOST_COOLDOWN_SECONDS,\n    kettleBoostUses: (state.kettleBoostUses || 0) + 1,\n  };\n};\n\nexport const getBottleneck = (state) => {",
)
patch(
    'app/src/game/simulation.js',
    "      coins: state.coins + offlineCoins,\n      lifetimeCoins: state.lifetimeCoins + offlineCoins,\n    },",
    "      coins: state.coins + offlineCoins,\n      lifetimeCoins: state.lifetimeCoins + offlineCoins,\n      kettleBoostRemaining: 0,\n      kettleBoostCooldown: Math.max(0, (state.kettleBoostCooldown || 0) - elapsedMinutes * 60),\n    },",
)

# --- Hook API. ---
patch(
    'app/src/hooks/useGameState.js',
    "  buyTrackUpgrade,\n  claimDailyObjective,",
    "  activateKettleBoost,\n  buyTrackUpgrade,\n  claimDailyObjective,",
)
patch(
    'app/src/hooks/useGameState.js',
    "  const buyUpgrade = useCallback((id) => setState((current) => buyTrackUpgrade(current, id)), []);",
    "  const useKettleBoost = useCallback(() => setState((current) => activateKettleBoost(current)), []);\n  const buyUpgrade = useCallback((id) => setState((current) => buyTrackUpgrade(current, id)), []);",
)
patch(
    'app/src/hooks/useGameState.js',
    "    dismissRecoveryNotice,\n    buyUpgrade,",
    "    dismissRecoveryNotice,\n    useKettleBoost,\n    buyUpgrade,",
)

# --- App wiring and always-visible mode feedback. ---
patch(
    'app/App.js',
    "    dismissRecoveryNotice,\n    buyUpgrade,",
    "    dismissRecoveryNotice,\n    useKettleBoost,\n    buyUpgrade,",
)
patch(
    'app/App.js',
    "          onClaimMilestone={claimMilestone}\n          onReset={confirmReset}",
    "          onClaimMilestone={claimMilestone}\n          onUseKettleBoost={useKettleBoost}\n          onReset={confirmReset}",
)
patch(
    'app/App.js',
    '<Text style={styles.centerBadgeText}>AUTO SERVING</Text>',
    "<Text style={styles.centerBadgeText}>{state.kettleBoostRemaining > 0 ? `BOOST ${Math.ceil(state.kettleBoostRemaining)}s` : 'AUTO SERVING'}</Text>",
)

# --- Rush Control becomes interactive. ---
patch(
    'app/src/components/GameDrawer.js',
    "  onClaimMilestone,\n  onReset,",
    "  onClaimMilestone,\n  onUseKettleBoost,\n  onReset,",
)
patch(
    'app/src/components/GameDrawer.js',
    "        {panel === 'rush' ? <RushPanel state={state} stats={stats} /> : null}",
    "        {panel === 'rush' ? <RushPanel state={state} stats={stats} onUseKettleBoost={onUseKettleBoost} /> : null}",
)
patch(
    'app/src/components/GameDrawer.js',
    "function RushPanel({ state, stats }) {",
    "function RushPanel({ state, stats, onUseKettleBoost }) {",
)
patch(
    'app/src/components/GameDrawer.js',
    "  const pressureHot = queuePressure >= 0.7 || serviceLimited;\n",
    "  const pressureHot = queuePressure >= 0.7 || serviceLimited;\n  const boostActive = (state.kettleBoostRemaining || 0) > 0;\n  const boostCooldown = Math.ceil(state.kettleBoostCooldown || 0);\n  const boostHeatGap = Math.max(0, stats.kettleBoostHeatCost - heat);\n  const boostReady = !boostActive && boostCooldown <= 0 && boostHeatGap <= 0;\n",
)
patch(
    'app/src/components/GameDrawer.js',
    "      <SummaryBanner label={stats.rushBonus.label.toUpperCase()} value={`${heat}% HEAT`} hot={heat >= 55} />\n\n      <View style={styles.card}>",
    "      <SummaryBanner label={stats.rushBonus.label.toUpperCase()} value={`${heat}% HEAT`} hot={heat >= 55} />\n\n      <View style={[styles.boostCard, boostActive && styles.boostCardActive]}>\n        <View style={styles.boostTopRow}>\n          <View style={{ flex: 1 }}>\n            <Text style={styles.boostTitle}>⚡ KETTLE BOOST</Text>\n            <Text style={styles.boostCopy}>Spend {stats.kettleBoostHeatCost} Heat for {stats.kettleBoostDuration}s of +45% service speed and slower patience drain.</Text>\n          </View>\n          <Text style={styles.boostState}>\n            {boostActive ? `${Math.ceil(state.kettleBoostRemaining)}s` : boostCooldown > 0 ? `${boostCooldown}s CD` : boostHeatGap > 0 ? `${boostHeatGap} HEAT` : 'READY'}\n          </Text>\n        </View>\n        <TouchableOpacity\n          style={[styles.boostButton, !boostReady && styles.boostButtonDisabled]}\n          disabled={!boostReady}\n          onPress={onUseKettleBoost}\n          accessibilityRole=\"button\"\n          accessibilityLabel={boostReady ? 'Activate Kettle Boost' : boostActive ? 'Kettle Boost active' : boostCooldown > 0 ? `Kettle Boost cooldown ${boostCooldown} seconds` : `Need ${boostHeatGap} more Heat for Kettle Boost`}\n          accessibilityState={{ disabled: !boostReady }}\n        >\n          <Text style={styles.boostButtonText}>{boostActive ? 'BOOST RUNNING' : boostCooldown > 0 ? 'COOLING KETTLE' : boostHeatGap > 0 ? 'BUILD MORE HEAT' : 'FIRE KETTLE BOOST'}</Text>\n        </TouchableOpacity>\n      </View>\n\n      <View style={styles.card}>",
)
patch(
    'app/src/components/GameDrawer.js',
    "  card: { backgroundColor: '#F2D99D', borderWidth: 3, borderColor: '#7A481E', padding: 8 },",
    "  boostCard: { backgroundColor: '#4B2B15', borderWidth: 3, borderColor: C.orange, padding: 9 },\n  boostCardActive: { backgroundColor: '#6C2B14', borderColor: C.gold },\n  boostTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },\n  boostTitle: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },\n  boostCopy: { color: '#F0CF9A', fontSize: 7.5, lineHeight: 11, fontWeight: '800', marginTop: 3 },\n  boostState: { minWidth: 48, color: '#FFF1C6', fontSize: 8, fontWeight: '900', textAlign: 'right' },\n  boostButton: { marginTop: 8, backgroundColor: C.orange, borderWidth: 3, borderColor: '#8C3914', paddingVertical: 8, alignItems: 'center' },\n  boostButtonDisabled: { backgroundColor: '#5C5142', borderColor: '#3D362E' },\n  boostButtonText: { color: '#FFF3CD', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },\n  card: { backgroundColor: '#F2D99D', borderWidth: 3, borderColor: '#7A481E', padding: 8 },",
)

# --- Service feedback calls out player-triggered boosts. ---
patch(
    'app/src/components/GameFeedback.js',
    "  const prevBestStreak = useRef(state.bestServiceStreak || 0);",
    "  const prevBestStreak = useRef(state.bestServiceStreak || 0);\n  const prevKettleBoostUses = useRef(state.kettleBoostUses || 0);",
)
patch(
    'app/src/components/GameFeedback.js',
    "    const bestStreak = state.bestServiceStreak || 0;\n\n    if (state.venueTier > prevVenueTier.current) {",
    "    const bestStreak = state.bestServiceStreak || 0;\n    const kettleBoostUses = state.kettleBoostUses || 0;\n\n    if (kettleBoostUses > prevKettleBoostUses.current) {\n      showMessage(`⚡ KETTLE BOOST · ${Math.ceil(state.kettleBoostRemaining || 0)}s`, 'hot');\n    } else if (state.venueTier > prevVenueTier.current) {",
)
patch(
    'app/src/components/GameFeedback.js',
    "    prevBestStreak.current = bestStreak;\n  }, [",
    "    prevBestStreak.current = bestStreak;\n    prevKettleBoostUses.current = kettleBoostUses;\n  }, [",
)
patch(
    'app/src/components/GameFeedback.js',
    "    state.bestServiceStreak,\n    upgradeScore,",
    "    state.bestServiceStreak,\n    state.kettleBoostUses,\n    state.kettleBoostRemaining,\n    upgradeScore,",
)

# --- Regression coverage. ---
patch(
    'app/tests/stabilization.test.js',
    "  buyTrackUpgrade,\n  claimDailyObjective,",
    "  activateKettleBoost,\n  buyTrackUpgrade,\n  claimDailyObjective,",
)
with (ROOT / 'app/tests/stabilization.test.js').open('a') as handle:
    handle.write("""


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

  const normalCapacity = getDerivedStats(base).coinsPerMinute;
  const boosted = activateKettleBoost(base);
  const boostedStats = getDerivedStats(boosted);
  assert.equal(boostedStats.kettleBoostActive, true);
  assert.ok(boostedStats.coinsPerMinute > normalCapacity);

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
""")

patch(
    'app/tests/bootGameState.test.js',
    'Save schema 999 is newer than supported schema 4',
    'Save schema 999 is newer than supported schema 5',
)
