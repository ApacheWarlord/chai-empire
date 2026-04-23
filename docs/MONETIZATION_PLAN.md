# Chai Empire - Monetization Plan

## Goals
- Keep the game fair, calm, and fully playable offline.
- Monetize with optional boosts, not frustration.
- Fit Indian mobile habits: ad-tolerant if rewards are clear, but very sensitive to spammy interruptions.

## Recommended First-Launch Strategy
Launch with:
- rewarded video as the main revenue feature
- one very light interstitial cap only after clear session breaks
- no banner ads in core gameplay
- no paywall on core progression
- no forced energy system

Suggested split for v1:
- 80 to 90 percent of ad impressions from rewarded video
- 10 to 20 percent from capped interstitials
- IAPs can wait until retention is proven

## Safest Ad Placements
These are the lowest-risk placements for an idle offline game:

### 1. Between venue upgrades
Show an interstitial only after a major milestone, such as moving from Roadside Stall to Market Kiosk.
- good because it lands on a natural break
- never stack multiple ads around the same upgrade
- cap to at most 1 per 6 to 8 minutes

### 2. On app resume after a long gap
If the player returns after a meaningful break, a single interstitial can appear before claiming idle earnings.
- only if the last ad was several minutes ago
- skip for first session of the day
- never before the player sees their reward summary

### 3. Optional reward buttons in upgrade and recovery moments
This should be the primary placement.
- before buying an expensive upgrade
- after queue overload or low satisfaction moments
- when player is short by a small amount for the next milestone

## Rewarded Ad Opportunities
Make rewards useful but not mandatory.

### Best reward types
- 2x offline earnings for 30 to 60 minutes worth of idle income
- instant cash equal to 2 to 4 minutes of current earnings
- rush hour boost for 3 minutes, faster customer spawn
- staff tea break, temporary serving speed boost
- one-time festival crowd surge
- revive a missed premium customer or bulk order

### Good trigger points
- after player taps a locked upgrade but lacks cash
- after venue progress reaches around 80 to 90 percent
- after returning from offline time
- after a soft failure like queue overflow

### Reward design rules
- reward should save time, not replace progress
- value should scale with current economy
- avoid more than 3 to 5 rewarded prompts per session
- never auto-open rewarded ads without explicit tap

## What To Avoid
- banners during the main stall screen, they hurt focus and look cheap
- forced ads during the first 10 minutes
- ads after every few upgrade taps
- rewards that feel required to fix bad balance
- fake close buttons or misleading reward copy
- monetizing basic save, speed controls, or core menu unlocks
- offering rewards so large that non-watchers feel punished

## Progression-Linked Monetization Hooks
Tie monetization to aspiration, not pain.

### Early game
- one optional boosted starter pack later as IAP, not at first boot
- rewarded cash top-up near first meaningful upgrade

### Mid game
- venue transition reward ad: celebrate new location, then offer optional 2x launch crowd
- optional ad to refill patience or trigger a chai rush during busier tiers

### Late game
- premium customer arrival boost
- temporary reputation multiplier during festival or rain events
- optional ad before prestige-style reset, if prestige is added later

## Future IAP Options
Best kept for phase 2 after D1 and D7 retention look healthy.

### Safe IAP ideas
- Remove Ads
- Founder Pack: permanent 1.5x idle earnings, cosmetic stall skin, small gem bundle if premium currency is added
- Cosmetic bundles: stall themes, cup skins, signboards, festive decor
- Convenience packs: extra offline earnings cap, extra loadout slot for boosts later

### Avoid for IAP
- hard paywalls on venue unlocks
- pay-only staff or recipes with gameplay advantage too early
- aggressive consumable spam in a low-ARPPU market

## Retention-Safe Revenue Strategy
- First session: zero forced ads.
- First rewarded ad only after player understands upgrades and venue progress.
- Interstitials only at natural breaks with strict cooldowns.
- Rewarded ads should feel like a bonus shortcut, not oxygen.
- Tune economy so a player can reach early venue upgrades happily without any ad use.
- Keep ad load lighter on low-end devices and short sessions.

## India-Market Notes
- Reward clarity matters more than fancy presentation.
- Players often accept rewarded ads if the benefit is immediate and visible.
- Many users play in short bursts, so avoid long ad chains.
- Low-end Android performance matters, so fewer ad calls and cleaner placements help retention.
- Cosmetic packs themed around local festivals can monetize without hurting fairness.

## Rollout Recommendation

### Phase 1, first public launch
Ship:
- rewarded video for offline earnings multiplier
- rewarded video for cash top-up or rush-hour boost
- interstitial only on major venue transition or long-gap resume
- strict frequency cap and remote tuning if available later

Do not ship yet:
- banners
- offer walls
- premium currency store
- complex IAP catalog
- ad-heavy revive loops

### Phase 2, after metrics review
If retention is healthy, add:
- Remove Ads IAP
- 1 to 2 cosmetic packs
- one starter bundle surfaced after player reaches venue 2 or 3

## Practical Default Rules
- no forced ad before minute 10
- max 1 interstitial per session under 8 minutes
- max 2 interstitials in longer sessions
- rewarded ads always user-initiated
- rewarded value target: roughly 2 to 4 minutes of progress
- if ad fill fails offline, show a friendly fallback and never block play

## Best Simple v1 Setup
If the team wants the safest possible launch, use just this:
1. Rewarded ad for 2x offline earnings claim
2. Rewarded ad for small timed boost
3. One capped interstitial on venue promotion screen

That setup is simple, player-friendly, and likely the best fit for Chai Empire's offline idle design.