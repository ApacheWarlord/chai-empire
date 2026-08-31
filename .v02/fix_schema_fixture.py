from pathlib import Path

path = Path('app/tests/bootGameState.test.js')
text = path.read_text()
old = 'Save schema 999 is newer than supported schema 3'
new = 'Save schema 999 is newer than supported schema 4'
if old not in text:
    raise SystemExit('Expected schema 3 recovery fixture not found')
path.write_text(text.replace(old, new, 1))
