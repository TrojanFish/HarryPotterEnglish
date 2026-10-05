# Hogwarts Audio — Superpowers Agent Engineering Guidelines

Welcome to the **Hogwarts Audio English Learning Platform** repository.
All AI agents and collaborators working on this codebase MUST follow the **Superpowers Engineering Methodology** alongside the project design specifications.

---

## 1. The Superpowers Core Protocol

### Mandatory Skill Invocation
- **Invoke relevant skills BEFORE taking action** — including before asking clarifying questions, exploring code, or writing implementations.
- Always check `.agents/skills/` for relevant skills:
  - **New Features / Refactoring**: Invoke `superpowers:brainstorming` first to tease out specs and explore alternatives; then `superpowers:writing-plans` to produce a step-by-step TDD plan.
  - **Bug Fixing / Regressions**: Invoke `superpowers:systematic-debugging` first. Complete all 4 phases: Root Cause Investigation -> Reproducer Test -> Targeted Fix -> Zero-Regression Verification.
  - **Execution**: Follow `superpowers:executing-plans` or `superpowers:subagent-driven-development`.
  - **Completion**: Invoke `superpowers:verification-before-completion` before declaring any task complete.

### The Red Flags (Stop Rationalizing)
| Thought | Reality |
|---|---|
| "This is just a simple question/tweak" | Simple things become complex. Invoke the skill. |
| "I'll write tests after the code works" | Tests written after are biased. Follow true TDD (Red -> Green -> Refactor). |
| "Let me just quickly patch this file" | Quick patches create regression spirals. Trace the root cause first. |
| "I'm sure everything passes" | Never assume. Run `npm test`, `npm run build`, and audits explicitly. |

---

## 2. Antigravity Environment Tool Mappings

When following Superpowers procedures in Antigravity:
- **Subagents**: Use `invoke_subagent` with `TypeName: "self"` (full tool access) or `TypeName: "research"` (read-only research).
- **Task Tracking**: Maintain a task artifact using `write_to_file` (`IsArtifact: true`, `ArtifactMetadata.ArtifactType: "task"`), updating steps with `replace_file_content`. (Note: `manage_task` is for background OS processes).
- **Verification Commands**:
  - Run Unit & E2E tests: `npm test`
  - Build verification: `npm run build`
  - Security credential check: `npm run verify-security`
  - Zero-emoji design audit: `npm run check-emojis`

---

## 3. Hogwarts Audio Domain Design System

In addition to Superpowers engineering rigor, all UI modifications MUST adhere to the workspace skills:

1. **`educational-ui-spec`**:
   - **Zero Emojis**: Emojis are strictly prohibited in user-facing UI and strings. Use Lucide React icons instead.
   - **Parchment Aesthetic**: Warm parchment palette (`#fbf9f5`, `#e8ddd0`, `#1e1610`, amber/bronze accents). Flat, shadow-free, noble aesthetic.
   - **Apple HIG Ergonomics**: All interactive touch targets must be at least 44x44px.
   - **Duolingo-style Micro-interactions**: Haptic feedback, subtle 95% active scale, clear state transitions.

2. **`refactoring-ui-spec`**:
   - **Hierarchy without font inflation**: Rely on font weight, letter spacing, and muted colors instead of massive headings.
   - **3-Tier Action Pyramid**: One dominant primary action button per view; secondary and tertiary actions must be restrained.
   - **Dual-Channel Status Indicators**: Never rely solely on color to convey status; combine icons with text or borders.

3. **Offline & Privacy Baseline**:
   - Offline-First: All core audio playback and VTT reading must function offline via IndexedDB (`HogwartsOfflineDB`).
   - Zero Credentials Leakage: Never expose Cloudflare R2 secrets or API tokens in client bundles.
   - COPPA / Academic Fair Use: Non-commercial educational usage only with prominent disclaimer and DMCA feedback channel.
