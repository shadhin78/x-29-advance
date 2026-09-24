# X-29 Advance — Master Technical Modernization Roadmap (MODERNIZATION-PLAN.md)

> **Document Status**: Authoritative Master Roadmap  
> **Target Audience**: AI Development Agents & Senior System Architects  
> **Rule of Execution**: Work strictly one numbered step at a time upon explicit user command. Never advance to the next step without full verification and checkpointing.

---

## Roadmap Overview

```text
FOUNDATION & ARCHITECTURE (COMPLETED)
[x] STEP 001 — Full Project Architecture Audit & Inventory
[x] STEP 002 — Baseline Performance & Disaster Recovery Safeguards
[x] STEP 003 — Next.js 16, React 19 & TypeScript Build Foundation
[x] STEP 004 — Clean Single-Domain URL Routing & App Router Shell
[x] STEP 005 — Strict Domain TypeScript Contracts & Schema Modeling
[x] STEP 006 — Shared UI Design System Primitives & Radix Components
[x] STEP 007 — Domain-Partitioned Zustand Stores Architecture
[x] STEP 008 — Modular Firebase 12 Architecture & Auth Integration
[x] STEP 009 — Local-First IndexedDB Engine & Coalesced Sync Service
[x] STEP 010 — Feature Domain Slices & Component Tree Scaffolding

PAGE-BY-PAGE PARITY VERIFICATION (IN PROGRESS)
[x] STEP 011 — Page-by-Page Migration & Visual Parity: /login
[x] STEP 012 — Page-by-Page Migration & Visual Parity: / (Dashboard Overview & KPI Cards)
[x] STEP 013 — Page-by-Page Migration & Visual Parity: /focus (Timer & Chronograph Dial)
[x] STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist)
[x] STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
[x] STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
[x] STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
[x] STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
[ ] STEP 019 — Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection)
[ ] STEP 020 — Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config)
[ ] STEP 021 — Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar)

OPTIMIZATION & PRODUCTION HARDENING (PENDING)
[ ] STEP 022 — Comprehensive Cross-Device & Responsive Verification (360px - 1440px)
[ ] STEP 023 — Decommissioning & Archiving of Monolithic Legacy JavaScript Files
[ ] STEP 024 — Elimination of Legacy Monolithic HTML Shell (index.html, login.html)
[ ] STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)
[ ] STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s)
[ ] STEP 027 — Mobile & Android Low-Power Optimization (Touch Latency & Background Timers)
[ ] STEP 028 — Modern Accessibility & ARIA Modernization (WCAG 2.1 AA)
[ ] STEP 029 — Production PWA Service Worker (Serwist/Workbox Offline Study Engine)
[ ] STEP 030 — Production Hardening & Vercel Edge Security Optimization
[ ] STEP 031 — End-to-End Regression & Data Integrity Cloud Verification
[ ] STEP 032 — Final Legacy Decommissioning & Production Cutover Sign-Off
```

---

## Detailed Step Specifications

### STEP 001 — Full Project Architecture Audit & Inventory
- **Step number**: STEP 001
- **Title**: Full Project Architecture Audit & Inventory
- **Objective**: Conduct comprehensive code, asset, styling, and dependency audit across all legacy modules.
- **Why it is required**: To understand every dependency, state mutation, and business rule before touching code.
- **Dependencies**: None.
- **Files/modules involved**: `index.html`, `js/script.js`, `js/state.js`, `router/router.js`, `pages/*`.
- **Detailed implementation plan**: Scan file tree, record sizes, audit DOM couplings, and map data flows.
- **Risk**: Overlooking obscure inline event handlers or global state dependencies.
- **Validation method**: All legacy files cataloged in `docs/CURRENT-STATE.md`.
- **Completion criteria**: Comprehensive inventory document committed to repository.
- **Status**: **COMPLETED**

---

### STEP 002 — Baseline Performance & Disaster Recovery Safeguards
- **Step number**: STEP 002
- **Title**: Baseline Performance & Disaster Recovery Safeguards
- **Objective**: Measure legacy performance metrics and build automated Firestore backup/restore tools.
- **Why it is required**: Establish empirical baseline (Lighthouse, Core Web Vitals) and guarantee zero data loss.
- **Dependencies**: STEP 001.
- **Files/modules involved**: `scripts/backup.js`, `scripts/verify-backup.js`, `docs/PERFORMANCE-BASELINE.md`.
- **Detailed implementation plan**: Run headless Lighthouse audit, record network transfer sizes, write backup scripts.
- **Risk**: Accidental data mutation during verification.
- **Validation method**: Backup scripts verify integrity of Firestore user payload.
- **Completion criteria**: Baseline metrics documented, backup scripts operational.
- **Status**: **COMPLETED**

---

### STEP 003 — Next.js 16, React 19 & TypeScript Build Foundation
- **Step number**: STEP 003
- **Title**: Next.js 16, React 19 & TypeScript Build Foundation
- **Objective**: Initialize modern build tooling alongside legacy codebase without disrupting existing server.
- **Why it is required**: Modern engine foundation for high-performance React rendering and type safety.
- **Dependencies**: STEP 002.
- **Files/modules involved**: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`.
- **Detailed implementation plan**: Install Next.js 16.3.5, React 19.3.0, TypeScript 7, PostCSS Tailwind.
- **Risk**: Dependency conflicts between legacy scripts and modern toolchain.
- **Validation method**: `npm run build` succeeds cleanly; `npm run typecheck` exits code 0.
- **Completion criteria**: Clean build exit and stable dual-run capability.
- **Status**: **COMPLETED**

---

### STEP 004 — Clean Single-Domain URL Routing & App Router Shell
- **Step number**: STEP 004
- **Title**: Clean Single-Domain URL Routing & App Router Shell
- **Objective**: Establish Next.js App Router structure with route groups and clean URLs.
- **Why it is required**: Eliminate legacy `#hash` routing and support single canonical domain (`/`, `/focus`, etc.).
- **Dependencies**: STEP 003.
- **Files/modules involved**: `app/layout.tsx`, `app/globals.css`, `app/(dashboard)/*`, `app/login/page.tsx`.
- **Detailed implementation plan**: Create `(dashboard)` route group, shared `AuthGate`, and `AppShell`.
- **Risk**: Visual flicker or layout shift on route transition.
- **Validation method**: All 13 routes compile and render static HTML.
- **Completion criteria**: Next.js build prerenders all 13 routes without errors.
- **Status**: **COMPLETED**

---

### STEP 005 — Strict Domain TypeScript Contracts & Schema Modeling
- **Step number**: STEP 005
- **Title**: Strict Domain TypeScript Contracts & Schema Modeling
- **Objective**: Define strong TypeScript types for every domain entity with zero `any`.
- **Why it is required**: Prevent runtime undefined crashes and enforce exact Firestore schema contracts.
- **Dependencies**: STEP 004.
- **Files/modules involved**: `types/*.ts` (15 definition files).
- **Detailed implementation plan**: Model tasks, syllabus, targets, timer logs, schedule blocks, outcomes, and sync.
- **Risk**: Mismatches between legacy data fields and strict TypeScript interfaces.
- **Validation method**: `npm run typecheck` runs without a single `any` or error.
- **Completion criteria**: 100% type coverage across domain models.
- **Status**: **COMPLETED**

---

### STEP 006 — Shared UI Design System Primitives & Radix Components
- **Step number**: STEP 006
- **Title**: Shared UI Design System Primitives & Radix Components
- **Objective**: Build accessible UI primitives (Dialog, Dropdown, Modals) preserving X-29 glassmorphic aesthetic.
- **Why it is required**: Replace brittle legacy innerHTML modals with accessible React components.
- **Dependencies**: STEP 005.
- **Files/modules involved**: `components/ui/*`, `components/shell/*`, `components/navigation/*`.
- **Detailed implementation plan**: Integrate `@radix-ui/react-dialog` with `glass-card` styling and custom focus.
- **Risk**: Styling collisions between Radix defaults and existing Tailwind classes.
- **Validation method**: Modals trap focus and close on `Escape` without altering visual style.
- **Completion criteria**: Reusable primitives matching legacy appearance exactly.
- **Status**: **COMPLETED**

---

### STEP 007 — Domain-Partitioned Zustand Stores Architecture
- **Step number**: STEP 007
- **Title**: Domain-Partitioned Zustand Stores Architecture
- **Objective**: Partition monolithic `window.AppState` into 12 domain-specific Zustand stores.
- **Why it is required**: Prevent global re-render storms and create modular, testable state management.
- **Dependencies**: STEP 005.
- **Files/modules involved**: `stores/*.ts` (12 store files).
- **Detailed implementation plan**: Create isolated stores for Auth, Timer, Tasks, Taxonomy, Targets, Schedule, Outcome, Pace, Habits, Sync, Modal, and Exam.
- **Risk**: State de-synchronization across dependent features.
- **Validation method**: `npm run test:unit` passes 27/27 domain state tests.
- **Completion criteria**: All 12 domain stores operational and verified by tests.
- **Status**: **COMPLETED**

---

### STEP 008 — Modular Firebase 12 Architecture & Auth Integration
- **Step number**: STEP 008
- **Title**: Modular Firebase 12 Architecture & Auth Integration
- **Objective**: Upgrade from Firebase v10 Compat to modular Firebase 12 tree-shakable SDK.
- **Why it is required**: Eliminate render-blocking compat scripts and improve security and bundle size.
- **Dependencies**: STEP 007.
- **Files/modules involved**: `lib/firebase/client.ts`, `services/authService.ts`, `stores/useAuthStore.ts`.
- **Detailed implementation plan**: Implement modular `initializeApp`, `getFirestore`, and `getAuth`.
- **Risk**: Auth state persistence drop on browser refresh.
- **Validation method**: Session persists across reloads; security rules remain enforced.
- **Completion criteria**: Clean modular Firebase 12 initialization with zero compat dependencies.
- **Status**: **COMPLETED**

---

### STEP 009 — Local-First IndexedDB Engine & Coalesced Sync Service
- **Step number**: STEP 009
- **Title**: Local-First IndexedDB Engine & Coalesced Sync Service
- **Objective**: Implement local-first persistence via `idb` and debounced background sync to Firestore.
- **Why it is required**: 0ms UI latency for user actions and prevention of Firestore write storms.
- **Dependencies**: STEP 008.
- **Files/modules involved**: `lib/storage/indexeddb.ts`, `lib/sync/syncService.ts`, `stores/useSyncStore.ts`.
- **Detailed implementation plan**: Write to IndexedDB immediately on user action; debounce cloud commit (180ms); filter self-echoes using `_lastWriteId`.
- **Risk**: Write race conditions or snapshot echo loops.
- **Validation method**: Fast clicks coalesce into a single Firestore commit; offline actions queue.
- **Completion criteria**: Local-first engine operational with tombstone tracking.
- **Status**: **COMPLETED**

---

### STEP 010 — Feature Domain Slices & Component Tree Scaffolding
- **Step number**: STEP 010
- **Title**: Feature Domain Slices & Component Tree Scaffolding
- **Objective**: Scaffold modular React component trees for all 10 feature slices under `features/`.
- **Why it is required**: Replace imperative HTML fragments with maintainable, declarative React components.
- **Dependencies**: STEP 006, STEP 007.
- **Files/modules involved**: `features/*` (55 components, services, and hooks).
- **Detailed implementation plan**: Construct presentational cards, forms, and studios for each domain.
- **Risk**: Syntax errors or broken imports between domain slices.
- **Validation method**: `npm run build` succeeds and renders all feature studios.
- **Completion criteria**: All 10 feature studios scaffolded and compiling cleanly.
- **Status**: **COMPLETED**

---

### STEP 011 — Page-by-Page Migration & Visual Parity: /login
- **Step number**: STEP 011
- **Title**: Page-by-Page Migration & Visual Parity: /login
- **Objective**: Verify and perfect the modern `/login` page against `login.html` for 100% visual and functional parity.
- **Why it is required**: First user entrypoint; must look and behave identically to legacy login.
- **Dependencies**: STEP 010.
- **Files/modules involved**: `app/login/page.tsx`, `services/authService.ts`, `stores/useAuthStore.ts`, `login.html`.
- **Detailed implementation plan**:
  1. Inspect legacy `login.html` CSS, logo dimensions, ambient blur, card paddings, and button states.
  2. Audit `app/login/page.tsx` side-by-side in browser.
  3. Verify Firebase authentication, error banners, redirect to `/`, and keyboard submission.
  4. Test on desktop and mobile viewports.
- **Risk**: Subtle font weight, card radius, or focus ring discrepancies.
- **Validation method**: Visual comparison test + real authentication session test.
- **Completion criteria**: `/login` matches `login.html` pixel-for-pixel; sign-in and errors verified.
- **Status**: **COMPLETED**

---

### STEP 012 — Page-by-Page Migration & Visual Parity: / (Dashboard Overview & KPI Cards)
- **Step number**: STEP 012
- **Title**: Page-by-Page Migration & Visual Parity: / (Dashboard Overview & KPI Cards)
- **Objective**: Verify and perfect the modern `/` Dashboard against legacy `pages/Dashboard/Dashboard.html`.
- **Why it is required**: The primary command center; contains 12 critical KPI widgets and progress bars.
- **Dependencies**: STEP 011.
- **Files/modules involved**: `features/dashboard/components/*`, `app/(dashboard)/page.tsx`, `pages/Dashboard/*`.
- **Detailed implementation plan**:
  1. Compare legacy dashboard card layout (Pace, Compact Heatmap, Monthly Targets, Completion, Outcome, Active Now, Daily Targets, Weekly Targets, Daily Actions, Upcoming Exams, Passed Subjects, Program Grid).
  2. Verify all numbers, percentage math, dynamic colors, and click actions.
  3. Validate responsive grid behavior across 360px, 768px, 1024px, and 1440px.
- **Risk**: Missing KPI calculation or mismatched card heights.
- **Validation method**: Side-by-side browser audit; data parity check against test store data.
- **Completion criteria**: Dashboard renders identical cards, identical numbers, and identical glass styling.
- **Status**: **COMPLETED**

---

### STEP 013 — Page-by-Page Migration & Visual Parity: /focus (Timer & Chronograph Dial)
- **Step number**: STEP 013
- **Title**: Page-by-Page Migration & Visual Parity: /focus (Timer & Chronograph Dial)
- **Objective**: Verify and perfect modern `/focus` against `pages/Focus/Focus.html` and `Focus.js`.
- **Why it is required**: The core study execution engine; must have 0ms input lag, zero timer drift, and precision chronograph visuals.
- **Dependencies**: STEP 012.
- **Files/modules involved**: `features/focus/components/*`, `stores/useTimerStore.ts`, `features/focus/services/timerEngine.ts`, `pages/Focus/*`.
- **Detailed implementation plan**:
  1. Verify SVG chronograph dial needle rotation (seconds, minutes), tick illumination, and digital digits (`tnum`).
  2. Test stopwatch mode, countdown mode, and subject selection.
  3. Validate audio chimes (Web Audio API synthesis), fullscreen mode, and session history logging.
  4. Ensure timer tick updates only dial needles/digits without re-rendering parent tree.
- **Risk**: Timer drift in background tabs or audio playback blocking.
- **Validation method**: Run timer for 5 minutes; verify elapsed accuracy against system clock.
- **Completion criteria**: Chronograph dial, audio chimes, and session drawer match legacy exactly.
- **Status**: **COMPLETED**

---

### STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist)
- **Step number**: STEP 014
- **Title**: Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist)
- **Objective**: Verify and perfect modern `/subjects` against `pages/Subjects/Subjects.html` and `Subjects.js`.
- **Why it is required**: Complete academic syllabus management; thousands of chapters, status badges, and color hashing.
- **Dependencies**: STEP 013.
- **Files/modules involved**: `features/subjects/components/*`, `stores/useTaxonomyStore.ts`, `features/taxonomy/services/taxonomyService.ts`.
- **Detailed implementation plan**:
  1. Verify Program -> Track -> Subject card hierarchy.
  2. Verify 14-subject deterministic color coding (`hashStringToColor`).
  3. Test Chapter Checklist modal, completed/in-progress toggles, passed status, and progress bars.
  4. Verify instant IndexedDB write on chapter toggle.
- **Risk**: Slow rendering when expanding large subject lists with hundreds of chapters.
- **Validation method**: Toggle chapters across multiple subjects; verify state and cloud persistence.
- **Completion criteria**: Syllabus tree matches legacy visually; chapter checklist modal operates flawlessly.
- **Status**: **COMPLETED**

---

### STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
- **Step number**: STEP 015
- **Title**: Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
- **Objective**: Verify modern `/daily-actions` and monthly setup against `pages/Daily Actions/*`.
- **Why it is required**: Daily habit tracking (DADB), habit radar, and monthly-weekly-daily target cascade.
- **Dependencies**: STEP 014.
- **Files/modules involved**: `features/daily-actions/components/*`, `stores/useDailyActionStore.ts`, `stores/useTargetStore.ts`.
- **Detailed implementation plan**:
  1. Verify Daily Actions checklist, habit streak counters, and habit radar modal.
  2. Verify Monthly Target Setup modal: batch allocator, fractions, auto-spread across calendar days.
  3. Test target cascading: Monthly -> Weekly -> Daily database consistency.
- **Risk**: Cascade synchronization errors or broken date key resolution.
- **Validation method**: Create monthly target; verify auto-generated weekly and daily targets match legacy math.
- **Completion criteria**: Visual and functional parity achieved for DADB and Target wizards.
- **Status**: **COMPLETED** (2026-09-24)

---

### STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
- **Step number**: STEP 016
- **Title**: Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
- **Objective**: Verify modern `/schedule` against `pages/Daily Schedule/*` and `scheduleRoutine.js`.
- **Why it is required**: 24-hour time-blocking studio, routine sets, active slot detection, and duration calculations.
- **Dependencies**: STEP 015.
- **Files/modules involved**: `features/schedule/components/*`, `stores/useScheduleStore.ts`, `features/schedule/services/scheduleService.ts`.
- **Detailed implementation plan**:
  1. Verify 24-hour timeline grid segmented into 1-hour slots.
  2. Test active slot detection based on current system time.
  3. Test ScheduleBlockModal (add, edit, delete block) and RoutineAllocationList.
  4. Verify total allocated hours calculation.
- **Risk**: Time zone offset or 12h/24h conversion errors.
- **Validation method**: Verify current time slot highlights in real-time; test block creation.
- **Completion criteria**: Timeline grid and active now cards match legacy exactly.
- **Status**: **COMPLETED** (2026-09-24)

---

### STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
- **Step number**: STEP 017
- **Title**: Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
- **Objective**: Verify modern `/pace` against `pages/Pace Management/*` and `paceManager.js`.
- **Why it is required**: Critical pace velocity math, chapters/day requirements, and projected finish dates.
- **Dependencies**: STEP 016.
- **Files/modules involved**: `features/pace/components/*`, `stores/usePaceStore.ts`, `features/pace/services/paceEngine.ts`.
- **Detailed implementation plan**:
  1. Verify PaceStatsBanner: overall pace, required daily rate, projected completion date.
  2. Verify PaceGoalCards for individual subjects with progress rings and date pickers.
  3. Test AddPaceGoalModal and goal adjustments.
- **Risk**: Velocity formula discrepancies compared to legacy calculations.
- **Validation method**: Run pace tests; compare projected finish dates against legacy engine.
- **Completion criteria**: Pace calculations and cards match legacy down to the pixel.
- **Status**: **COMPLETED** (2026-09-24)

---

### STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
- **Step number**: STEP 018
- **Title**: Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
- **Objective**: Verify modern `/outcome` against `pages/Outcome/*` and `outcomeResults.js`.
- **Why it is required**: Academic grading engine, 4.00 CGPA calculations, pass-freeze, and celebration animations.
- **Dependencies**: STEP 017.
- **Files/modules involved**: `features/outcome/components/*`, `stores/useOutcomeStore.ts`, `features/outcome/services/outcomeEngine.ts`.
- **Detailed implementation plan**:
  1. Verify CGPA summary card, grade letter badges, and weighted average math.
  2. Verify PassFreezeSection: toggle passed subjects, lock grades, and update success score.
  3. Verify CelebrationSection: celebration targets, confetti trigger (`canvas-confetti`).
  4. Test ResultEntryModal (add, edit, delete course result).
- **Risk**: Rounding discrepancies in 4.00 CGPA scale.
- **Validation method**: Test edge cases (all A+, mixed grades, failed courses); compare against legacy. Unit tests (40/40), typecheck passed, desktop/mobile responsive verified.
- **Completion criteria**: Outcome studio, grade tables, and celebration mode verified.
- **Status**: **COMPLETED**

---

### STEP 019 — Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection)
- **Step number**: STEP 019
- **Title**: Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection)
- **Objective**: Verify modern `/exam` against `pages/Exam Routine/*` and `examRoutine.js`.
- **Why it is required**: Exam dates routine, countdown hero widget, and header live countdown synchronization.
- **Dependencies**: STEP 018.
- **Files/modules involved**: `features/exam/components/*`, `stores/useExamStore.ts`, `pages/Exam Routine/*`.
- **Detailed implementation plan**:
  1. Verify CountdownHero: days/hours/minutes left with tabular countdown font.
  2. Verify ExamRoutineTable: subject name, exam date, time slot, venue, and status pill.
  3. Test ExamModal (create, edit, delete exam session) and active countdown selector.
  4. Verify header countdown widget updates when active exam is changed.
- **Risk**: Date parsing issues across different locales.
- **Validation method**: Add exam; verify countdown ticks accurately in hero and top header.
- **Completion criteria**: Exam routine table and countdown hero match legacy exactly.
- **Status**: **NOT STARTED**

---

### STEP 020 — Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config)
- **Step number**: STEP 020
- **Title**: Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config)
- **Objective**: Verify modern `/master-config` against `pages/Master Config/*` and `masterConfig.js`.
- **Why it is required**: System configuration: track definitions, program visibility, priority order, data backup.
- **Dependencies**: STEP 019.
- **Files/modules involved**: `features/config/components/*`, `stores/useTaxonomyStore.ts`, `pages/Master Config/*`.
- **Detailed implementation plan**:
  1. Verify TracksProgramsSection: add track, edit track, toggle program visibility.
  2. Verify PriorityConfigSection: drag-and-drop or order adjustments for academic priorities.
  3. Verify backup & restore tools (JSON export and import).
- **Risk**: Accidental taxonomy corruption during editing.
- **Validation method**: Test track creation and visibility toggle; verify cloud persistence.
- **Completion criteria**: Master config studio matches legacy interface and behavior.
- **Status**: **NOT STARTED**

---

### STEP 021 — Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar)
- **Step number**: STEP 021
- **Title**: Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar)
- **Objective**: Verify modern `/analytics` against `pages/Analytics/*` and `spectra.js`.
- **Why it is required**: Advanced analytics studio: multi-week study heatmaps, habit radar arcs, chapter progress maps.
- **Dependencies**: STEP 020.
- **Files/modules involved**: `features/analytics/components/*`, `features/analytics/services/*`, `pages/Analytics/*`.
- **Detailed implementation plan**:
  1. Verify FocusHeatmapCard: multi-week calendar matrix with color intensity tiers based on hours.
  2. Verify HabitRadarSection: polar radar SVG with smooth bezier arcs and completion statistics.
  3. Verify ChapterMapSection: progress breakdown per subject and track.
  4. Verify StatFilterToolbar: date range selector, grouping options, and history drawer.
- **Risk**: Canvas/SVG performance degradation on mobile devices.
- **Validation method**: Verify all charts render smoothly without layout thrashing.
- **Completion criteria**: Spectra analytics studio achieves 100% visual and behavioral parity.
- **Status**: **NOT STARTED**

---

### STEP 022 — Comprehensive Cross-Device & Responsive Verification (360px - 1440px)
- **Step number**: STEP 022
- **Title**: Comprehensive Cross-Device & Responsive Verification (360px - 1440px)
- **Objective**: Test every modernized page across all required viewports (360px, 390px, 414px, 768px, 1024px, 1440px).
- **Why it is required**: Mobile parity is a first-class requirement; zero horizontal overflow, touch-friendly UI.
- **Dependencies**: STEP 011 through STEP 021.
- **Files/modules involved**: All components in `app/`, `components/`, and `features/`.
- **Detailed implementation plan**:
  1. Inspect layout at 360px (compact Android phone): ensure no clipping or overflow.
  2. Inspect layout at 768px (tablet): verify 2-column card wrapping.
  3. Inspect layout at 1024px+ (desktop): verify persistent sidebar and 3-column grid.
  4. Verify touch targets are >= 44x44px and input font sizes >= 16px.
- **Risk**: Subtle horizontal scrollbar appearing on small screens.
- **Validation method**: Automated and manual browser viewport sweeps.
- **Completion criteria**: Zero horizontal overflow, touch-friendly controls across all 6 breakpoints.
- **Status**: **NOT STARTED**

---

### STEP 023 — Decommissioning & Archiving of Monolithic Legacy JavaScript Files
- **Step number**: STEP 023
- **Title**: Decommissioning & Archiving of Monolithic Legacy JavaScript Files
- **Objective**: Safely move unminified legacy scripts (2.5+ MB) into `archive/` after parity is proven.
- **Why it is required**: Clean codebase, eliminate dead code, prevent confusion between legacy and modern implementations.
- **Dependencies**: STEP 022.
- **Files/modules involved**: `js/features/*`, `pages/*/*.js`, `shared/services/timerService.js`.
- **Detailed implementation plan**:
  1. Confirm zero imports or references remain in active modern code.
  2. Confirm test suites still pass.
  3. Move legacy JS files to `archive/legacy-js/`.
  4. Verify build and runtime integrity.
- **Risk**: Inadvertently removing a script still referenced by a legacy fallback.
- **Validation method**: Run full test suite; verify Next.js build and browser navigation.
- **Completion criteria**: All legacy JS safely archived with zero regression.
- **Status**: **NOT STARTED**

---

### STEP 024 — Elimination of Legacy Monolithic HTML Shell (index.html, login.html)
- **Step number**: STEP 024
- **Title**: Elimination of Legacy Monolithic HTML Shell (index.html, login.html)
- **Objective**: Archive monolithic `index.html` (294.6 KB) and `login.html` once Next.js is primary entrypoint.
- **Why it is required**: Remove 300+ KB of dead HTML and ensure clean production deployment.
- **Dependencies**: STEP 023.
- **Files/modules involved**: `index.html`, `login.html`, `router/router.js`.
- **Detailed implementation plan**:
  1. Confirm Next.js root route `/` and `/login` handle all production traffic.
  2. Move `index.html` and `login.html` to `archive/legacy-html/`.
  3. Verify production server points cleanly to Next.js output.
- **Risk**: Broken legacy dev server fallback.
- **Validation method**: Confirm Next.js server serves all routes without index.html.
- **Completion criteria**: Legacy HTML archived; Next.js serves 100% of application requests.
- **Status**: **NOT STARTED**

---

### STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)
- **Step number**: STEP 025
- **Title**: Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)
- **Objective**: Optimize client-side JavaScript bundles to under 350 KB gzipped.
- **Why it is required**: Fast download, parse, and execution on slow 4G mobile connections.
- **Dependencies**: STEP 024.
- **Files/modules involved**: `next.config.ts`, `app/*`, `features/*`.
- **Detailed implementation plan**:
  1. Implement `next/dynamic` lazy loading for Chart.js, Spectra heatmaps, and habit radar.
  2. Tree-shake unused Lucide icons.
  3. Analyze bundle size with Next.js bundle analyzer.
- **Risk**: Flash of unstyled content or delayed chart rendering.
- **Validation method**: Bundle analyzer report confirms main chunk < 350 KB gzipped.
- **Completion criteria**: Target bundle size achieved without visual disruption.
- **Status**: **NOT STARTED**

---

### STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s)
- **Step number**: STEP 026
- **Title**: Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s)
- **Objective**: Achieve Lighthouse Performance score > 90, LCP < 2.0s, FCP < 1.0s, and CLS = 0.
- **Why it is required**: Modernize from legacy 37 Lighthouse score and 29.9s LCP bottleneck.
- **Dependencies**: STEP 025.
- **Files/modules involved**: `app/layout.tsx`, `app/globals.css`, `public/*`.
- **Detailed implementation plan**:
  1. Optimize font loading with Next.js font display swap (`next/font/google`).
  2. Preconnect to critical domains (Firestore, Google Fonts).
  3. Eliminate any layout shifts by specifying explicit aspect ratios and skeleton states.
- **Risk**: Regressions in visual styling during optimization.
- **Validation method**: Run Lighthouse performance audit on production build.
- **Completion criteria**: Lighthouse score > 90, LCP < 2.0s, FCP < 1.0s.
- **Status**: **NOT STARTED**

---

### STEP 027 — Mobile & Android Low-Power Optimization (Touch Latency & Background Timers)
- **Step number**: STEP 027
- **Title**: Mobile & Android Low-Power Optimization (Touch Latency & Background Timers)
- **Objective**: Ensure 60fps scrolling and responsive interaction on low-to-mid range Android devices.
- **Why it is required**: User actively studies using mobile devices on 4G networks.
- **Dependencies**: STEP 026.
- **Files/modules involved**: `features/focus/hooks/useTimerTicker.ts`, `components/shell/Sidebar.tsx`.
- **Detailed implementation plan**:
  1. Test timer execution under Android background tab throttling; ensure timestamp math prevents drift.
  2. Optimize touch response with `touch-action: manipulation` and active state feedback.
  3. Minimize memory allocations during active stopwatch/timer execution.
- **Risk**: Android OS killing background study sessions.
- **Validation method**: Simulated CPU 4x throttling test; timer verification over 30 minutes.
- **Completion criteria**: Touch latency < 100ms; zero timer drift under throttling.
- **Status**: **NOT STARTED**

---

### STEP 028 — Modern Accessibility & ARIA Modernization (WCAG 2.1 AA)
- **Step number**: STEP 028
- **Title**: Modern Accessibility & ARIA Modernization (WCAG 2.1 AA)
- **Objective**: Achieve full keyboard navigation, screen-reader compatibility, and Lighthouse Accessibility > 95.
- **Why it is required**: Modern web standard compliance without changing the visual aesthetic.
- **Dependencies**: STEP 027.
- **Files/modules involved**: All components in `components/` and `features/`.
- **Detailed implementation plan**:
  1. Ensure all interactive buttons, tabs, and checkboxes have semantic tags or ARIA labels.
  2. Verify visible focus rings matching glassmorphic design (`glowing-input:focus`).
  3. Test keyboard navigation across all 11 pages (Tab, Enter, Space, Escape).
- **Risk**: Intrusive default browser focus outlines clashing with dark theme.
- **Validation method**: Lighthouse Accessibility audit > 95; screen-reader verification.
- **Completion criteria**: Full WCAG 2.1 AA keyboard and ARIA compliance.
- **Status**: **NOT STARTED**

---

### STEP 029 — Production PWA Service Worker (Serwist/Workbox Offline Study Engine)
- **Step number**: STEP 029
- **Title**: Production PWA Service Worker (Serwist/Workbox Offline Study Engine)
- **Objective**: Deploy a robust Service Worker for asset caching and true offline study capability.
- **Why it is required**: Fix legacy limitation where no Service Worker was active; enable offline study.
- **Dependencies**: STEP 028.
- **Files/modules involved**: `public/sw.js`, `manifest.json`, `app/layout.tsx`.
- **Detailed implementation plan**:
  1. Configure Workbox/Serwist caching strategy: Cache-First for static assets/fonts, Network-First for Firestore.
  2. Register Service Worker in root layout.
  3. Verify PWA installation prompt and standalone launch behavior.
- **Risk**: Stale cache serving outdated application code after updates.
- **Validation method**: Disconnect network in DevTools; verify app loads and timer runs offline.
- **Completion criteria**: PWA installable and fully functional offline.
- **Status**: **NOT STARTED**

---

### STEP 030 — Production Hardening & Vercel Edge Security Optimization
- **Step number**: STEP 030
- **Title**: Production Hardening & Vercel Edge Security Optimization
- **Objective**: Configure production security headers, CSP, caching headers, and Edge deployment rules.
- **Why it is required**: Protect application from XSS, clickjacking, and latency.
- **Dependencies**: STEP 029.
- **Files/modules involved**: `vercel.json`, `next.config.ts`.
- **Detailed implementation plan**:
  1. Add Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options: DENY.
  2. Configure immutable asset caching headers for static assets.
  3. Test Vercel edge deployment build.
- **Risk**: Overly strict CSP blocking necessary Firebase or font resources.
- **Validation method**: Securityheaders.com audit achieves A rating; Firebase Auth functions cleanly.
- **Completion criteria**: Production headers active and verified on Vercel deployment.
- **Status**: **NOT STARTED**

---

### STEP 031 — End-to-End Regression & Data Integrity Cloud Verification
- **Step number**: STEP 031
- **Title**: End-to-End Regression & Data Integrity Cloud Verification
- **Objective**: Perform exhaustive end-to-end regression across all 11 user workflows on a Firestore clone.
- **Why it is required**: Confirm zero data corruption, zero lost features, and perfect calculation parity.
- **Dependencies**: STEP 030.
- **Files/modules involved**: Entire modernized application.
- **Detailed implementation plan**:
  1. Test authentication lifecycle (login, auto-refresh, logout).
  2. Test study execution: timer session, chapter completion, target auto-cascade, pace update.
  3. Test 24h schedule editing, exam countdown change, CGPA simulation, and taxonomy edit.
  4. Verify cloud Firestore document payload matches schema rules.
- **Risk**: Subtle data model discrepancy under edge conditions.
- **Validation method**: Automated and manual end-to-end user journey test.
- **Completion criteria**: 100% of user workflows pass without errors or data anomalies.
- **Status**: **NOT STARTED**

---

### STEP 032 — Final Legacy Decommissioning & Production Cutover Sign-Off
- **Step number**: STEP 032
- **Title**: Final Legacy Decommissioning & Production Cutover Sign-Off
- **Objective**: Finalize production cutover to modern Next.js engine, complete documentation, and sign off.
- **Why it is required**: Formal completion of the technical modernization project.
- **Dependencies**: STEP 031.
- **Files/modules involved**: `docs/*`, `README.md`.
- **Detailed implementation plan**:
  1. Create final recoverable git tag and backup checkpoint.
  2. Update all documentation files with final production metrics.
  3. Present final before/after modernization report to user.
- **Risk**: None (parity already proven in STEP 031).
- **Validation method**: Final production verification on canonical domain.
- **Completion criteria**: Project modernized, documented, and fully signed off.
- **Status**: **NOT STARTED**
