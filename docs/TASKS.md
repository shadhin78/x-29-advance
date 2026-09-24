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
[ ] STEP 014 — Page-by-Page Migration & Visual Parity: /subjects (Taxonomy Tree & Chapter Checklist) (NOT STARTED - NEXT IN QUEUE)
[ ] STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
[ ] STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
[ ] STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
[ ] STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
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
- [ ] Verify Program -> Track -> Subject card hierarchy against `Subjects.html`.
- [ ] Verify 14-subject deterministic color coding.
- [ ] Test Chapter Checklist modal, completed/in-progress toggles, and progress bars.
- [ ] Verify instant IndexedDB write on chapter toggle.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 014.
- **Status**: **NOT STARTED (NEXT IN QUEUE)**

---

### STEP 015 — Page-by-Page Migration & Visual Parity: /daily-actions & Monthly Target Setup
- [ ] Verify Daily Habits checklist (DADB) and streak counters against `Daily Actions.html`.
- [ ] Verify Habit Radar modal with polar SVG radar chart.
- [ ] Verify Monthly Target Setup modal: batch allocator, fractions, and auto-spread engine.
- [ ] Verify target cascading from Monthly -> Weekly -> Daily database.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 015.
- **Status**: **NOT STARTED**

---

### STEP 016 — Page-by-Page Migration & Visual Parity: /schedule (24h Daily Timeline & Active Slot)
- [ ] Verify 24-hour timeline grid against `Daily Schedule.html`.
- [ ] Test real-time active slot detection based on system clock.
- [ ] Test ScheduleBlockModal (create, edit, delete 24h block).
- [ ] Verify total allocated hours calculation per activity.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 016.
- **Status**: **NOT STARTED**

---

### STEP 017 — Page-by-Page Migration & Visual Parity: /pace (Velocity Metrics & Completion Forecasts)
- [ ] Verify PaceStatsBanner metrics (Required Pace, Current Velocity, Forecast Date).
- [ ] Verify PaceGoalCards for individual subjects with progress rings.
- [ ] Test AddPaceGoalModal and date adjustments.
- [ ] Confirm pace math matches legacy formulas exactly.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 017.
- **Status**: **NOT STARTED**

---

### STEP 018 — Page-by-Page Migration & Visual Parity: /outcome (CGPA Simulator & Celebration Mode)
- [ ] Verify CGPA summary card and 4.00-scale conversion math.
- [ ] Verify PassFreezeSection: toggle passed subjects, lock grades, update success score.
- [ ] Verify CelebrationSection: celebration threshold and confetti animation.
- [ ] Test ResultEntryModal (add, edit, delete course result).
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 018.
- **Status**: **NOT STARTED**

---

### STEP 019 — Page-by-Page Migration & Visual Parity: /exam (Exam Routine & Countdown Selection)
- [ ] Verify CountdownHero card with tabular countdown digits against `Exam Routine.html`.
- [ ] Verify ExamRoutineTable with subject name, date, time slot, venue, and status pills.
- [ ] Test ExamModal and active countdown selection.
- [ ] Verify top header countdown updates dynamically when active exam changes.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 019.
- **Status**: **NOT STARTED**

---

### STEP 020 — Page-by-Page Migration & Visual Parity: /master-config (Taxonomy & System Config)
- [ ] Verify TracksProgramsSection: add track, edit track, toggle program visibility.
- [ ] Verify PriorityConfigSection: priority order adjustments.
- [ ] Verify JSON backup download and upload tools.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 020.
- **Status**: **NOT STARTED**

---

### STEP 021 — Page-by-Page Migration & Visual Parity: /analytics (Spectra Studio, Heatmap & Habit Radar)
- [ ] Verify FocusHeatmapCard: multi-week matrix with 5 color intensity tiers.
- [ ] Verify HabitRadarSection: polar radar SVG with smooth bezier arcs.
- [ ] Verify ChapterMapSection: progress breakdown per subject and track.
- [ ] Verify StatFilterToolbar: date range selector (7D, 30D, 90D, All).
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- [ ] Git commit checkpoint for STEP 021.
- **Status**: **NOT STARTED**

---

### STEP 022 — Comprehensive Cross-Device & Responsive Verification (360px - 1440px)
- [ ] Test every modernized page across viewports: 360px, 390px, 414px, 768px, 1024px, 1440px.
- [ ] Verify zero horizontal overflow on all screen sizes (`overflow-x: hidden`).
- [ ] Verify touch targets >= 44x44px and input font sizes >= 16px.
- [ ] Update `DESIGN-PARITY.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

---

### STEP 023 — Decommissioning & Archiving of Monolithic Legacy JavaScript Files
- [ ] Confirm zero active dependencies on legacy `.js` files.
- [ ] Confirm automated test suite passes after archiving.
- [ ] Move legacy `.js` files into `archive/legacy-js/`.
- [ ] Update `MEMORY.md` and `MIGRATION-LOG.md`.
- **Status**: **NOT STARTED**

---

### STEP 024 — Elimination of Legacy Monolithic HTML Shell (index.html, login.html)
- [ ] Confirm Next.js handles 100% of routes and traffic.
- [ ] Move `index.html` and `login.html` into `archive/legacy-html/`.
- [ ] Verify Next.js production server functions independently.
- [ ] Update `MEMORY.md` and `MIGRATION-LOG.md`.
- **Status**: **NOT STARTED**

---

### STEP 025 — Bundle Splitting & Client JavaScript Reduction (< 350 KB Gzip)
- [ ] Implement `next/dynamic` lazy loading for Chart.js, heatmaps, and habit radar.
- [ ] Tree-shake unused Lucide icons and dependencies.
- [ ] Measure client JS bundle size with bundle analyzer (< 350 KB Gzip).
- [ ] Update `PERFORMANCE.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

---

### STEP 026 — Core Web Vitals & Rendering Performance Optimization (LCP < 2.0s, FCP < 1.0s)
- [ ] Optimize font loading with Next.js font display swap.
- [ ] Preconnect to critical domains (Firestore, Google Fonts).
- [ ] Eliminate layout shifts with explicit aspect ratios and skeletons.
- [ ] Run Lighthouse performance audit (Target: > 90, LCP < 2.0s, FCP < 1.0s).
- [ ] Update `PERFORMANCE.md` and `MEMORY.md`.
- **Status**: **NOT STARTED**

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
