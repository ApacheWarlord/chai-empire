# Chai Empire v1 Onboarding and First 20 Minutes

## Onboarding Goal
Teach the player the full loop with minimal text:
- customers come automatically
- workers serve automatically
- coins are earned passively
- upgrades matter immediately
- new venue tiers are the main long-term goal

The first session should feel like a quick rise from a humble stall to a busier setup, not a slow tutorial.

## Tutorial Principles
- Use 3 to 5 short coach marks only
- Never stop simulation for more than a few seconds
- Show cause and effect instantly after first purchase
- Use Hindi-English flavor lightly in UI, but keep interaction language simple
- Let the player keep earning during tutorial text

## First-Time User Flow

### Step 0: Boot and Landing
Show the stall already running.
- one worker visible at kettle
- one customer already waiting
- one order completes within first 3 to 4 seconds

No menu screen before gameplay.

### Step 1: First Earnings
After first sale, highlight coin counter and show short message:
- `Customers come on their own. Your stall earns while you manage upgrades.`

No button required.

### Step 2: First Upgrade Prompt
Once player reaches 25 coins, pulse the Better Stove upgrade.
Text:
- `Upgrade your stove to serve faster.`

Expected outcome:
- player buys Better Stove 1
- next order visibly completes faster

### Step 3: Menu Unlock Prompt
At 60 coins total earned, pulse Masala Chai unlock.
Text:
- `Add Masala Chai. Better menu, better earnings.`

Expected outcome:
- player sees customers start ordering a more valuable item

### Step 4: Queue Pressure Teaching
Let queue reach 2 to 3 customers naturally.
Text:
- `Too much rush? Hire help or upgrade speed.`

Do not force action yet.

### Step 5: First Staff Unlock
When player can afford Helper, highlight it.
Text:
- `Hire a helper to serve two customers at once.`

This is the key delight moment of early game.

### Step 6: Venue Aspiration
After Helper is purchased and player nears 300 to 400 coins, show a locked venue card.
Text:
- `Grow enough and move up from this roadside stall.`

This plants the long-term goal before the first venue upgrade.

## First 20-30 Minute Progression Script
This is the target player journey, not a hard script.

## Minute 0-2
Player experience:
- understands customers are automatic
- buys first speed upgrade
- sees coins coming in steadily

Target purchases:
- Better Stove 1
- maybe Signage 1

## Minute 2-5
Player experience:
- unlocks Masala Chai
- average order value rises
- queue starts forming sometimes

Target purchases:
- Masala Chai
- Better Stove 2
- Signage 1

## Minute 5-8
Player experience:
- realizes throughput is the constraint
- hires Helper
- business visibly gets busier and smoother

Target purchases:
- Helper
- Biscuit Pack or Tea Leaves 1

## Minute 8-12
Player experience:
- saving toward first venue feels realistic
- queue cap and worker limit become visible constraints
- first venue upgrade is unlocked or almost unlocked

Target milestone:
- Pushcart Kiosk

## Minute 12-20
Player experience:
- new venue feels like a real step up
- more menu variety is available
- they start choosing between quality, menu, and saving

Target purchases:
- Ginger Chai
- Bun Maska
- Tea Leaves upgrades

## Minute 20-30
Player experience:
- small empire fantasy starts to land
- they are thinking about optimization, not just following prompts
- Small Tea Shop becomes next big aspiration or unlock

Target milestone:
- approach or unlock Small Tea Shop

## UI Guidance for Onboarding
Top bar:
- coins
- revenue per minute
- satisfaction icon

Main play area:
- queue of customers
- stall visuals
- active workers
- order bubbles with item icons

Bottom tray tabs:
- Speed
- Staff
- Quality
- Menu
- Venue

For early clarity, show red or amber queue pressure indicators when customers are waiting too long.

## Suggested Coach Mark Copy
Keep copy short and warm.
- `Customers will come automatically.`
- `Upgrade to brew faster.`
- `Unlock new items for bigger orders.`
- `Hire help to handle the rush.`
- `Save up to upgrade your stall.`

## Failure Avoidance
Avoid these tutorial mistakes:
- asking player to tap every customer
- showing 8 upgrade categories at once
- opening with long story text
- hiding venue progression until too late
- overwhelming player with too many currencies

## Recommended v1 FTUE Reward Rhythm
- first purchase in under 45 seconds
- first menu unlock in under 2.5 minutes
- first helper unlock in under 8 minutes
- first venue upgrade in under 12 minutes

## Minimal Narrative Wrapper
Use only a light framing layer.
Opening line:
- `One kettle. One stall. Let us build something big.`

After first venue upgrade:
- `Word is spreading. Your chai stall is becoming a local favourite.`

Narrative should support progress, not interrupt it.

## Acceptance Criteria
A first-time player should be able to say all of these after 3 minutes:
- `I don't need to tap to serve.`
- `Buying upgrades makes the stall faster.`
- `New items make me more money.`
- `Hiring staff is powerful.`
- `I am working toward a better shop.`
