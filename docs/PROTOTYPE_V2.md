# Chai Empire Pixel Prototype v2

## Status
Working portrait mobile prototype on branch `codex/pixel-art-gameplay-v2`.

## What is implemented
- portrait-only Expo app for Android and iOS
- 8-bit / retro pixel-art gameplay shell
- pixel Owner, Helper, Office Worker, Student, Traveler, and Uncle Group sprites
- live customer queue mapped to customer archetypes
- order bubbles and patience bars
- automatic serving economy loop
- speed, staff, quality, menu, and venue upgrades
- rush meter and live events
- offline earnings and resilient save recovery
- daily objectives and venue progression
- compact mobile HUD and thumb-friendly upgrade cards
- uncommon, seven-second biscuit thief encounters with a prominent `SHOO!` action
- bounded biscuit-jar losses, duplicate-safe outcomes, and a small Heat reward for reacting in time
- conflict guards for Priority Orders and major events, plus background-safe dismissal with no offline theft
- skill-rated thief reactions (`PERFECT`, `QUICK`, and `CLOSE`) with 10/6/3 Heat rewards
- persistent guard streak, best streak, and perfect-catch stats in Rush Control

## Validation
GitHub Actions validates every prototype branch push by:
1. installing dependencies with `npm ci`
2. running the full game test suite
3. exporting Android, iOS, and web bundles with Expo
4. generating a clean Android native project
5. compiling a standalone release APK with Gradle

Validated prototype lineage: `codex/pixel-art-gameplay-v2`.

### Thief improvement cycle (`codex/gameplay-v3`)

- 44/44 Node tests pass, including spawn timing, shoo success, bounded theft, duplicate resolution, save hydration, and offline/background safety.
- Expo exports pass for Android, iOS, and web.
- A standalone Android release APK compiles successfully with Gradle.

## Run locally
```bash
cd app
npm ci
npm start
```

Use Expo Go or an emulator/device for interactive development.

## Android artifact
The CI workflow publishes `chai-empire-android-apk`, containing `app-release.apk`.

## Next production polish
- isolated walk/serve animation frames
- proper sound and music pass
- venue-specific pixel backgrounds for tiers 2-5
- physical-device UX and performance playtest
- analytics/crash reporting before beta
