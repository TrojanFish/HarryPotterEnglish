# Hogwarts UI Quality Assurance Checklist (20 Refactoring Rules)

Run this checklist before submitting or reviewing any component, modal, or page redesign in this repository.

---

### Phase 1: Foundations & Personality
- [ ] **Rule 01: Personality Consistency**
  - Is the component consistent with the *Warm Parchment Academy* personality?
  - Are headers using `font-magical` and body text using `font-reading`?
  - Are border radiuses consistent (`rounded-xl` for controls, `rounded-2xl` for cards, `rounded-3xl` for modals)?
- [ ] **Rule 02: Greyscale Hierarchy First**
  - Does the layout hold together in pure black/white/parchment before adding amber color?
  - Are spatial hierarchy and contrast clear purely through typography and whitespace?
- [ ] **Rule 03: Hierarchy Without Font-Size Inflation**
  - Are primary texts emphasized using `font-bold` / `font-extrabold` rather than escalating to oversized text (`text-3xl+`)?
  - Are secondary texts muted using `text-stone-500` / `text-stone-400` instead of shrinking them below readable size (min 11px)?
- [ ] **Rule 04: De-emphasize to Emphasize**
  - When an element needs focus (e.g., active sentence, active tab), did you quiet down the competing siblings (e.g., lower opacity, border-transparent, muted text) rather than making the target flash or scream?
- [ ] **Rule 05: Eliminate Superfluous Labels**
  - Are self-evident fields (email, audio time, book count, word pronunciation) freed from redundant prefixes like `时长:`, `单词:`, `章节:`?
  - Does the formatting itself convey what the data is?

---

### Phase 2: Actions & Whitespace
- [ ] **Rule 06: Strict 3-Tier Action Pyramid**
  - Is there strictly **at most ONE primary action** (`.duo-btn-primary`, solid amber fill) on screen?
  - Are secondary actions styled with `.duo-btn-secondary` (outline border on white)?
  - Are tertiary/cancel/close actions styled with ghost or text links?
  - Are high-risk actions (clear vocab, delete cache) unobtrusive until the confirmation step?
- [ ] **Rule 07: Generous Whitespace (Start with Too Much)**
  - Do cards and modals have generous inner padding (`p-4` on mobile, `p-6` on desktop)?
  - Does the content breathe comfortably without hugging container borders?
- [ ] **Rule 08: Constrain Content Width**
  - Is desktop content constrained to readable maximum widths (`max-w-4xl` for reader, `max-w-2xl` for modals, `max-w-md` for popovers)?
  - Are wide screens prevented from stretching inputs or single-column cards across the entire monitor?
- [ ] **Rule 09: Spacing Proximity Law**
  - Is the gap between distinct sections/cards (`gap-4` to `gap-6`) visibly greater than the gap between child elements inside a section (`gap-1` to `gap-2`)?
  - Can users instinctively know which caption belongs to which title without dividing lines?
- [ ] **Rule 10: Adaptive Responsive Scaling**
  - Do desktop titles scale down reasonably on mobile (e.g., `text-2xl` on desktop -> `text-lg` or `text-base` on mobile)?
  - Are mobile form inputs locked to `>= 16px` (`text-base`) to prevent iOS Safari auto-zoom?

---

### Phase 3: Typography & Color Scale
- [ ] **Rule 11: Controlled Line Length & Adaptive Leading**
  - Are reading paragraphs bounded within 45-75 characters per line?
  - Is English subtitle line-height generous (`leading-[1.75]` ~ `leading-[1.8]`) for tap-to-lookup finger accuracy?
  - Are large headlines tightened to `leading-tight` (1.2 ~ 1.3)?
- [ ] **Rule 12: Baseline Alignment**
  - When mixed-size texts (e.g., word + phonetic + level badge) are aligned horizontally, do they use `items-baseline` rather than `items-center`?
- [ ] **Rule 13: Systematic Color Tiers**
  - Are surface, border, and text colors picked from the designated token scale (`theme-parchment`, `amber-500`, `stone-700`, `e8ddd0`) rather than arbitrary ad-hoc hex codes?
- [ ] **Rule 14: Accessible Dark-on-Light Badges**
  - Do status badges and exam level tags use gentle light backgrounds with dark text (`bg-amber-100 text-amber-900`) rather than glaring high-saturation fills?
  - Do they pass WCAG AAA (7:1) contrast?
- [ ] **Rule 15: Dual-Channel Status Indicators**
  - Does every status indicator convey meaning through **both** color and an icon/text?
  - Can colorblind users tell success vs. error purely from the icon (`CheckCircle2` vs. `AlertCircle`)?

---

### Phase 4: Polish & Edge Cases
- [ ] **Rule 16: Accent Borders for Visual Gravity**
  - Do active or highlighted items use a dedicated 4px accent border (`border-l-4 border-l-amber-500`) to anchor attention cleanly?
- [ ] **Rule 17: Stable Overlay on Images**
  - Are texts on book covers or background banners protected by a dark scrim (`bg-black/50`) or subtle dark backdrop to ensure 100% legibility?
- [ ] **Rule 18: Scaled Containers for SVG Icons**
  - Are Lucide icons kept at their natural scale (14px - 20px) and housed in padded rounded containers (`w-10 h-10 rounded-xl bg-amber-500/15`) rather than blown up into huge, clumsy vectors?
- [ ] **Rule 19: Restrained Borders (Subtle Deltas First)**
  - Did you check if background difference (`bg-[#fbf9f4]` vs `bg-white`) and whitespace are sufficient before drawing a 1px border?
  - Is the UI free from "Excel spreadsheet" grid clutter?
- [ ] **Rule 20: Intentional, Actionable Empty States**
  - When a list has 0 items (empty vocab, empty offline cache, 0 search results), does it show a friendly illustration/icon, comforting parchment copy, and a prominent Primary CTA to begin?
