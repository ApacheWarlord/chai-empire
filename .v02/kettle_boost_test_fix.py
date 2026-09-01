from pathlib import Path

path = Path('app/tests/stabilization.test.js')
text = path.read_text()
old = "  const normalCapacity = getDerivedStats(base).coinsPerMinute;\n  const boosted = activateKettleBoost(base);\n  const boostedStats = getDerivedStats(boosted);\n  assert.equal(boostedStats.kettleBoostActive, true);\n  assert.ok(boostedStats.coinsPerMinute > normalCapacity);"
new = "  const normalStats = getDerivedStats(base);\n  const boosted = activateKettleBoost(base);\n  const boostedStats = getDerivedStats(boosted);\n  assert.equal(boostedStats.kettleBoostActive, true);\n  assert.ok(boostedStats.averageServiceTime < normalStats.averageServiceTime);"
if old not in text:
    raise SystemExit('Expected Kettle Boost capacity assertion not found')
path.write_text(text.replace(old, new, 1))
