# X-29 Advance — Persistent AI Engineering Memory (MEMORY.md)

> **Document Status**: Living Engineering State Log  
> **Last Updated**: 2026-09-24  
> **Rule**: Update this file after EVERY meaningful development session or milestone.

---

## 1. Current Migration Status
- **Current Phase**: **PHASE 10 — Page-by-Page Migration & Visual Parity Verification (Next in queue)**
- **Completed Phases**:
  - Phase 0 (Full Audit & AI Project Memory setup)
  - Phase 1 (Baseline Performance & Safety Checkpoints)
  - Phase 2 (Legacy Modularization Batches 1-10 + Next.js 16 / React 19 Foundation)
  - Phase 3 (Clean Single-Domain Routing)
  - Phase 4 (Domain Component Trees & Studio Scaffolding)
  - Phase 5 (Strict TypeScript Types & Zero `any` Enforcement)
  - Phase 6 (Shared UI & Glassmorphism Design System)
  - Phase 7 (Domain-Specific Zustand Stores Architecture)
  - Phase 8 (Modular Firebase 12 Integration)
  - Phase 9 (Local-First IndexedDB Persistence & Coalesced Sync Engine)

---

## 2. Latest Architectural Decisions
1. **Zero Redesign Directive**: The existing dark cyber-academic UI (`#0b0f19`, glass cards with `backdrop-filter: blur(20px)`, Outfit and Inter fonts, canonical 14 subject colors) must be reproduced byte-for-byte in React.
2. **Clean Single-Domain Routing**:
   - Single canonical domain: `https://x-29-advance.vercel.app/`
   - Clean routes without subfolder URL artifacts: `/login`, `/`, `/focus`, `/analytics`, `/daily-actions`, `/schedule`, `/subjects`, `/pace`, `/master-config`, `/outcome`, `/exam`.
   - Route group `app/(dashboard)/` provides shared `AuthGate` and `AppShell` without affecting public URL paths.
3. **Local-First State Architecture**:
   - Primary state resides in domain-partitioned Zustand stores (`stores/*.ts`).
   - Mutations write immediately to IndexedDB via `idb` for 0ms UI latency and crash resilience.
   - Remote writes to Firestore are coalesced and debounced (180ms - 300ms window) to prevent write storms on Firestore.
   - Self-write echo protection via `_lastWriteId` prevents unnecessary re-parsing or DOM re-renders upon receiving cloud snapshot echoes.
4. **Build-Time CSS Generation**:
   - Migrated from client-side `cdn.tailwindcss.com` runtime compiler to build-time PostCSS pipeline, eliminating the massive 14s render-blocking stall.

---

## 3. Important Discoveries & Codebase Facts
- **Firestore Security Rules Enforce Key Whitelist**: `firestore.rules` enforces that `/users/{userId}` documents contain ONLY allowed keys (up to 48 top-level keys). Any modernization changes to payload structure must strictly adhere to this schema.
- **Single-User Admin Identity**: The primary admin and authenticated user is `ris2k29@gmail.com`.
- **Test Suite Health**:
  - Legacy regression test suites (`npm run test`): **100% PASS** (all 10 batches passing).
  - Modern ESM domain unit tests (`npm run test:unit`): **27 / 27 PASS** (0 failures).
  - TypeScript compilation (`npm run typecheck`): **0 ERRORS** (`tsc --noEmit` exits cleanly).
- **Baseline Performance Metrics**:
  - Lighthouse Performance: 37 / 100
  - LCP: 29.9s | FCP: 14.6s | TBT: 750ms | TTFB: 10ms
  - Transferred Bundle: 5.02 MB across 47 requests (due to unminified scripts & runtime CDNs).

---

## 4. Known Technical Problems & Technical Debt
1. **Co-existence of Legacy and Modern Code**: The workspace currently contains both the legacy SPA (`index.html`, `pages/*/*.html`, `js/features/*`) and the modern Next.js 16 app (`app/`, `features/`, `stores/`). Legacy files must remain functional until Phase 10 visual parity is proven.
2. **Monolithic Legacy Script Sizes**:
   - `monthlyTargets.js`: 282.0 KB
   - `monthly target setup.js`: 194.3 KB
   - `timerService.js`: 118.8 KB
   - `outcomeResults.js`: 110.7 KB
   - `weeklyTargets.js`: 110.6 KB
   - `spectra.js`: 110.4 KB
   - `paceManager.js`: 107.7 KB
   - `dashboard.js`: 102.9 KB
   These files will be decommissioned in Phase 11.
3. **No Active PWA Service Worker in Legacy**: Missing offline caching in legacy SPA; will be resolved when Next.js Serwist/Workbox service worker is activated in Phase 17.

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
- **Latest Commit**: `cf42e92` (`feat: add root layout for Next.js application and update type references`)
- **Git Status**: Clean working tree.
- **Verification Commands**:
  - `npm run typecheck` -> Exit Code 0 (Clean)
  - `npm run test` -> Exit Code 0 (All legacy batch suites pass)
  - `npm run test:unit` -> Exit Code 0 (27 / 27 ESM tests pass)

---

## 7. Next Recommended Task
**Start PHASE 10: Page-by-Page Migration & Visual Parity Verification**  
- Subtask 10.1: Mount and verify `/login` page (visual parity with `login.html`, error banner, glass card styling, Firebase Auth sign-in).
- Subtask 10.2: Mount and verify `/` Dashboard (KPI cards, active now widget, live exam countdown, daily/weekly/monthly target action cards).
