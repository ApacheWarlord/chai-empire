# Chai Empire Scene Composition + UI Wireframe Guide

## Goal
Define a build-ready portrait gameplay screen that supports one-thumb play, strong readability, and clear monetization boundaries.

## Master Screen Layout
Use a single primary gameplay screen with four layers.

### Layer 1, Background Environment
- sky or wall gradient
- neighborhood backdrop silhouettes
- weather/event dressing
- non-interactive ambience props

### Layer 2, Playfield
- stall or shop shell
- queue lane
- customer standing points
- prep stations
- worker positions
- served-item feedback space

### Layer 3, HUD and guidance
- top economy bar
- milestone card
- urgency chips
- event banner
- offline reward prompt

### Layer 4, Bottom control tray
- upgrade tabs
- purchase cards
- secondary modal entry points

## Portrait Safe-Zone Wireframe
```text
 --------------------------------------------------
| Coins      CPM      Satisfaction      Settings   |
| Offline chest / live event strip if active       |
| Next venue card + progress bars                  |
|--------------------------------------------------|
| Ambient backdrop                                 |
|                                                  |
|  signboard / shop shell                          |
|  worker A   kettle   worker B                    |
|                                                  |
|  service counter / pickup zone                   |
|                                                  |
|  customer queue lane                             |
|                                                  |
| urgency chip / best next upgrade bubble          |
|--------------------------------------------------|
| [Speed] [Staff] [Quality] [Menu] [Venue]         |
| Upgrade card carousel / list                     |
| Buy CTA / cost / effect preview                  |
 --------------------------------------------------
```

## Scene Composition Rules
### Camera
- fixed portrait framing
- stall centered slightly above middle of screen
- customer queue enters from lower-left or lower-right for diagonal depth
- horizon/back wall placed high enough to leave room for playfield action

### Depth Staging
- foreground: stools, crates, planters, signage edges
- midground: customers, workers, counter
- background: walls, traffic silhouettes, skyline, utility poles, bunting

### Visual Readability Targets
- customers visible even with 5 to 8 in queue
- active prep station never obscured by modal UI
- top bar always visible in gameplay state
- bottom tray must not cover heads/faces of queued customers

## Gameplay Zone Breakdown
### 1. Top Bar
Must fit in one glance.
- coins total
- coins per minute
- satisfaction meter
- settings button
- optional sound/vibration state within settings, not top bar

### 2. Reward / Event Row
Contextual row under top bar.
- offline chest appears only when claimable
- live event banner occupies same row when relevant
- avoid stacking multiple banners

### 3. Venue Milestone Card
Compact horizontal card above playfield.
Show:
- next venue thumbnail or silhouette
- three progress bars max
- reward preview
- one CTA: `View venue`

### 4. Central Playfield
Should answer three questions instantly:
- how busy are we?
- who is serving?
- what looks upgraded?

Show:
- current venue art
- queue length
- active workers
- order bubbles on customers
- sale feedback and tips

### 5. Urgency and Recommendation Cue
Only one floating recommendation at a time.
Examples:
- Need more speed
- Queue nearly full
- Best next upgrade
- New menu item ready

### 6. Bottom Upgrade Tray
- 5 persistent tabs
- card list scrolls horizontally or vertically inside tray
- recommended card pinned first
- cards include icon, title, level, cost, and outcome

## Upgrade Card Wireframe Guidance
Each card should contain:
- top-left icon
- title and current level
- one-line effect summary
- numeric delta preview
- price button on right or bottom
- lock badge if gated
- subtle category color strip

### Card States
- default
- affordable
- recommended
- pressed
- locked
- maxed

Recommended state signals:
- affordable: green edge glow
- recommended: gold ribbon
- locked: greyed with visible unlock condition

## Button Guidance
### Primary buttons
- rounded rectangle
- warm gold or saffron fill
- dark text
- minimum touch height 48 dp

### Secondary buttons
- cream or muted brown fill
- dark outline

### Destructive/reset buttons
- red only in settings/modal context

## Modal Guidance
Keep full-screen interruptions rare.
Use modals only for:
- offline earnings claim
- venue upgrade reveal
- tutorial milestone explanation
- settings
- rewarded ad opt-in later

Modal rules:
- dim background but keep stall visible
- max 2 actions per modal
- primary CTA should be obvious

## UI Motion Guidance
- top bar values animate with short easing when earnings change
- tabs slide or snap, no heavy transitions
- purchase flash appears on affected station and on purchased card
- venue upgrade uses largest animation budget

## Platform Notes
### Android
- leave extra top and bottom safe area tolerance for diverse aspect ratios
- avoid tiny text or thin separators on mid-range screens

### iOS
- respect notch/home indicator safe areas
- slightly higher spacing polish and icon sharpness expectations

## Accessibility Notes
- never rely on color alone for warnings
- include icon + label for key states
- minimum 14 to 16 px equivalent text for interactive labels
- support reduced-motion mode by shortening non-critical animations

## UI Asset Breakdown
### HUD assets
- top bar panel
- coin icon
- satisfaction icon set
- settings icon
- offline chest button
- event banner frame
- venue progress card shell

### Tray assets
- tab buttons x5 states
- upgrade card shell
- CTA button states
- lock badge
- recommended ribbon
- progress bar fill and frame

### Floating feedback assets
- urgency bubble frame
- arrow pointer
- positive toast frame
- warning toast frame
