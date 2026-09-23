# X-29 Advance — Permanent Engineering & AI Control Rules (RULES.md)

> **CRITICAL DIRECTIVE**: This is the authoritative governance document for all development on X-29 Advance.  
> Every AI agent and human engineer MUST strictly comply with every rule in this document.  
> Convenience, speed, or subjective design preferences NEVER supersede these rules.

---

## 1. THE 15 PERMANENT AI ENGINEERING RULES (NON-NEGOTIABLE)

1. **Existing X-29 design is the visual source of truth.**
2. **Do NOT redesign.** Never make the interface "better looking", minimalist, or generic corporate.
3. **Do NOT remove functionality.** Never drop buttons, filters, modals, audio chimes, or settings.
4. **Do NOT change behavior without explicit user approval.** Preserve all calculations, workflows, and edge cases.
5. **Do NOT change Firebase data structure casually.** Preserve all collection paths, document schemas, and field types.
6. **Do NOT expose secrets.** Never send service account keys, admin secrets, or private credentials to the browser or git.
7. **Do NOT perform giant blind rewrites.** Never convert entire projects at once; migrate incrementally.
8. **Work strictly one numbered step at a time.** Never execute multiple numbered steps simultaneously.
9. **Test every step thoroughly.** Verify functionality, visual parity, responsive behavior, and performance before completing any step.
10. **Update documentation after every step.** Keep `MODERNIZATION-PLAN.md`, `TASKS.md`, `MEMORY.md`, `PERFORMANCE.md`, and `MIGRATION-LOG.md` synchronized.
11. **Create a Git checkpoint for every major completed step.** Never proceed without a clean, recoverable commit.
12. **Never silently skip a step.** If a step is blocked, mark it `BLOCKED`, document the blocker, and stop.
13. **Never silently mark a step complete.** Completion requires passing automated tests, browser verification, and parity sign-off.
14. **Read documentation before continuing a previous step.** Always read `CURRENT-STATE.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN-PARITY.md`, `TASKS.md`, and `MEMORY.md` first.
15. **Prefer measurable performance improvements.** Optimize based on measured data, not guesswork.

---

## 2. ABSOLUTE DESIGN PRESERVATION RULES

1. **Zero Unsolicited Redesign**:
   - The existing HTML/CSS/JS application is the immutable visual source of truth.
   - Do NOT change colors, typography, font sizes, weights, line heights, margins, paddings, card radii, shadows, borders, or layout grids without explicit user authorization.
   - Do NOT replace the established X-29 visual language with generic Tailwind UI, shadcn defaults, or minimalist corporate themes.
2. **Visual Parity is Mandatory**:
   - Every modernized React/Next.js component must visually match its legacy counterpart down to the pixel.
   - Preserve all dark theme color hex codes: root background `#0b0f19`, card surface `#0f172a`, border `#1e293b`.
   - Preserve glassmorphism: `backdrop-filter: blur(20px)`, border `rgba(255, 255, 255, 0.08)`, and custom glowing focus states (`glowing-input:focus`).
3. **Exact Animations & Micro-Interactions**:
   - Preserve `pageEnter`, `auraPulse`, `shimmer-flow`, `premium-pulse`, and chronograph dial rotations.
   - Preserve button hover scales, checkbox strike-through animations, and modal transition curves.

---

## 3. FUNCTIONALITY & MATHEMATICAL PARITY RULES

1. **Preserve Business Logic Intact**:
   - Do NOT modify or "simplify" calculations for:
     - 4.00-scale CGPA conversion and weighted score aggregations.
     - Pace velocity estimations, daily chapter requirements, and projected finish dates.
     - Active study streaks and habit adherence percentages.
     - Timestamp-based stopwatch and countdown timer elapsed mathematics.
     - Monthly -> Weekly -> Daily target cascading and auto-spread distributions.
2. **Zero Feature Deletion**:
   - Do NOT delete or silently drop any existing legacy capability, button, filter, tab, modal, audio chime, or configuration setting.
   - If an existing routine seems redundant or legacy, understand its role completely before proposing any architectural refactoring.
3. **Edge Case & Error Handling Preservation**:
   - Preserve tombstone deletion tracking (`_tombstones`) so deleted items never re-appear during cross-device sync.
   - Preserve optimistic UI updates with error rollback.

---

## 4. MIGRATION & SAFETY RULES

1. **Understand -> Audit -> Plan -> Implement -> Test -> Compare -> Verify**:
   - Never jump straight from legacy code to a rewrite.
   - Always analyze module dependencies before touching code.
2. **Protect the Working Reference**:
   - Do NOT delete any legacy HTML, JS, or CSS file until the new React implementation has achieved 100% functional, visual, and performance parity verified by browser testing.
   - Always verify that all automated test suites pass before and after every phase.
3. **Reversible Execution**:
   - Ensure every migration step can be rolled back without data loss.

---

## 5. NEXT.JS & REACT ARCHITECTURAL RULES

1. **Server Components by Default**:
   - Keep layouts, static shells, and metadata as Server Components.
   - Mark files with `'use client'` ONLY when strictly required (e.g. interactive forms, Zustand store hooks, browser APIs, timers, or canvas elements).
   - Never place `'use client'` at the root layout.
2. **No Monolithic Component Dumping**:
   - Avoid creating 1,000-line monolithic JSX components. Split by responsibility:
     - Presentational components (`components/`)
     - Custom hooks (`hooks/`)
     - Domain logic & calculations (`services/`)
     - State management (`stores/`)
3. **No Legacy DOM Manipulation in React**:
   - NEVER use `innerHTML`, `document.getElementById()`, `window.renderUI()`, or manual script injection in React components.
   - Rely strictly on React state, props, and declarative rendering.

---

## 6. STATE MANAGEMENT & DATA PERSISTENCE RULES

1. **Domain-Specific Zustand Stores**:
   - Do NOT create a giant `useAppState` store duplicating `window.AppState`.
   - Partition state by bounded domain:
     - `useAuthStore`
     - `useTimerStore`
     - `useTaskStore`
     - `useTaxonomyStore`
     - `useTargetStore`
     - `useScheduleStore`
     - `useExamStore`
     - `useOutcomeStore`
     - `usePaceStore`
     - `useDailyActionStore`
     - `useSyncStore`
     - `useModalStore`
2. **Local-First with Transparent Sync**:
   - User actions must immediately update Zustand state (0ms UI latency) and persist to local IndexedDB.
   - Cloud synchronization to Firestore must be debounced (180ms - 300ms) and coalesced to eliminate write storms.
3. **Self-Write Echo Acknowledgment**:
   - Always verify `_lastWriteId` on remote snapshot events to avoid re-rendering or re-parsing the client's own committed writes.

---

## 7. FIREBASE & SECURITY RULES

1. **Zero Credential Exposure**:
   - NEVER expose `firebase-service-account.json`, admin credentials, or private keys to client code or Git.
   - Server-only credentials must strictly stay on the server.
   - Public client configuration may only contain public keys (`apiKey`, `projectId`, etc.).
2. **Never Weaken Security Rules**:
   - Do not alter `firestore.rules` to make development easier.
   - Respect strict single-user ownership: `request.auth.uid == userId`.
   - Maintain the allowed top-level document key whitelist and type validation.
3. **Avoid Unnecessary Firestore Reads/Writes**:
   - Never trigger a Firestore write on timer tick.
   - Never write to Firestore if no data was actually modified.
   - Do not maintain multiple duplicate realtime listeners for the same document path.

---

## 8. MOBILE & RESPONSIVENESS RULES

1. **Mobile is First-Class**:
   - Every layout and dialog must be verified across: `360px`, `390px`, `414px`, `768px`, `1024px`, and `1280px+`.
   - Zero horizontal page overflow (`overflow-x: hidden`).
   - Touch targets must be at least 44x44px.
   - Form inputs on mobile must have `font-size: 16px` to prevent iOS auto-zoom.

---

## 9. TYPESCRIPT STRICTNESS RULES

1. **Strict Mode & Zero `any`**:
   - `any` is strictly prohibited. Use proper interfaces, unions, generics, or `unknown` with type guards.
   - Maintain all domain interfaces in `types/` synchronized with actual Firestore data schemas.
2. **Typecheck Cleanliness**:
   - `npm run typecheck` (`tsc --noEmit`) must exit with 0 errors after every change.

---

## 10. STOP CONDITIONS

STOP and report to user immediately when:
- Data integrity is uncertain or there is a risk of data loss.
- A security boundary is unclear or credentials might be exposed.
- Two implementations conflict and the authoritative behavior cannot be verified.
- A build or runtime blocker exists that prevents verification.
- An architectural decision would materially alter user workflow or interface appearance.
