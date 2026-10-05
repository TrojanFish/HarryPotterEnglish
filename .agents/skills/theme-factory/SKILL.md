---
name: theme-factory
description: "Toolkit for defining, testing, and applying consistent color themes and typography pairings across UI views and printable artifacts. Adapted from anthropics/skills/theme-factory for Hogwarts Audio English learning platform."
---

# Theme Factory (Hogwarts Houses Edition)

Adapted from Anthropic's official `theme-factory` skill in `anthropics/skills`.

## Purpose

Enforce strict, accessible, and visually authentic themes across the application and generated learning materials (PDFs, flashcards, study sheets).

## Core Palettes & Tokens

### 1. Classic Parchment (Default Core)
- **Background**: `#fbf9f4` (Warm vintage parchment)
- **Surface**: `#ffffff` (Crisp reading card)
- **Surface Alt**: `#f7f3ed` (Subtle container)
- **Border**: `#e8ddd0` (Aged parchment seam, 1.5px flat)
- **Border Strong**: `#d4c4a8`
- **Primary Accent**: `#f59e0b` / `#d97706` (Amber gold)
- **Text Primary**: `#1e1610` (Dark ink, WCAG AAA compliant on `#fbf9f4`)
- **Text Secondary**: `#5c4d3c`
- **Text Muted**: `#8b7b6b`

### 2. Gryffindor Scarlet & Gold
- **Accent**: `#b91c1c` (Deep crimson)
- **Highlight**: `#f59e0b` (Lion gold)
- **Border**: `#fecaca` / `#b91c1c`
- **Focus**: High energy, courage, active speaking and shadowing

### 3. Slytherin Emerald & Silver
- **Accent**: `#047857` (Serpent emerald)
- **Highlight**: `#e2e8f0` (Noble silver)
- **Border**: `#a7f3d0` / `#059669`
- **Focus**: Ambition, deep grammar precision, streak mastery

### 4. Ravenclaw Sapphire & Bronze
- **Accent**: `#1d4ed8` (Eagle sapphire)
- **Highlight**: `#d97706` (Antique bronze)
- **Border**: `#bfdbfe` / `#2563eb`
- **Focus**: Wisdom, extensive vocabulary expansion, reading depth

### 5. Hufflepuff Badger Gold & Earth
- **Accent**: `#d97706` (Warm badger gold)
- **Highlight**: `#292524` (Deep earth black)
- **Border**: `#fde68a`
- **Focus**: Dedication, consistent daily 5-minute study habit

## Contrast and Accessibility Floor

- Every text-to-background contrast ratio must satisfy WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for large text / buttons).
- Dual-channel status indicators: never rely solely on color; combine icons with text or borders.
- Dark on light is the standard for long-form adolescent and adult reading comfort.
