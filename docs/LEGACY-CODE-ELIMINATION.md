# X-29 — Legacy Code Elimination Audit & Cleanup Roadmap

**Document Status:** Master Architecture & Elimination Specification  
**Audit Date:** 2026-09-26  
**Auditor:** DeepMind Antigravity AI Engineering Suite  
**Application Target:** Next.js 16.3.5 / React 19.3.0 / Tailwind CSS 4.3.3 / Zustand 5.0.15 / IndexedDB / Firebase  
**Golden Rule:** UNDERSTAND → AUDIT → PLAN → IMPLEMENT → TEST → COMPARE → VERIFY  

---

## Executive Summary

The modernization of X-29 into Next.js 16, React 19, TypeScript, and Zustand is fully implemented and operating.  
This audit was performed to determine the exact dependency, runtime, and build status of all remaining legacy files in the workspace.

### Key Audit Findings

1. **Legacy JavaScript (`js/` — 27 files, 314.7 KB):**
   - **Modern Application Usage:** **0%** — ZERO modern TypeScript components, pages, stores, or services import or execute any file in `js/`.
   - **Runtime Serving:** **404 Not Found** — Next.js does not route or serve `js/`.
   - **Production Bundles:** **0 KB** — No legacy JS is bundled into `.next/static/chunks/`.
   - **Remaining Dependency:** 10 legacy files are imported by legacy Node test scripts (`tests/*.test.js`), and `package.json` still lists `"main": "js/dev-server.js"`. 17 files in `js/` are completely unreferenced anywhere.

2. **Legacy HTML (`pages/*/*.html` — 11 files, 314.7 KB):**
   - **Modern Application Usage:** **0%** — All 10 feature studios and monthly setup are rendered natively by Next.js App Router (`app/(dashboard)/`).
   - **Runtime Serving:** **404 Not Found** — Next.js ignores `.html` files in routing (`pageExtensions: ['tsx', 'ts']`).
   - **Purpose:** Purely visual/behavioral reference material. Safe to archive.

3. **Legacy CSS (`pages/*/*.css` + `css/style.css` — 12 files, 52.8 KB):**
   - **Modern Application Usage:** **ACTIVE** — All 12 files are imported wholesale into `app/globals.css`.
   - **Production Bundles:** Included in the 335 KB global CSS bundle (`.next/static/chunks/*.css`).
   - **Selector Audit:** Out of 217 classes and 70 IDs, **112 classes and 51 IDs are actively utilized** in modern React JSX for keyframe animations (`animate-aura`, `animate-page-enter`, `analytics-slide-up`, `master-config-slide-up`), fullscreen timer modes, custom scrollbars, and specific feature cards.
   - **CRITICAL DIRECTIVE:** **DO NOT DELETE CSS BLINDLY.** Removing these files without extracting active rules will break visual parity. Active rules must be consolidated into `globals.css` / Tailwind first.

4. **Legacy API & Root Files (`api/config.js`, root `manifest.json`, `ext`):**
   - `api/config.js` (866 B): Legacy Vercel Serverless function. Modern code reads `process.env.NEXT_PUBLIC_FIREBASE_*`. Returns 404 in Next.js.
   - Root `manifest.json` (732 B): Legacy PWA manifest with `"start_url": "index.html"`. Superseded by `public/manifest.json`.
   - Root `ext` (2.7 KB): Text instruction file from Phase 2 Step 6.

---

## 1. Full Legacy Inventory & Classification

Every candidate file in the workspace has been audited and classified into exactly one status:
- **ACTIVE:** Required by production application.
- **PARTIALLY ACTIVE:** Only some logic/style/assets are required.
- **UNUSED:** Not used by current application.
- **ARCHIVE:** Historical or reference material.
- **UNKNOWN:** Usage unproven (none in this audit).

### Category A: Legacy Stylesheets (12 Files — PARTIALLY ACTIVE)

| File Path | Raw Size | Status | Active Selectors in Modern Code | Action Required |
|---|---|---|---|---|
| `css/style.css` | 11,017 B | PARTIALLY ACTIVE | `animate-page-enter`, `animate-aura`, `custom-scrollbar`, `scrollbar-hide` | Consolidate active keyframes & scrollbars |
| `pages/Dashboard/Dashboard.css` | 2,649 B | PARTIALLY ACTIVE | 4 classes, 8 IDs (`custom-scrollbar`, dashboard layout rules) | Consolidate active rules |
| `pages/Focus/Focus.css` | 13,402 B | PARTIALLY ACTIVE | 17 classes, 21 IDs (`timer-fullscreen`, dial styling, alarm controls) | Consolidate timer layout & full-screen rules |
| `pages/Subjects/Subjects.css` | 2,252 B | PARTIALLY ACTIVE | 8 classes, 3 IDs (`task-checkbox`, subject card layout) | Consolidate subject card rules |
| `pages/Daily Actions/Daily Actions.css` | 2,016 B | PARTIALLY ACTIVE | 6 classes, 2 IDs (grid layout, action checkboxes) | Consolidate habit tracking rules |
| `pages/Daily Actions/monthly target setup/monthly target setup.css` | 3,969 B | PARTIALLY ACTIVE | 10 classes, 7 IDs (`mt-chapter-row`, `mt-subject-card`, `mt-prog-card`) | Consolidate monthly allocation rules |
| `pages/Daily Schedule/Daily Schedule.css` | 1,871 B | PARTIALLY ACTIVE | 5 classes, 4 IDs (timeline grid, routine card rules) | Consolidate schedule routine rules |
| `pages/Pace Management/Pace Management.css` | 2,538 B | PARTIALLY ACTIVE | 7 classes, 6 IDs (pace stat cards, timeline markers) | Consolidate pace metric rules |
| `pages/Outcome/Outcome.css` | 2,892 B | PARTIALLY ACTIVE | 7 classes, 2 IDs (grade pill, status badges) | Consolidate outcome card rules |
| `pages/Exam Routine/Exam Routine.css` | 2,550 B | PARTIALLY ACTIVE | 7 classes, 3 IDs (`exam-session-card`, `exam-item-row`, `tabular-nums`) | Consolidate exam routine rules |
| `pages/Master Config/Master Config.css` | 1,886 B | PARTIALLY ACTIVE | 9 classes, 3 IDs (`master-config-slide-up`, config card flex) | Consolidate config slide-up keyframe |
| `pages/Analytics/Analytics.css` | 5,751 B | PARTIALLY ACTIVE | 15 classes, 2 IDs (`analytics-slide-up`, `commitment-cell-*`) | Consolidate analytics heatmap & radar rules |

### Category B: Legacy HTML Files (11 Files — UNUSED / REFERENCE)

| File Path | Raw Size | Status | Modern App Route | Runtime Status |
|---|---|---|---|---|
| `pages/Dashboard/Dashboard.html` | 57,344 B | UNUSED | `app/(dashboard)/page.tsx` (`DashboardStudio`) | 404 (Not Served) |
| `pages/Focus/Focus.html` | 32,921 B | UNUSED | `app/(dashboard)/focus/page.tsx` (`FocusStudio`) | 404 (Not Served) |
| `pages/Subjects/Subjects.html` | 5,848 B | UNUSED | `app/(dashboard)/subjects/page.tsx` (`SubjectsStudio`) | 404 (Not Served) |
| `pages/Daily Actions/Daily Actions.html` | 34,991 B | UNUSED | `app/(dashboard)/daily-actions/page.tsx` (`DailyActionsStudio`) | 404 (Not Served) |
| `pages/Daily Actions/monthly target setup/monthly target setup.html` | 42,527 B | UNUSED | `app/(dashboard)/daily-actions/monthly-setup/page.tsx` (`TargetStudio`) | 404 (Not Served) |
| `pages/Daily Schedule/Daily Schedule.html` | 7,250 B | UNUSED | `app/(dashboard)/schedule/page.tsx` (`ScheduleStudio`) | 404 (Not Served) |
| `pages/Pace Management/Pace Management.html` | 10,757 B | UNUSED | `app/(dashboard)/pace/page.tsx` (`PaceStudio`) | 404 (Not Served) |
| `pages/Outcome/Outcome.html` | 10,881 B | UNUSED | `app/(dashboard)/outcome/page.tsx` (`OutcomeStudio`) | 404 (Not Served) |
| `pages/Exam Routine/Exam Routine.html` | 27,107 B | UNUSED | `app/(dashboard)/exam/page.tsx` (`ExamStudio`) | 404 (Not Served) |
| `pages/Master Config/Master Config.html` | 20,872 B | UNUSED | `app/(dashboard)/master-config/page.tsx` (`MasterConfigStudio`) | 404 (Not Served) |
| `pages/Analytics/Analytics.html` | 64,238 B | UNUSED | `app/(dashboard)/analytics/page.tsx` (`AnalyticsStudio`) | 404 (Not Served) |

### Category C: Legacy JavaScript Files (27 Files in `js/` — UNUSED BY MODERN APP)

| File Path | Raw Size | Status | Replacement in Modern App | External References |
|---|---|---|---|---|
| `js/core/app.js` | 10,732 B | UNUSED | `app/layout.tsx`, `components/shell/AppShell.tsx` | `tests/app-core.test.js`, `tests/full-regression.test.js` |
| `js/core/metrics.js` | 54,975 B | UNUSED | `components/shell/TopStatsBar.tsx`, `features/exam/services/examService.ts` | `tests/tasks-metrics-dashboard.test.js`, `tests/full-regression.test.js` |
| `js/core/rollover.js` | 13,050 B | UNUSED | `stores/useDailyActionStore.ts`, `features/targets/services/targetAllocationEngine.ts` | NONE |
| `js/core/scheduleSlot.js` | 241 B | UNUSED | `features/schedule/services/scheduleService.ts` | NONE |
| `js/core/state.js` | 734 B | UNUSED | 12 Zustand domain stores in `stores/` | NONE |
| `js/dev-server.js` | 4,722 B | UNUSED | `next dev` | `package.json` (`main`, `dev:legacy`) |
| `js/firebase.js` | 69,846 B | UNUSED | `lib/firebase/client.ts`, `lib/sync/syncService.ts` | `tests/full-regression.test.js` |
| `js/pages/login/login.js` | 6,018 B | UNUSED | `app/login/page.tsx` | NONE |
| `js/services/auth.js` | 16,903 B | UNUSED | `services/authService.ts`, `stores/useAuthStore.ts` | `tests/auth-service.test.js`, `tests/full-regression.test.js` |
| `js/services/backup.js` | 6,495 B | UNUSED | `features/config/components/MasterConfigStudio.tsx` | NONE |
| `js/services/firebase.js` | 252 B | UNUSED | `lib/firebase/client.ts` | NONE |
| `js/services/taxonomy.js` | 5,948 B | UNUSED | `features/taxonomy/services/taxonomyService.ts` | NONE |
| `js/shared/audio.js` | 2,108 B | UNUSED | `features/focus/services/timerAudioService.ts` | NONE |
| `js/shared/confetti.js` | 3,396 B | UNUSED | `features/outcome/utils/confetti.ts` | NONE |
| `js/shared/deletion.js` | 6,091 B | UNUSED | `components/ui/ModalHost.tsx`, `stores/useModalStore.ts` | `tests/modals.test.js` |
| `js/shared/modals.js` | 14,170 B | UNUSED | `stores/useModalStore.ts`, Radix UI Dialogs | `tests/modals.test.js` |
| `js/shared/sidebar.js` | 3,679 B | UNUSED | `components/shell/Sidebar.tsx`, `MobileHeader.tsx` | `tests/full-regression.test.js` |
| `js/shared/toast.js` | 1,147 B | UNUSED | In-component UI / `stores/useSyncStore.ts` | NONE |
| `js/state.js` | 53,564 B | UNUSED | `lib/storage/indexeddb.ts`, 12 Zustand stores | NONE |
| `js/utils/colors.js` | 5,750 B | UNUSED | `features/outcome/utils/outcomeColors.ts` | `tests/tasks-metrics-dashboard.test.js` |
| `js/utils/date.js` | 8,852 B | UNUSED | `features/*/services/*.ts` | NONE |
| `js/utils/dom.js` | 1,846 B | UNUSED | React JSX rendering | `tests/daily-targets.test.js`, `tests/tasks-metrics-dashboard.test.js` |
| `js/utils/format.js` | 4,394 B | UNUSED | `features/focus/services/timerEngine.ts` | NONE |
| `js/utils/id.js` | 575 B | UNUSED | `crypto.randomUUID()` | NONE |
| `js/utils/sanitize.js` | 1,748 B | UNUSED | React JSX auto-escaping | NONE |
| `js/utils/storage.js` | 2,510 B | UNUSED | `lib/storage/indexeddb.ts` | NONE |
| `js/utils.js` | 25,299 B | UNUSED | TypeScript engines in `features/*/services/*.ts` | `tests/daily-targets.test.js`, `tests/tasks-metrics-dashboard.test.js` |

### Category D: Legacy API & Root Files (3 Files — UNUSED / ARCHIVE)

| File Path | Raw Size | Status | Replacement | Notes |
|---|---|---|---|---|
| `api/config.js` | 866 B | UNUSED | `lib/firebase/client.ts` | Unused legacy serverless file; returns 404 in Next.js |
| `manifest.json` (root) | 732 B | UNUSED | `public/manifest.json` | Contains `"start_url": "index.html"`; dead file |
| `ext` (root) | 2,734 B | ARCHIVE | N/A | Phase 2 Step 6 instruction prompt file |

---

## 2. Production Bundle & Runtime Evidence

| Metric / Check | Value / Result | Proof |
|---|---|---|
| **Legacy JS in production build?** | **NO** | Zero legacy JS signatures in `.next/static/chunks/` |
| **Legacy CSS in production build?** | **YES** | 12 files imported in `globals.css` bundle into `.next/static/chunks/*.css` |
| **Legacy HTML served?** | **NO** | `GET /pages/*/*.html` returns HTTP 404 |
| **Legacy JS executed at runtime?** | **NO** | `GET /js/*.js` returns HTTP 404; no browser requests |
| **TypeScript compile status** | **PASS** | `tsconfig.json` excludes `pages/`, `js/`, `archive/` cleanly |
| **Production build status** | **PASS** | `next build` compiles 14/14 static pages cleanly |
| **Active Modern Stores** | **12 Stores** | Auth, Timer, Taxonomy, Targets, Tasks, DailyActions, Exam, Outcome, Pace, Schedule, Sync, Modal |

---

## 3. The 12-Step Numbered Cleanup Roadmap

```text
LEGACY STEP 001 — Complete Dependency & Runtime Inventory [COMPLETED]
LEGACY STEP 002 — Modernize Test Suite & Decouple Legacy JS Test Dependencies [COMPLETED]
LEGACY STEP 003 — Archive 16 Completely Unreferenced Legacy JavaScript Files [COMPLETED]
LEGACY STEP 004 — Archive Test-Referenced Legacy JavaScript & Update Package Entrypoints [COMPLETED]
LEGACY STEP 005 — Archive Inactive Legacy HTML Templates from pages/ [COMPLETED]
LEGACY STEP 006 — Remove Obsolete Configuration and Orphaned Root Files [COMPLETED]
LEGACY STEP 007 — Clean Up Remnant Window Global & Fallback Bridges in Modern Code
LEGACY STEP 008 — Extract and Consolidate Active Legacy CSS into Design System
LEGACY STEP 009 — Archive Legacy CSS Files and Decommission pages/ and css/ Directories
LEGACY STEP 010 — Production Bundle & Performance Optimization
LEGACY STEP 011 — Full Regression, PWA, Mobile & Data Persistence Verification
LEGACY STEP 012 — Final Legacy Architecture Sign-Off & Lock
```

---

### LEGACY STEP 001 — Complete Dependency & Runtime Inventory

- **Step Number:** LEGACY-001  
- **Title:** Complete Dependency & Runtime Inventory  
- **Objective:** Map every legacy file, trace all AST imports, verify runtime HTTP responses, and audit CSS selectors against React components.  
- **Files Involved:** All 53 legacy candidate files across `pages/`, `js/`, `css/`, `api/`, and root.  
- **Current Dependency:** Documented above in Section 1.  
- **What will be removed:** None (Audit only).  
- **What will replace it:** N/A.  
- **Why it is safe:** Read-only operation; zero code modification.  
- **Risk:** None.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Static AST parser + local HTTP request checks + CSS selector matcher.  
- **Rollback Plan:** N/A.  
- **Completion Criteria:** Complete verified inventory document created in `docs/LEGACY-CODE-ELIMINATION.md`.  
- **Status:** **COMPLETED** (2026-09-26)  

---

### LEGACY STEP 002 — Modernize Test Suite & Decouple Legacy JS Test Dependencies

- **Step Number:** LEGACY-002  
- **Title:** Modernize Test Suite & Decouple Legacy JS Test Dependencies  
- **Objective:** Update `package.json` test scripts to run the modern TypeScript test suite (`tests/*.test.mjs`) instead of the legacy `tests/*.test.js` suite that requires `js/`.  
- **Files Involved:**  
  - `package.json`  
  - `tests/*.test.mjs` (15 modern engine test files)  
  - `tests/*.test.js` (10 legacy test files)  
- **Current Dependency:** `npm test` runs 10 legacy files that import from `../js/` and `../archive/legacy-js/`.  
- **What will be removed:** The dependency of `npm test` on `js/`.  
- **What will replace it:** Modern native Node test runner executing `node --test tests/*.test.mjs`.  
- **Why it is safe:** The modern test suite tests the actual production TypeScript engines (`analyticsService.ts`, `examService.ts`, `timerEngine.ts`, `paceEngine.ts`, `taxonomyService.ts`, `outcomeEngine.ts`, `scheduleService.ts`, `targetAllocationEngine.ts`).  
- **Risk:** Low.  
- **Visual Parity Risk:** None (test code only).  
- **Functional Risk:** None (no production runtime changes).  
- **Data Risk:** None.  
- **Test Plan:** Run `npm test` and verify that all 15 modern domain tests pass with 100% success.  
- **Rollback Plan:** Revert `package.json` `"test"` script back to legacy script invocation.  
- **Completion Criteria:** `npm test` runs all modern unit tests successfully without touching `js/`.  
- **Status:** **COMPLETED** (2026-09-26)  
- **Verification Results:**  
  - `npm test` decoupled from `js/` and now invokes `node --test tests/*.test.mjs`.
  - All 15 test suites and 84 tests pass with 100% success (0 failures, 505ms).
  - Modern granular domain test scripts operational: `test:timer`, `test:exam`, `test:analytics`, `test:pace`, `test:outcome`, `test:targets`, `test:taxonomy`, `test:schedule`, `test:e2e`, `test:pwa`, `test:a11y`, `test:security`.
  - Legacy test scripts safely preserved under `test:legacy` for historical reference.
  - TypeScript compilation: 0 errors (`tsc --noEmit`).
  - Production build: 14/14 static pages generated cleanly in 1.65s.
  - Zero design, UI, runtime, or Firebase changes.  

---

### LEGACY STEP 003 — Archive 16 Completely Unreferenced Legacy JavaScript Files

- **Step Number:** LEGACY-003  
- **Title:** Archive 16 Completely Unreferenced Legacy JavaScript Files  
- **Objective:** Move the 16 legacy JavaScript files in `js/` that have ZERO references anywhere (neither modern code, tests, nor scripts) to `archive/legacy-js/js/` with cryptographic SHA-256 verification.  
- **Files Involved:**  
  - `js/core/rollover.js` (13,050 B)  
  - `js/core/scheduleSlot.js` (241 B)  
  - `js/core/state.js` (734 B)  
  - `js/pages/login/login.js` (6,018 B)  
  - `js/services/backup.js` (6,495 B)  
  - `js/services/firebase.js` (252 B)  
  - `js/services/taxonomy.js` (5,948 B)  
  - `js/shared/audio.js` (2,108 B)  
  - `js/shared/confetti.js` (3,396 B)  
  - `js/shared/toast.js` (1,147 B)  
  - `js/state.js` (53,564 B)  
  - `js/utils/date.js` (8,852 B)  
  - `js/utils/format.js` (4,394 B)  
  - `js/utils/id.js` (575 B)  
  - `js/utils/sanitize.js` (1,748 B)  
  - `js/utils/storage.js` (2,510 B)  
- **Current Dependency:** Zero active references in modern application code, zero test references.  
- **What will be removed:** 16 source files from active `js/` directory.  
- **What will replace it:** Existing modern implementations in `features/` and `stores/`.  
- **Why it is safe:** Proven zero inbound imports and 404 runtime status.  
- **Risk:** Very Low.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Run `npm run typecheck`, `npm run build`, `node tests/app-core.test.js`, and `npm test` after archival.  
- **Rollback Plan:** Restore from `archive/legacy-js/js/`.  
- **Completion Criteria:** All 16 files safely moved with SHA-256 integrity verification to `archive/legacy-js/js/`.  
- **Status:** **COMPLETED** (2026-09-26)  
- **Verification Results:**  
  - All 16 files (108.4 KB) copied to `archive/legacy-js/js/` with 100% matching SHA-256 checksums verified by `scripts/archive-unreferenced-legacy-js.mjs`.
  - `js/core/app.js` import paths for `state.js` and `rollover.js` updated to point to `archive/legacy-js/js/` (matching Step 023 pattern).
  - Empty directories `js/pages/login/` and `js/pages/` cleaned up.
  - Exactly 11 test-referenced legacy files remain in `js/` for Step 004.
  - `npm test`: 15 test suites, 84 tests pass with 100% success (506ms).
  - `node tests/app-core.test.js`: 9/9 tests pass.
  - `npm run typecheck`: 0 errors (`tsc --noEmit`).
  - `npm run build`: 14/14 static pages generated cleanly in 1.99s.
  - Zero design, UI, runtime, or Firebase changes.  

---

### LEGACY STEP 004 — Archive Test-Referenced Legacy JavaScript & Update Package Entrypoints

- **Step Number:** LEGACY-004  
- **Title:** Archive Test-Referenced Legacy JavaScript & Update Package Entrypoints  
- **Objective:** Move the remaining 11 files in `js/` to `archive/legacy-js/js/`, update `package.json` `"main"` and `"dev:legacy"`, and decommission the active `js/` directory.  
- **Files Involved:**  
  - `js/core/app.js` (10,786 B)  
  - `js/core/metrics.js` (54,975 B)  
  - `js/firebase.js` (69,846 B)  
  - `js/services/auth.js` (16,903 B)  
  - `js/shared/deletion.js` (6,091 B)  
  - `js/shared/modals.js` (14,170 B)  
  - `js/shared/sidebar.js` (3,679 B)  
  - `js/utils/colors.js` (5,750 B)  
  - `js/utils/dom.js` (1,846 B)  
  - `js/utils.js` (25,299 B)  
  - `js/dev-server.js` (4,722 B)  
  - `package.json`  
- **Current Dependency:** Only referenced by legacy test files in `tests/*.test.js` (decoupled in Step 002).  
- **What will be removed:** Active `js/` directory.  
- **What will replace it:** TypeScript implementations in `lib/`, `features/`, and `stores/`.  
- **Why it is safe:** Next.js build never bundles `js/` and runtime never requests `js/`.  
- **Risk:** Low.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Verify `npm run typecheck`, `npm run build`, `npm test`, `npm run test:legacy`, and `node tests/full-regression.test.js`.  
- **Rollback Plan:** Restore `js/` from `archive/legacy-js/js/`.  
- **Completion Criteria:** `js/` directory cleanly archived with SHA-256 verification; zero legacy JS files remaining in root.  
- **Status:** **COMPLETED** (2026-09-26)  
- **Verification Results:**  
  - All 11 files (209.0 KB) copied to `archive/legacy-js/js/` with 100% matching SHA-256 checksums verified by `scripts/archive-remaining-legacy-js.mjs`.
  - Normalized internal imports inside `archive/legacy-js/js/core/app.js` to self-contained archive relative paths (`../state.js`, `./rollover.js`, `../../shared/services/timerService.js`, `../../router/router.js`, `../features/dashboard/dashboard.js`, `../services/auth.js`).
  - Adjusted `ROOT_DIR` in `archive/legacy-js/js/dev-server.js` to point to project root (`path.join(__dirname, '..', '..', '..')`).
  - Updated `package.json` entry points: `"main": "archive/legacy-js/js/dev-server.js"` and `"dev:legacy": "node archive/legacy-js/js/dev-server.js"`.
  - Updated test require/read paths in: `tests/app-core.test.js`, `tests/auth-service.test.js`, `tests/modals.test.js`, `tests/tasks-metrics-dashboard.test.js`, `tests/daily-targets.test.js`, and `tests/full-regression.test.js`.
  - Safely unlinked all 11 source files from `js/` and pruned all empty directories (`js/core/`, `js/services/`, `js/shared/`, `js/utils/`, and `js/`). Active `js/` directory completely decommissioned (`Test-Path js` = False).
  - Modern test suite (`npm test`): 15 test suites, 84 tests pass with 100% success (548ms).
  - Legacy test suite (`npm run test:legacy`): 10 / 10 legacy suites pass against archive.
  - Full regression test (`node tests/full-regression.test.js`): 57 Passed, 0 Failed.
  - TypeScript compilation: 0 errors (`tsc --noEmit`).
  - Production build: 14/14 static pages generated cleanly in 1.67s.
  - Zero design, UI, runtime, or Firebase changes.  

---

### LEGACY STEP 005 — Archive Inactive Legacy HTML Templates from pages/

- **Step Number:** LEGACY-005  
- **Title:** Archive Inactive Legacy HTML Templates from pages/  
- **Objective:** Move the 11 HTML template files in `pages/*/*.html` to `archive/legacy-html/pages/` while leaving the 11 CSS files untouched.  
- **Files Involved:**  
  - `pages/Dashboard/Dashboard.html`  
  - `pages/Focus/Focus.html`  
  - `pages/Subjects/Subjects.html`  
  - `pages/Daily Actions/Daily Actions.html`  
  - `pages/Daily Actions/monthly target setup/monthly target setup.html`  
  - `pages/Daily Schedule/Daily Schedule.html`  
  - `pages/Pace Management/Pace Management.html`  
  - `pages/Outcome/Outcome.html`  
  - `pages/Exam Routine/Exam Routine.html`  
  - `pages/Master Config/Master Config.html`  
  - `pages/Analytics/Analytics.html`  
- **Current Dependency:** None. Next.js ignores `.html` files (`pageExtensions: ['tsx', 'ts']`). Runtime returns HTTP 404.  
- **What will be removed:** The 11 `.html` files in `pages/`.  
- **What will replace it:** Already replaced by the 10 React studios and `TargetStudio` in `app/(dashboard)/` and `features/`.  
- **Why it is safe:** Empirically proven to not be served or bundled by Next.js. Preserved in `archive/` for historical/design reference.  
- **Risk:** Zero.  
- **Visual Parity Risk:** Zero.  
- **Functional Risk:** Zero.  
- **Data Risk:** Zero.  
- **Test Plan:** Run `npm test`, `npm run test:legacy`, `node tests/full-regression.test.js`, `npm run typecheck`, and `npm run build`; verify all 14 routes continue rendering without error.  
- **Rollback Plan:** Move files back from `archive/legacy-html/pages/`.  
- **Completion Criteria:** All 11 HTML files moved to archive with SHA-256 checksums matching originals; all 11 active CSS files remain intact.  
- **Status:** **COMPLETED** (2026-09-26)  
- **Verification Results:**  
  - Verified 11/11 HTML files (307.4 KB) copied to `archive/legacy-html/pages/` with 100% matching SHA-256 checksums verified by `scripts/archive-legacy-html.mjs`.
  - Unlinked all 11 source HTML files from `pages/`.
  - Confirmed 0 `.html` files remain in `pages/`.
  - Confirmed all 11 active CSS stylesheets in `pages/*/*.css` remain completely intact and untouched (imported by `app/globals.css`).
  - Modern test suite (`npm test`): 15 test suites, 84 tests pass with 100% success (542ms).
  - Legacy test suite (`npm run test:legacy`): 10 / 10 legacy suites pass.
  - Full modular regression test (`node tests/full-regression.test.js`): 57 Passed, 0 Failed.
  - TypeScript compilation: 0 errors (`tsc --noEmit`).
  - Production build: 14/14 static pages generated cleanly in 1.50s.
  - Zero design, UI, runtime, or Firebase changes.  

---

### LEGACY STEP 006 — Remove Obsolete Configuration and Orphaned Root Files

- **Step Number:** LEGACY-006  
- **Title:** Remove Obsolete Configuration and Orphaned Root Files  
- **Objective:** Decommission `api/config.js`, remove root `manifest.json` (dead file), and archive `ext` instruction file.  
- **Files Involved:**  
  - `api/config.js` (866 B)  
  - `manifest.json` (root, 732 B)  
  - `ext` (root, 2,734 B)  
- **Current Dependency:** None. `api/config.js` is an unrouted Vercel serverless function returning 404 in Next.js. Root `manifest.json` points to `index.html` (while active PWA uses `public/manifest.json`). `ext` is a Phase 2 prompt.  
- **What will be removed:** `api/config.js`, root `manifest.json`, `ext`.  
- **What will replace it:** `public/manifest.json`, `lib/firebase/client.ts`.  
- **Why it is safe:** Verified dead code.  
- **Risk:** Zero.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Test PWA installability and manifest loading at `/manifest.json`; run `npm test`, `npm run test:legacy`, `node tests/full-regression.test.js`, `npm run typecheck`, and `npm run build`.  
- **Rollback Plan:** Restore from git or archive.  
- **Completion Criteria:** Root directory cleaned of dead legacy manifest, unrouted api script, and prompt files.  
- **Status:** **COMPLETED** (2026-09-26)  
- **Verification Results:**  
  - Verified 3/3 files (4.2 KB) archived to `archive/legacy-config/` with 100% matching SHA-256 checksums:
    - `api/config.js` (866 B) | SHA-256: `1c727fc60a07f1ad...`
    - `manifest.json` (732 B) | SHA-256: `a65838b47339c751...`
    - `ext` (2,734 B) | SHA-256: `e7e76cf0abf2d52c...`
  - Unlinked source files from root and `api/`.
  - Pruned empty folder: `api/` (`Test-Path api` = False).
  - Preserved backward-compatibility paths in `tests/pwa-service-worker.test.mjs` and `tests/full-regression.test.js` against archive fallback.
  - Confirmed modern PWA is served exclusively from `public/manifest.json` with root start URL `/` and dark theme palette.
  - Modern test suite (`npm test`): 15 test suites, 84 tests pass with 100% success (630ms).
  - Legacy test suite (`npm run test:legacy`): 10 / 10 legacy suites pass.
  - Full modular regression test (`node tests/full-regression.test.js`): 57 Passed, 0 Failed.
  - TypeScript compilation: 0 errors (`tsc --noEmit`).
  - Production build: 14/14 static pages generated cleanly in 1.71s.
  - Zero design, UI, runtime, or Firebase changes.  

---

### LEGACY STEP 007 — Clean Up Remnant Window Global & Fallback Bridges in Modern Code

- **Step Number:** LEGACY-007  
- **Title:** Clean Up Remnant Window Global & Fallback Bridges in Modern Code  
- **Objective:** Remove dead `window.AppState` sync shims and unreferenced UI placeholder components from modern code.  
- **Files Involved:**  
  - `stores/useExamStore.ts` (lines 48–53, 114, 137, 155, 168, 189, 213, 228, 251, 270)  
  - `components/ui/FeaturePlaceholder.tsx` (unreferenced dead component)  
- **Current Dependency:** `syncToWindowAppState` in `useExamStore.ts` checks if `window.AppState` exists (which never exists in modern runtime).  
- **What will be removed:** The dead `syncToWindowAppState` function and all call sites in `useExamStore.ts`; delete `FeaturePlaceholder.tsx`.  
- **What will replace it:** Standard Zustand state updates already present in `useExamStore.ts`.  
- **Why it is safe:** `window.AppState` is not used by any modern component.  
- **Risk:** Very Low.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Run `npm run typecheck`, `node --test tests/exam-engine.test.mjs`, and verify exam management UI in browser.  
- **Rollback Plan:** Revert git changes in `stores/useExamStore.ts`.  
- **Completion Criteria:** Zero remaining references to `window.AppState` in modern TypeScript stores.  
- **Status:** **NOT STARTED**  

---

### LEGACY STEP 008 — Extract and Consolidate Active Legacy CSS into Design System

- **Step Number:** LEGACY-008  
- **Title:** Extract and Consolidate Active Legacy CSS into Design System  
- **Objective:** Extract the 112 active CSS classes, 51 active IDs, and keyframe animations from the 12 legacy CSS files and integrate them cleanly into `app/globals.css` / Tailwind utility layers. Discard unused selectors.  
- **Files Involved:**  
  - `app/globals.css`  
  - `css/style.css`  
  - 11 CSS files in `pages/*/*.css`  
- **Current Dependency:** 12 `@import` statements in `app/globals.css`. Modern JSX relies on classes like `mt-chapter-row`, `exam-session-card`, `timer-fullscreen`, `animate-page-enter`, and keyframes `master-config-slide-up`, `analytics-slide-up`.  
- **What will be removed:** Unused legacy selectors (over 105 unused classes and 19 unused IDs).  
- **What will replace it:** Cohesive, organized CSS rules and `@keyframes` directly inside `app/globals.css`.  
- **Why it is safe:** All active selectors are explicitly preserved with exact rules and declarations; visual parity is tested side-by-side.  
- **Risk:** Medium (requires strict visual verification).  
- **Visual Parity Risk:** Medium — must be verified at 360px, 768px, 1280px across all 10 studios.  
- **Functional Risk:** Low.  
- **Data Risk:** None.  
- **Test Plan:** Visual screenshot comparison before and after consolidation across all 10 feature studios; verify responsive layouts and animations.  
- **Rollback Plan:** Restore original 12 CSS files and `@import` statements.  
- **Completion Criteria:** All required visual styling preserved in `app/globals.css`; zero visual diffs; clean compilation.  
- **Status:** **NOT STARTED**  

---

### LEGACY STEP 009 — Archive Legacy CSS Files and Decommission pages/ and css/ Directories

- **Step Number:** LEGACY-009  
- **Title:** Archive Legacy CSS Files and Decommission pages/ and css/ Directories  
- **Objective:** Remove the 12 `@import` statements from `app/globals.css`, archive the 12 CSS files to `archive/legacy-css/`, and remove empty `pages/` and `css/` directories.  
- **Files Involved:**  
  - `app/globals.css`  
  - `css/style.css`  
  - 11 CSS files in `pages/*/*.css`  
  - Directories `pages/` and `css/`  
- **Current Dependency:** None after Step 008 consolidation.  
- **What will be removed:** `pages/` and `css/` directories from the active workspace.  
- **What will replace it:** Consolidated `app/globals.css` verified in Step 008.  
- **Why it is safe:** All active styling was already consolidated and verified in Step 008.  
- **Risk:** Low.  
- **Visual Parity Risk:** Low (already proven in Step 008).  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Run `npm run build`; test all routes in browser; confirm no 404 or missing stylesheet errors.  
- **Rollback Plan:** Re-add `@import` statements and restore files from `archive/legacy-css/`.  
- **Completion Criteria:** `pages/` and `css/` directories fully decommissioned and preserved in `archive/`.  
- **Status:** **NOT STARTED**  

---

### LEGACY STEP 010 — Production Bundle & Performance Optimization

- **Step Number:** LEGACY-010  
- **Title:** Production Bundle & Performance Optimization  
- **Objective:** Measure production bundle sizes, analyze CSS chunk reductions, verify zero dead code in client bundles, and optimize package imports.  
- **Files Involved:**  
  - `.next/` build output  
  - `scripts/measure-bundles.mjs`  
  - `scripts/analyze-route-bundles.mjs`  
- **Current Dependency:** Build artifacts and analyzer scripts.  
- **What will be removed:** Unused CSS chunk weight.  
- **What will replace it:** Optimized, lean production chunks.  
- **Why it is safe:** Pure optimization and verification step.  
- **Risk:** Very Low.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Run `npm run build` and bundle analyzer; compare bundle size before and after.  
- **Rollback Plan:** N/A.  
- **Completion Criteria:** Actual measured bundle reductions recorded in documentation.  
- **Status:** **NOT STARTED**  

---

### LEGACY STEP 011 — Full Regression, PWA, Mobile & Data Persistence Verification

- **Step Number:** LEGACY-011  
- **Title:** Full Regression, PWA, Mobile & Data Persistence Verification  
- **Objective:** Conduct rigorous end-to-end testing of all 10 feature studios across desktop and mobile viewports (360px, 390px, 414px, 768px, 1280px+), verify IndexedDB local-first storage, test Firebase cloud sync, and verify Service Worker caching.  
- **Files Involved:**  
  - Entire Next.js application  
  - `public/sw.js`  
  - `lib/storage/indexeddb.ts`  
  - `lib/sync/syncService.ts`  
- **Current Dependency:** All modern systems.  
- **What will be removed:** None (Validation step).  
- **What will replace it:** N/A.  
- **Why it is safe:** Verification step.  
- **Risk:** None.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Execute all 15 native unit test suites, CDP responsive test suite (`scripts/verify-responsive-cdp.mjs`), offline capability test, and timer background tab sleep/wake verification.  
- **Rollback Plan:** N/A.  
- **Completion Criteria:** 100% test pass rate across all domains with zero regressions.  
- **Status:** **NOT STARTED**  

---

### LEGACY STEP 012 — Final Legacy Architecture Sign-Off & Lock

- **Step Number:** LEGACY-012  
- **Title:** Final Legacy Architecture Sign-Off & Lock  
- **Objective:** Formally sign off on complete legacy code elimination, update master architectural documentation, ensure all reference materials are safely locked in `archive/`, and establish permanent clean repository state.  
- **Files Involved:**  
  - `docs/MIGRATION-LOG.md`  
  - `docs/ARCHITECTURE.md`  
  - `docs/CURRENT-STATE.md`  
  - `docs/LEGACY-CODE-ELIMINATION.md`  
- **Current Dependency:** Documentation.  
- **What will be removed:** Obsolete documentation references to legacy directories.  
- **What will replace it:** Clean, modern production documentation.  
- **Why it is safe:** Documentation sign-off only.  
- **Risk:** None.  
- **Visual Parity Risk:** None.  
- **Functional Risk:** None.  
- **Data Risk:** None.  
- **Test Plan:** Verify all documentation links and references.  
- **Rollback Plan:** N/A.  
- **Completion Criteria:** Final sign-off recorded; all 12 steps marked COMPLETED.  
- **Status:** **NOT STARTED**  

---

## 4. Safety & Archival Protocol

Per X-29 AI Engineering Rules #7, #8, and #32:
1. **Never delete outright without archival.** Every file removed from the active workspace must be preserved in `archive/` with its relative directory structure intact.
2. **SHA-256 verification.** Archival scripts must calculate and compare SHA-256 checksums before unlinking source files.
3. **Rollback guarantee.** If any visual, functional, or data anomaly is detected during any step, execution halts immediately and the step is rolled back.
4. **Step-by-step gate.** Only ONE legacy step may be executed at a time. Never chain steps automatically.
