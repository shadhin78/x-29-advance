# X-29 Advance — Technical Architecture Document

> **Document Status**: Production Architectural Reference  
> **Target Audience**: AI Development Agents & Senior System Architects  
> **Core Objective**: Map the existing legacy architecture in full detail, identify technical bottlenecks, and define the target Next.js 16 / TypeScript / Zustand / Local-First architecture.

---

## PART 1: CURRENT (LEGACY) ARCHITECTURE

### 1.1. System Overview & Core Stack
The legacy version of X-29 Advance is a client-side Single Page Application (SPA) driven by vanilla JavaScript, HTML fragments, and external runtime CDN libraries:
- **Runtime Environment**: Browser DOM with Node.js local dev server (`js/dev-server.js` on port 3000).
- **Core Languages**: HTML5, Vanilla CSS, ECMAScript 2020 (unbundled, unminified JavaScript scripts).
- **UI & Styling**: Runtime Tailwind CSS browser compiler loaded via CDN script (`https://cdn.tailwindcss.com`), custom CSS overrides in `css/style.css` and per-page CSS files.
- **Charts & Visualizations**: Chart.js loaded via CDN (`https://cdn.jsdelivr.net/npm/chart.js`).
- **Database & Auth**: Firebase v10 Compat SDK (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`).
- **Icons**: Custom PNG/JPEG image assets and inline SVG strings.

### 1.2. Legacy Directory Structure
```text
X-29-advance-code/
├── index.html                  # Monolithic entrypoint (294.6 KB, 3,890 lines)
├── login.html                  # Standalone login page (7.0 KB, 128 lines)
├── manifest.json               # Web App Manifest
├── firestore.rules             # Production Firestore security rules
├── css/
│   └── style.css               # Shared custom classes & keyframe animations (10.8 KB)
├── router/
│   └── router.js               # Dynamic fragment loader & custom SPA router (37.6 KB)
├── js/
│   ├── dev-server.js           # Static HTTP development server
│   ├── state.js                # Global AppState definition & defaults (53.5 KB)
│   ├── firebase.js             # Firebase auth, sync, and Firestore listeners (69.8 KB)
│   ├── utils.js                # General formatting and date helpers (25.3 KB)
│   ├── utils/colors.js         # 14-color palette & deterministic hasher (5.7 KB)
│   ├── shared/                 # Modals, toasts, audio, deletion routines
│   ├── services/               # Auth, taxonomy, backup services
│   ├── core/                   # App bootstrapper, metrics calculation engine, rollover
│   └── features/               # Extracted legacy domain modules (targets, pace, outcome, analytics, habits, schedule, exam)
├── pages/                      # Page HTML/CSS/JS bundles dynamically fetched by router:
│   ├── Analytics/              # Analytics.html (64.2 KB), Analytics.js (27.2 KB), Analytics.css (5.7 KB)
│   ├── Daily Actions/          # Daily Actions.html (35 KB), Daily Actions.js (16.7 KB), Daily Actions.css (2 KB)
│   │   └── monthly target setup/ # monthly target setup.html (42.5 KB), .js (194.2 KB), .css (4 KB)
│   ├── Daily Schedule/         # Daily Schedule.html (7.2 KB), Daily Schedule.js (8.3 KB), .css (1.9 KB)
│   ├── Dashboard/              # Dashboard.html (57.3 KB), Dashboard.js (14.2 KB), .css (2.6 KB)
│   ├── Exam Routine/           # Exam Routine.html (27.1 KB), Exam Routine.js (11.8 KB), .css (2.5 KB)
│   ├── Focus/                  # Focus.html (32.9 KB), Focus.js (84.3 KB), Focus.css (13.4 KB)
│   ├── Master Config/          # Master Config.html (20.8 KB), Master Config.js (32.7 KB), .css (1.9 KB)
│   ├── Outcome/                # Outcome.html (10.8 KB), Outcome.js (17.3 KB), .css (2.9 KB)
│   ├── Pace Management/        # Pace Management.html (10.7 KB), Pace Management.js (15.1 KB), .css (2.5 KB)
│   └── Subjects/               # Subjects.html (5.8 KB), Subjects.js (85.8 KB), .css (2.3 KB)
├── shared/services/
│   └── timerService.js         # Monolithic background timer service (118.8 KB)
└── scripts/                    # Backup, restore, and verification utilities
```

### 1.3. Legacy Data Flow & State Management
```text
User Event (click, input, toggle)
        ↓
Inline onclick or event listener in DOM
        ↓
Mutates window.AppState properties in-place
        ↓
Synchronous fast-persist: JSON.stringify(AppState) -> localStorage['local_app_state']
        ↓
Debounced saveToCloud (180ms delay)
        ↓
Serializes monolithic document payload (tasks, tracks, targets, timers, schedule, etc.)
        ↓
Firestore set with merge: db.collection('users').doc(uid).set(cleanPayload, { merge: true })
        ↓
onSnapshot listener receives document echo
        ↓
Self-write echo guard checks _lastWriteId (ignores echo or reconciles remote mutations)
        ↓
Imperative DOM re-render (innerHTML replacement, querySelector mutations)
```

### 1.4. Legacy Database Architecture (Firestore)
- **Document Path**: `/users/{userId}` (Single monolithic document per user).
- **Payload Contents**: Entire workspace state stored inside 1 single JSON document:
  - `tasks`: Array of study plan slot tasks.
  - `tracks`, `syllabusStructure`, `customPrograms`: Complete academic syllabus tree.
  - `monthlyTargetsDatabase`, `weeklyTargetsDatabase`, `dailyTargetsDatabase`: Nested target allocations.
  - `scheduleBlocks`, `scheduleBlocks2`: 24-hour daily timeline allocations.
  - `timerLogs`, `activeTimerState`: Historical and active study timer records.
  - `paceGoals`, `passedItems`, `celebrationTargets`, `successResults`: Academic metrics.
  - `_tombstones`: Distributed delete-tombstones map for conflict resolution.
- **Security**: Bound strictly to `request.auth.uid == userId` via `firestore.rules`. Enumeration restricted to admin email `ris2k29@gmail.com`.

### 1.5. Critical Architectural Bottlenecks of Legacy System
1. **Monolithic DOM Payload**: `index.html` is 294.6 KB upfront with ~3,890 lines of HTML loaded before any content renders.
2. **Render-Blocking External CDNs**: `cdn.tailwindcss.com` compiles utility classes on the main thread in the browser, blocking First Contentful Paint by 14+ seconds. Chart.js CDN and Firebase Compat v10 add unnecessary synchronous script evaluation.
3. **Massive Unbundled JavaScript Files**:
   - `monthlyTargets.js`: 282.0 KB
   - `monthly target setup.js`: 194.3 KB
   - `timerService.js`: 118.8 KB
   - `outcomeResults.js`: 110.7 KB
   - `weeklyTargets.js`: 110.6 KB
   - `spectra.js`: 110.4 KB
   - `paceManager.js`: 107.7 KB
   - `dashboard.js`: 102.9 KB
   - `taskEngine.js`: 94.2 KB
   - `Subjects.js`: 85.8 KB
   - `dailyTracker.js`: 85.1 KB
   - `Focus.js`: 84.3 KB
4. **Single-Document Firestore Bottleneck**: Every single minor action (e.g., checking off 1 chapter, updating a 1-minute timer log) re-serializes the entire monolithic state and performs an expensive write of the whole document.
5. **Brittle Imperative DOM Updates**: Hundreds of `document.getElementById()`, `innerHTML = ...`, and manual class mutations causing layout thrashing and DOM memory leaks.
6. **No Active Service Worker**: Although `manifest.json` exists, no service worker is registered, leaving the app completely vulnerable to network drops and incapable of true offline execution.

---

## PART 2: TARGET ARCHITECTURE (MODERNIZED)

### 2.1. Target Technology Stack
- **Framework**: Next.js 16 (App Router) + React 19.
- **Language**: Strict TypeScript (zero `any`, full domain typing).
- **Styling**: Tailwind CSS (PostCSS build pipeline — zero runtime CDN compiler) preserving exact custom CSS tokens, glassmorphism, and keyframe animations.
- **UI Primitives**: Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`) for accessible modals and dropdowns without breaking visual styles.
- **Icons**: Lucide React (`lucide-react`) + canonical SVG definitions matching existing icons.
- **State Management**: Zustand 5 (`zustand`) with domain-partitioned stores.
- **Data Persistence**: Local-First IndexedDB (`idb`) + Modular Firebase 12 SDK (`firebase/firestore`, `firebase/auth`).
- **Deployment & Hosting**: Vercel (Edge-ready, single canonical domain `x-29-advance.vercel.app`).

### 2.2. Target Directory Structure
```text
X-29-advance-code/
├── app/                                # Next.js 16 App Router
│   ├── globals.css                     # PostCSS Tailwind + design tokens + animations
│   ├── layout.tsx                      # Root HTML shell, fonts (Inter & Outfit), Providers
│   ├── login/
│   │   └── page.tsx                    # Clean /login route with glassmorphic auth card
│   └── (dashboard)/                    # Clean URL Route Group (omitted from URL)
│       ├── layout.tsx                  # AuthGate + AppShell wrapper (Header + Sidebar)
│       ├── page.tsx                    # / (Dashboard Overview)
│       ├── focus/page.tsx              # /focus (Timer & Chronograph)
│       ├── analytics/page.tsx          # /analytics (Spectra Analytics Studio)
│       ├── daily-actions/page.tsx      # /daily-actions (DADB Habits & Targets)
│       ├── schedule/page.tsx           # /schedule (24h Daily Timeline)
│       ├── subjects/page.tsx           # /subjects (Syllabus & Chapter Checklist)
│       ├── pace/page.tsx               # /pace (Pace Velocity & Forecast)
│       ├── master-config/page.tsx      # /master-config (Taxonomy & System Config)
│       ├── outcome/page.tsx            # /outcome (CGPA & Celebration)
│       └── exam/page.tsx               # /exam (Exam Routine & Countdown)
├── components/                         # Shared UI & Shell Architecture
│   ├── auth/                           # AuthGate, LoginForm
│   ├── navigation/                     # Sidebar, NavigationPills, MobileNav
│   ├── shell/                          # AppShell, HeaderBar, SyncIndicator, ExamCountdownWidget
│   ├── providers/                      # Providers wrapper (Auth, Sync, UI)
│   └── ui/                             # Radix-backed Dialog, Modal, Dropdown, Tooltip, Toast
├── features/                           # Domain-Driven Feature Slices
│   ├── analytics/                      # components/, services/, hooks/, types/
│   ├── config/                         # components/, services/, hooks/
│   ├── daily-actions/                  # components/, services/, hooks/
│   ├── dashboard/                      # components/ (Overview cards, KPI widgets)
│   ├── exam/                           # components/, services/, hooks/
│   ├── focus/                          # components/ (ChronographDial, TimerControls, SessionHistory)
│   ├── outcome/                        # components/, services/, hooks/
│   ├── pace/                           # components/, services/, hooks/
│   ├── schedule/                       # components/, services/, hooks/
│   ├── subjects/                       # components/, services/, hooks/
│   ├── targets/                        # components/, services/ (targetAllocationEngine)
│   ├── tasks/                          # services/ (taskEngine, subjectGoals)
│   └── taxonomy/                       # services/ (taxonomyService)
├── stores/                             # Domain-Specific Zustand Stores
│   ├── useAuthStore.ts                 # User authentication state & session
│   ├── useTimerStore.ts                # Precision timer state, active chronograph, logs
│   ├── useTaskStore.ts                 # Study tasks, chapter completion, filters
│   ├── useTaxonomyStore.ts             # Tracks, programs, subjects, syllabus tree
│   ├── useTargetStore.ts               # Monthly, weekly, and daily target databases
│   ├── useExamStore.ts                 # Exam sessions, routine, countdown selection
│   ├── useScheduleStore.ts             # 24h schedule blocks, routine sets, active slot
│   ├── useOutcomeStore.ts              # Course results, CGPA, pass freeze, celebration
│   ├── usePaceStore.ts                 # Pace goals, velocity metrics, projections
│   ├── useDailyActionStore.ts          # Daily habits (DADB), logs, radar metrics
│   ├── useModalStore.ts                # Lightweight UI modal open/close coordinator
│   └── useSyncStore.ts                 # Cloud sync status, generation, last write ID
├── lib/
│   ├── firebase/client.ts              # Modular Firebase 12 client initialization
│   ├── storage/
│   │   ├── indexeddb.ts                # Fast local-first IndexedDB engine via idb
│   │   └── zustandStorageAdapter.ts    # Transparent Zustand persistence adapter
│   └── sync/
│       └── syncService.ts              # Coalesced, debounced background Firestore synchronizer
├── types/                              # Strict TypeScript Definitions (15 domain files)
├── public/                             # Optimized static assets, manifest, icons, service worker
└── docs/                               # Permanent AI Project Memory
```

### 2.3. Target Data Flow (Local-First Reactive Architecture)
```text
User Action (Checkbox click, Timer start/stop, Target edit)
        ↓
Domain Store Action (e.g. useTaskStore.toggleTaskCompletion())
        ↓
1. Instant React State Update (0ms UI latency, smooth 60fps re-render)
2. Immediate IndexedDB Persist (asynchronous non-blocking background write)
3. Notify Sync Engine (marks local generation dirty, generates clientWriteId)
        ↓
Debounced Cloud Synchronizer (180ms - 300ms coalescing window)
        ↓
Modular Firestore Commit: db.collection('users').doc(uid).set(payload, { merge: true })
        ↓
Remote Firestore Snapshot Event
        ↓
Sync Engine reconciles incoming snapshot against local generation & tombstones
(If write is local echo -> instant acknowledge, zero re-render)
```

### 2.4. Performance & Code-Splitting Strategy
1. **Build-Time Compilation**: Zero runtime Tailwind parsing. All CSS utility classes are generated into minified static bundles by PostCSS.
2. **Server Components by Default**: Non-interactive layouts, static wrappers, and metadata generated on server.
3. **Selective Dynamic Imports (`next/dynamic`)**: Heavy canvas charts (Spectra heatmap, habit radar, progress trend curves) dynamically imported with `ssr: false` so that dashboard and focus pages boot instantaneously.
4. **Timestamp-Based Timers**: `useTimerStore` and `useTimerTicker` calculate elapsed time mathematically without interval accumulator drift and without triggering unnecessary tree re-renders outside the timer dial.
