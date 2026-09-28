# Jilebi — Design Context

This file is the source of truth for design decisions on the Jilebi restaurant website. All polish, redesign, and feature work should flow from this brief.

## Users

**Who.** Diners in and around Nürtingen, Germany — primarily German-speaking locals (DE is the default locale), with a secondary English-speaking audience (tourists, expats, business visitors). The site is consumed by:

- A first-time visitor evaluating where to eat tonight, on a phone, mid-walk or at a desk.
- A returning regular booking a table for a specific occasion.
- A planner choosing a venue for a small celebration (birthday, anniversary, work dinner).

**Job to be done.** Decide *"is this the right restaurant for me tonight?"* and, if yes, secure a table without friction. Secondary: read the menu, glance at the room, find the address.

**Context of use.** Daytime and evening, mostly mobile, often in a hurry. Some users are anxious (booking for an important date) — the interface should feel reassuring, not clever.

## Brand Personality

**Three words: warm, refined, soulful.**

- **Warm** — hospitable, inviting, generous. The visual equivalent of being met at the door with a smile.
- **Refined** — quiet sophistication, not flashy luxury. Considered choices in spacing, type, and color rather than decoration. The serif type, tracked uppercase labels, and gold rules already set this tone — keep that discipline.
- **Soulful** — there is a culture and a craft behind the food. The site should hint at depth without performing authenticity. Avoid stock-photo Indian-restaurant tropes (saffron-on-burgundy palettes, mandala flourishes, Bollywood-poster type, Taj Mahal silhouettes).

**Emotion to evoke.** Anticipation. The same feeling as walking past a restaurant at dusk and seeing candles on the tables.

## Aesthetic Direction

**Theme: light.** This is daytime hospitality, not a crypto landing page. The existing ivory background is correct — keep it. Dark accents for contrast, not as the dominant surface.

**Established palette (do not invent new colors without reason).**

| Token | Hex | Role |
|---|---|---|
| `ivory` | `#FDFAF5` | Page background, primary surface |
| `charcoal` | `#1C1C1C` | Primary text, dark CTAs |
| `gold` | `#C9923A` | Accent, hover states, rules, CTA hover |
| `muted` | `#7A6E5A` | Secondary text |
| `sand` | `#E8E0D4` | Borders, dividers, subtle surfaces |

**Typography.**

- Display: Georgia (serif). Used for section titles in tracked uppercase.
- Body: Inter / system-ui. Used for paragraphs, labels, controls.
- Letter-spacing tokens: `tracking-widest` (0.3em) for chips/labels, `tracking-brand` (0.25em) for section titles.

The serif/uppercase/tracked formula is the brand's strongest signature. Don't dilute it; refine it.

**What it should NOT look like.**

- Generic SaaS template (rounded-2xl gradient cards, identical 3-column feature grids, hero with floating screenshot).
- Stock-photo Indian-restaurant tropes (orange-on-burgundy, mandala flourishes, ornate calligraphy display fonts, Taj Mahal silhouettes).
- Trendy dark-mode glow aesthetic (neon accents, glassmorphism, purple→blue gradients).
- Motion-heavy / scroll-jacked / parallax-everything.

## Design Principles

These guide every decision:

1. **Restraint over decoration.** A single gold rule does more than three. Empty space is the brand.
2. **Type carries the voice.** Hierarchy comes from weight, scale, and tracking — not from cards, borders, or icons.
3. **Warm neutrals, sparing gold.** Gold is precious because it's rare. Use it on hover, on rules, on the one element that should be looked at — never on bulk surfaces.
4. **Reassure first, delight second.** This site exists to convert nervous bookers into confirmed reservations. Every interaction should feel calm and predictable. Surprise belongs in the food, not the form.
5. **Bilingual parity.** German and English layouts must both look intentional. German text is typically 20–30% longer — design for the longer string and let English breathe.
6. **Accessibility is hospitality.** Visible focus rings, generous tap targets, contrast that works in sun glare. Reduced-motion users get the same calm experience without animation.
