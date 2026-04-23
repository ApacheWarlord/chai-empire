# Chai Empire Next Sprint

## Objective
Move Chai Empire from a good prototype to a more believable, sticky v1 slice.

## Current State
Already present in prototype:
- core idle economy loop
- upgrades across speed, staff, quality, menu, and venue
- venue progression and milestone board
- offline income claim
- strong visual shell for the first stall fantasy

## Recommended Sprint Goal
Add depth that makes the game feel alive, not just numerical.

## Sprint Priorities

### 1. Customer Variety Layer
Add simple customer archetypes with visible gameplay impact.

Initial set:
- office worker, fast patience, medium spend
- student, medium patience, low spend, higher biscuit preference
- traveler, low frequency, higher spend
- uncle group, slower patience, larger order value

Deliverables:
- customer type data file
- weighted spawn logic
- light UI difference per customer type
- effect on order value and patience

### 2. Order Bubble Feedback
Make orders readable from the scene.

Deliverables:
- order bubble above active customers
- menu item icon or short label
- completed order pop feedback
- clearer queue pressure signal

### 3. Events System v1
Add short timed bursts that change tempo.

Initial events:
- morning rush
- rain slowdown
- office break surge
- cricket match crowd

Deliverables:
- event rotation logic
- banner copy for each event
- simple modifiers for arrival rate and value

### 4. Early Retention Layer
Give the player one more reason to return.

Deliverables:
- daily objective strip
- three rotating objective templates
- reward payout on completion

Suggested templates:
- serve 25 customers
- earn 500 coins
- unlock one upgrade

## Recommended Build Order
1. customer archetypes
2. order bubble feedback
3. events system
4. daily objectives

## Scope Discipline
Do not expand into:
- multiplayer
- complex manual cooking minigames
- deep staffing AI
- multiple screens for v1

Keep the build readable and one-screen-first.

## Success Check
The sprint is successful if:
- the player can notice different customer behavior
- the stall feels more reactive during a session
- the game produces more memorable peaks
- there is at least one small return incentive
