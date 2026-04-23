# Chai Empire v1 Gameplay Design

## Product Goal
Build a relaxing offline idle-upgrades mobile game where the player grows from a single roadside chai stall into a recognizable local chai business. The game should feel familiar to Indian players, easy to understand in under 60 seconds, and satisfying in short sessions.

## v1 Pillars
- Auto-running business, not manual tap spam
- Frequent visible upgrades every 20 to 90 seconds in early game
- Strong India-native fantasy through menu, customers, and venue art
- Offline progress that is useful but capped
- Simple enough to implement with deterministic spreadsheet-friendly balance

## Core Loop
1. Customers spawn automatically.
2. Customers join the queue if space is available.
3. Each customer generates an order from unlocked menu items.
4. Available workers process orders automatically.
5. Completed orders pay coins and may grant a tip.
6. Player spends coins on upgrades.
7. Upgrades improve throughput, order value, satisfaction, and queue size.
8. After required milestones, player upgrades to the next venue tier.

## Core Simulation Model
Use one continuous simulation tick, recommended 4 to 10 ticks per second.

### Main Variables
- `coins`
- `venueTier`
- `queueCapacity`
- `arrivalRatePerMin`
- `activeWorkers`
- `prepSpeedMultiplier`
- `serviceSpeedMultiplier`
- `qualityLevel`
- `reputationLevel`
- `satisfactionScore` from 0 to 100
- `menuUnlocked[]`
- `offlineTimer`

### Order Flow
Each customer instance should track:
- `customerType`
- `patienceSeconds`
- `orderItem`
- `timeWaiting`
- `timeInService`
- `finalPayout`
- `satisfactionResult`

Recommended service simplification for v1:
- 1 worker can handle 1 order at a time
- each order has one total `serviceTime`
- `serviceTime = itemBasePrepTime / prepSpeedMultiplier`
- cashier is abstracted into service speed, not a separate station in v1

## Customer Spawn Logic
## Spawn Formula
Run a spawn check every 1 second.

`spawnProgress += currentArrivalRate / 60`

While `spawnProgress >= 1`:
- if queue is not full, spawn 1 customer and subtract 1 from `spawnProgress`
- if queue is full, discard the spawn and count it as missed demand

This gives stable deterministic arrivals without heavy randomness.

## Arrival Rate Formula
`currentArrivalRate = baseVenueRate * timeBandMultiplier * reputationMultiplier * eventMultiplier * menuVarietyMultiplier`

Recommended v1 multipliers:
- `reputationMultiplier = 1 + (reputationLevel * 0.04)`
- `menuVarietyMultiplier = 1 + (unlockedMenuCount - 1) * 0.06`
- `eventMultiplier` defaults to `1.0`

## Time Bands
Use a repeating 12-minute in-game day cycle for readable session rhythm.

| Time Band | Minutes | Multiplier | Theme |
|---|---:|---:|---|
| Early Morning | 0-3 | 0.8 | setup traffic |
| Morning Rush | 3-6 | 1.35 | office and school crowd |
| Afternoon | 6-9 | 0.9 | slower flow |
| Evening Rush | 9-12 | 1.5 | strongest tea demand |

This creates natural surges without adding real-world clock dependency.

## Customer Types
Use 4 types in v1.

| Type | Weight | Patience | Spend Multiplier | Preferred Items |
|---|---:|---:|---:|---|
| Office Worker | 30% | 20s | 1.05 | chai, coffee |
| Student | 30% | 18s | 0.9 | chai, biscuits, bun maska |
| Local Regular | 25% | 26s | 1.0 | masala chai, ginger chai |
| Traveler | 15% | 16s | 1.15 | premium and snack items |

Implementation note:
- Preferred items should only affect weighted order generation, not require custom AI.

## Order Generation Logic
When a customer spawns:
1. Build list of unlocked items.
2. Apply customer preference weights.
3. Roll one item.
4. Store expected payout and service time.

Simple weighted demand by unlock tier:
- Basic chai should remain common all game
- Newly unlocked items should get a temporary discovery bonus of +25% demand weight for 3 minutes

## Satisfaction Logic
Per-customer satisfaction starts at 100 and is modified by:
- wait penalty: `-2 per second after 5 seconds`
- quality bonus: `+2 per quality level`
- item stockout penalty: not used in v1 if stock system is omitted
- queue abandon: customer leaves if patience hits zero

Outcome bands:
- `85+`: happy, 20% tip chance
- `65-84`: normal, no modifier
- `40-64`: unhappy, -1 reputation progress
- `<40`: angry, larger chance to leave before service completes

Use rolling venue satisfaction as average of last 20 served customers.

## Upgrade Categories
## 1. Speed
Purpose: raise throughput directly.
- Better Stove: +15% prep speed per level
- Bigger Kettle: +10% prep speed per level, small visual upgrade
- Serving Flow: +1 queue capacity every 2 levels and +5% service speed per level

## 2. Staff
Purpose: add parallel order handling.
- Owner starts as worker 1
- Helper unlock adds worker 2
- Senior Chaiwala adds worker 3
- Counter Boy adds worker 4 at later venue

Rule: worker count is the strongest throughput upgrade, so gate it by venue and price it above speed upgrades.

## 3. Quality
Purpose: raise payout and satisfaction.
- Tea Leaves: +4% item price per level
- Milk Quality: +3 satisfaction equivalent per level
- Masala Mix: +2% item price and +1 satisfaction equivalent per level
- Kulhad/ Cup Quality: cosmetic plus +2% premium item value after venue 3

## 4. Menu
Purpose: increase average order value and variety multiplier.
Each unlocked item:
- adds a new possible order
- slightly increases arrival rate through variety
- usually gives higher price but longer service time

## 5. Venue / Prestige Layer
Purpose: hard milestone progression.
Venue upgrades should require:
- coin payment
- minimum total business level
- minimum reputation level

This prevents pure saving from skipping system engagement.

## Venue Progression
Use 5 venue tiers in v1.

| Tier | Venue | Base Arrival/min | Queue Cap | Worker Cap | Menu Cap | Target Dwell |
|---|---|---:|---:|---:|---:|---|
| 1 | Roadside Stall | 6 | 3 | 2 | 3 | first 8-10 min |
| 2 | Pushcart Kiosk | 9 | 4 | 2 | 4 | 10-20 min |
| 3 | Small Tea Shop | 13 | 5 | 3 | 6 | 20-45 min |
| 4 | Corner Shop | 18 | 6 | 4 | 7 | 45-90 min |
| 5 | Neighborhood Cafe | 24 | 8 | 4 | 8 | 90+ min |

## Venue Upgrade Requirements
| To Unlock | Coin Cost | Min Business Level | Min Reputation |
|---|---:|---:|---:|
| Kiosk | 400 | 8 | 2 |
| Small Tea Shop | 2,500 | 18 | 5 |
| Corner Shop | 12,000 | 32 | 9 |
| Neighborhood Cafe | 60,000 | 50 | 14 |

`Business Level` can simply be sum of all purchased upgrade levels plus menu unlock count.

## Menu Unlocks
Use a tight, culturally familiar v1 menu.

| Unlock Order | Item | Venue Min | Price | Base Service Time | Demand Weight | Notes |
|---|---|---:|---:|---:|---:|---|
| 1 | Basic Chai | 1 | 8 | 4.0s | 100 | default starter item |
| 2 | Masala Chai | 1 | 12 | 4.8s | 70 | first premium-feeling unlock |
| 3 | Biscuit Pack | 1 | 10 | 2.5s | 45 | quick service filler |
| 4 | Ginger Chai | 2 | 15 | 5.2s | 55 | strong mid-early seller |
| 5 | Bun Maska | 2 | 18 | 3.5s | 40 | snack bridge item |
| 6 | Coffee | 3 | 22 | 5.5s | 35 | higher price, lower weight |
| 7 | Samosa | 3 | 24 | 4.2s | 30 | strong combo fantasy without combo system |
| 8 | Kulhad Chai | 4 | 30 | 6.0s | 28 | premium emotional unlock |

Average order value should climb mainly from menu and quality, not from raw price inflation.

## Economy Assumptions
Target rough early economy:
- starting revenue: 60 to 90 coins per minute
- after first speed upgrades: 100 to 130 cpm
- after helper unlock: 160 to 220 cpm
- by Small Tea Shop: 300 to 450 cpm
- by Corner Shop: 700 to 1,000 cpm

## Upgrade Cost Model
Use escalating costs by track.

### Speed Track
- base cost: 25
- growth: x1.45
- 12 levels total in v1

### Quality Track
- base cost: 40
- growth: x1.5
- 10 levels total in v1

### Reputation / Signage Track
- base cost: 30
- growth: x1.55
- 8 levels total in v1

### Worker Unlocks
- worker 2: 180
- worker 3: 1,200
- worker 4: 7,500

### Menu Unlock Costs
- Masala Chai: 60
- Biscuit Pack: 90
- Ginger Chai: 250
- Bun Maska: 400
- Coffee: 1,000
- Samosa: 1,400
- Kulhad Chai: 6,000

## Offline Progress
Offline is important, but should not replace play.

Recommended v1 rule:
- simulate `20%` of live throughput
- cap at `120 minutes`
- use current average coins per minute from last 3 live minutes

Formula:
`offlineCoins = avgLiveCPM * offlineMinutes * 0.2`

Optional bonus later:
- watch ad for x2 offline earnings, if monetization is added

## Anti-Frustration Rules
- Never let the player hit zero meaningful upgrades for more than 2 minutes in first session
- First worker unlock should happen inside 6 to 8 minutes
- Venue 2 should be reachable in first 12 minutes for a normal player
- No stock management, burn/fail states, or manual refill friction in v1
- Angry customers should reduce efficiency indirectly, not hard-punish coins already earned

## v1 Events
Keep events lightweight and temporary.

| Event | Duration | Effect |
|---|---:|---|
| Light Rain | 90s | +20% arrivals, +10% chai demand |
| Office Rush | 60s | +30% office worker spawn weight |
| Cricket Break | 75s | +25% arrivals, +15% snack demand |
| Cool Evening | 90s | +15% premium chai demand |

Use at most one event active at a time.

## Success Criteria for First Playtest
- Players understand progression without tutorial text overload
- First 10 minutes contain at least 8 purchase moments
- Queue pressure is visible but not stressful
- Venue 2 unlock feels aspirational but attainable
- Masala Chai and Helper are perceived as meaningful upgrades
