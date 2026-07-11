---
name: Monochrome Precision
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#4c4546'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0e0'
  on-secondary-container: '#616363'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1200px
  gutter: 16px
---

## Brand & Style

This design system is built on the principles of high-utility minimalism and "Linear-style" precision. It targets a professional audience that values speed, clarity, and a distraction-free communication environment. The aesthetic is "Apple-esque," prioritizing intentional whitespace, crisp edges, and a strict monochromatic palette to ensure that the user's content—the conversation—remains the focal point. 

The emotional response should be one of "calm productivity." By removing unnecessary ornamentation and color, the UI recedes into the background, allowing the structural hierarchy and typography to guide the user's focus.

## Colors

The palette is strictly achromatic, leveraging the high contrast between pure black and pure white to create a sense of premium authority. 

- **Primary**: Pure Black (#000000) is used for primary actions, text, and critical UI anchors.
- **Secondary**: Pure White (#FFFFFF) serves as the base for all surfaces and message bubbles to maintain a clean "airlight" feel.
- **Accents/Neutrals**: Light grays define the architecture. `#F3F4F6` is used for secondary surfaces (like sidebars), while `#E5E7EB` is the standard for hairline borders.
- **Interactive**: Subtle shifts in gray (e.g., `#F9FAFB`) indicate hover states without breaking the monochromatic harmony.

## Typography

The design system utilizes **Geist** for its technical precision and optimal legibility in data-dense environments. The typographic scale is tight, with a focus on clear information hierarchy through weight rather than size. 

- **Headlines**: Use semi-bold weights with slight negative letter-spacing to create a "locked-in" professional look.
- **Body**: Standardized at 14px for chat messages to allow for high information density while maintaining readability.
- **Labels**: Small, uppercase labels are used for metadata (timestamps, status indicators) to distinguish UI controls from user content.

## Layout & Spacing

The layout follows a 4px baseline grid to ensure mathematical alignment across all elements. 

- **Structure**: A fixed-sidebar layout is used for navigation and thread lists, while the main chat window utilizes a fluid container that caps at 1200px to maintain comfortable line lengths.
- **Margins**: A standard 24px margin is applied to main containers to provide the "spacious" feel characteristic of high-end software.
- **Mobile**: On mobile devices, sidebars collapse into drawers or separate views, and horizontal padding is reduced to 16px to maximize horizontal space for text.

## Elevation & Depth

Depth is achieved through **low-contrast outlines** and **tonal layering** rather than heavy shadows.

- **Level 0 (Base)**: White (#FFFFFF) background.
- **Level 1 (Surface)**: Soft gray (#F9FAFB) background with a 1px border (#E5E7EB). Used for the sidebar and search bars.
- **Popovers/Modals**: Pure white background with a very subtle, highly diffused ambient shadow (0px 10px 30px rgba(0,0,0,0.04)) and a 1px border to define the edge against the background.
- **Dividers**: 1px solid lines using #E5E7EB are used to separate chat threads and header sections.

## Shapes

The shape language is "Soft" (0.25rem / 4px), aligning with the precision of the Geist typeface. 

- **Primary Components**: Buttons, input fields, and cards use a 4px corner radius.
- **Secondary Components**: Message bubbles use a slightly more generous 8px (rounded-lg) radius to create a distinction between "structural" elements and "content" elements.
- **Avatars**: Circular (fully rounded) to provide a soft counterpoint to the otherwise rectangular and structured UI.

## Components

- **Buttons**:
  - *Primary*: Pure black background, white text, no border.
  - *Secondary*: White background, 1px gray border (#E5E7EB), black text.
- **Input Fields**: 1px solid border (#E5E7EB). On focus, the border darkens to black. No drop shadows.
- **Message Bubbles**:
  - *Sent*: White background with a 1px border (#E5E7EB). Black text.
  - *Received*: Lightest gray background (#F3F4F6) with no border. Black text.
- **Lists**: Chat thread lists use a hover state of #F9FAFB. Active threads are indicated by a 2px black vertical bar on the leading edge.
- **Chips/Status**: Small, 4px rounded tags with light gray backgrounds and #6B7280 text for "Away" or "Offline" states.
- **Scrollbars**: Minimalist, non-persistent "overlay" style bars that only appear during interaction to reduce visual noise.