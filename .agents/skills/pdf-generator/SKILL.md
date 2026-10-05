---
name: pdf-generator
description: "Guidelines and architecture for generating high-fidelity, printable educational PDFs, parchment study sheets, and physical flashcards. Adapted from anthropics/skills/pdf for Hogwarts Audio English learning platform."
---

# PDF & Printable Learning Materials Generator

Adapted from Anthropic's official `pdf` skill in `anthropics/skills`.

## Purpose

Provide client-side, zero-dependency, and 100% offline generation of elegant, high-contrast, printable learning materials:
- Printable A4 cut-out parchment flashcards (6 cards per sheet, 2 columns × 3 rows)
- Study transcripts and bilingual reading guides
- Ebbinghaus spaced repetition offline study checklists

## Technical Architecture: Pure Vector Print Engine

Rather than relying on bulky 1MB+ binary libraries (like jsPDF) that lack native Chinese CJK font subsets and distort IPA phonetic symbols, this architecture utilizes **W3C Paged Media & Vector Print stylesheets**:

1. **Page Geometry**:
   ```css
   @page {
     size: A4 portrait;
     margin: 10mm 10mm 10mm 10mm;
   }
   ```
2. **Page-Break Discipline**:
   - Prevent cards from splitting across page breaks:
     ```css
     .parchment-card {
       break-inside: avoid;
       page-break-inside: avoid;
     }
     ```
3. **Typography**:
   - High-contrast serif headlines for aesthetic authenticity.
   - Standard phonetic IPA glyph rendering using system font stacks (`Segoe UI`, `-apple-system`, `Lucida Sans Unicode`).
4. **Offline & Privacy**:
   - 100% client-side memory execution (`Blob` or `iframe`). No learner data or vocabulary lists are sent over the network.
