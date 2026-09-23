# X-29 Advance — Master Technical Modernization Roadmap (TASKS.md)

> **Document Status**: Active Implementation Roadmap  
> **Target Audience**: AI Development Agents & Engineering Team  
> **Rule**: Execute one phase at a time. Never advance to the next phase without full verification and checkpointing.

---

## Roadmap Overview & Progress Summary

```text
[x] PHASE 0 — Full Project Audit & Documentation
[x] PHASE 1 — Baseline Performance & Safety Checkpoints
[x] PHASE 2 — Legacy Modularization & Next.js 16 Foundation Setup
[x] PHASE 3 — Clean Single-Domain URL Routing Structure
[x] PHASE 4 — Feature Domain Slices & Component Foundation
[x] PHASE 5 — Strict TypeScript Interfaces & Type Safety
[x] PHASE 6 — Shared UI & Design System Primitives
[x] PHASE 7 — Domain-Specific Zustand Stores Architecture
[x] PHASE 8 — Modular Firebase 12 Architecture & Diagnostics
[x] PHASE 9 — Local-First IndexedDB Persistence & Sync Engine
[ ] PHASE 10 — Page-by-Page Migration & Visual Parity Verification
[ ] PHASE 11 — Elimination of Legacy Monolithic JavaScript Files
[ ] PHASE 12 — Client JavaScript & Bundle Size Reduction
[ ] PHASE 13 — Performance Optimization & Core Web Vitals (LCP < 2s)
[ ] PHASE 14 — Mobile-First Performance & Android Optimization
[ ] PHASE 15 — Cross-Device Responsive Layout Polish
[ ] PHASE 16 — Accessibility & ARIA Modernization
[ ] PHASE 17 — Production PWA & Offline Service Worker
[ ] PHASE 18 — Production Build & Vercel Edge Optimization
[ ] PHASE 19 — End-to-End Regression & Data Safety Verification
[ ] PHASE 20 — Final Legacy Decommissioning & Cleanup
```

---

## Detailed Phase Specifications

### PHASE 0 — Full Project Audit & AI Project Memory
- **Goal**: Thoroughly inspect all existing code, styles, dependencies, database patterns, and create the permanent AI memory files.
- **Reason**: Understand the working system completely before modifying architecture.
- **Dependencies**: None.
- **Files Involved**:
  - `docs/PRD.md`
  - `docs/ARCHITECTURE.md`
  - `docs/RULES.md`
  - `docs/DESIGN.md`
  - `docs/TASKS.md`
  - `docs/MEMORY.md`
- **Tasks**:
  - [x] Scan and inventory all project folders, files, sizes, and lines of code.
  - [x] Identify top large files and architectural bottlenecks.
  - [x] Audit Firestore security rules, models, and sync protocols.
  - [x] Create the 6 permanent documentation files in `docs/`.
- **Risks**: Missed legacy side effects or hidden dependencies.
- **Validation**: All 6 files exist, contain real X-29 facts, and cross-reference active codebase.
- **Status**: **COMPLETED**

---

### PHASE 1 — Baseline Performance & Safety Checkpoints
- **Goal**: Measure and record exact legacy performance metrics and ensure backup mechanisms work.
- **Reason**: Establish an empirical baseline to measure modern improvements objectively.
- **Dependencies**: Phase 0.
- **Files Involved**: `docs/PERFORMANCE-BASELINE.md`, `scripts/backup.js`, `scripts/verify-backup.js`.
- **Tasks**:
  - [x] Record Lighthouse scores, Core Web Vitals, transferred bundle sizes, and network requests.
  - [x] Verify backup and restore scripts with Firestore admin SDK.
  - [x] Create git baseline checkpoint commit (`873c49a`).
- **Risks**: Accidental data overwrite during backup verification.
- **Validation**: `docs/PERFORMANCE-BASELINE.md` populated with Lighthouse 37 score, LCP 29.9s, FCP 14.6s.
- **Status**: **COMPLETED**

---

### PHASE 2 — Legacy Modularization & Next.js 16 Foundation Setup
- **Goal**: Extract tightly coupled logic from `js/script.js` into modular files and initialize Next.js 16 + React 19.
- **Reason**: Break circular dependencies and create the modern runtime shell.
- **Dependencies**: Phase 1.
- **Files Involved**:
  - `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
  - `js/features/` (10 extracted module batches)
  - `tests/*.test.js`
- **Tasks**:
  - [x] Install Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, and Radix UI.
  - [x] Extract Batches 1 to 10 of legacy scripts (Targets, Pace, Outcome, Analytics, Tasks, Metrics, Dashboard).
  - [x] Run automated test suite (`npm run test`) confirming 100% pass across all 10 batches.
- **Risks**: Circular dependencies causing re-render loops or stack overflow.
- **Validation**: `npm run test` exits with code 0 (all test suites passing).
- **Status**: **COMPLETED**

---

### PHASE 3 — Clean Single-Domain URL Routing Structure
- **Goal**: Implement clean Next.js App Router structure under one canonical domain.
- **Reason**: Eliminate messy subfolder paths and enable fast server-rendered route transitions.
- **Dependencies**: Phase 2.
- **Files Involved**:
  - `app/layout.tsx`
  - `app/globals.css`
  - `app/login/page.tsx`
  - `app/(dashboard)/layout.tsx`
  - `app/(dashboard)/*/page.tsx`
- **Tasks**:
  - [x] Establish root layout with Google Fonts (`Inter` and `Outfit`) and Providers.
  - [x] Create `app/(dashboard)/` route group with shared `AuthGate` and `AppShell`.
  - [x] Define clean URLs for all 10 feature routes: `/`, `/focus`, `/analytics`, `/daily-actions`, `/schedule`, `/subjects`, `/pace`, `/master-config`, `/outcome`, `/exam`.
- **Risks**: Broken navigation links or URL redirection loops.
- **Validation**: Next.js route compilation succeeds without warnings.
- **Status**: **COMPLETED**

---

### PHASE 4 — Feature Domain Slices & Component Foundation
- **Goal**: Build modular React component trees for each domain slice under `features/`.
- **Reason**: Replace giant imperative HTML string templates with maintainable React components.
- **Dependencies**: Phase 3.
- **Files Involved**:
  - `features/analytics/components/`
  - `features/config/components/`
  - `features/daily-actions/components/`
  - `features/dashboard/components/`
  - `features/exam/components/`
  - `features/focus/components/`
  - `features/outcome/components/`
  - `features/pace/components/`
  - `features/schedule/components/`
  - `features/subjects/components/`
- **Tasks**:
  - [x] Scaffold presentational cards, modals, and toolbars for each feature slice.
  - [x] Connect components to domain services and Zustand stores.
- **Risks**: Visual discrepancies compared to legacy HTML.
- **Validation**: All components render without runtime React errors.
- **Status**: **COMPLETED**

---

### PHASE 5 — Strict TypeScript Interfaces & Type Safety
- **Goal**: Model every domain entity with strict TypeScript types, eliminating all `any` types.
- **Reason**: Guarantee data contract integrity and prevent runtime undefined access bugs.
- **Dependencies**: Phase 4.
- **Files Involved**: `types/*.ts` (15 definition files).
- **Tasks**:
  - [x] Define types for tasks, tracks, syllabus structure, target databases, timers, schedule blocks, and outcomes.
  - [x] Verify complete type coverage with `npm run typecheck`.
- **Risks**: Legacy data containing unexpected types or missing optional fields.
- **Validation**: `tsc --noEmit` exits with 0 errors.
- **Status**: **COMPLETED**

---

### PHASE 6 — Shared UI & Design System Primitives
- **Goal**: Create accessible, reusable UI primitives (Dialogs, Dropdowns, Toasts, Badges).
- **Reason**: Standardize interactive behaviors and guarantee keyboard/screen-reader accessibility.
- **Dependencies**: Phase 5.
- **Files Involved**: `components/ui/`, `components/shell/`, `components/navigation/`.
- **Tasks**:
  - [x] Implement Radix UI Dialog and Dropdown Menu wrappers preserving X-29 glass styling.
  - [x] Build HeaderBar with live countdown and sync indicator.
  - [x] Build responsive Sidebar navigation.
- **Risks**: Style collisions between Radix defaults and existing Tailwind classes.
- **Validation**: Modals open/close with keyboard `Escape` and focus trap.
- **Status**: **COMPLETED**

---

### PHASE 7 — Domain-Specific Zustand Stores Architecture
- **Goal**: Partition global state into isolated, testable Zustand stores.
- **Reason**: Eliminate `window.AppState` single point of failure and prevent unnecessary re-render storms.
- **Dependencies**: Phase 5.
- **Files Involved**: `stores/*.ts` (12 store files).
- **Tasks**:
  - [x] Implement `useAuthStore`, `useTimerStore`, `useTaskStore`, `useTaxonomyStore`, `useTargetStore`, `useScheduleStore`, `useExamStore`, `useOutcomeStore`, `usePaceStore`, `useDailyActionStore`, `useSyncStore`, `useModalStore`.
  - [x] Test pure store actions with unit tests.
- **Risks**: Inconsistent state synchronization across interdependent stores.
- **Validation**: All 27 unit tests pass in `npm run test:unit`.
- **Status**: **COMPLETED**

---

### PHASE 8 — Modular Firebase 12 Architecture & Diagnostics
- **Goal**: Upgrade to modular Firebase 12 SDK with non-blocking initial config resolution.
- **Reason**: Remove heavy Firebase Compat v10 scripts from index/head.
- **Dependencies**: Phase 7.
- **Files Involved**: `lib/firebase/client.ts`, `services/authService.ts`.
- **Tasks**:
  - [x] Implement modular Firebase app initialization and Firestore instance provider.
  - [x] Preserve exact `users/{uid}` document structure and security rules.
- **Risks**: Auth state drop during browser refresh.
- **Validation**: Auth state restored instantly from local storage.
- **Status**: **COMPLETED**

---

### PHASE 9 — Local-First IndexedDB Persistence & Sync Engine
- **Goal**: Build local-first persistence via IndexedDB and debounced background sync.
- **Reason**: Guarantee 0ms local response latency and eliminate Firestore write storms.
- **Dependencies**: Phase 8.
- **Files Involved**: `lib/storage/indexeddb.ts`, `lib/sync/syncService.ts`.
- **Tasks**:
  - [x] Implement `idb` wrapper for local caching.
  - [x] Implement coalesced, debounced background sync engine with tombstone tracking.
- **Risks**: Race conditions during offline-to-online transitions.
- **Validation**: Write coalescing queues multiple fast clicks into single remote commit.
- **Status**: **COMPLETED**

---

### PHASE 10 — Page-by-Page Migration & Visual Parity Verification
- **Goal**: Systematically verify each page in Next.js against the legacy HTML/CSS/JS version for exact visual and functional parity.
- **Reason**: Ensure zero visual disruption or lost features.
- **Dependencies**: Phase 4 to 9.
- **Files Involved**:
  - Page 1: `/login` (Private access authentication)
  - Page 2: `/` (Dashboard overview & KPI cards)
  - Page 3: `/focus` (Timer, Chronograph dial, audio chimes, session history)
  - Page 4: `/subjects` (Taxonomy hierarchy, chapter checklist, execution)
  - Page 5: `/daily-actions` (DADB habits, habit radar, target management)
  - Page 6: `/schedule` (24h daily schedule planner & active slot)
  - Page 7: `/pace` (Pace management & velocity projections)
  - Page 8: `/outcome` (CGPA modeling & celebration mode)
  - Page 9: `/exam` (Exam routine & countdown)
  - Page 10: `/master-config` (Tracks, programs, subjects, backup/restore)
  - Page 11: `/analytics` (Spectra analytics studio)
- **Tasks**:
  - [ ] Mount and test Page 1: Login.
  - [ ] Mount and test Page 2: Dashboard.
  - [ ] Mount and test Page 3: Focus & Timer.
  - [ ] Mount and test Page 4: Subjects.
  - [ ] Mount and test Page 5: Daily Actions & Targets.
  - [ ] Mount and test Page 6: Daily Schedule.
  - [ ] Mount and test Page 7: Pace Management.
  - [ ] Mount and test Page 8: Outcome & CGPA.
  - [ ] Mount and test Page 9: Exam Routine.
  - [ ] Mount and test Page 10: Master Config.
  - [ ] Mount and test Page 11: Spectra Analytics.
  - [ ] Verify exact visual match on desktop and mobile.
- **Risks**: Subtle styling or functional discrepancies between legacy DOM and React components.
- **Validation**: Side-by-side browser comparison passes on every page.
- **Status**: **PENDING (NEXT MILESTONE)**

---

### PHASE 11 — Elimination of Legacy Monolithic JavaScript Files
- **Goal**: Safely retire and decommission large unbundled legacy scripts once React parity is proven.
- **Reason**: Remove 2.5+ MB of dead scripts and reduce repo clutter.
- **Dependencies**: Phase 10.
- **Files Involved**: `js/features/targets/monthlyTargets.js`, `shared/services/timerService.js`, `pages/*/*.js`.
- **Tasks**:
  - [ ] Confirm zero active dependencies on legacy scripts.
  - [ ] Archive legacy scripts into `archive/`.
- **Risks**: Accidental removal of scripts still referenced by tests or legacy fallback.
- **Validation**: Full test suite passes after archiving.
- **Status**: **PENDING**

---

### PHASE 12 — Client JavaScript & Bundle Size Reduction
- **Goal**: Minimize client-side JS delivered over the wire to under 350 KB gzipped.
- **Reason**: Accelerate download and parse times on mobile devices.
- **Dependencies**: Phase 11.
- **Tasks**:
  - [ ] Tree-shake unused icons and libraries.
  - [ ] Implement `next/dynamic` lazy loading for Chart.js canvases.
- **Validation**: Next.js build bundle analyzer report confirms target sizes.
- **Status**: **PENDING**

---

### PHASE 13 — Performance Optimization & Core Web Vitals
- **Goal**: Achieve Lighthouse Performance score > 90 and LCP < 2.0s.
- **Reason**: Eliminate the 29.9s LCP bottleneck.
- **Dependencies**: Phase 12.
- **Tasks**:
  - [ ] Eliminate render-blocking resources.
  - [ ] Optimize font loading with Next.js font display swap.
  - [ ] Preconnect to critical domains.
- **Validation**: Automated Lighthouse audit confirms LCP < 2.0s and FCP < 1.0s.
- **Status**: **PENDING**

---

### PHASE 14 — Mobile-First Performance & Android Optimization
- **Goal**: Ensure butter-smooth 60fps performance on low-to-mid range Android devices.
- **Reason**: User frequently accesses dashboard on mobile during study.
- **Dependencies**: Phase 13.
- **Tasks**:
  - [ ] Test timer execution under Android background throttling.
  - [ ] Verify touch latency < 100ms.
- **Validation**: Mobile CPU throttling test passes without dropped frames.
- **Status**: **PENDING**

---

### PHASE 15 — Cross-Device Responsive Layout Polish
- **Goal**: Guarantee zero horizontal overflow and pixel-perfect rendering across all screen widths.
- **Dependencies**: Phase 14.
- **Tasks**:
  - [ ] Test breakpoints: 360px, 390px, 414px, 768px, 1024px, 1440px.
- **Validation**: Zero horizontal scrollbar, zero clipped cards.
- **Status**: **PENDING**

---

### PHASE 16 — Accessibility & ARIA Modernization
- **Goal**: Ensure full keyboard navigation and screen-reader accessibility.
- **Dependencies**: Phase 15.
- **Tasks**:
  - [ ] Verify visible focus rings, ARIA roles, and label associations.
- **Validation**: Lighthouse Accessibility score > 95.
- **Status**: **PENDING**

---

### PHASE 17 — Production PWA & Offline Service Worker
- **Goal**: Deploy a production-ready Service Worker for asset caching and offline study.
- **Dependencies**: Phase 16.
- **Tasks**:
  - [ ] Implement service worker with cache-first strategy for static assets and network-first for data.
  - [ ] Verify PWA install prompt.
- **Validation**: App loads and allows timer study while completely disconnected from internet.
- **Status**: **PENDING**

---

### PHASE 18 — Production Build & Vercel Edge Optimization
- **Goal**: Deploy production build to Vercel edge network with security headers.
- **Dependencies**: Phase 17.
- **Tasks**:
  - [ ] Configure `vercel.json` with security headers (CSP, HSTS, X-Frame-Options).
- **Validation**: Production deployment succeeds and passes health check.
- **Status**: **PENDING**

---

### PHASE 19 — End-to-End Regression & Data Safety Verification
- **Goal**: Run comprehensive end-to-end regression tests on production data clones.
- **Dependencies**: Phase 18.
- **Tasks**:
  - [ ] Verify every user flow from login to timer, task completion, schedule editing, and outcome calculation.
- **Validation**: Zero data anomalies, zero console errors.
- **Status**: **PENDING**

---

### PHASE 20 — Final Legacy Decommissioning & Cleanup
- **Goal**: Cleanly decommission legacy `index.html` and old assets after production validation.
- **Dependencies**: Phase 19.
- **Tasks**:
  - [ ] Archive legacy HTML files into permanent backup storage.
  - [ ] Final project documentation sign-off.
- **Status**: **PENDING**
