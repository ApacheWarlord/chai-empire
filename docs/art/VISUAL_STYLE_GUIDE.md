# Chai Empire 2.5D Visual Style Guide

## Visual Goal
Create a warm, aspirational, India-native chai business world that feels handcrafted, readable on small screens, and lively without needing expensive real-time 3D.

## Style Summary
- **Format:** 2.5D illustrated mobile game
- **Camera:** fixed three-quarter view, slightly elevated
- **Readability:** bold silhouettes, simplified props, high contrast on interactable areas
- **Mood:** cozy, busy, optimistic, street-smart
- **Rendering:** hand-painted textures with soft gradients, baked shadows, subtle rim light

## 2.5D Rules
Use layered 2D assets to imply depth.
- foreground props overlap customer feet and stall base
- character bodies are side/front hybrid so faces remain readable
- counters, benches, jars, signboards, and stoves use angled tops
- ground planes include soft oval shadows under all moveable entities
- avoid realistic perspective distortion that fights UI readability

## Art Pillars
1. **Warmth first**: steam, tea tones, cream highlights, evening-glow lighting.
2. **Readable business fantasy**: player instantly sees queue, workers, service stations, and upgrades.
3. **Cultural specificity without clutter**: kulhad cups, steel kettles, biscuit jars, signboards, tarpaulin roofs, tiled counters.
4. **Upgrade visibility**: every major purchase should visibly improve the stall.
5. **Performance-aware polish**: texture reuse, modular props, low animation complexity.

## Shape Language
- rounded rectangles and circles for friendly UI and customer silhouettes
- trapezoids and angled planes for counters, roofs, carts, and menu boards
- avoid thin lines, tiny ornament, or photoreal detail

## Material Language
- brass and warm steel for kettles and cookware
- painted wood for signage and shelves
- cream ceramic and red clay for cups
- fabric tarps and plastic stools for early tiers
- tile, enamel board, and branded panels for later tiers

## Color System
### Primary Brand Colors
- Chai Brown: `#6B3E26`
- Milk Tea Beige: `#E7D2B2`
- Kulhad Clay: `#A85A3A`
- Saffron Accent: `#E39A2D`
- Bazaar Green: `#3F8A57`
- Monsoon Blue: `#557A95`
- Deep Maroon: `#7A2E2E`
- Steam Cream: `#FFF7EC`

### Functional UI Colors
- Coin Gold: `#F4C542`
- Success Green: `#44A85A`
- Warning Amber: `#F0A43A`
- Danger Red: `#D9534F`
- Info Blue: `#4A90C2`
- Locked Grey: `#8B8F96`
- Panel Dark: `#2E2A28`
- Soft Outline: `#4C413A`

### Usage Rules
- keep warm neutrals dominant
- use saffron and gold for rewards, premium unlocks, and momentum
- use green for growth and affordability only
- reserve red for actual risk, abandonment, or negative states
- maintain WCAG-friendly contrast on text overlays and buttons

## Lighting
- broad ambient daylight with warm highlights
- steam and tea glow can provide micro warmth around the kettle station
- late-tier venues may add more controlled interior lighting with brighter signage
- no harsh dynamic shadows required; use painted drop shadows and contact shadows

## Texture Direction
- matte painted surfaces
- minimal noise, no photo overlays
- tiny wear marks on counters and signs for authenticity
- keep surfaces clean enough for casual mobile readability

## Line and Edge Treatment
- subtle dark outline or edge separation on characters and key props
- thicker outline on small icons
- use inner shadow/highlight pairs to make buttons feel tactile

## Typography Direction
Recommended mobile-safe families:
- heading: **Baloo 2 SemiBold** or **Nunito ExtraBold**
- body/UI: **Inter**, **Nunito**, or **Noto Sans**

Typography rules:
- use sentence case for most UI
- short labels, high legibility
- avoid ornate display fonts in gameplay HUD

## Venue Tier Art Evolution
### Tier 1, Tapri Start
- roadside stove
- tin sheet roof or cloth shade
- hand-painted signboard
- plastic stools, crate seating
- single kettle, biscuit jars

### Tier 2, Bazaar Cart
- wheeled cart body
- brighter painted panels
- more organized snack display
- umbrella or improved canopy

### Tier 3, Corner Stall
- permanent counter
- glass snack case
- wall menu board
- second prep zone visible

### Tier 4, Mohalla Chai Shop
- tiled surfaces
- fan, branded cups, better lighting
- more queue management rails and seating

### Tier 5+, Cafe / Empire tiers
- stronger brand identity
- denser interior detail
- richer signage, cups, packaging
- cleaner geometry and more premium finishes

## Character Art Direction
- cheerful, readable silhouettes over realism
- slightly oversized heads/hands for emotional clarity on phones
- simple facial features, strong mustache/hair/accessory variety
- clothing reflects broad urban and small-town India without stereotypes
- use color blocking to distinguish archetypes quickly

## FX Direction
- steam wisps
- coin pops
- satisfaction hearts/smiles
- dust/speed puffs for rush moments
- glow pulse on new unlocks
- subtle shimmer on premium upgrades

## Production Constraints
- target sprite sheets with modular reuse
- default character base shared across variants where possible
- keep alpha-heavy VFX limited
- separate assets into background, midground, gameplay entities, and UI
- prefer 1x master art at production resolution with export variants for devices

## Mobile Export Guidance
- design primary composition for 1080x1920 portrait safe area
- maintain core HUD readability inside narrower Android aspect ratios
- avoid putting critical UI in extreme corners due to device cutouts
- plan 2x and 3x icon exports for iOS and Android storefront/UI needs
