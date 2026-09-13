---
version: "alpha"
name: "Design System Specification"
description: "Material Design 3 (M3) token specification. Defines semantic color roles, 15-token typography scale, corner radius scale, tonal elevation, and adaptive layout rules."
colors:
  primary: "#38bdf8"
  on-primary: "#082f49"
  primary-container: "#0c4a6e"
  on-primary-container: "#e0f2fe"
  secondary: "#94a3b8"
  on-secondary: "#0f172a"
  secondary-container: "#1e293b"
  on-secondary-container: "#f1f5f9"
  surface: "#090d16"
  on-surface: "#f3f4f6"
  surface-variant: "#111827"
  on-surface-variant: "#94a3b8"
  surface-container-lowest: "#060910"
  surface-container-low: "#0d131f"
  surface-container: "#111827"
  surface-container-high: "#162033"
  surface-container-highest: "#1f293d"
  error: "#dc2626"
  on-error: "#ffffff"
  error-container: "#450a0a"
  on-error-container: "#fecaca"
  outline: "#334155"
  outline-variant: "#1f293d"
typography:
  display-lg:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: "57px"
    fontWeight: "400"
    lineHeight: "64px"
    letterSpacing: "-0.25px"
  display-md:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: "45px"
    fontWeight: "400"
    lineHeight: "52px"
    letterSpacing: "0px"
  display-sm:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: "400"
    lineHeight: "44px"
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: "400"
    lineHeight: "40px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: "400"
    lineHeight: "36px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: "400"
    lineHeight: "32px"
    letterSpacing: "0px"
  title-lg:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: "400"
    lineHeight: "28px"
    letterSpacing: "0px"
  title-md:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: "500"
    lineHeight: "24px"
    letterSpacing: "0.15px"
  title-sm:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "20px"
    letterSpacing: "0.1px"
  body-lg:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
    letterSpacing: "0.5px"
  body-md:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "20px"
    letterSpacing: "0.25px"
  body-sm:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "16px"
    letterSpacing: "0.4px"
  label-lg:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "20px"
    letterSpacing: "0.1px"
  label-md:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "16px"
    letterSpacing: "0.5px"
  label-sm:
    fontFamily: "'Roboto', 'Roboto Flex', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: "500"
    lineHeight: "16px"
    letterSpacing: "0.5px"
rounded:
  none: "0px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "28px"
  full: "9999px"
spacing:
  none: "0px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  xxxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.full}"
  button-tonal:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
  button-outlined:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  card-container:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  card-elevated:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  card-filled:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  badge:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-error}"
    rounded: "{rounded.full}"
  badge-container:
    backgroundColor: "{colors.error-container}"
    textColor: "{colors.on-error-container}"
    rounded: "{rounded.full}"
  input-field:
    backgroundColor: "{colors.surface-variant}"
    textColor: "{colors.on-surface-variant}"
    rounded: "{rounded.xs}"
  surface-lowest:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  surface-high:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  action-primary-container:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.lg}"
---

## Overview

Project design system specification aligned with Material Design 3 (M3). Configured for high visual fidelity, dark-mode default contrast, and token-driven consistency across components.

- **Design Framework:** Material Design 3 (M3)
- **Primary Typefaces:** `'Roboto Flex'`, `'Roboto'`, and `'Roboto Mono'`
- **Theme:** Dark mode default with high-contrast surfaces and cyan brand accents.

---

## Colors

Semantic color roles for application state and components:

| Role | Value | Contrast & Usage |
|---|---|---|
| `primary` | `#38bdf8` | High-emphasis actions and accents (Pair with `on-primary` `#082f49`) |
| `primary-container` | `#0c4a6e` | Standout highlights and badges (Pair with `on-primary-container` `#e0f2fe`) |
| `secondary` | `#94a3b8` | Muted labels and secondary controls (Pair with `on-secondary` `#0f172a`) |
| `surface` | `#090d16` | Main background layer (Pair with `on-surface` `#f3f4f6`) |
| `surface-container-low` | `#0d131f` | Lower card container tier |
| `surface-container` | `#111827` | Default card and panel background |
| `surface-container-high` | `#162033` | Hover states and elevated cards |
| `surface-container-highest` | `#1f293d` | Modals, active inputs, borders |
| `error` | `#ef4444` | Errors and critical warnings (Pair with `on-error` `#ffffff`) |
| `outline` | `#334155` | Borders and structural boundaries |
| `outline-variant` | `#1f293d` | Subtle card dividers |

---

## Typography

Standard 15-token Material Design 3 scale:

- **Brand / Display / Body:** `'Roboto Flex'`, `'Roboto'`, system-ui, -apple-system, sans-serif
- **Monospace / Code:** `'Roboto Mono'`, monospace

---

## Layout

- **Spacing:** 8dp grid with 4dp steps (`space-xs`: 4px, `space-sm`: 8px, `space-md`: 16px, `space-lg`: 24px, `space-xl`: 32px).
- **Responsive Breakpoints:** Compact (<600dp), Medium (600-839dp), Expanded (840-1199dp), Large (>=1200dp).

---

## Elevation & Depth

Achieved primarily through tonal shifts between `surface`, `surface-container`, `surface-container-high`, and `surface-container-highest`.

---

## Shapes

- `xs`: 4px (inputs, badges)
- `sm`: 8px (chips, compact items)
- `md`: 12px (cards, standard containers)
- `lg`: 16px (FAB, modals)
- `full`: 9999px (pill buttons, circular badges)

---

## Components

- **Buttons:** Filled (`primary`), Tonal (`secondary-container`), Outlined (`outline`), Text. Shape: `full`.
- **Cards:** Background `surface-container`, border 1px solid `outline-variant`, shape `md`.
- **Inputs:** Background `surface-variant`, shape `xs`.

---

## Do's and Don'ts

- **Do** use semantic CSS variables (`var(--color-primary)`, `var(--color-surface)`) instead of hardcoded hex values.
- **Do** ensure all interactive elements have at least 48x48dp touch targets.
- **Do** maintain WCAG 2.1 AA minimum contrast (4.5:1 text, 3:1 graphical).
- **Don't** use pure `#000000` for dark mode surfaces; use calibrated dark slate tones (`#090d16`).

---

## Documentation & Reference Links

- **M3 Foundations:** https://m3.material.io/foundations
- **Color Roles & System:** https://m3.material.io/styles/color/roles
- **Type Scale Tokens:** https://m3.material.io/styles/typography/type-scale-tokens
- **Elevation Tokens:** https://m3.material.io/styles/elevation/tokens
- **Corner Radius Scale:** https://m3.material.io/styles/shape/corner-radius-scale
- **Components Catalog:** https://m3.material.io/components
