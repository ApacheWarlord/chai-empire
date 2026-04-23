# Chai Empire v1 Product Polish Blueprint

## Purpose
Turn the current design into a build-ready mobile prototype direction that feels cleaner, clearer, and closer to a marketable launch candidate.

## Product Positioning
**Fantasy:** build the busiest chai business in town, one visible upgrade at a time.

**Player promise:**
- easy to understand in under 30 seconds
- satisfying progress every session
- strong India-native identity
- offline income without needing constant attention

**Tone:** warm, ambitious, proud, street-smart.

## Market-Ready v1 Pillars
1. **One-screen readability**: the player should understand money, rush, and next goal at a glance.
2. **Visible cause and effect**: every upgrade should create a noticeable speed, value, or crowd change.
3. **Always a next milestone**: the UI should constantly point to the next unlock, helper, or venue.
4. **Reward density**: micro-rewards every few seconds, medium rewards every 1 to 3 minutes, major rewards every 8 to 15 minutes.
5. **Cultural clarity**: strong chai-shop identity without cluttered realism.

## Recommended Core Screen Structure
Use a single main gameplay screen with layered panels rather than many separate pages.

### 1. Top Bar
Keep this fixed and always readable.
- **Coins**: large, left-aligned
- **Coins/min**: smaller label under coins
- **Satisfaction meter**: smile icon plus percentage
- **Offline chest button**: appears only when claimable
- **Settings**: small icon, top right

### 2. Center Playfield
This should sell the fantasy immediately.
- visible stall/shop art
- customer queue lane
- worker positions
- order bubbles over customers
- animated coin pops when orders finish
- short event banner at top of playfield when active

### 3. Right-side or floating urgency cues
Show only when relevant.
- queue almost full
- new item unlocked
- venue requirement almost complete
- customer patience warning

### 4. Bottom Upgrade Tray
Use 5 tabs only.
- Speed
- Staff
- Quality
- Menu
- Venue

Each card in the tray should show:
- name
- 1-line effect
- current level or lock state
- price
- tiny stat preview like `+15% brew speed`
- green highlight if affordable
- gold glow if it is a recommended next purchase

## UI Hierarchy Rules
To avoid visual mess:
- only 1 primary CTA at a time
- max 3 highlighted UI elements at once
- use color by meaning, not decoration
- never hide coin rate or next venue progress
- tutorial coach marks should point to existing UI, not open extra screens

## Stronger Feedback Loops
## Micro Feedback, every 2 to 8 seconds
- coin pop animation on every served order
- cup/clink sound on completion
- tiny satisfaction emoji over happy customers
- queue fill indicators that animate as pressure rises

## Mid Feedback, every 30 to 120 seconds
- upgrade purchase flash on affected station or worker
- `Rush Handled` style toast after queue clears from a bottleneck
- `Popular Item` ribbon on newly unlocked menu item for 3 minutes
- progress ring filling toward venue upgrade

## Major Feedback, every 8 to 15 minutes
- full venue transformation animation
- before/after revenue snapshot
- new customer types enter with a short reveal banner
- ambient audio / palette shift by venue tier

## Clearer Progression Indicators
The player should always know three things:
1. what is happening now
2. what is slowing them down
3. what big goal is next

### Recommended persistent indicators
- **Now:** coins/min and queue pressure
- **Current bottleneck:** show one simple diagnosis chip
  - `Need more speed`
  - `Need another worker`
  - `Menu can earn more`
- **Next milestone:** venue card with 3 requirements and progress bars

### Venue card layout
Show this as a compact card above the bottom tray.
- next venue image silhouette
- coin requirement progress
- business level progress
- reputation progress
- expected reward preview
  - `+1 queue`
  - `new item slots`
  - `more customer traffic`

### Upgrade recommendation logic
For v1, a simple recommendation system is enough:
- if abandonment rises, recommend Speed or Staff
- if queue is calm and CPM is flat, recommend Menu or Quality
- if venue requirements are near completion, recommend saving for Venue

Label one card with `Best Next Upgrade`.

## Cleaner Early-Game Flow
## First 90 seconds
- first sale lands in under 4 seconds
- first upgrade available in under 30 to 45 seconds
- first visible bottleneck appears by 90 seconds

## First 8 minutes
- player buys at least 4 meaningful upgrades
- first menu unlock visibly changes order mix
- first helper creates the biggest throughput spike so far
- venue card becomes emotionally desirable before it is affordable

## First 15 minutes
- player reaches or nearly reaches Kiosk
- business looks materially upgraded
- player understands that every venue is a new chapter, not only a bigger number

## Recommended Polished Upgrade Presentation
Avoid long lists. Group upgrades by outcome.

### Speed Tab
- Better Stove
- Bigger Kettle
- Faster Pouring

Card subtitle style:
- `Serve faster`
- `Finish orders sooner`

### Staff Tab
- Helper
- Senior Chaiwala
- Counter Boy

Card subtitle style:
- `Handle more customers at once`

### Quality Tab
- Tea Leaves
- Milk Quality
- Masala Mix

Card subtitle style:
- `Higher tips and happier regulars`

### Menu Tab
Show item cards with:
- item icon
- price
- service time
- demand tag like `Fast Seller`, `Premium`, `Quick Snack`

### Venue Tab
Show venue as a transformation goal, not a generic upgrade row.

## Presentation and Art Direction
## Visual style
- colorful but grounded
- chunky readable icons
- big upgrade cards
- warm tea browns, saffron, green, cream, and steel-blue accents

## Suggested color roles
- coins: warm gold
- positive growth: green
- queue warning: amber
- angry/risk: red
- premium unlocks: deep maroon or royal blue

## Environment storytelling by tier
- Tier 1: roadside kettle, plastic stools, painted sign
- Tier 2: wheeled kiosk, brighter board, hanging snack jars
- Tier 3: proper counter, bench seating, glass display
- Tier 4+: tiled walls, menu board, branded cups, denser crowd

## Audio polish priorities
If only a few sounds are possible, prioritize:
1. sale complete
2. upgrade purchase
3. venue unlock sting
4. soft kettle ambience loop

## Retention Hooks That Still Fit Offline Play
Keep hooks lightweight and readable.

### Daily-feeling, without real-time dependency
- milestone board with 3 rotating goals per run/session
- examples: `Serve 25 customers`, `Earn 500 coins`, `Sell 10 Masala Chai`

### Short event bursts
- rain rush
- cricket break
- office tea time

Events should be announced by a banner and change crowd behavior visibly.

### Collection feel
Track simple badges:
- all menu items unlocked
- first 100 customers served
- zero-abandonment streak
- first premium venue reached

## Build-Ready MVP Scaffold
## States to implement first
- boot into active stall
- live simulation loop
- offline earnings return modal
- venue upgrade transition
- settings/reset

## Data modules
- venue definitions
- menu item definitions
- upgrade definitions
- customer archetypes
- event definitions
- tutorial triggers
- save/load state

## Rendering priorities
1. queue + worker readability
2. upgrade tray usability
3. milestone card clarity
4. lightweight juice and animation

## Recommended engineering simplifications
- one scene with layered panels
- data-driven upgrades/items in JSON or TS objects
- deterministic spawn logic from existing design docs
- pooled customer/order visuals
- local save only for v1

## Prototype Acceptance Test for Polish
A tester should be able to say:
- `I always knew what to buy next.`
- `The stall felt more alive after each upgrade.`
- `I could tell when I was falling behind demand.`
- `The next venue looked exciting before I unlocked it.`
- `It felt like a real chai business, not a generic idle game.`

## Recommended Next Deliverables
1. build one-screen wireframe from this layout
2. convert upgrades/items into data tables for implementation
3. prototype milestone card plus recommendation chip
4. add first-pass juice: coin pops, queue warning, unlock glow, venue transition
