# Chai Empire v1 Balance Sheet Notes

## Purpose
This document turns the high-level design into balancing targets that can be implemented directly in code or copied into a spreadsheet.

## Balancing Principles
- Early game should compound quickly and visibly
- Throughput upgrades beat price-only upgrades in first session
- Menu unlocks feel exciting, but should not overshadow worker unlocks
- Venue changes are step changes in capacity, not just bigger art
- Idle income should stay meaningful, but live play should remain 4x to 5x better than offline

## Recommended Core Equations

### Throughput
`ordersPerMinute = min(arrivalsPerMinuteAccepted, workerCount * 60 / avgServiceTime)`

### Revenue
`coinsPerMinute = ordersPerMinute * avgOrderValue * payoutMultiplier`

Where:
- `avgOrderValue` comes from menu mix
- `payoutMultiplier = 1 + (teaLeavesLevel * 0.04) + (masalaMixLevel * 0.02)`

### Satisfaction
`serviceScore = clamp(100 - max(0, waitSeconds - 5) * 2 + qualityBonus, 0, 100)`

### Reputation Gain
Recommended hidden meter:
- +2 points for happy customer
- +1 point for normal customer
- -1 point for unhappy customer
- -3 points for queue abandon

Every 20 reputation points = +1 reputation level.

## Baseline Item Values
| Item | Price | Service Time | Effective Value/sec | Notes |
|---|---:|---:|---:|---|
| Basic Chai | 8 | 4.0s | 2.00 | baseline anchor |
| Masala Chai | 12 | 4.8s | 2.50 | best first unlock |
| Biscuit Pack | 10 | 2.5s | 4.00 | queue smoother |
| Ginger Chai | 15 | 5.2s | 2.88 | strong kiosk item |
| Bun Maska | 18 | 3.5s | 5.14 | high value snack |
| Coffee | 22 | 5.5s | 4.00 | premium variety unlock |
| Samosa | 24 | 4.2s | 5.71 | strongest shop-tier item |
| Kulhad Chai | 30 | 6.0s | 5.00 | emotional premium unlock |

Interpretation:
- Items with better value/sec increase earnings only if demand weights allow them to appear enough.
- Basic Chai must stay common to preserve theme and readability.

## Suggested Demand Weights by Progress Stage
### Stage 1: Starting Stall
| Item | Weight |
|---|---:|
| Basic Chai | 100 |

### Stage 2: After Masala + Biscuit
| Item | Weight |
|---|---:|
| Basic Chai | 100 |
| Masala Chai | 70 |
| Biscuit Pack | 45 |

Expected average order value: ~10.0 to 10.5

### Stage 3: Kiosk Menu
| Item | Weight |
|---|---:|
| Basic Chai | 95 |
| Masala Chai | 75 |
| Biscuit Pack | 40 |
| Ginger Chai | 55 |
| Bun Maska | 40 |

Expected average order value: ~12.5 to 13.5

### Stage 4: Small Shop Menu
| Item | Weight |
|---|---:|
| Basic Chai | 90 |
| Masala Chai | 70 |
| Biscuit Pack | 35 |
| Ginger Chai | 60 |
| Bun Maska | 45 |
| Coffee | 35 |
| Samosa | 30 |

Expected average order value: ~15.5 to 17.0

## Upgrade Pricing Table
Round numbers are easier to tune and present to players.

### Better Stove
| Level | Cost | Total Prep Bonus |
|---|---:|---:|
| 1 | 25 | 15% |
| 2 | 35 | 30% |
| 3 | 50 | 45% |
| 4 | 75 | 60% |
| 5 | 110 | 75% |
| 6 | 160 | 90% |

### Tea Leaves Quality
| Level | Cost | Price Bonus |
|---|---:|---:|
| 1 | 40 | 4% |
| 2 | 60 | 8% |
| 3 | 90 | 12% |
| 4 | 135 | 16% |
| 5 | 205 | 20% |
| 6 | 310 | 24% |

### Signage / Reputation
| Level | Cost | Arrival Bonus |
|---|---:|---:|
| 1 | 30 | 4% |
| 2 | 45 | 8% |
| 3 | 70 | 12% |
| 4 | 105 | 16% |
| 5 | 160 | 20% |
| 6 | 245 | 24% |

### Staff Unlocks
| Unlock | Cost | Effect |
|---|---:|---|
| Helper | 180 | +1 worker |
| Senior Chaiwala | 1,200 | +1 worker |
| Counter Boy | 7,500 | +1 worker |

## Recommended Purchase Flow in First Session
Player should generally feel this order is strong, even if not mandatory:
1. Better Stove 1
2. Masala Chai
3. Signage 1
4. Better Stove 2
5. Helper
6. Biscuit Pack
7. Tea Leaves 1
8. Save toward Kiosk

If playtests show players delaying Helper too long, reduce Helper cost from 180 to 150.

## First 30 Minutes Progression Targets
| Session Time | Target State | Revenue Target |
|---|---|---|
| 0-3 min | bought 1-2 cheap upgrades | 70-100 cpm |
| 3-6 min | Masala unlocked, queue visible | 100-140 cpm |
| 6-8 min | Helper purchased | 160-220 cpm |
| 8-12 min | Kiosk unlock or close | 220-300 cpm |
| 12-20 min | Kiosk menu expanded | 280-380 cpm |
| 20-30 min | Small Tea Shop unlocked or close | 350-500 cpm |

## Venue Balance Expectations
### Tier 1: Roadside Stall
Main lesson: buying speed and first menu unlocks increases visible flow.
- expected average wait: 5 to 10s
- acceptable abandonment: under 8%
- player should feel lightly constrained by queue size

### Tier 2: Pushcart Kiosk
Main lesson: variety and quality matter.
- expected average wait: 4 to 8s
- abandonment: under 10%
- helper should already be active

### Tier 3: Small Tea Shop
Main lesson: throughput scale step.
- expected average wait: 6 to 10s before third worker
- abandonment: under 12%
- coffee and samosa create value spike

## Tuning Levers if Game Feels Bad
If progression feels too slow:
- reduce venue costs by 15%
- increase base arrival rate by 10%
- reduce worker unlock costs first before buffing price values

If queues feel too punishing:
- add +1 queue capacity at venue tiers 2 and 3
- increase patience for Local Regulars by 4 seconds
- reduce service times for chai variants by 0.4 seconds

If players snowball too fast:
- lower menu variety multiplier from 6% to 4%
- increase menu unlock costs by 10 to 15%
- reduce tip chance for happy customers from 20% to 10%

If quality upgrades feel weak:
- surface satisfaction more clearly in UI
- add visible `Popular Choice` or `Premium Taste` labels to high-quality items
- increase quality price bonus from 4% to 5% per Tea Leaves level

## Simple Spreadsheet Columns
Recommended spreadsheet columns for implementation:
- upgrade_id
- upgrade_type
- level
- cost
- flat_worker_bonus
- prep_speed_mult
- arrival_mult
- payout_mult
- satisfaction_bonus
- unlocks_item
- unlocks_venue
- min_venue_tier

## Metrics to Log in Prototype
Even offline prototypes should collect local session stats:
- time to first purchase
- time to helper unlock
- time to venue 2 unlock
- cpm over time
- average queue length
- abandonment rate
- top purchased upgrades
- first session length

## Red Flags in Playtests
- players think they need to tap customers manually
- menu unlocks reduce earnings due to slow service and poor weighting
- venue unlock arrives before player notices queue pressure
- offline rewards overshadow live play
- quality upgrades feel invisible

## Recommended Starting Defaults for Engineering
- tick rate: 5 per second
- spawn check: 1 per second
- queue max at game start: 3
- starting worker count: 1
- starting coins: 0
- starting item set: Basic Chai only
- starting reputation level: 0
- starting satisfaction rolling score: 75
