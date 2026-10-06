# Jilebi visual system

## Direction

A warm, photographic invitation to dinner. Diners browsing on a phone in daylight should immediately find the food, the atmosphere, and the booking action. Preserve the ivory foundation and restrained gold from PRODUCT.md.

## Color

Ivory #FDFAF5 is the main surface; charcoal #1C1C1C carries text and primary actions. Gold #C9923A is decorative, while gold-ink #8C631F provides readable small accent text. Sand #E8E0D4 separates content. The story and gallery use a warm paper surface, oklch(95.6% .018 80). The footer is charcoal with ivory text.

## Typography

Preserve Georgia for the brand and display headings, paired with the existing Inter body family. The wordmark uses a large, tightly spaced upright serif. Display headings use fluid sizing and occasional italic gold-ink emphasis. Uppercase tracking is reserved for navigation, section numbering, and compact labels. Body text remains sentence case with generous line height.

## Composition

Page order in both languages: Hero → Our Story (01) → Menu (02) → Reservations (03) → Gallery (04) → Footer. Visitors can book directly after browsing the food.

The hero pairs the oversized wordmark with one warm butter-chicken photograph in a thin ivory frame and a quiet caption. The photograph uses a landscape crop on desktop and tablet, and a slightly closer crop on mobile. Below 1024px, the copy and photograph stack. Short desktop viewports use smaller display type and tighter upper spacing to keep the hero actions visible. The story combines room photography with narrative copy. The menu pairs category photography with priced rows and keyboard-operable tabs. The gallery varies image sizes. The reservation section puts a welcome beside the existing two-step booking form. The footer groups contact information and hours under a final invitation.

## Page proportions

Use the hero as the visual anchor. Story, menu, reservations, gallery, and footer use vertical padding of clamp(3rem, 4.5vw, 5.5rem), reduced to 40px below 768px; retain the footer's 28px bottom padding. Section titles range from 36px to 60px, with reservations capped at 56px. Section eyebrows have a 16px bottom gap; heading rows separate from content by 32px on desktop and 24px on mobile. Body text and booking controls retain their sizes. Sections grow naturally with content.

Story photographs range from 360px to 440px high, with 300px on mobile. Menu photographs range from 360px to 440px, with the existing 160px mobile crop; desktop menu rows use 24px vertical padding. The gallery keeps all six photographs and its mosaic: regular image minimums are 170px, the featured image 375px, and the panorama 190px. Mobile minimums are 280px for the featured image and 160px for other images. Footer heading separation is 32px, and the information grid uses 32px upper and 40px lower padding.

## Interaction and accessibility

Keep booking actions visible in desktop and mobile navigation. Hidden mobile navigation must not expose focusable links. Menu tabs support arrows, Home and End with roving focus. Preserve the gallery lightbox and booking form focus handling. Use visible focus outlines and reduced-motion overrides. Motion is limited to opacity and transforms. All new visitor-facing copy belongs in both locale files.

## Responsive behavior

At narrow widths, sections stack, menu photographs become shorter, gallery images use two columns, and the booking calendar and options become one column. Between 768px and 1199px, booking introduction and form stack while the calendar and time choices can remain side by side. Check German as well as English before changing spacing.

## Booking surface

The booking form uses a subtly rounded warm-paper surface, restrained shadow, serif invitation, and compact two-step progress. A tinted calendar panel separates date selection from guest and time controls. Unavailable days are quiet rather than struck through. Selected dates use solid gold-ink; selected time rows use a pale gold background and a checkmark. A bottom action bar summarizes date, guests, and time beside Continue. Contact fields and the confirmation state share this treatment. On mobile, the panels stack and the smallest screens give the action a full-width row.

## Assets

Use local restaurant and food photographs through next/image. Menu categories show representative dishes or drinks: samosas for starters, butter chicken for mains, gulab jamun for desserts, and mango lassi for drinks. The starter and drink assets are generated for the portfolio demo; prompts are recorded in docs/menu-image-prompts.md. Do not add invented reviews, awards, or ratings. Preserve the portfolio-demo notice and clearly labeled external directions link.
