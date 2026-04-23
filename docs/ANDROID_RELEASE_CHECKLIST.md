# Android Release Checklist

Practical release-prep checklist for the Expo-managed Chai Empire Android build.

## Build identity
- App name: `Chai Empire`
- Android package: `com.chaiempire.game`
- Version name: `0.1.0`
- Version code: `1` in `app/app.json`
- Production EAS profile: `app/eas.json`

## Included shipping-prep changes
- branded placeholder app icon, adaptive icon foreground, splash art, and favicon in `app/assets/branding/`
- Android release profile that emits an AAB for Play Store uploads
- internal preview profile that emits an APK for device testing
- explicit `.gitignore` for Expo build artifacts and local deps
- reproducible asset generator script: `app/scripts/generate_brand_assets.py`

## Before first store submission
1. Replace placeholder branding assets if final art is ready.
2. Create EAS project and sign in: `npx eas login`.
3. Link project if needed: `npx eas init`.
4. Configure Android credentials: `npx eas credentials`.
5. Build preview APK for QA: `npx eas build --platform android --profile preview`.
6. Build production bundle: `npx eas build --platform android --profile production`.
7. Smoke-test install, cold boot, resume from background, offline earnings, and save recovery on a physical Android device.
8. Capture Play Store screenshots, feature graphic, privacy policy URL, and store copy.

## QA focus for this prototype
- save survives force-close and relaunch
- offline earnings claim appears only once per return
- recovery notice can be dismissed without blocking play
- progression economy still feels fair after extended idle sessions
- touch targets remain readable on 360dp width Android screens
- no layout clipping around top safe area and bottom gesture area

## Current risks / follow-ups
- placeholder brand pack is shippable for internal testing, but not ideal for public store launch
- Play Store listing assets and policy docs are still needed
- no analytics, crash reporting, or IAP wiring yet
- package id is set, but signing credentials and store ownership are not configured in repo
