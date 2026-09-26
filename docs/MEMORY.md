# X-29 Advance — Persistent AI Engineering Memory (MEMORY.md)

> **Document Status**: Living Engineering State Log  
> **Last Updated**: 2026-09-24  
> **Rule**: Update this file after EVERY meaningful development session or milestone.

> **PERMANENT PARITY MANDATE**:  
> The original X-29 HTML/CSS/JS implementation is the visual source of truth. Technical modernization must not redesign, restyle, reinterpret, or alter the established interface unless the user explicitly requests a design change.

---

## 1. Current Migration Status
- **Current Step**: **STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s) (COMPLETED & VERIFIED)**
- **Next Step in Queue**: **STEP 027 — Mobile & Android Low-Power Optimization (Touch Latency & Background Timers)**
- **Previous Completed Step**: **STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)**
- **Completed Steps**:
  - STEP 001 — Full Project Architecture Audit & Inventory
  - STEP 002 — Baseline Performance & Disaster Recovery Safeguards
  - STEP 003 — Next.js 16, React 19 & TypeScript Build Foundation
  - STEP 004 — Clean Single-Domain URL Routing & App Router Shell
  - STEP 005 — Strict Domain TypeScript Contracts & Schema Modeling
  - STEP 006 — Shared UI Design System Primitives & Radix Components
  - STEP 007 — Domain-Partitioned Zustand Stores Architecture
  - STEP 008 — Modular Firebase 12 Architecture & Auth Integration
  - STEP 009 — Local-First IndexedDB Engine & Coalesced Sync Service
  - STEP 010 — Feature Domain Slices & Component Tree Scaffolding
  - STEP 011 — Page-by-Page Migration & Visual Parity: /login
  - STEP 012 — Page-by-Page Migration & Visual Parity: / (Dashboard Overview & KPI Cards)
  - STEP 013 — Page-by-Page Migration & Visual Parity: /focus (Timer & Chronograph Dial)
  - STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist)
  - STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
  - STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
  - STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
  - STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
  - STEP 019 — Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection)
  - STEP 020 — Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config)
  - STEP 021 — Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar)
  - STEP 022 — Comprehensive Cross-Device & Responsive Verification (360px - 1440px)
  - STEP 023 — Decommissioning & Archiving of Monolithic Legacy JavaScript Files
  - STEP 024 — Elimination of Legacy Monolithic HTML Shell (index.html, login.html)
  - STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)
  - STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s)
- **Legacy Elimination Roadmap (docs/LEGACY-CODE-ELIMINATION.md)**:
  - LEGACY STEP 001 — Complete Dependency & Runtime Inventory (COMPLETED)
  - LEGACY STEP 002 — Modernize Test Suite & Decouple Legacy JS Test Dependencies (COMPLETED & VERIFIED)
  - LEGACY STEP 003 — Archive 16 Completely Unreferenced Legacy JavaScript Files (COMPLETED & VERIFIED)
  - LEGACY STEP 004 — Archive Test-Referenced Legacy JavaScript & Update Package Entrypoints (COMPLETED & VERIFIED — Active `js/` directory completely decommissioned)
  - LEGACY STEP 005 — Archive Inactive Legacy HTML Templates from pages/ (COMPLETED & VERIFIED — All 11 HTML files archived, 11 active CSS stylesheets preserved intact)
  - LEGACY STEP 006 — Remove Obsolete Configuration and Orphaned Root Files (COMPLETED & VERIFIED — api/config.js, root manifest.json, and ext safely archived)
  - Next in Queue: LEGACY STEP 007 — Clean Up Remnant Window Global & Fallback Bridges in Modern Code

---

## 2. Latest Architectural Decisions
1. **Zero Redesign Directive**:
   - The dark cyber-academic aesthetic (`#0b0f19` deep space background, `#0f172a` slate-900 surface, glass cards with `backdrop-filter: blur(20px)`, and canonical 14 subject colors) is preserved byte-for-byte.
   - No generic Tailwind, shadcn, or minimalist corporate themes are permitted.
2. **Clean Single-Domain Routing**:
   - Single canonical domain: `https://x-29-advance.vercel.app/`
   - Clean routes without subfolder URL artifacts: `/login`, `/`, `/focus`, `/analytics`, `/daily-actions`, `/schedule`, `/subjects`, `/pace`, `/master-config`, `/outcome`, `/exam`.
   - Route group `app/(dashboard)/` provides shared `AuthGate` and `AppShell` without affecting public URL paths.
3. **Local-First Reactive State Architecture**:
   - Primary state lives in 12 domain-partitioned Zustand stores (`stores/*.ts`).
   - Mutations write immediately to IndexedDB via `idb` for 0ms UI latency and crash resilience.
   - Remote writes to Firestore are coalesced and debounced (180ms - 300ms window) to prevent write storms on Firestore.
   - Self-write echo protection via `_lastWriteId` prevents unnecessary re-parsing or DOM re-renders upon receiving cloud snapshot echoes.
4. **Build-Time CSS Generation**:
   - Replaced client-side `cdn.tailwindcss.com` runtime compiler with build-time PostCSS pipeline, eliminating the massive 14.6s render-blocking stall.
5. **Focus Studio & Chronograph Dial Parity**:
   - Imported `pages/Focus/Focus.css` directly in `app/globals.css` ensuring `--chrono-main-hand`, `--chrono-subdial-hand`, `.timer-fullscreen` keyframe animations, and custom scrollbars render natively.
   - Preserved exact legacy element IDs, CSS variables, raw SVGs (`stroke-width="2.5"`), split digital milliseconds timer, text-only buttons, safety confirmation modal for RESET, and Active Panel top 2-column header (mode switcher + subject dropdown & fullscreen toggle).
   - Fullscreen mode toggles `.timer-fullscreen` hardware-accelerated overlay and `timer-fullscreen-active` body scroll lock.
6. **Subjects Studio & Taxonomy Parity**:
   - Imported `pages/Subjects/Subjects.css` directly in `app/globals.css` ensuring `.animate-page-enter`, `.subjects-slide-up`, `.task-checkbox`, and custom scrollbars render natively.
   - Preserved exact legacy element IDs, classes, and layouts: Global Overall Completion (`#completion-stats-section`), circular Syllabus gauge button (`#btn-open-global-chapters`), expandable Subject Progress accordion (`#sidebar-progress-section`), Filter Tasks by Subject navigation (`#subject-navigation-section`), expandable subject cards (`#task-list`), 4 pace metric cards, and chapter task cards with circular checkboxes.
   - Wired interactive modals: Time Goal modal (`SubjectTimeModal`), Edit Subject modal (`SubjectEditModal`), Revision modal (`RevisionModal`), Subject Trend modal (`SingleSubjectTrendModal`), and Syllabus modal (`GlobalChaptersModal`).
7. **Daily Actions Studio & Database Parity Restoration**:
   - Resolved visual regressions on `/daily-actions`:
     - Restored fluid container `w-full` (`id="page-daily-actions"`), removing artificial `max-w-7xl` centering and redundant padding.
     - Fixed YES/NO toggle button logic: YES activates vibrant green gradient (`from-green-400 to-emerald-500`) with glowing shadow; NO activates vibrant red gradient (`from-red-400 to-red-500`).
     - Fixed card borders: matches action color on YES, red on NO, slate on idle.
     - Restored 180-day mini-heatmap buttons: month abbreviation on top (`SEP`), date number on bottom (`24`).
     - Fixed typography: removed monospaced font from `#daily-actions-percent` to match legacy (`text-lg sm:text-xl md:text-2xl font-black`).
     - Restored 100% authentic raw SVGs: removed all generic Lucide icon imports across `MonthlyTargetsSection`, `WeeklyTargetsSection`, `DailyTargetsSection`, `EditDailyActionModal`, `ActionAnalyticsModal`, `TargetsDbModal`, and `DailyActionsDbModal`.
     - Restored `ActionAnalyticsModal` (`#analytics-modal`): GitHub 7-day row heatmap trend with month labels, 3 action-colored stat boxes, and Recent Check-ins Direct Toggle grid.
     - Restored `TargetsDbModal` (`#monthly-targets-db-modal`): full table layout with Status checkboxes, Range, Program, Subject, Chapter, and Delete actions.
     - Restored `TargetStudio` (`/daily-actions/monthly-setup`): fluid layout matching legacy `monthly target setup.html`.

8. **Core Web Vitals & Font Optimization (STEP 026)**:
   - Self-hosted Google Fonts (`Inter`, `Outfit`, `JetBrains_Mono`, `Rajdhani`, `Chakra_Petch`) at build time via `next/font/google`, eliminating blocking `<link rel="stylesheet">` requests from Google Fonts CDN and preventing Flash of Invisible Text (FOIT) via `display: 'swap'`.
   - Preconnected to critical authentication and database origins (`identitytoolkit.googleapis.com`, `firestore.googleapis.com`).
   - Slashed unoptimized asset payloads via `sharp`: compressed `public/icons/logo-sticker.png` by 99.2% (from 672 KB down to 5.4 KB), preventing image-driven LCP delays.
   - Fixed widget containers to explicit dimensions (`min-h-[64px]`) to maintain zero layout shifts (`CLS = 0.0000`).
   - Achieved empirical real-browser performance across all 11 routes: FCP 40–208ms (budget < 1.0s), LCP 40–232.6ms (budget < 2.0s), CLS = 0.0000.

---

## 3. Important Discoveries & Codebase Facts
- **Firestore Security Rules Enforce Key Whitelist**: `firestore.rules` enforces that `/users/{userId}` documents contain ONLY allowed keys (up to 48 top-level keys). Any modernization changes to payload structure must strictly adhere to this schema.
- **Single-User Admin Identity**: The primary admin and authenticated user is `ris2k29@gmail.com`.
- **Test Suite Health**:
  - Primary test runner (`npm test` / `npm run test:unit`): **84 / 84 PASS** (15 modern TypeScript domain & engine test suites, 0 failures, 505ms duration). Decoupled 100% from legacy `js/`.
  - Granular modern runners operational: `test:timer`, `test:exam`, `test:analytics`, `test:pace`, `test:outcome`, `test:targets`, `test:taxonomy`, `test:schedule`, `test:e2e`, `test:pwa`, `test:a11y`, `test:security`.
  - Legacy regression test suite preserved: `npm run test:legacy` (10 batches passing).
  - TypeScript compilation (`npm run typecheck`): **0 ERRORS** (`tsc --noEmit` exits cleanly).
  - Turbopack Next.js Build (`npm run build`): **Compiled in 1.65s** (14 static routes prerendered).
- **Baseline Performance Metrics**:
  - Lighthouse Performance: 37 / 100
  - LCP: 29.9s | FCP: 14.6s | TBT: 750ms | TTFB: 10ms
  - Transferred Bundle: 5.02 MB across 47 requests (due to unminified scripts & runtime CDNs).

---

## 4. Known Technical Problems & Technical Debt
1. **Co-existence of Legacy and Modern Code**: The workspace currently contains both the legacy SPA (`index.html`, `pages/*/*.html`, `js/features/*`) and the modern Next.js 16 app (`app/`, `features/`, `stores/`). Legacy files must remain functional until Phase 10 (Steps 011–021) visual parity is proven.
2. **Monolithic Legacy Script Sizes**:
   - `monthlyTargets.js`: 282.0 KB
   - `monthly target setup.js`: 194.3 KB
   - `timerService.js`: 118.8 KB
   - `outcomeResults.js`: 110.7 KB
   - `weeklyTargets.js`: 110.6 KB
   - `spectra.js`: 110.4 KB
   - `paceManager.js`: 107.7 KB
   - `dashboard.js`: 102.9 KB
   These files will be decommissioned in STEP 023.
3. **No Active PWA Service Worker in Legacy**: Missing offline caching in legacy SPA; will be resolved when Next.js Serwist/Workbox service worker is activated in STEP 029.

---

## 5. Important File Relationships & Data Flow Map
```text
[Browser User Action]
       │
       ▼
[React Feature Component] (e.g. features/focus/components/ChronographDial.tsx)
       │
       ▼
[Domain Zustand Store] (e.g. stores/useTimerStore.ts)
       │
       ├─► [Instant UI Update] (0ms latency, local React render)
       ├─► [Local-First Cache] (lib/storage/indexeddb.ts via idb)
       │
       ▼
[Sync Engine] (lib/sync/syncService.ts)
       │ (Debounced 180ms coalescing window)
       ▼
[Modular Firebase 12 Client] (lib/firebase/client.ts)
       │
       ▼
[Firestore Cloud] (/users/{uid} document with merge: true)
```

---

## 6. Last Verified State & Git Checkpoint
- **Branch**: `main`
- **Latest Commit**: `bd2d37e` (`feat: complete STEP 011 /login visual parity and establish master modernization docs`)
- **Git Status**: Clean working tree.
- **Verification Commands**:
  - `npm run typecheck` -> Exit Code 0 (Clean)
  - `npm run test` -> Exit Code 0 (All legacy batch suites pass)
  - `npm run test:unit` -> Exit Code 0 (27 / 27 ESM tests pass)
  - `npm run build` -> Exit Code 0 (Compiled in 2.2s, 13 static pages)

---

## 7. Next Recommended Task
**Execute STEP 017: Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)**  
- Subtask 1: Verify PaceStatsBanner metrics (Required Pace chapters/day, Current Velocity, Forecast Date).
- Subtask 2: Verify PaceGoalCards for individual subjects with circular completion rings.
- Subtask 3: Test AddPaceGoalModal with target date picker and velocity calculator.
- Subtask 4: Confirm pace math strictly matches legacy formulas (`remainingChapters / remainingDays`).
- Subtask 5: Update `DESIGN-PARITY.md` and `MEMORY.md`.
- Subtask 6: Create git checkpoint for STEP 017.

Wait for user command:
```text
Continue from STEP 017
```
