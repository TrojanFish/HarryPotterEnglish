---
name: webapp-testing
description: "Toolkit and methodology for interacting with and testing web applications across multiple viewports (iPhone 375px/390px, iPad, Desktop). Adapted from anthropics/skills/webapp-testing for Hogwarts Audio."
---

# Web Application Testing (Hogwarts Audio Edition)

Adapted from Anthropic's official `webapp-testing` skill in `anthropics/skills`.

## Purpose

Automate frontend functionality testing, regression defense, multi-viewport layout validation, and DOM inspection across desktop and mobile form factors.

## Key Testing Dimensions

### 1. Viewport Matrix
Always verify layouts across these 4 standard viewport profiles:
- **Mobile Compact**: `375 × 667` (iPhone SE standard — testing worst-case horizontal crowding)
- **Mobile Modern**: `390 × 844` (iPhone 14/15 standard)
- **Tablet**: `768 × 1024` (iPad portrait)
- **Desktop**: `1280 × 800` (MacBook / Laptop standard)

### 2. Reconnaissance-Then-Action Pattern
1. Inspect rendered DOM and element bounds:
   - Verify that horizontal elements do not cause horizontal page overflow (`scrollWidth <= clientWidth`).
   - Check that all interactive buttons have `min-height >= 44px` and `min-width >= 44px`.
   - Verify text inputs have `font-size >= 16px` on mobile screens (`<= 640px`).
2. Identify selectors via descriptive accessible roles (`role="button"`, `aria-label`, data attributes), rather than brittle class chains.
3. Execute actions and verify UI state changes.

### 3. Automated Regression Protocol
- Run unit test suite: `npm test`
- Run design audits: `npm run check-emojis`
- Run security audits: `npm run verify-security`
- Run production bundle build: `npm run build`
