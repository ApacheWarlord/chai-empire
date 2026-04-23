# Chai Empire Asset Plan

## Scope
This file defines the required v1 artwork for a polished playable build on iOS and Android.

## 1. Icon List
### Core economy and status icons
- coin
- coins per minute
- satisfaction happy
- satisfaction neutral
- satisfaction unhappy
- reputation/star
- queue warning
- patience timer
- offline earnings chest
- settings
- sound on/off
- vibration on/off

### Upgrade category icons
- speed
- staff
- quality
- menu
- venue
- marketing
- comfort

### Upgrade effect icons
- brew speed
- pour speed
- queue capacity
- tip bonus
- demand increase
- patience increase
- quality boost
- worker slot
- item slot

### Menu item icons
- basic chai
- masala chai
- ginger chai
- kulhad chai
- biscuit pack
- bun maska
- samosa
- coffee
- bread omelette

### Meta / CTA icons
- buy
- locked
- unlocked
- recommended
- best value
- info
- close
- back
- next
- reward video placeholder

## 2. Environment Art List
### Tier 1, Tapri Start
- background street wall / roadside backdrop
- ground plane
- starter stall shell
- kettle stove station
- basic counter
- cloth shade or tin roof
- hand-painted signboard
- plastic stools
- biscuit jars shelf
- crate storage
- hanging bulb or lantern

### Tier 2, Bazaar Cart
- cart body upgrade
- side wheels and frame
- brighter canopy
- improved front panel branding
- snack display shelf
- extra storage box

### Tier 3, Corner Stall
- permanent wall backdrop
- glass display case
- wider counter
- menu chalkboard
- bench seating
- second prep surface

### Shared ambience set
- electrical pole / wires silhouette
- passing auto/rickshaw silhouette card
- tree / plant card
- rain overlay
- festival bunting
- cricket poster / event dressing

## 3. Character and Customer Sprite Needs
### Staff base characters
Need modular character system where possible.
- chaiwala owner, male presentation
- chaiwala owner, female presentation option
- helper
- cashier/counter staff
- cleaner/support staff

### Staff animation set per character
- idle loop
- brew loop
- pour loop
- serve loop
- celebrate / upgrade react
- tired / stressed variant optional

### Customer archetypes
Create 8 broad archetypes with recolor/accessory variation support.
- office worker
- student
- rickshaw driver
- traveler
- local uncle
- family adult
- premium customer
- delivery/pickup customer for later reuse

### Customer visual variation plan
Per archetype aim for:
- 2 body colorways
- 2 clothing palettes
- 2 hair/head variants where feasible
- accessory swaps like bag, helmet, dupatta, glasses, newspaper

### Customer animation set
- walk in
- queue idle A
- queue idle B
- receive item
- pay / tip
- happy leave
- impatient leave

## 4. Props List
### Service props
- steel kettle
- premium kettle upgrade
- tea cups
- kulhad cups
- steel glasses
- milk can
- tea canister
- masala jar
- ladle / spoon
- serving tray

### Food props
- biscuit packet display
- bun maska plate
- samosa tray
- bread omelette plate
- coffee cup

### Stall props
- cash box
- QR/payment sign prop
- chalkboard menu
- paper menu strip
- branded cup sleeve later-tier prop
- fan
- queue rail
- dustbin
- water container
- handwash bucket optional

### Decoration / comfort props
- umbrella
- tarpaulin shade
- bench
- plastic chair
- planter
- hanging light
- wall clock
- newspaper stack
- radio

## 5. Animation List
### Must-have gameplay animations
- kettle steam loop
- brew bubble loop
- pour loop
- customer walk cycle
- worker serve cycle
- coin pop burst
- tip sparkle
- satisfaction emote pop
- queue warning pulse
- affordable card glow
- button press bounce
- venue upgrade reveal

### Nice-to-have polish animations
- cloth canopy sway
- hanging sign wobble
- rain splash overlay
- ambient traffic pass
- fan rotation
- premium unlock shimmer

## 6. UI Art List
### Panels and shells
- top HUD bar
- milestone card
- event banner frame
- upgrade card frame
- tab buttons x5
- modal frame
- tooltip bubble
- toast frame

### Controls
- primary button states
- secondary button states
- close button
- checkbox/toggle
- progress bar fill set
- slider if needed later

### Feedback assets
- coin burst VFX sprites
- unlock rays
- soft smoke/steam sprites
- sparkle sprites
- warning pulse ring

## 7. Asset Production Checklist
### Pre-production
- lock visual style guide before painting production assets
- confirm target resolution and export scale policy
- create character proportion sheet
- create venue perspective template
- create UI spacing grid and safe-area template

### Concept and approval
- 3 mood boards max, pick one direction quickly
- concept Tier 1 venue first
- concept 3 customer archetypes first before full set
- approve icon line/shape language before expanding icon sheet

### Production order, recommended
1. UI grayscale wireframes
2. Tier 1 environment pack
3. staff base characters
4. first 4 customer archetypes
5. core HUD icons
6. upgrade card shells and buttons
7. gameplay VFX
8. Tier 2 and Tier 3 venue upgrades
9. remaining customer variants and polish props
10. store capsule / promo art later

### Technical packaging
- export layered masters in organized source files
- separate static and animated elements
- use consistent pivot points for character sprites
- name assets by category and tier
- keep sprite atlas groups under memory-friendly limits
- document all 9-slice UI frames

### QA checklist
- check readability at small Android screen sizes
- verify text does not overlap ornate frames
- test icon clarity at 24dp and 32dp
- confirm silhouettes remain readable on busy backgrounds
- remove unnecessary alpha padding from exports
- confirm animation loops do not look jittery at 30 fps

### Done definition for v1 art
- Tier 1 to Tier 3 venues visually complete
- gameplay HUD complete
- at least 5 staff/customer archetypes fully usable in-game
- all core menu items have icons
- all must-have gameplay VFX implemented
- one venue upgrade reveal sequence polished enough for trailer capture

## 8. Recommended Directory Structure
```text
assets/
  art/
    environments/
      tier1_tapri/
      tier2_bazaar_cart/
      tier3_corner_stall/
      shared/
    characters/
      staff/
      customers/
    props/
      service/
      food/
      decor/
    ui/
      hud/
      cards/
      buttons/
      icons/
      fx/
    animations/
      character_sheets/
      vfx/
  source/
    concept/
    layered_masters/
```
