# Chai Empire Ad Placement Strategy

## Goal
Support future monetization without damaging the relaxed offline-retention loop.

## Recommended Ad Philosophy
- never interrupt active serving flow with forced interstitials
- keep early sessions ad-light or ad-free
- reward intent, not attention trapping
- make ad value obvious and skippable by simply ignoring it

## Best-Fit Ad Placements
### 1. Rewarded ad after offline earnings claim
**Best primary placement**
- show only after player returns to game and sees base offline reward
- optional CTA: `Watch for 2x earnings`
- no auto-play
- available after first meaningful progression milestone, not immediately at install

Why it works:
- natural pause point
- player already thinking about value collection
- does not interrupt live queue management

### 2. Rewarded ad for short business boost
Use sparingly.
Examples:
- 3 minutes faster brewing
- temporary tip boost
- instant queue patience refill during rush

Rules:
- unlock after tutorial completion
- cap uses per session/day bucket
- never make the base game feel nerfed without boosts

### 3. Rewarded ad on failed rush recovery
Optional rescue, not punishment.
- if many customers leave during a surge, offer `Bring customers back` or `Calm the queue`
- only after failure event ends
- never during active touch interaction burst

### 4. Interstitial only at long natural chapter breaks, if ever added
Recommended default: **do not ship interstitials in v1**.
If business requires testing later:
- only after venue unlock or session exit flow
- never more than one per several minutes of active play
- do not show in first session
- A/B test carefully against D1 and average session length

## Placements to Avoid
- during tutorial
- during first 10 minutes of player lifetime
- while queue is visibly active
- immediately after every upgrade purchase
- on resume before player sees the game state
- stacked with offline reward modal

## UX Implementation Notes
- ad CTAs should look secondary to primary game actions
- clearly show reward amount before tap
- if ad fails, still return player cleanly to the game
- keep reward economy moderate so ads accelerate but do not dominate progression

## Suggested Economy Guardrails
- offline 2x ad reward: okay
- temporary boost multiplier: 1.5x to 2x max
- rescue reward should solve one short-term problem, not replace progression
- no permanent stat increases tied to ads

## Retention-Safe Rollout Plan
### v1 launch
- no forced ads
- rewarded offline multiplier only

### v1.1
- test one additional rewarded boost slot
- measure retention, session time, and ad opt-in rate

### v1.2+
- only consider soft interstitial experiment at venue transition if retention is stable

## Success Metrics
- rewarded opt-in rate stays healthy without hurting session completion
- D1/D7 retention remains stable after monetization rollout
- average session length does not drop materially
- negative reviews do not cluster around ad complaints

## Recommendation
For Chai Empire, the safest and most brand-aligned plan is:
1. launch with rewarded offline earnings multiplier only
2. later add one optional business boost rewarded placement
3. avoid forced ads unless analytics prove the game can absorb them
