from pathlib import Path


def replace_once(path, old, new):
    file_path = Path(path)
    text = file_path.read_text()
    if old not in text:
        raise SystemExit(f"Expected source block not found in {path}: {old[:80]!r}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "app/App.js",
    "import { pixelSprites } from './src/data/pixelSprites';\n",
    "import { pixelSprites } from './src/data/pixelSprites';\n"
    "import { GameDrawer } from './src/components/GameDrawer';\n"
    "import { GameFeedback } from './src/components/GameFeedback';\n"
    "import { VenueDecor } from './src/components/VenueDecor';\n",
)

replace_once(
    "app/App.js",
    "  const [activeTab, setActiveTab] = useState('speed');\n",
    "  const [activeTab, setActiveTab] = useState('speed');\n"
    "  const [activePanel, setActivePanel] = useState(null);\n",
)

replace_once(
    "app/App.js",
    "    venueProgress,\n    recommendation,\n    dailyObjectives,\n",
    "    venueProgress,\n    recommendation,\n    milestones,\n    dailyObjectives,\n",
)

replace_once(
    "app/App.js",
    "        <View style={styles.sceneFrame}>\n          <View style={styles.bigSignOuter}>\n",
    "        <View style={styles.sceneFrame}>\n          <GameFeedback state={state} />\n          <View style={styles.bigSignOuter}>\n",
)

replace_once(
    "app/App.js",
    "          <View style={styles.sceneSky}>\n            <View style={styles.sunPixel} />\n",
    "          <View style={styles.sceneSky}>\n            <VenueDecor tier={state.venueTier} />\n            <View style={styles.sunPixel} />\n",
)

old_nav = '''        <View style={styles.bottomNav}>
          <BottomNav icon="☷" label={`${dailyObjectives.filter((item) => !item.claimed).length} MISSIONS`} />
          <BottomNav icon="★" label={`${state.serviceStreak} STREAK`} />
          <View style={styles.centerBadge}>
            <Text style={styles.centerBadgeCup}>☕</Text>
            <Text style={styles.centerBadgeText}>AUTO SERVING</Text>
          </View>
          <BottomNav icon="⚡" label={`${Math.round(state.heatMeter || 0)}% RUSH`} />
          <TouchableOpacity
            style={styles.bottomNavItem}
            onPress={confirmReset}
            accessibilityRole="button"
            accessibilityLabel="Reset game data"
          >
            <Text style={styles.bottomNavIcon}>↺</Text>
            <Text style={styles.bottomNavLabel}>RESET</Text>
          </TouchableOpacity>
        </View>
'''

new_nav = '''        <GameDrawer
          panel={activePanel}
          onClose={() => setActivePanel(null)}
          dailyObjectives={dailyObjectives}
          milestones={milestones}
          state={state}
          stats={stats}
          venueProgress={venueProgress}
          onClaimObjective={claimObjective}
          onReset={confirmReset}
        />

        <View style={styles.bottomNav}>
          <BottomNav
            icon="☷"
            label={`${dailyObjectives.filter((item) => !item.claimed).length} MISSIONS`}
            onPress={() => setActivePanel(activePanel === 'missions' ? null : 'missions')}
            active={activePanel === 'missions'}
          />
          <BottomNav
            icon="★"
            label={`${milestones.filter((item) => item.complete).length}/${milestones.length} GOALS`}
            onPress={() => setActivePanel(activePanel === 'milestones' ? null : 'milestones')}
            active={activePanel === 'milestones'}
          />
          <View style={styles.centerBadge}>
            <Text style={styles.centerBadgeCup}>☕</Text>
            <Text style={styles.centerBadgeText}>AUTO SERVING</Text>
          </View>
          <BottomNav
            icon="⚡"
            label={`${Math.round(state.heatMeter || 0)}% RUSH`}
            onPress={() => setActivePanel(activePanel === 'rush' ? null : 'rush')}
            active={activePanel === 'rush'}
          />
          <BottomNav
            icon="⚙"
            label="SETTINGS"
            onPress={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
            active={activePanel === 'settings'}
          />
        </View>
'''
replace_once("app/App.js", old_nav, new_nav)

old_bottom = '''function BottomNav({ icon, label }) {
  return (
    <View style={styles.bottomNavItem}>
      <Text style={styles.bottomNavIcon}>{icon}</Text>
      <Text style={styles.bottomNavLabel}>{label}</Text>
    </View>
  );
}
'''
new_bottom = '''function BottomNav({ icon, label, onPress, active = false }) {
  return (
    <TouchableOpacity
      style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Text style={styles.bottomNavIcon}>{icon}</Text>
      <Text style={styles.bottomNavLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
'''
replace_once("app/App.js", old_bottom, new_bottom)

replace_once(
    "app/App.js",
    "  bottomNavItem: { flex: 1, minHeight: 54, backgroundColor: '#3A210F', borderWidth: 3, borderColor: '#6F3B16', alignItems: 'center', justifyContent: 'center' },\n",
    "  bottomNavItem: { flex: 1, minHeight: 54, backgroundColor: '#3A210F', borderWidth: 3, borderColor: '#6F3B16', alignItems: 'center', justifyContent: 'center' },\n"
    "  bottomNavItemActive: { backgroundColor: '#6A3B12', borderColor: C.gold },\n",
)

replace_once("app/app.json", '    "version": "0.1.0",\n', '    "version": "0.2.0",\n')
replace_once("app/app.json", '      "versionCode": 1,\n', '      "versionCode": 2,\n')
replace_once("app/package.json", '  "version": "0.1.0",\n', '  "version": "0.2.0",\n')

old_sanitize = '''  sanitized.lifetimeCoins = Math.max(sanitized.lifetimeCoins, sanitized.coins);
  sanitized.premiumServed = Math.min(sanitized.premiumServed, sanitized.totalServed);
  sanitized.bestServiceStreak = Math.max(sanitized.bestServiceStreak, sanitized.serviceStreak);

  return sanitized;
'''
new_sanitize = '''  sanitized.lifetimeCoins = Math.max(sanitized.lifetimeCoins, sanitized.coins);
  sanitized.premiumServed = Math.min(sanitized.premiumServed, sanitized.totalServed);
  sanitized.bestServiceStreak = Math.max(sanitized.bestServiceStreak, sanitized.serviceStreak);

  const venue = venueTiers.find((entry) => entry.id === sanitized.venueTier) || venueTiers[0];
  sanitized.staffOwned = sanitized.staffOwned.filter((workerCount) => workerCount <= venue.workerCap);
  const menuAvailableAtVenue = sanitized.unlockedMenu.filter((itemId) => {
    const item = menuItems.find((entry) => entry.id === itemId);
    return item && item.venueMin <= sanitized.venueTier;
  });
  sanitized.unlockedMenu = [
    'basic-chai',
    ...menuAvailableAtVenue.filter((itemId) => itemId !== 'basic-chai'),
  ].slice(0, venue.menuCap);
  const allowedMenuIds = new Set(sanitized.unlockedMenu);
  sanitized.queue = sanitized.queue.filter((customer) => allowedMenuIds.has(customer.itemId));
  sanitized.activeOrders = sanitized.activeOrders.filter((order) => allowedMenuIds.has(order.itemId));

  return sanitized;
'''
replace_once("app/src/game/createInitialState.js", old_sanitize, new_sanitize)

anchor = '''test('offline earnings annualize partial CPM windows without auto-completing daily revenue', () => {
'''
new_test = '''test('save hydration enforces current venue worker and menu caps', () => {
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

'''
replace_once("app/tests/stabilization.test.js", anchor, new_test + anchor)

print('v0.2 source integration applied successfully')
