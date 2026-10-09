# Pre-Launch Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all P0 and P1/P2 remediation items identified in the pre-launch readiness report, transitioning the platform to an Unconditional Green Light for production release.

**Architecture:** 
1. Re-engineer the sync code generation algorithm to high-entropy Base32 with cryptographic entropy and pairing collision reservation.
2. Build an accessible, zero-emoji, parchment-styled `LegalDisclaimerModal` with fair-use disclaimers, COPPA protection statements, WB copyright acknowledgment, and DMCA contact info, wired into sidebar and footer entry points.
3. Propagate vocabulary soft-delete tombstones through the local-first sync engine.
4. Harmonize legacy test files and missing `.js` ESM extensions so that all tests pass without errors.

**Tech Stack:** React 18, Tailwind CSS, Lucide React, Node.js Test Runner, Cloudflare Pages Functions, Web Crypto API.

**Spec:** `pre_launch_readiness_report.md` (Document ID: `HAR-AUDIT-2026-10-09-PROD`)

## Global Constraints
- Zero Unicode emojis across all new UI components and strings (Lucide React SVG only).
- Warm parchment design system (`#fbf9f5`, `#e8ddd0`, `#1e1610`, amber accents).
- Apple HIG touch targets: all interactive buttons and close icons >= 44x44px.
- Zero credential leakage: no private keys or secrets in client code.
- 100% test pass rate across all test suites.

## Review Focus
- Sync code entropy and collision reservation across 10,000 simulated accounts.
- Soft delete synchronization: ensure deleted words do not resurrect on cloud pull.
- Legal modal accessibility: Escape key dismiss, backdrop click, mobile drag handle.
- Node.js ESM compatibility: all local imports use explicit `.js` extensions.

---

### Task 1: Re-engineer Sync Code Generation & Pairing Collision Reservation [P0]

**Files:**
- Modify: `server/syncStore.js`
- Modify: `functions/api/[[path]].js`
- Test: `tests/preLaunchRemediation.test.js`

**Interfaces:**
- `generateSyncCode(userId: string): string` -> Returns a 7-character string matching `/^HP-[2-9A-Z]{4}$/` with >1,000,000 possible combinations.
- `syncCodeIndex: Map<string, string>` -> Replaced with collision-guarded mapping ensuring unique pairing code per active user.

- [ ] **Step 1: Write failing test in `tests/preLaunchRemediation.test.js`**
Verify that across 1,000 distinct user IDs, `generateSyncCode` yields >950 unique codes (eliminating the 32-code ceiling), and that collisions never overwrite active users in `processSync`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/preLaunchRemediation.test.js`
Expected: FAIL (due to current 32-code limit).

- [ ] **Step 3: Implement high-entropy generator & collision guard in `server/syncStore.js` and `functions/api/[[path]].js`**
Use SHA-256 byte slicing across the 32-char alphabet to expand state space from 32 to 1,048,576. Add collision reservation loop: if code is assigned to a different user, re-hash with nonce.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/preLaunchRemediation.test.js tests/sync.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add server/syncStore.js functions/api/[[path]].js tests/preLaunchRemediation.test.js`
`git commit -m "fix(sync): resolve sync code entropy collapse with high-entropy generator and collision guard"`

---

### Task 2: Create Legal Disclaimer & COPPA Compliance Modal [P0]

**Files:**
- Create: `src/components/LegalDisclaimerModal.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/navigation/DesktopSidebar.jsx`
- Modify: `src/components/navigation/MobileTopBar.jsx`
- Modify: `src/components/BookshelfView.jsx`
- Test: `tests/preLaunchRemediation.test.js`

**Interfaces:**
- `<LegalDisclaimerModal isOpen={boolean} onClose={function} isParchment={boolean} />`

- [ ] **Step 1: Write test for Legal Disclaimer Modal in `tests/preLaunchRemediation.test.js`**
Verify component exports, contains Fair Use, J.K. Rowling & WB copyright acknowledgment, COPPA disclosure for ages 11-15, DMCA email, has Apple HIG >=44px close target, and has zero emojis.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/preLaunchRemediation.test.js`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `LegalDisclaimerModal.jsx` and wire entries into UI**
Create `LegalDisclaimerModal.jsx` with four clear sections, parchment styling, and Lucide icons (`Scale`, `ShieldCheck`, `BookOpen`, `Mail`, `X`). Wire trigger into `DesktopSidebar`, `MobileTopBar`, `BookshelfView`, and `App.jsx`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/preLaunchRemediation.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/components/LegalDisclaimerModal.jsx src/App.jsx src/components/navigation/DesktopSidebar.jsx src/components/navigation/MobileTopBar.jsx src/components/BookshelfView.jsx tests/preLaunchRemediation.test.js`
`git commit -m "feat(legal): add comprehensive academic fair use and COPPA compliance modal"`

---

### Task 3: Implement Vocabulary Soft-Delete Tombstone Cloud Sync [P1]

**Files:**
- Modify: `src/utils/syncEngine.js`
- Modify: `src/hooks/useVocabManager.js`
- Test: `tests/preLaunchRemediation.test.js`

**Interfaces:**
- `syncEngine.markVocabDeleted(word: string)` -> Saves `{ word, isDeleted: true, updatedAt: number }` to `hp_deleted_vocab`.
- `syncEngine.sync()` -> Bundles deleted tombstones in `changes.vocab`, clears tombstones upon successful sync response.

- [ ] **Step 1: Write failing test in `tests/preLaunchRemediation.test.js`**
Verify that deleting a word registers a deletion tombstone and that sync payloads transmit `{ word, isDeleted: true }`.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/preLaunchRemediation.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement tombstone persistence in `syncEngine.js` and call from `useVocabManager.js`**
Add `markVocabDeleted(word)` to `syncEngine`, include `deletedVocab` in outgoing payload, and purge on success.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/preLaunchRemediation.test.js tests/sync.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/utils/syncEngine.js src/hooks/useVocabManager.js tests/preLaunchRemediation.test.js`
`git commit -m "fix(sync): propagate vocabulary soft-delete tombstones during cloud synchronization"`

---

### Task 4: Harmonize Orphaned Tests and ESM Extensions [P2]

**Files:**
- Modify: `src/hooks/useCatalog.js`
- Modify: `tests/conciseControls.test.js`
- Modify: `tests/appViewRouting.test.js`
- Modify: `tests/challenger-m3-iteration2.test.js`
- Modify: `package.json`

- [ ] **Step 1: Fix `src/hooks/useCatalog.js` import**
Change `import { chapters } from '../data/chapters';` to `import { chapters } from '../data/chapters.js';`.

- [ ] **Step 2: Update assertions in `conciseControls.test.js` and `appViewRouting.test.js`**
Align assertions with current production UX standards (translation toggle presence and `handleSwitchCurrentView` routing).

- [ ] **Step 3: Update `tests/challenger-m3-iteration2.test.js` to reference `parchmentPdfGenerator.js`**
Replace obsolete `ankiExport.js` reference with `parchmentPdfGenerator.js`.

- [ ] **Step 4: Run full test suite and wildcard tests**
Run: `npm test` and `node --test tests/*.test.js`
Expected: All tests pass.

- [ ] **Step 5: Commit**
`git add src/hooks/useCatalog.js tests/ package.json`
`git commit -m "test: harmonize legacy test suites and ESM imports for clean wildcard execution"`

---

### Task 5: Full Multi-Dimension Verification & Production Build

- [ ] Run `npm test` (all unit and integration tests)
- [ ] Run `npm run check-emojis` (verify 0 emojis)
- [ ] Run `npm run verify-security` (verify 0 credential leaks)
- [ ] Run `npm run build` (verify production Vite bundle)
- [ ] Update `pre_launch_readiness_report.md` to UNCONDITIONAL GREEN LIGHT
- [ ] Commit and push to `origin/main`
