# Streamline Player Transport Controls (Remove 15s Seek in Favor of Sentence Navigation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Streamline audio player transport controls across PodcastPlayerView, GlobalPodcastCapsule, and AudioPlayer by removing redundant ±15s seek buttons in favor of the clean, pedagogically sound 3-button sentence navigation layout `[ 上一句 ]` `[ 播放/暂停 ]` `[ 下一句 ]`.

**Architecture:**
1. In `PodcastPlayerView.jsx`: Replace 5-button transport cluster with symmetric 3-button cluster (`[ 上一句 ]` `[ 播放/暂停 ]` `[ 下一句 ]`).
2. In `GlobalPodcastCapsule.jsx`: Replace ±15s buttons in both mobile bottom drawer and desktop floating capsule with `[ 上一句 ]` and `[ 下一句 ]`.
3. In `AudioPlayer.jsx`: Remove ±15s buttons in mobile thumb zone and desktop transport row, standardizing on sentence navigation.
4. In `App.jsx`: Wire `onPrevSentence={handlePrevSentence}` into `GlobalPodcastCapsule`.
5. Update tests in `tests/podcastPlayerView.test.js`, `tests/globalPodcastCapsule.test.js`, and `tests/audioPlayerControls.test.js`.

**Tech Stack:** React 18, Tailwind CSS, Lucide React, Node test runner.

## Global Constraints
- Zero Emojis in UI or strings (strictly use Lucide React icons).
- Apple HIG touch targets ($\ge 44 \times 44\text{pt}$).
- Warm parchment color palette (`#fbf9f4`, `#e8ddd0`, amber accents).
- 3-Tier Action Pyramid: Central Play/Pause dominant CTA, secondary sentence navigation buttons.

---

## Tasks

- [x] Task 1: Update `PodcastPlayerView.jsx` Transport Controls
  - Remove `±15s` buttons from main transport row (lines 185-193 and 236-244).
  - Remove `±15s` buttons from compact mini-player (lines 341 and 362).
  - Ensure `[ 上一句 ]` and `[ 下一句 ]` buttons have Apple HIG $\ge 44\text{px}$ touch targets.

- [x] Task 2: Update `GlobalPodcastCapsule.jsx` and `App.jsx`
  - In `GlobalPodcastCapsule.jsx`: Accept `onPrevSentence` prop.
  - In mobile capsule: Replace `-15s` and `+15s` buttons with `[ 上一句 ]` (`SkipBack`) and `[ 下一句 ]` (`SkipForward`).
  - In desktop floating capsule: Replace `-15s` and `+15s` with `[ 上一句 ]` and `[ 下一句 ]`.
  - In `App.jsx`: Pass `onPrevSentence={handlePrevSentence}` to `GlobalPodcastCapsule`.

- [x] Task 3: Update `AudioPlayer.jsx` Transport Controls
  - In mobile layer 2: Remove `-15s` and `+15s` buttons, centering `[ 上一句 ]` `[ 播放/暂停 ]` `[ 下一句 ]`.
  - In desktop center transport: Remove `-15s` and `+15s` buttons, leaving `[ 上一句 ]` `[ 播放/暂停 ]` `[ 下一句 ]` and `[ 单句循环 ]`.

- [x] Task 4: Update Test Suites
  - Update `tests/podcastPlayerView.test.js` to assert `上一句` and `下一句` instead of `15s`.
  - Update `tests/globalPodcastCapsule.test.js` to assert `上一句` and `下一句` instead of `15s`.
  - Update `tests/audioPlayerControls.test.js` to assert sentence navigation controls.
  - Run `node --test tests/podcastPlayerView.test.js tests/globalPodcastCapsule.test.js tests/audioPlayerControls.test.js`.

- [x] Task 5: Full Verification Gate (Test, Build, Zero-Emoji, Security) & Git Push
  - `npm test`
  - `npm run build`
  - `npm run check-emojis`
  - `npm run verify-security`
  - Git commit and push to `main`.
