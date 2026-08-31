from pathlib import Path

ROOT = Path('.')

def patch(path, old, new):
    p = ROOT / path
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Missing patch context in {path}: {old[:80]!r}')
    p.write_text(text.replace(old, new, 1))

# Add meaningful one-time rewards to long-term milestone goals.
patch('app/src/data/gameData.js',
"  { id: 'serve-25', label: 'Serve 25 customers', target: 25, metric: 'totalServed' },\n  { id: 'earn-500', label: 'Earn ₹500 revenue', target: 500, metric: 'lifetimeCoins' },\n  { id: 'sell-10-premium', label: 'Sell 10 premium cups', target: 10, metric: 'premiumServed' },",
"  { id: 'serve-25', label: 'Serve 25 customers', target: 25, metric: 'totalServed', reward: 120 },\n  { id: 'earn-500', label: 'Earn ₹500 revenue', target: 500, metric: 'lifetimeCoins', reward: 220 },\n  { id: 'sell-10-premium', label: 'Sell 10 premium cups', target: 10, metric: 'premiumServed', reward: 320 },")

# Save schema: persist claimed milestone IDs and sanitize unknown IDs.
patch('app/src/game/createInitialState.js',
"import { menuItems, staffUnlocks, upgradeTracks, venueTiers } from '../data/gameData';",
"import { menuItems, milestoneGoals, staffUnlocks, upgradeTracks, venueTiers } from '../data/gameData';")
patch('app/src/game/createInitialState.js', 'export const SAVE_SCHEMA_VERSION = 3;', 'export const SAVE_SCHEMA_VERSION = 4;')
patch('app/src/game/createInitialState.js',
"  venueUnlockedToast: null,\n  dailyObjectives:",
"  venueUnlockedToast: null,\n  claimedMilestoneIds: [],\n  dailyObjectives:")
patch('app/src/game/createInitialState.js',
"const validMenuIds = new Set(menuItems.map((item) => item.id));\nconst validStaffCounts",
"const validMenuIds = new Set(menuItems.map((item) => item.id));\nconst validMilestoneIds = new Set(milestoneGoals.map((goal) => goal.id));\nconst validStaffCounts")
patch('app/src/game/createInitialState.js',
"    heatMeter: Math.min(100, Math.max(0, toFiniteNumber(saved.heatMeter, base.heatMeter))),\n    queue:",
"    heatMeter: Math.min(100, Math.max(0, toFiniteNumber(saved.heatMeter, base.heatMeter))),\n    claimedMilestoneIds: Array.isArray(saved.claimedMilestoneIds)\n      ? [...new Set(saved.claimedMilestoneIds.filter((id) => typeof id === 'string' && validMilestoneIds.has(id)))]\n      : base.claimedMilestoneIds,\n    queue:")

# Simulation: expose claimed state and a safe one-time claim operation.
patch('app/src/game/simulation.js',
"      complete: value >= goal.target,\n      progress: clamp(value / goal.target, 0, 1),",
"      claimed: (state.claimedMilestoneIds || []).includes(goal.id),\n      complete: value >= goal.target,\n      progress: clamp(value / goal.target, 0, 1),")
needle = "export const getTutorialStep = (state) => {"
insert = """export const claimMilestoneReward = (state, milestoneId) => {\n  const goal = milestoneGoals.find((entry) => entry.id === milestoneId);\n  if (!goal) return state;\n  const claimedIds = state.claimedMilestoneIds || [];\n  const value = state[goal.metric] || 0;\n  if (value < goal.target || claimedIds.includes(goal.id)) return state;\n\n  return {\n    ...state,\n    coins: state.coins + goal.reward,\n    claimedMilestoneIds: [...claimedIds, goal.id],\n  };\n};\n\n"""
patch('app/src/game/simulation.js', needle, insert + needle)

# Hook: wire milestone claiming into the app state API.
patch('app/src/hooks/useGameState.js',
"  buyTrackUpgrade,\n  claimDailyObjective,",
"  buyTrackUpgrade,\n  claimDailyObjective,\n  claimMilestoneReward,")
patch('app/src/hooks/useGameState.js',
"  const claimObjective = useCallback((id) => setState((current) => claimDailyObjective(current, id)), []);",
"  const claimObjective = useCallback((id) => setState((current) => claimDailyObjective(current, id)), []);\n  const claimMilestone = useCallback((id) => setState((current) => claimMilestoneReward(current, id)), []);")
patch('app/src/hooks/useGameState.js',
"    claimObjective,\n    dismissTutorial,",
"    claimObjective,\n    claimMilestone,\n    dismissTutorial,")

# Drawer: show reward and a real CLAIM action for completed milestones.
patch('app/src/components/GameDrawer.js',
"  onClaimObjective,\n  onReset,",
"  onClaimObjective,\n  onClaimMilestone,\n  onReset,")
patch('app/src/components/GameDrawer.js',
"        {panel === 'milestones' ? <MilestonesPanel milestones={milestones} /> : null}",
"        {panel === 'milestones' ? <MilestonesPanel milestones={milestones} onClaim={onClaimMilestone} /> : null}")
start = "function MilestonesPanel({ milestones }) {"
end = "\nfunction RushPanel({ state, stats }) {"
p = ROOT / 'app/src/components/GameDrawer.js'
text = p.read_text()
a = text.index(start)
b = text.index(end, a)
new_panel = """function MilestonesPanel({ milestones, onClaim }) {\n  const claimed = milestones.filter((milestone) => milestone.claimed).length;\n  const claimable = milestones.filter((milestone) => milestone.complete && !milestone.claimed).length;\n  const nextMilestone = milestones\n    .filter((milestone) => !milestone.complete)\n    .sort((a, b) => b.progress - a.progress)[0];\n\n  return (\n    <View style={styles.stack}>\n      <SummaryBanner\n        label={claimable ? `${claimable} EMPIRE REWARD${claimable === 1 ? '' : 'S'} READY` : nextMilestone ? `NEXT · ${nextMilestone.label.toUpperCase()}` : 'EMPIRE RECORD COMPLETE'}\n        value={`${claimed}/${milestones.length} CLAIMED`}\n      />\n      {milestones.map((milestone) => {\n        const ready = milestone.complete && !milestone.claimed;\n        return (\n          <View key={milestone.id} style={[styles.card, milestone.claimed && styles.cardComplete, ready && styles.cardReady]}>\n            <View style={styles.cardTopRow}>\n              <Text style={styles.cardTitle}>{milestone.label.toUpperCase()}</Text>\n              <Text style={styles.reward}>{formatCoins(milestone.reward)}</Text>\n            </View>\n            <Progress value={milestone.progress} complete={milestone.complete} />\n            <View style={styles.cardBottomRow}>\n              <Text style={styles.muted}>{milestone.current}/{milestone.target}</Text>\n              {ready ? (\n                <TouchableOpacity\n                  style={styles.actionButton}\n                  onPress={() => onClaim(milestone.id)}\n                  accessibilityRole=\"button\"\n                  accessibilityLabel={`Claim ${milestone.label} milestone reward`}\n                >\n                  <Text style={styles.actionText}>CLAIM</Text>\n                </TouchableOpacity>\n              ) : milestone.claimed ? (\n                <Text style={styles.status}>✓ CLAIMED</Text>\n              ) : (\n                <Text style={styles.remaining}>{Math.max(0, milestone.target - milestone.current)} TO GO</Text>\n              )}\n            </View>\n          </View>\n        );\n      })}\n    </View>\n  );\n}\n"""
p.write_text(text[:a] + new_panel + text[b:])

# App wiring and bottom-nav badge: reward-ready state is more useful than merely completed.
patch('app/App.js',
"    claimObjective,\n    dismissTutorial,",
"    claimObjective,\n    claimMilestone,\n    dismissTutorial,")
patch('app/App.js',
"          onClaimObjective={claimObjective}\n          onReset={confirmReset}",
"          onClaimObjective={claimObjective}\n          onClaimMilestone={claimMilestone}\n          onReset={confirmReset}")
patch('app/App.js',
"            label={`${milestones.filter((item) => item.complete).length}/${milestones.length} GOALS`}",
"            label={milestones.some((item) => item.complete && !item.claimed)\n              ? `${milestones.filter((item) => item.complete && !item.claimed).length} REWARD READY`\n              : `${milestones.filter((item) => item.claimed).length}/${milestones.length} GOALS`}")

# Regression coverage.
patch('app/tests/stabilization.test.js',
"  buyTrackUpgrade,\n  claimDailyObjective,",
"  buyTrackUpgrade,\n  claimDailyObjective,\n  claimMilestoneReward,")
p = ROOT / 'app/tests/stabilization.test.js'
text = p.read_text()
text += """\n\ntest('milestone rewards can be claimed exactly once without inflating lifetime revenue', () => {\n  const state = createInitialState();\n  state.totalServed = 25;\n  const startingCoins = state.coins;\n  const startingLifetime = state.lifetimeCoins;\n\n  const claimed = claimMilestoneReward(state, 'serve-25');\n  const duplicate = claimMilestoneReward(claimed, 'serve-25');\n\n  assert.equal(claimed.coins, startingCoins + 120);\n  assert.equal(claimed.lifetimeCoins, startingLifetime);\n  assert.deepEqual(claimed.claimedMilestoneIds, ['serve-25']);\n  assert.equal(duplicate.coins, claimed.coins);\n});\n\ntest('save hydration removes duplicate and unknown milestone claims', () => {\n  const state = createInitialState();\n  const restored = hydrateState({\n    ...state,\n    claimedMilestoneIds: ['serve-25', 'serve-25', 'not-a-real-goal', 42],\n  });\n\n  assert.deepEqual(restored.claimedMilestoneIds, ['serve-25']);\n});\n"""
p.write_text(text)
