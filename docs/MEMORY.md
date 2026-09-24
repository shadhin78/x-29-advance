# X-29 Advance — Persistent AI Engineering Memory (MEMORY.md)

> **Document Status**: Living Engineering State Log  
> **Last Updated**: 2026-09-24  
> **Rule**: Update this file after EVERY meaningful development session or milestone.

> **PERMANENT PARITY MANDATE**:  
> The original X-29 HTML/CSS/JS implementation is the visual source of truth. Technical modernization must not redesign, restyle, reinterpret, or alter the established interface unless the user explicitly requests a design change.

---

## 1. Current Migration Status
- **Current Step**: **STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup COMPLETED & VERIFIED**
- **Next Step in Queue**: **STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot) (AWAITING USER COMMAND TO PROCEED)**
- **Previous Completed Step**: **STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist)**
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


---

## 3. Important Discoveries & Codebase Facts
- **Firestore Security Rules Enforce Key Whitelist**: `firestore.rules` enforces that `/users/{userId}` documents contain ONLY allowed keys (up to 48 top-level keys). Any modernization changes to payload structure must strictly adhere to this schema.
- **Single-User Admin Identity**: The primary admin and authenticated user is `ris2k29@gmail.com`.
- **Test Suite Health**:
  - Legacy regression test suites (`npm run test`): **100% PASS** (all 10 batches passing).
  - Modern ESM domain unit tests (`npm run test:unit`): **27 / 27 PASS** (0 failures, 290ms duration).
  - TypeScript compilation (`npm run typecheck`): **0 ERRORS** (`tsc --noEmit` exits cleanly).
  - Turbopack Next.js Build (`npm run build`): **Compiled in 2.2s** (13 static routes prerendered).
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
**Execute STEP 012: Page-by-Page Migration & Visual Parity: / (Dashboard Overview & KPI Cards)**  
- Subtask 1: Audit 12 dashboard cards against legacy `pages/Dashboard/Dashboard.html`.
- Subtask 2: Verify all numbers, percentage math, dynamic colors, and click actions.
- Subtask 3: Validate responsive grid behavior (3-col desktop, 2-col tablet, 1-col mobile).
- Subtask 4: Verify zero console errors and zero layout shifts.
- Subtask 5: Update `DESIGN-PARITY.md` and `MEMORY.md`.
- Subtask 6: Create git checkpoint for STEP 012.

Wait for user command:
```text
Continue from STEP 012
```
