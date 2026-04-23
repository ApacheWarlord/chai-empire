# Chai Empire Workspace

This is the proper working home for the game.

## Structure

### `app/`
Cross-platform mobile app codebase for iOS and Android.

### `src/`
Source structure reference for gameplay systems and UI modules.
Suggested internal layout:
- `components/`
- `screens/`
- `data/`
- `systems/`
- `theme/`
- `utils/`

### `assets/`
Game assets and production art.
- `concept/` - concept art and moodboards
- `ui/` - HUD, buttons, cards, panels
- `sprites/` - characters, props, venue pieces
- `icons/` - game and UI icons
- `audio/` - SFX and music planning
- `marketing/` - app store art, promo material

### `docs/`
Game design, content, polish, monetization, and art direction.

### `production/`
Execution layer for the factory.
- `planning/` - milestone plans and scope docs
- `roadmap/` - phased delivery notes
- `qa/` - testing checklists and bug tracking
- `builds/` - release notes and build handoff notes

### `references/`
External references, benchmark notes, and inspiration summaries.

## Working Rule
All Chai Empire game work should be kept inside this project folder, not the workspace root.

## Immediate Priorities
1. keep app build inside `app/`
2. keep design and production docs in `docs/` and `production/`
3. keep visual work inside `assets/`
4. prepare for Android and iOS delivery from one codebase
