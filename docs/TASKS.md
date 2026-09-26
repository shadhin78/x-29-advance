# X-29 Advance — Master Technical Modernization Tasks (TASKS.md)

> **Document Status**: Active Implementation Task Tracker  
> **Target Audience**: AI Development Agents & Engineering Team  
> **Rule**: Execute strictly one numbered step at a time upon explicit user command. Never advance to the next step without full verification and checkpointing.

---

## Master Progress Summary

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

> **PERMANENT PARITY MANDATE**:  
> The original X-29 HTML/CSS/JS implementation is the visual source of truth. Technical modernization must not redesign, restyle, reinterpret, or alter the established interface unless the user explicitly requests a design change.

PAGE-BY-PAGE PARITY VERIFICATION
[x] STEP 011 — Page-by-Page Migration & Visual Parity: /login
[x] STEP 012 — DESIGN PARITY RECOVERY: Shell, Sidebar, Header & Dashboard (/) (COMPLETED & VERIFIED)
[x] STEP 013 — Page-by-Page Migration & Visual Parity: /focus (Timer & Chronograph Dial) (COMPLETED & VERIFIED)
[x] STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist) (COMPLETED & VERIFIED)
[x] STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup (COMPLETED & VERIFIED)
[x] STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot) (COMPLETED & VERIFIED)
[x] STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts) (COMPLETED & VERIFIED)
[x] STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode) (COMPLETED & VERIFIED)
[x] STEP 019 — Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection) (COMPLETED & VERIFIED)
[x] STEP 020 — Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config) (COMPLETED & VERIFIED)
[x] STEP 021 — Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar) (COMPLETED & VERIFIED)

OPTIMIZATION & PRODUCTION HARDENING
[x] STEP 022 — Comprehensive Cross-Device & Responsive Verification (360px - 1440px) (COMPLETED & VERIFIED)
[x] STEP 023 — Decommissioning & Archiving of Monolithic Legacy JavaScript Files (COMPLETED & VERIFIED)
[x] STEP 024 — Elimination of Legacy Monolithic HTML Shell (index.html, login.html) (COMPLETED & VERIFIED)
[x] STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip) (COMPLETED & VERIFIED)
[x] STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s) (COMPLETED & VERIFIED)
[ ] STEP 027 — Mobile & Android Low-Power Optimization (Touch Latency & Background Timers) (NEXT IN QUEUE)
[ ] STEP 028 — Modern Accessibility & ARIA Modernization (WCAG 2.1 AA)
[ ] STEP 029 — Production PWA Service Worker (Serwist/Workbox Offline Study Engine)
[ ] STEP 030 — Production Hardening & Vercel Edge Security Optimization
[ ] STEP 031 — End-to-End Regression & Data Integrity Cloud Verification
[ ] STEP 032 — Final Legacy Decommissioning & Production Cutover Sign-Off

LEGACY CODE ELIMINATION ROADMAP (docs/LEGACY-CODE-ELIMINATION.md)
[x] LEGACY STEP 001 — Complete Dependency & Runtime Inventory (COMPLETED)
[x] LEGACY STEP 002 — Modernize Test Suite & Decouple Legacy JS Test Dependencies (COMPLETED & VERIFIED)
[x] LEGACY STEP 003 — Archive 16 Completely Unreferenced Legacy JavaScript Files (COMPLETED & VERIFIED)
[x] LEGACY STEP 004 — Archive Test-Referenced Legacy JavaScript & Update Package Entrypoints (COMPLETED & VERIFIED)
[x] LEGACY STEP 005 — Archive Inactive Legacy HTML Templates from pages/ (COMPLETED & VERIFIED)
[x] LEGACY STEP 006 — Remove Obsolete Configuration and Orphaned Root Files (COMPLETED & VERIFIED)
[ ] LEGACY STEP 007 — Clean Up Remnant Window Global & Fallback Bridges in Modern Code (NEXT IN QUEUE)
[ ] LEGACY STEP 008 — Extract and Consolidate Active Legacy CSS into Design System
[ ] LEGACY STEP 009 — Archive Legacy CSS Files and Decommission pages/ and css/ Directories
[ ] LEGACY STEP 010 — Production Bundle & Performance Optimization
[ ] LEGACY STEP 011 — Full Regression, PWA, Mobile & Data Persistence Verification
[ ] LEGACY STEP 012 — Final Legacy Architecture Sign-Off & Lock
```

---

## Detailed Task Breakdown

### STEP 001 — Full Project Architecture Audit & Inventory
- [x] Scan all project folders, files, sizes, and lines of code.
- [x] Identify top large files (`monthlyTargets.js`, `timerService.js`, `index.html`).
- [x] Audit Firestore security rules and user document schema (`/users/{uid}`).
- [x] Map legacy `window.AppState` mutations and data flow.
- **Status**: **COMPLETED**

---

### STEP 002 — Baseline Performance & Disaster Recovery Safeguards
- [x] Run headless Lighthouse audit on legacy SPA (Recorded: Performance 37, LCP 29.9s).
- [x] Document legacy Core Web Vitals in `docs/PERFORMANCE.md`.
- [x] Create automated Firestore backup and verify scripts (`scripts/backup.js`).
- [x] Commit baseline git checkpoint (`873c49a`).
- **Status**: **COMPLETED**

---

### STEP 003 — Next.js 16, React 19 & TypeScript Build Foundation
- [x] Configure `package.json` with Next.js 16.3.5, React 19.3.0, TypeScript 7.
- [x] Set up PostCSS build pipeline (`@tailwindcss/postcss`) replacing `cdn.tailwindcss.com`.
- [x] Configure strict `tsconfig.json` with path aliases (`@/*`).
- [x] Verify clean Next.js build (`npm run build`).
- **Status**: **COMPLETED**

---

### STEP 004 — Clean Single-Domain URL Routing & App Router Shell
- [x] Implement root layout with Google Fonts (`Inter` and `Outfit`) and providers.
- [x] Create route group `app/(dashboard)/` for clean URLs without subfolder paths.
- [x] Define 11 feature routes (`/`, `/focus`, `/analytics`, `/schedule`, `/subjects`, etc.).
- [x] Build `/login` route with glassmorphic authentication shell.
- **Status**: **COMPLETED**

---

### STEP 005 — Strict Domain TypeScript Contracts & Schema Modeling
- [x] Model domain entities in `types/` (15 definition files).
- [x] Guarantee zero `any` types across the modern codebase.
- [x] Match types strictly to `firestore.rules` allowed keys.
- [x] Verify complete type coverage with `npm run typecheck` (0 errors).
- **Status**: **COMPLETED**

---

### STEP 006 — Shared UI Design System Primitives & Radix Components
- [x] Integrate Radix UI Dialog preserving glassmorphism (`backdrop-filter: blur(20px)`).
- [x] Build HeaderBar with live countdown and sync indicator pill.
- [x] Build responsive Sidebar navigation with canonical route indicators.
- [x] Build MobileHeader and mobile drawer navigation.
- **Status**: **COMPLETED**

---

### STEP 007 — Domain-Partitioned Zustand Stores Architecture
- [x] Implement 12 domain Zustand stores under `stores/`.
- [x] Decouple global state into isolated domains: Auth, Timer, Tasks, Taxonomy, Targets, Schedule, Outcome, Pace, Habits, Sync, Modal, Exam.
- [x] Verify store actions with 27 ESM unit tests (`npm run test:unit`).
- **Status**: **COMPLETED**

---

### STEP 008 — Modular Firebase 12 Architecture & Auth Integration
- [x] Implement modular Firebase 12 client SDK in `lib/firebase/client.ts`.
- [x] Connect `AuthService` and `useAuthStore` to Firebase Authentication.
- [x] Ensure server service account secrets are never bundled client-side.
- [x] Verify auth state persistence across browser reloads.
- **Status**: **COMPLETED**

---

### STEP 009 — Local-First IndexedDB Engine & Coalesced Sync Service
- [x] Implement lightweight IndexedDB wrapper via `idb` (`lib/storage/indexeddb.ts`).
- [x] Build coalesced, debounced (180ms) background Firestore synchronizer.
- [x] Implement self-write echo guard (`_lastWriteId`) to prevent echo re-renders.
- [x] Implement tombstone tracking for robust deletion consistency.
- **Status**: **COMPLETED**

---

### STEP 010 — Feature Domain Slices & Component Tree Scaffolding
- [x] Scaffold 55 feature components, services, and hooks across 10 domain slices under `features/`.
- [x] Connect components to domain stores and calculation services.
- [x] Verify Turbopack production compilation (`npm run build` succeeds in 2.2s).
- **Status**: **COMPLETED**

---

### STEP 011 — Page-by-Page Migration & Visual Parity: /login
- [x] Inspect legacy `login.html` CSS, dimensions, shadows, and focus rings.
- [x] Test `app/login/page.tsx` side-by-side in browser.
- [x] Verify Firebase Auth sign-in, error banners, and redirect.
- [x] Verify keyboard `Enter` submission and mobile viewport centering.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 011.
- **Status**: **COMPLETED**

---

### STEP 012 — Page-by-Page Migration & Visual Parity: / (Dashboard Overview & KPI Cards)
- [x] Audit 12 dashboard cards against legacy `pages/Dashboard/Dashboard.html`.
- [x] Verify all numbers, percentage math, dynamic colors, and click actions.
- [x] Integrate TrendsBar (X Bar) and Track Completion Grid to achieve 100% section parity.
- [x] Validate responsive grid behavior (3-col desktop, 2-col tablet, 1-col mobile).
- [x] Verify zero console errors and zero layout shifts.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 012.
- **Status**: **COMPLETED**

---

### STEP 013 — Page-by-Page Migration & Visual Parity: /focus (Timer & Chronograph Dial)
- [x] Audit SVG Chronograph dial needle rotation, drop shadows, and tick marks against `Focus.html`.
- [x] Verify stopwatch and countdown modes with tabular font (`00:00:00`) and milliseconds split display.
- [x] Test Web Audio API chimes and hardware-accelerated fullscreen mode (`.timer-fullscreen`).
- [x] Verify timer tick updates only dial needles/digits without parent tree re-rendering.
- [x] Verify study log persistence to IndexedDB and Firestore.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 013.
- **Status**: **COMPLETED**

---

### STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist)
- [x] Verify Global Overall Completion header, database link, and circular syllabus gauge against `Subjects.html`.
- [x] Verify expandable Subject Progress accordion with track & program progress bars using canonical color pairs.
- [x] Verify Filter Tasks by Subject navigation with `All Tasks`, `Revise Subject`, and program/subject pills.
- [x] Verify expandable Subject Cards with 4 pace cards (Time Goal, Req Pace, Actual Pace, Est Finish).
- [x] Verify chapter task cards with subject color top accent bar and interactive circular checkboxes (`task-checkbox`).
- [x] Test modals: Time Goal modal (`SubjectTimeModal`), Edit Subject modal (`SubjectEditModal`), Revision modal (`RevisionModal`), Trend modal (`SingleSubjectTrendModal`), and Syllabus modal (`GlobalChaptersModal`).
- [x] Verify instant IndexedDB write and Firestore debounced sync on chapter toggle.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 014.
- **Status**: **COMPLETED**

---

### STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
- [x] Verify Daily Habits checklist (DADB) and streak counters against `Daily Actions.html`.
- [x] Verify Habit Radar modal with polar SVG radar chart.
- [x] Verify Monthly Target Setup modal: batch allocator, fractions, and auto-spread engine.
- [x] Verify target cascading from Monthly -> Weekly -> Daily database.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 015.
- **Status**: **COMPLETED** (2026-09-24)

---

### STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
- [x] Verify 24-hour timeline grid against `Daily Schedule.html`.
- [x] Test real-time active slot detection based on system clock.
- [x] Test ScheduleBlockModal (create, edit, delete 24h block).
- [x] Verify total allocated hours calculation per activity.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 016.
- **Status**: **COMPLETED** (2026-09-24)

---

### STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
- [x] Verify PaceStatsBanner metrics (Required Pace, Current Velocity, Forecast Date).
- [x] Verify PaceGoalCards for individual subjects with progress bars and 4 action buttons.
- [x] Test AddPaceGoalModal / inline goal creation form and date adjustments.
- [x] Confirm pace math matches legacy formulas exactly.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 017.
- **Status**: **COMPLETED** (2026-09-24)

---

### STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
- [x] Verify CGPA summary card and 4.00-scale conversion math.
- [x] Verify PassFreezeSection: toggle passed subjects, lock grades, update success score.
- [x] Verify CelebrationSection: celebration threshold and confetti animation.
- [x] Test ResultEntryModal (add, edit, delete course result).
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 018.
- **Status**: **COMPLETED**

---

### STEP 019 — Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection)
- [x] Verify CountdownHero card with tabular countdown digits against `Exam Routine.html`.
- [x] Verify ExamRoutineTable with subject name, date, time slot, venue, and status pills.
- [x] Test ExamModal and active countdown selection.
- [x] Verify top header countdown updates dynamically when active exam changes.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 019.
- **Status**: **COMPLETED**

---

### STEP 020 — Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config)
- [x] Verify TracksProgramsSection: add track, edit track, toggle program visibility.
- [x] Verify PriorityConfigSection: priority order adjustments.
- [x] Verify JSON backup download and upload tools.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 020.
- **Status**: **COMPLETED**

---

### STEP 021 — Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar)
- [x] Verify FocusHeatmapCard: multi-week matrix with 5 color intensity tiers.
- [x] Verify HabitRadarSection: polar radar SVG with smooth bezier arcs.
- [x] Verify ChapterMapSection: progress breakdown per subject and track.
- [x] Verify StatFilterToolbar: date range selector (7D, 30D, 90D, All).
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [x] Git commit checkpoint for STEP 021.
- **Status**: **COMPLETED**

---

### STEP 022 — Comprehensive Cross-Device & Responsive Verification (360px - 1440px)
- [x] Test every modernized page across viewports: 360px, 390px, 414px, 768px, 1024px, 1440px.
- [x] Verify zero horizontal overflow on all screen sizes (`overflow-x: hidden`).
- [x] Verify touch targets >= 44x44px and input font sizes >= 16px.
- [x] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- **Status**: **COMPLETED**

---

### STEP 023 — Decommissioning & Archiving of Monolithic Legacy JavaScript Files
- [x] Confirm zero active dependencies on legacy `.js` files.
- [x] Confirm automated test suite passes after archiving.
- [x] Move legacy `.js` files into `archive/legacy-js/`.
- [x] Update `MEMORY.md` and `MIGRATION-LOG.md`.
- **Status**: **COMPLETED**

---

### STEP 024 — Elimination of Legacy Monolithic HTML Shell (index.html, login.html)
- [x] Confirm Next.js handles 100% of routes and traffic.
- [x] Move `index.html` and `login.html` into `archive/legacy-html/`.
- [x] Verify Next.js production server functions independently.
- [x] Update `MEMORY.md` and `MIGRATION-LOG.md`.
- **Status**: **COMPLETED**

---

### STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)
- [x] Implement `next/dynamic` lazy loading for Chart.js, heatmaps, habit radar, and heavy off-screen modals across all feature studios.
- [x] Tree-shake unused Lucide icons and dependencies via `optimizePackageImports`.
- [x] Isolate Firestore client into asynchronous lazy-loaded module, reducing initial page bundles by ~140 KB gzip across all routes.
- [x] Measure client JS bundle size with Next.js bundle analyzer and custom per-route chunk analyzer (All routes < 253 KB Gzip, well below 350 KB threshold).
- [x] Update `MIGRATION-LOG.md` and `MEMORY.md`.
- **Status**: **COMPLETED**

---

### STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s)
- [x] Optimize font loading with Next.js self-hosted font display swap (`next/font/google` for Inter, Outfit, JetBrains Mono, Rajdhani, Chakra Petch; zero FOIT, zero render-blocking stylesheet requests).
- [x] Preconnect and dns-prefetch critical domains (Firestore, Firebase Auth Identity Toolkit).
- [x] Eliminate layout shifts with explicit aspect ratios, fixed widget dimensions, and skeletons (CLS = 0.0000 across all 11 routes).
- [x] Optimize asset payloads (`sharp` image optimization reducing `logo-sticker.png` by 99.2% from 672 KB to 5.4 KB).
- [x] Run Chrome DevTools Protocol (CDP) Core Web Vitals audit (LCP 40–232.6ms [budget < 2.0s], FCP 40–208ms [budget < 1.0s], CLS 0.0000).
- [x] Update `PERFORMANCE.md` and `MEMORY.md`.
- **Status**: **COMPLETED**

---

### STEP 027 — Mobile & Android Low-Power Optimization (Touch Latency & Background Timers)
- [ ] Test timer execution under Android background throttling (verify zero drift).
- [ ] Optimize touch feedback with `touch-action: manipulation`.
- [ ] Test on low-to-mid range Android simulation.
- [ ] Update `PERFORMANCE.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

---

### STEP 028 — Modern Accessibility & ARIA Modernization (WCAG 2.1 AA)
- [ ] Verify semantic tags, ARIA labels, and role attributes across all components.
- [ ] Verify visible focus rings matching glassmorphic design.
- [ ] Verify keyboard navigation across all 11 pages (Tab, Enter, Space, Escape).
- [ ] Run Lighthouse Accessibility audit (Target: > 95).
- [ ] Update `PERFORMANCE.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

---

### STEP 029 — Production PWA Service Worker (Serwist/Workbox Offline Study Engine)
- [ ] Configure Workbox/Serwist caching strategy in Service Worker.
- [ ] Register Service Worker in root layout.
- [ ] Verify offline study capability and PWA install prompt.
- [ ] Update `PERFORMANCE.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

---

### STEP 030 — Production Hardening & Vercel Edge Security Optimization
- [ ] Configure `vercel.json` with security headers (CSP, HSTS, X-Frame-Options).
- [ ] Configure immutable static asset caching rules.
- [ ] Test edge deployment build on Vercel.
- [ ] Update `MIGRATION-LOG.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

---

### STEP 031 — End-to-End Regression & Data Integrity Cloud Verification
- [ ] Test all 11 user journeys end-to-end on Firestore data clone.
- [ ] Verify zero data corruption, zero lost fields, and perfect calculation parity.
- [ ] Update `MEMORY.md` and `MIGRATION-LOG.md`.
- **Status**: **NOT STARTED**

---

### STEP 032 — Final Legacy Decommissioning & Production Cutover Sign-Off
- [ ] Create permanent git release tag.
- [ ] Final documentation sign-off in `README.md` and `docs/*`.
- [ ] Present before/after modernization report.
- **Status**: **NOT STARTED**

---

## Legacy Elimination Tasks (docs/LEGACY-CODE-ELIMINATION.md)

### LEGACY STEP 001 — Complete Dependency & Runtime Inventory
- [x] Scan all 53 legacy candidate files across `pages/`, `js/`, `css/`, `api/`, and root.
- [x] Trace AST imports and requires across all modern TypeScript components.
- [x] Verify runtime HTTP status codes on local server (all legacy HTML/JS return 404).
- [x] Audit CSS selectors: 112 active classes and 51 active IDs identified.
- [x] Generate master roadmap specification in `docs/LEGACY-CODE-ELIMINATION.md`.
- **Status**: **COMPLETED**

---

### LEGACY STEP 002 — Modernize Test Suite & Decouple Legacy JS Test Dependencies
- [x] Update `package.json` `"test"` script to run `node --test tests/*.test.mjs`.
- [x] Update `package.json` with granular modern test runners (`test:timer`, `test:exam`, `test:analytics`, `test:pace`, `test:outcome`, `test:targets`, `test:taxonomy`, `test:schedule`, `test:e2e`, `test:pwa`, `test:a11y`, `test:security`).
- [x] Preserve legacy test suite under `test:legacy` for historical reference.
- [x] Verify all 15 test suites and 84 unit/domain tests pass with 100% success (505ms).
- [x] Verify `npm test` has zero runtime or build dependency on `js/`.
- [x] Verify TypeScript compiles with 0 errors (`tsc --noEmit`).
- [x] Verify Next.js production build succeeds with 14/14 static pages.
- [x] Confirm zero UI/design/runtime regressions.
- **Status**: **COMPLETED**

---

### LEGACY STEP 003 — Archive 16 Completely Unreferenced Legacy JavaScript Files
- [x] Create automated archival engine with SHA-256 verification (`scripts/archive-unreferenced-legacy-js.mjs`).
- [x] Cryptographically verify and copy 16 unreferenced JS files (108.4 KB) to `archive/legacy-js/js/`:
  - `js/core/rollover.js`, `js/core/scheduleSlot.js`, `js/core/state.js`
  - `js/pages/login/login.js`
  - `js/services/backup.js`, `js/services/firebase.js`, `js/services/taxonomy.js`
  - `js/shared/audio.js`, `js/shared/confetti.js`, `js/shared/toast.js`
  - `js/state.js`
  - `js/utils/date.js`, `js/utils/format.js`, `js/utils/id.js`, `js/utils/sanitize.js`, `js/utils/storage.js`
- [x] Update `js/core/app.js` import paths for `state.js` and `rollover.js` to point to `archive/legacy-js/js/`.
- [x] Safely unlink the 16 source files and remove empty directories `js/pages/login/` and `js/pages/`.
- [x] Verify `node tests/app-core.test.js` passes 9/9 tests with updated archive import paths.
- [x] Verify all 15 modern test suites pass 84/84 tests via `npm test` (506ms).
- [x] Verify TypeScript compilation clean with 0 errors (`npm run typecheck`).
- [x] Verify Next.js production build succeeds with 14/14 static pages (`npm run build`).
- **Status**: **COMPLETED**

---

### LEGACY STEP 004 — Archive Test-Referenced Legacy JavaScript & Update Package Entrypoints
- [x] Create automated archival and test remapping engine (`scripts/archive-remaining-legacy-js.mjs`).
- [x] Cryptographically verify SHA-256 and copy remaining 11 legacy JS files (209.0 KB) to `archive/legacy-js/js/`:
  - `js/core/app.js`, `js/core/metrics.js`, `js/dev-server.js`, `js/firebase.js`
  - `js/services/auth.js`, `js/shared/deletion.js`, `js/shared/modals.js`, `js/shared/sidebar.js`
  - `js/utils/colors.js`, `js/utils/dom.js`, `js/utils.js`
- [x] Normalize internal imports inside `archive/legacy-js/js/core/app.js` to self-contained relative paths.
- [x] Adjust `ROOT_DIR` in `archive/legacy-js/js/dev-server.js` to project root (`path.join(__dirname, '..', '..', '..')`).
- [x] Update `package.json` entry points `"main": "archive/legacy-js/js/dev-server.js"` and `"dev:legacy": "node archive/legacy-js/js/dev-server.js"`.
- [x] Update test require/read paths in: `tests/app-core.test.js`, `tests/auth-service.test.js`, `tests/modals.test.js`, `tests/tasks-metrics-dashboard.test.js`, `tests/daily-targets.test.js`, and `tests/full-regression.test.js`.
- [x] Unlink all 11 source files and remove empty directories `js/core/`, `js/services/`, `js/shared/`, `js/utils/`, and `js/`.
- [x] Verify active `js/` directory is completely removed (`Test-Path js` = False).
- [x] Verify modern test runner passes 84/84 tests across 15 suites (`npm test` in 548ms).
- [x] Verify legacy test suite passes 10/10 test files against archive (`npm run test:legacy`).
- [x] Verify full modular regression test passes 57/57 assertions (`node tests/full-regression.test.js`).
- [x] Verify TypeScript compiles with 0 errors (`npm run typecheck`).
- [x] Verify Next.js production build compiles 14/14 static pages cleanly (`npm run build`).
- **Status**: **COMPLETED**

---

### LEGACY STEP 005 — Archive Inactive Legacy HTML Templates from pages/
- [x] Create automated archival engine with SHA-256 verification (`scripts/archive-legacy-html.mjs`).
- [x] Cryptographically verify SHA-256 and copy all 11 legacy HTML files (307.4 KB) to `archive/legacy-html/pages/`:
  - `pages/Dashboard/Dashboard.html` (57,344 B)
  - `pages/Focus/Focus.html` (32,921 B)
  - `pages/Subjects/Subjects.html` (5,848 B)
  - `pages/Daily Actions/Daily Actions.html` (34,991 B)
  - `pages/Daily Actions/monthly target setup/monthly target setup.html` (42,527 B)
  - `pages/Daily Schedule/Daily Schedule.html` (7,250 B)
  - `pages/Pace Management/Pace Management.html` (10,757 B)
  - `pages/Outcome/Outcome.html` (10,881 B)
  - `pages/Exam Routine/Exam Routine.html` (27,107 B)
  - `pages/Master Config/Master Config.html` (20,872 B)
  - `pages/Analytics/Analytics.html` (64,238 B)
- [x] Safely unlink all 11 source HTML files from `pages/`.
- [x] Confirm 0 `.html` files remain in `pages/` (`Get-ChildItem -Recurse -Filter "*.html"` returns 0).
- [x] Safety audit: verify all 11 active CSS stylesheets in `pages/*/*.css` remain completely intact and untouched.
- [x] Verify modern test runner passes 84/84 tests across 15 suites (`npm test` in 542ms).
- [x] Verify legacy test suite passes 10/10 test files against archive (`npm run test:legacy`).
- [x] Verify full modular regression test passes 57/57 assertions (`node tests/full-regression.test.js`).
- [x] Verify TypeScript compiles with 0 errors (`npm run typecheck`).
- [x] Verify Next.js production build compiles 14/14 static pages cleanly in 1.50s (`npm run build`).
- **Status**: **COMPLETED**

---

### LEGACY STEP 006 — Remove Obsolete Configuration and Orphaned Root Files
- [x] Create automated archival engine with SHA-256 verification (`scripts/archive-legacy-config-and-root.mjs`).
- [x] Cryptographically verify SHA-256 and copy 3 dead configuration/prompt files (4.2 KB) to `archive/legacy-config/`:
  - `api/config.js` (866 B)
  - `manifest.json` (732 B)
  - `ext` (2,734 B)
- [x] Unlink source files from repo root and `api/`.
- [x] Prune empty directory: `api/` (`Test-Path api` returns False).
- [x] Update backward compatibility paths in `tests/pwa-service-worker.test.mjs` and `tests/full-regression.test.js` against archive fallback.
- [x] Verify modern test runner passes 84/84 tests across 15 suites (`npm test` in 630ms).
- [x] Verify legacy test suite passes 10/10 test files against archive (`npm run test:legacy`).
- [x] Verify full modular regression test passes 57/57 assertions (`node tests/full-regression.test.js`).
- [x] Verify TypeScript compiles with 0 errors (`npm run typecheck`).
- [x] Verify Next.js production build compiles 14/14 static pages cleanly in 1.71s (`npm run build`).
- **Status**: **COMPLETED**





