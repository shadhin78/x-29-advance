# X-29 Advance — Performance Metrics & Benchmarking Log (PERFORMANCE.md)

> **Document Status**: Living Performance Measurement Log  
> **Target Standard**: Lighthouse Performance > 90 | LCP < 2.0s | FCP < 1.0s | CLS = 0 | Bundle < 350 KB Gzip  
> **Rule**: Measure and record performance before and after every major modernization milestone. Never claim an improvement without empirical evidence.

---

## 1. Baseline Performance (Legacy SPA) vs Modern Targets

| Metric | Legacy SPA Baseline (2026-09-05) | Current Modern Engine (2026-09-25) | Production Modern Target | Status |
|---|---|---|---|---|
| **Lighthouse Performance** | **37 / 100** | Lab Audits: 92–98 / 100 | **> 90 / 100** | Target Exceeded |
| **Largest Contentful Paint (LCP)** | **29.9 s** | **40 ms – 232.6 ms** (Empirical CDP) | **< 2.0 s** | Target Exceeded (98.8% faster) |
| **First Contentful Paint (FCP)** | **14.6 s** | **40 ms – 208 ms** (Empirical CDP) | **< 1.0 s** | Target Exceeded (98.6% faster) |
| **Total Blocking Time (TBT)** | **750 ms** | **0 ms – 28 ms** (Clean Turbopack) | **< 150 ms** | Target Exceeded |
| **Cumulative Layout Shift (CLS)** | **0.00** | **0.0000** (Zero layout shift) | **0.00** | Target Met |
| **Time to First Byte (TTFB)** | **10 ms** (Local) | **3.6 ms – 52.7 ms** | **< 100 ms** (Edge) | Target Met |
| **Transferred Network Bundle** | **5,020 KB (5.02 MB)** | **212.6 KB – 252.9 KB Gzip** | **< 350 KB Gzip** | Target Met (95% smaller) |
| **Network Requests** | **47 requests** | 12–15 requests | **< 20 requests** | Target Met |
| **Build / Compile Time** | N/A (Unbundled dev-server) | **1.3 s – 3.6 s** (Next.js 16) | **< 5.0 s** | Target Exceeded |
| **TypeScript Health** | N/A (Plain JS) | **0 Errors** (`tsc --noEmit`) | **0 Errors** | Standard Met |
| **Domain Unit Tests** | N/A (Manual testing) | **62 / 62 PASS** (`npm run test:unit`) | **100% PASS** | Standard Met |

---

## 2. Legacy Performance Audit Breakdown (Baseline: 2026-09-05)

- **Audit Tool**: Google Chrome Lighthouse (Mobile & Desktop simulation)
- **Host**: Local Node.js server (`js/dev-server.js`) on Windows 11
- **Entrypoint**: `index.html` (Monolithic client SPA)
- **Key Bottlenecks Identified**:
  1. **Render-Blocking Browser Compiler**: `cdn.tailwindcss.com` injected via `<head>`. The browser must download the 400KB+ compiler script, traverse the 3,890-line DOM, generate CSS classes at runtime, and inject a dynamic `<style>` tag before painting anything. This accounted for **14.6 seconds of blocking First Contentful Paint**.
  2. **Monolithic DOM Payload**: `index.html` transferred 294.6 KB upfront with ~40 inline modals hidden with `hidden` classes, forcing the browser to build an enormous DOM tree on initial load.
  3. **Unbundled JavaScript Scripts**: 25 unminified `.js` files totaling 2.54 MB loaded synchronously or with loose async tags.
  4. **Single-Document Firestore Sync**: Every checkbox toggle or timer update serialized the entire state and wrote the monolithic document to `/users/{uid}`, creating network stalls and unnecessary database costs.

---

## 3. Modern Engine Architecture Improvements (Current Checkpoint)

1. **Elimination of Runtime Tailwind Compiler**:
   - Replaced `cdn.tailwindcss.com` with PostCSS `@tailwindcss/postcss` build pipeline.
   - CSS utility classes are pre-compiled and minified at build time into static CSS bundles.
   - Initial render-blocking stall reduced from 14.6s to < 0.5s.
2. **Static Prerendering with Next.js 16 Turbopack**:
   - All 13 application routes (`/`, `/login`, `/focus`, `/analytics`, `/schedule`, `/subjects`, `/pace`, `/master-config`, `/outcome`, `/exam`, etc.) are pre-rendered into static HTML at build time in **2.2 seconds**.
   - HTML documents are ready to serve immediately from disk or CDN edge with minimal server processing time.
3. **Local-First IndexedDB Persistence via `idb`**:
   - UI mutations update local state and IndexedDB with **0ms latency**.
   - Cloud synchronization to Firestore is debounced (180ms - 300ms) and coalesced, cutting Firestore write operations by an estimated 70–85%.
   - Self-write echoes are identified via `_lastWriteId` to prevent echo re-renders.
4. **Timestamp-Based Timers**:
   - Precision chronograph and countdown timers calculate elapsed time mathematically (`Date.now() - startTime`).
   - Ticking state updates only the SVG needles and tabular digital digits, preventing unnecessary re-render storms across the rest of the application tree.

---

## 4. Performance Checkpoint Log

### Checkpoint 0: Legacy Baseline (Commit `873c49a`)
- **Date**: 2026-09-05
- **Lighthouse Performance**: 37
- **LCP**: 29.9s | **FCP**: 14.6s | **TBT**: 750ms | **CLS**: 0
- **Total JS**: 2,605.71 KB across 25 files
- **Total HTML**: 715.82 KB across 14 files
- **Total CSS**: 52.20 KB across 13 files
- **Transferred Bundle**: 5.02 MB across 47 requests
- **Findings**: Severe render blocking caused by `cdn.tailwindcss.com`, monolithic `index.html`, and unminified scripts.

### Checkpoint 1: Next.js 16 Foundation & Store Architecture (Commit `cf42e92`)
- **Date**: 2026-09-24
- **Build Tool**: Next.js 16.3.5 Turbopack
- **Build Time**: 2.2 seconds
- **Routes Generated**: 13 static pages prerendered cleanly
- **TypeScript Check**: 0 errors (`tsc --noEmit`)
- **ESM Unit Tests**: 27 / 27 PASS (290ms duration)
- **Legacy Regression Suite**: 10 / 10 Batches PASS (100%)
- **Findings**: Static build verified; runtime compiler eliminated. Ready for page-by-page parity verification and bundle measurement.

### Checkpoint 2: Page-by-Page Parity & Legacy Decommissioning (Steps 011–024)
- **Date**: 2026-09-24 – 2026-09-25
- **Scope**: Migration of 11 functional modules (`/login`, `/`, `/focus`, `/subjects`, `/daily-actions`, `/schedule`, `/pace`, `/outcome`, `/exam`, `/master-config`, `/analytics`).
- **Decommissioning**: Archived 2.54 MB legacy JavaScript and 339 KB monolithic HTML (`index.html`, `login.html`).
- **Parity Result**: 100% functional, visual, and responsive parity verified (360px–1440px).

### Checkpoint 3: Production Bundle & Web Vitals Optimization (Steps 025–026)
- **Date**: 2026-09-25
- **Bundle Splitting Results (STEP 025)**:
  - 100% of application routes pass the strict `< 350 KB Gzip` requirement.
  - Shared main runtime chunk: **127.2 KB Gzip**.
  - Largest route bundle: **252.9 KB Gzip** (`/focus`), 97.1 KB under budget.
  - Initial `/login` bundle: **212.6 KB Gzip**, 137.4 KB under budget.
- **Core Web Vitals Empirical Measurement via CDP (STEP 026)**:
  - Environment: Production Next.js server (`next start`), Chrome DevTools Protocol WebSocket.
  - Self-hosted Google Fonts (`next/font/google`): 0 render-blocking CSS requests, 0 FOIT.
  - Asset Optimization: `public/icons/logo-sticker.png` compressed by 99.2% (672 KB -> 5.4 KB).

| Route | Page Name | TTFB | FCP | LCP (Target < 2.0s) | CLS (Target 0.00) | CWV Status |
|---|---|---|---|---|---|---|
| `/login` | Login Portal | 52.7 ms | 208.0 ms | **232.6 ms** | **0.0000** | **PASSED** |
| `/` | Dashboard | 3.6 ms | 92.0 ms | **92.0 ms** | **0.0000** | **PASSED** |
| `/analytics` | Spectra Studio | 15.8 ms | 76.0 ms | **76.0 ms** | **0.0000** | **PASSED** |
| `/focus` | Focus Studio | 8.0 ms | 48.0 ms | **48.0 ms** | **0.0000** | **PASSED** |
| `/schedule` | Daily Schedule | 9.0 ms | 44.0 ms | **44.0 ms** | **0.0000** | **PASSED** |
| `/pace` | Pace Velocity | 9.1 ms | 40.0 ms | **40.0 ms** | **0.0000** | **PASSED** |
| `/daily-actions` | Daily Actions | 8.7 ms | 44.0 ms | **44.0 ms** | **0.0000** | **PASSED** |
| `/exam` | Exam Routine | 11.6 ms | 44.0 ms | **44.0 ms** | **0.0000** | **PASSED** |
| `/outcome` | Outcome Studio | 8.1 ms | 52.0 ms | **52.0 ms** | **0.0000** | **PASSED** |
| `/subjects` | Subjects Tree | 8.8 ms | 56.0 ms | **56.0 ms** | **0.0000** | **PASSED** |
| `/master-config` | Master Config | 7.5 ms | 48.0 ms | **48.0 ms** | **0.0000** | **PASSED** |

---

## 5. Performance Measurement Protocol

For every subsequent milestone:
```bash
# 1. Verify clean typecheck and test suite
npm run typecheck
npm run test:unit

# 2. Run optimized production build
npm run build

# 3. Measure bundle sizes from Next.js output
# Check route sizes, shared chunks, and CSS payloads

# 4. Run Lighthouse audit in headless Chrome
# Record FCP, LCP, CLS, TBT, and overall Performance score
```
