---
name: frontend-design
description: "Guidelines and heuristics for distinctive, purposeful frontend design. Adapted from anthropics/skills/frontend-design for the Hogwarts Audio English learning platform. Prevents generic AI SaaS templates, reinforces deliberate typography, active voice, and ergonomic clarity."
---

# Frontend Design Guidelines (Hogwarts Audio Edition)

Adapted from Anthropic's official `frontend-design` skill in `anthropics/skills`.

## Core Philosophy

Design is content and signposting, not decoration. Every element must serve the learner's focus: listening, understanding, and internalizing the English text.

## 1. Eradicate "Generic AI Design" Tells

AI-generated designs habitually default to predictable crutches. In this project, the following patterns are strictly audited and avoided:

1. **The SaaS-Card Kit**: Content chopped into identical rounded cards with identical radii regardless of hierarchy, soft grey box shadows, and decorative gradient washes.
   - *Fix*: Use flat borders, clear background contrast, and meaningful grouping.
2. **Template Chrome**:
   - Tracked-out ALL-CAPS eyebrow labels above headings (`text-xs tracking-widest uppercase`).
   - Long strings of metadata joined by middle dots (`Book 1 · Chapter 2 · 5 mins · 12 cues · Level 1`). Use natural phrasing or distinct pills instead.
   - Arbitrary trailing arrows appended to buttons (`→` or `->`). Use contextual icons from Lucide React.
   - Em dashes with arbitrary spaces (`WORD — fragment`).
3. **Random Accenting**:
   - Picking a single random word in a title and making it italic, gradient, or coloured. Treat titles as cohesive typographical units.
4. **Un-triggered Ambient Animations**:
   - Floating elements, continuous pulsating glow, or slide-up triggers on every card.
   - *Fix*: Reserve animation exclusively for user-triggered moments (audio playing soundwave, SRS card flip, milestone achievement chime).

## 2. Intentional Typography & Hierarchy

- **Font Pairing**:
  - Headings / Magical Branding: High-contrast serif or noble script (`font-magical`, `font-serif`, Georgia / Times New Roman).
  - Audio Subtitles & Reading: Highly legible humanist or neo-grotesque sans-serif with generous line-height (`leading-[1.75]`).
  - Timestamps, Cues, & Statistics: Monospace font (`font-mono`, tabular numbers `tabular-nums`) to prevent jittering during playback.
- **Hierarchy Without Inflation**:
  - Differentiate secondary and tertiary information through font weight (`font-semibold` vs `font-normal`) and muted warm tones (`text-stone-500`, `text-amber-800`), rather than inflating heading sizes.

## 3. Active-Voice Copywriting & Signposting

- All CTAs must use active verbs that clearly explain the outcome:
  - "打印羊皮纸单词卡 (PDF)", not "提交"
  - "导出 Anki 牌组", not "确定"
  - "开启智能复习", not "闪卡"
  - "清空全部生词", not "删除"
- Toasts and feedback must use the past tense of the same verb:
  - Click "导出 Anki 牌组" -> Toast "已成功导出 Anki 牌组文件"
  - Click "清空全部生词" -> Toast "生词本已清空"

## 4. Ergonomics Floor

- **Apple HIG Touch Target**: Every interactive element on mobile must have a minimum 44×44pt touch area.
- **The 16px Mobile Input Rule**: Text inputs must use `text-base` (16px) on mobile viewports to prevent iOS Safari auto-zoom.
- **Parchment Aesthetic**: Warm parchment palette (`#fbf9f4`, `#e8ddd0`, `#1e1610`, amber/bronze accents). Shadow-free, flat, and authentic.
- **Zero Emojis**: Strictly 100% SVG icons from `lucide-react`. Zero Unicode emojis in UI strings.
