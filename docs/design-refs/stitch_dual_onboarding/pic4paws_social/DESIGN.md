---
name: Pic4Paws Social
colors:
  background-light: '#f8f6f6'
  surface-white: '#ffffff'
  text-main: '#0f172a'
  text-muted: '#64748b'
  border-subtle: '#f1f5f9'
  overlay-glass: rgba(255, 255, 255, 0.9)
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-xs:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
  button-text:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 448px
  edge-margin: 1rem
  stack-gap: 1.5rem
  element-padding: 0.75rem
  inner-gap: 0.5rem
---

## Brand & Style

Pic4Paws is a high-energy, mission-driven social platform designed to bridge the gap between animal shelters and potential adopters. The brand personality is **optimistic, urgent, and community-centric**. 

The design follows a **Modern-Tactile** aesthetic. It combines the clean, systematic layout of a social feed with high-impact "action-first" overlays. By using a vibrant primary orange against a clean white backdrop, the UI evokes a sense of warmth and immediate action. The style emphasizes clarity and emotional connection, using large-scale photography as the primary driver of the user experience.

## Colors

The palette is anchored by **Rescue Orange (#ec5b13)**, a high-visibility color that signifies energy and urgency. This is balanced by **Teal Secondary (#2dd4bf)**, used for supportive actions like "Sponsor," providing a calming contrast to the primary heat.

- **Primary:** Used for the main CTA (Adopt), active navigation states, and branding icons.
- **Secondary:** Reserved for secondary conversion points and specialized status indicators.
- **Neutral/Background:** We use a very light grey-tinted white for the page background to reduce glare, while keeping cards and headers pure white to create a subtle "lift."
- **Typography Colors:** Slate-900 for high-contrast readability in body text and Slate-500 for secondary metadata.

## Typography

We use **Inter** exclusively to maintain a clean, "app-first" utilitarian feel that doesn't distract from the photography. 

The hierarchy relies heavily on weight rather than just scale. Headlines and names are rendered in **Bold (700)** to stand out against the high-density information of a social feed. Captions use a slightly increased line-height for better readability on mobile devices. Navigation labels at the bottom of the screen use a tight 10px bold style to maximize screen real estate while remaining legible.

## Layout & Spacing

The system is designed as a **Fixed-Width Mobile Container** centered on larger screens, maximizing readability. 

- **Vertical Rhythm:** Post items are separated by a consistent 1.5rem bottom padding and a subtle 1px border. 
- **The 4/5 Aspect Ratio:** All primary media content is locked to a 4:5 aspect ratio, providing a taller, more immersive portrait view optimized for mobile scrolling.
- **Overlays:** Action buttons are positioned 1.5rem from the bottom and 1rem from the sides of the media container to ensure they sit within the thumb-zone.

## Elevation & Depth

Hierarchy is achieved through a mix of **Tonal Layering** and **Material Overlays**:

1.  **Level 0 (Background):** Light-grey tint (#f8f6f6) acts as the canvas.
2.  **Level 1 (Cards/Headers):** Pure white surfaces with 1px subtle borders (Slate-100) create the primary container.
3.  **Level 2 (Interaction Bar):** The bottom navigation uses a high-blur backdrop filter (95% opacity white with `backdrop-blur-md`) to appear floating above the content.
4.  **Level 3 (Action Buttons):** Buttons within the photo container use `shadow-lg` to create clear separation from the image background, ensuring they are perceived as interactive physical layers.

## Shapes

The design uses a **Rounded (Level 2)** shape language to feel approachable and friendly, appropriate for a pet-themed platform.

- **Primary Containers:** No rounding (full width) to maximize image impact.
- **Interaction Elements:** Buttons and overlays use `rounded-xl` (1.5rem/24px) to create a soft, pill-like appearance that invites tapping.
- **Avatar Elements:** 100% circular (full rounding) to clearly distinguish human/shelter identities from pet photography.

## Components

### Buttons
- **Primary (Adopt):** Solid Rescue Orange with white bold text and a leading icon. Large vertical padding (12px-14px).
- **Secondary (Sponsor/Donate):** Solid Teal or Glassmorphic white. Both use 8px-10px vertical padding for a slightly smaller footprint.
- **Ghost/Icon:** Flat Slate-600 icons with no background, increasing to Primary Orange on active state.

### Cards (Post Items)
Full-bleed on the horizontal axis with a structured header (Avatar + Title + Metadata) and a footer interaction bar. The "Like" icon in the interaction bar should always use the Primary Orange.

### Tabs
Flat style with a 2px bottom border in Primary Orange for the active state. Text weight should be Bold (700) for both states, using color to differentiate.

### Navigation
A persistent bottom bar with a blurred background. Icons should use `font-variation-fill` for the active state to provide a strong visual cue.