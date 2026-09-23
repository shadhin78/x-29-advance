# X-29 Advance — Permanent Engineering & AI Control Rules (RULES.md)

> **CRITICAL DIRECTIVE**: This is the authoritative governance document for all development on X-29 Advance.
> Every AI agent and human engineer MUST strictly comply with every rule in this document.
> Convenience, speed, or subjective design preferences NEVER supersede these rules.

---

## 1. ABSOLUTE DESIGN PRESERVATION RULES

1. **Zero Unsolicited Redesign**:
   - The existing HTML/CSS/JS application is the immutable visual source of truth.
   - Do NOT change colors, typography, font sizes, weights, line heights, margins, paddings, card radii, shadows, borders, or layout grids without explicit user authorization.
   - Do NOT replace the established X-29 visual language with generic Tailwind UI, shadcn defaults, or minimalist corporate themes.
2. **Visual Parity is Mandatory**:
   - Every modernized React/Next.js component must visually match its legacy counterpart down to the pixel.
   - Preserve all dark theme color hex codes (e.g. background `#0b0f19`, card `#0f172a`, border `#1e293b`).
   - Preserve glassmorphism: `backdrop-filter: blur(20px)`, border `rgba(255, 255, 255, 0.08)`, and custom glowing focus states.
3. **Exact Animations & Micro-Interactions**:
   - Preserve `pageEnter`, `auraPulse`, `shimmer-flow`, `premium-pulse`, and chronograph dial rotations.
   - Preserve button hover scales, checkbox strike-through animations, and modal transition curves.

---

## 2. FUNCTIONALITY & MATHEMATICAL PARITY RULES

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

## 3. MIGRATION & SAFETY RULES

1. **Understand -> Audit -> Plan -> Implement -> Test -> Compare -> Verify**:
   - Never jump straight from legacy code to a rewrite.
   - Always analyze module dependencies before touching code.
2. **Never Perform Big-Bang Rewrites**:
   - Migration MUST be incremental: one domain, one feature slice, one component at a time.
   - Keep the existing application fully functional and runnable throughout the entire modernization process.
3. **Protect the Working Reference**:
   - Do NOT delete any legacy HTML, JS, or CSS file until the new React implementation has achieved 100% functional, visual, and performance parity verified by browser testing.
   - Always verify that all automated test suites pass before and after every phase.
4. **Git Checkpoints**:
   - Ensure a clean git status or commit before initiating any major migration phase.
   - Test and verify thoroughly before committing phase results.

---

## 4. NEXT.JS & REACT ARCHITECTURAL RULES

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

## 5. STATE MANAGEMENT & DATA PERSISTENCE RULES

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

## 6. FIREBASE & SECURITY RULES

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

## 7. PERFORMANCE & BUNDLE SIZE RULES

1. **Zero Runtime Compiler in Production**:
   - Never use `cdn.tailwindcss.com` in modernized code. Use PostCSS build-time generation.
2. **Lazy-Load Heavy Features**:
   - Dynamic import (`next/dynamic` with `ssr: false`) for Chart.js, canvas heatmaps, and complex visualization studio components.
3. **Prevent Timer Drift & Render Storms**:
   - Timers must be timestamp-based (`Date.now() - startTime`).
   - Only the timer digits and chronograph needles should re-render on active ticks; never re-render the outer page or layout.

---

## 8. MOBILE & RESPONSIVENESS RULES

1. **Mobile is First-Class**:
   - Every layout and dialog must be verified across: `360px`, `390px`, `414px`, `768px`, `1024px`, and `1280px+`.
   - Zero horizontal page overflow (`overflow-x: hidden`).
   - Touch targets must be at least 44x44px.
   - Form inputs on mobile must have font-size >= 16px to prevent iOS auto-zoom.

---

## 9. TYPESCRIPT STRICTNESS RULES

1. **Strict Mode & Zero `any`**:
   - `any` is strictly prohibited. Use proper interfaces, unions, generics, or `unknown` with type guards.
   - Maintain all domain interfaces in `types/` synchronized with actual Firestore data schemas.
2. **Typecheck Cleanliness**:
   - `npm run typecheck` (`tsc --noEmit`) must exit with 0 errors after every change.

---

## 10. CROSS-FILE SYNCHRONIZATION RULES

1. **Complete Reference Updates**:
   - When modifying any function signature, store action, or component interface, locate and update all call sites across the codebase.
   - Never leave dead CSS selectors, broken imports, or orphaned event handlers.
2. **Reusability**:
   - Reuse existing utilities (e.g. `hashStringToColor`, `hexToRgba`, `formatTimerDigits`, `calculateCompletionRate`) rather than duplicating code.
