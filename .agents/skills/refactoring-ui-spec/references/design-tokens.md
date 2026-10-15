# Hogwarts Design System Tokens & Tailwind Palette

This document defines the single source of truth for all visual tokens in the Hogwarts Audio English learning platform, fully aligned with the *Refactoring UI* color scale, typography, and spacing principles.

---

## 1. Parchment Academy Color Palette

Never use raw arbitrary hex codes outside these designated tokens.

### A. Surfaces & Backgrounds
| Token / Class | Hex | Usage |
| :--- | :--- | :--- |
| `bg-[#fbf9f4]` / `theme-parchment` | `#fbf9f4` | App canvas background (warm daylight parchment, eye-care compliant) |
| `bg-white` | `#ffffff` | Primary content card surface (contrasts gently against parchment) |
| `bg-[#f7f3ed]` / `bg-stone-50` | `#f7f3ed` | Secondary surface, quote blocks, nested context sentence container |
| `bg-[#fbf9f5]` | `#fbf9f5` | Drawer/modal body surface |

### B. Borders (Subtle & Deliberate)
| Token / Class | Hex | Usage |
| :--- | :--- | :--- |
| `border-[#e8ddd0]` | `#e8ddd0` | Default card & container hairline border (warm parchment ochre) |
| `border-[#d4c4a8]` | `#d4c4a8` | Strong border, input borders on hover, modal dividers |
| `border-amber-300/80` | `#fcd34d` | Accent card border, active highlights |
| `border-amber-500` | `#f59e0b` | Selected / active state border (4px accent indicator) |

### C. Text Hierarchy (3-Step Minimum Scale)
| Token / Class | Hex | Usage |
| :--- | :--- | :--- |
| `text-amber-950` / `text-[#1e1610]` | `#1e1610` | Primary headlines, target English words, emphasis text |
| `text-stone-700` / `text-[#5c4d3c]` | `#5c4d3c` | English sentence body, Chinese translations |
| `text-stone-500` / `text-[#8b7b6b]` | `#8b7b6b` | Secondary captions, timestamps, chapter numbers |
| `text-stone-400` | `#a8a29e` | Tertiary metadata, inactive icons, subtle hints |

### D. Primary Accent (Hogwarts Amber Gold)
| Shade | Tailwind Class | Hex | Usage |
| :--- | :--- | :--- | :--- |
| 50 | `bg-amber-50` | `#fffbeb` | Active card subtle background tint |
| 100 | `bg-amber-100` | `#fef3c7` | Badge background (exam vocabulary) |
| 200 | `border-amber-200` | `#fde68a` | Subtle container border |
| 300 | `border-amber-300` | `#fcd34d` | Interactive hover border |
| 500 | `bg-amber-500` | `#f59e0b` | **Primary Brand Color**: CTA buttons, active tabs, play transport |
| 600 | `bg-amber-600` / `text-amber-600` | `#d97706` | Button hover, icon emphasis |
| 700 | `text-amber-700` | `#b45309` | High-contrast accent text |
| 800 | `text-amber-800` | `#92400e` | Dark text on amber-100 badge |
| 900 | `text-amber-900` | `#78350f` | Deep brand text |
| 950 | `text-amber-950` | `#451a03` | Highest hierarchy brand title |

### E. Semantic Accents (WCAG AAA Dark-on-Light)
| Status | Background | Border | Text | Icon |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `bg-emerald-100` | `border-emerald-300` | `text-emerald-900` | `CheckCircle2` |
| **Warning / Streak** | `bg-orange-100` | `border-orange-300` | `text-orange-900` | `Flame` |
| **Danger / Mistake** | `bg-rose-100` | `border-rose-300` | `text-rose-900` | `AlertCircle` / `RotateCcw` |
| **Magic Lore** | `bg-red-100` | `border-red-300` | `text-red-900` | `Sparkles` |
| **SRS Memory Box** | `bg-indigo-100` | `border-indigo-300` | `text-indigo-900` | `BrainCircuit` |

---

## 2. Spacing Ladder (Rhythm of 4 & 8)

Use predictable increments rather than arbitrary margin/padding values:
- `p-1` / `gap-1`: 4px (micro icon/badge gap)
- `p-2` / `gap-2`: 8px (button inner elements, badge padding)
- `p-3` / `gap-3`: 12px (card compact padding, toolbar gaps)
- `p-4` / `gap-4`: 16px (standard mobile card padding, list gap)
- `p-6` / `gap-6`: 24px (desktop card padding, section gap)
- `p-8` / `gap-8`: 32px (major page section divider)

**Proximity Rule**:
- Component internal gap: `gap-1` or `gap-1.5` (4px - 6px)
- Related group gap: `gap-3` (12px)
- Unrelated module gap: `gap-6` (24px)

---

## 3. Corner Radius Scale
- `rounded-lg`: 8px (small badges, segmented control pill buttons)
- `rounded-xl`: 12px (standard control buttons, input fields)
- `rounded-2xl`: 16px (modal internal cards, sentence cards, dropdown menus)
- `rounded-3xl`: 24px (top level modal containers, hero banner)
- `rounded-full`: 9999px (circular play buttons, tags, status pills)

---

## 4. Touch Targets & Safe Area Tokens
- Minimum touch size: `min-h-[44px]` and `min-w-[44px]` (Apple HIG compliance)
- Touch latency elimination: `touch-manipulation`
- iOS Top Notch / Dynamic Island: `pt-safe`
- iOS Home Indicator: `pb-safe`
- Mobile Bottom Sheet handle: `w-10 h-1.5 bg-stone-300 rounded-full mx-auto`
