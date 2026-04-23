# Chai Empire Mobile Prototype

Expo-based single-codebase mobile prototype for iOS and Android.

## What is here
- `App.js`: one-screen playable prototype shell
- `src/data/gameData.js`: venues, menu items, upgrades, events, milestones
- `src/game/`: initial state and simulation logic
- `src/hooks/useGameState.js`: save/load, offline earnings, live tick loop

## Run
```bash
cd projects/chai-empire/app
npm install
npm run start
```
Then press:
- `a` for Android emulator/device
- `i` for iOS simulator on macOS
- or scan with Expo Go

## Release-oriented commands
```bash
npm run assets:generate   # rebuild placeholder brand pack
npm run export:web        # verify Expo config and asset wiring
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

## Android shipping notes
- Release config lives in `app.json` and `eas.json`.
- Placeholder Android-ready branding assets live in `assets/branding/`.
- Release checklist lives in `../docs/ANDROID_RELEASE_CHECKLIST.md`.

## Current prototype features
- offline local save with capped offline earnings
- venue progression card with requirements and reward preview
- recommendation chip and bottleneck hint
- menu, staff, speed, quality, and venue tabs
- data-driven structure ready for future 2.5D art layers

## Suggested next production steps
1. Replace emoji playfield with layered sprites/parallax props.
2. Add pooled customer entities with patience bars and order bubbles.
3. Add sound, venue transition animation, and proper balance pass.
4. Promote to TypeScript and add unit tests for simulation math.
