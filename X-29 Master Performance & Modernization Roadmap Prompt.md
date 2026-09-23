# X-29 ADVANCE — MASTER PERFORMANCE, ARCHITECTURE & UX MODERNIZATION PROJECT

You are working on my X-29 / Study Dashboard application.

## CURRENT STATE

The application has already been partially reorganized:

- Pages/features have been separated into folders/files.
- However, some core files are still extremely large.
- `js/script.js` is still very large.
- `index.html` is still very large.
- Some other legacy files are also large.
- The application started as a large Vanilla HTML/CSS/JavaScript project.
- Firebase / Firestore is already part of the project.
- The goal is NOT to destroy the current working application.
- The goal is to progressively transform it into a modern, maintainable, extremely fast, responsive, mobile-friendly application.

The final target architecture may use:

- React
- Next.js
- TypeScript
- Tailwind CSS
- Radix UI where useful
- Lucide icons
- Zustand where global client state is actually needed
- Firebase / Firestore
- IndexedDB for local-first/offline data where appropriate
- Service Worker / Workbox or the currently best-maintained compatible PWA solution
- Vercel
- npm

IMPORTANT:

Do NOT blindly install or migrate everything immediately.

First understand the existing application.

Then create a migration plan.

Then execute the plan ONE PHASE AT A TIME.

---

# PRIMARY GOAL

Transform X-29 into a:

1. Extremely fast application
2. Fast initial load
3. Fast navigation
4. Low JavaScript payload
5. Low HTML payload
6. Low CSS payload
7. Low network usage
8. Low CPU usage
9. Low memory usage
10. Responsive UI
11. Mobile-first application
12. Desktop-friendly application
13. Accessible application
14. User-friendly application
15. Maintainable codebase
16. Modular architecture
17. Offline-capable/local-first application where appropriate
18. Production-ready PWA
19. Stable Firebase architecture
20. High Lighthouse / Core Web Vitals performance
21. Excellent experience on low-end Android devices and slower networks

Do NOT optimize only for a powerful desktop PC.

Optimize for real users, especially:

- mobile phones
- low/mid-range Android devices
- slower mobile networks
- limited CPU
- limited memory
- repeated daily usage

---

# CORE PRINCIPLE

DO NOT PERFORM A GIANT REWRITE.

The current application works.

Preserve working behavior while progressively improving the architecture.

Every major migration must have:

BEFORE
→ CHANGE
→ VERIFY
→ AFTER

Never replace large amounts of working code without measuring and testing.

---

# STEP 0 — DEEP AUDIT FIRST

Before changing anything, inspect the entire project.

Understand:

- folder structure
- routes/pages
- HTML files
- JavaScript files
- CSS files
- Firebase architecture
- Firestore access
- API/server code
- authentication
- state management
- event listeners
- DOM manipulation
- duplicated code
- utility functions
- third-party libraries
- images
- fonts
- scripts
- inline scripts
- inline CSS
- loading behavior
- localStorage usage
- IndexedDB usage
- service worker status
- PWA status
- caching
- network requests
- Firebase listeners
- timers
- intervals
- polling
- expensive calculations
- unnecessary renders
- unnecessary DOM updates
- large static data
- duplicated HTML
- duplicated CSS
- duplicated JavaScript

Pay special attention to the largest files.

Create a report showing:

FILE
SIZE
LINES
ROLE
DEPENDENCIES
PROBLEMS
MIGRATION TARGET

---

# STEP 1 — CREATE A PERMANENT PROJECT ROADMAP

Before making architectural changes, create a documentation system inside the repository.

Create a folder such as:

`docs/x29-modernization/`

At minimum create:

`MASTER-ROADMAP.md`

`CURRENT-STATE.md`

`ARCHITECTURE.md`

`PERFORMANCE-BASELINE.md`

`MIGRATION-STATUS.md`

`DECISIONS.md`

`PROGRESS-LOG.md`

`KNOWN-ISSUES.md`

`ROLLBACK-PLAN.md`

You may create additional documentation files when useful.

These files become the permanent memory of the modernization project.

---

# MASTER-ROADMAP.md

This file must contain:

## Vision

What the final X-29 architecture should look like.

## Goals

Performance
Architecture
Mobile
Responsive UI
Accessibility
UX
Offline
Security
Maintainability

## Phases

Divide the entire project into logical phases.

Do NOT start implementation yet.

The roadmap should cover the complete transformation from the current architecture to the target architecture.

---

# MIGRATION-STATUS.md

Maintain a table like:

| Phase | Step | Status | Started | Completed | Notes |
|------|------|--------|---------|-----------|------|
| 0 | Audit | | | | |
| 1 | Baseline | | | | |
| 2 | Architecture | | | | |
| 3 | JavaScript decomposition | | | | |
| 4 | HTML decomposition | | | | |
| 5 | CSS modernization | | | | |
| 6 | React migration | | | | |
| 7 | Next.js migration | | | | |
| 8 | TypeScript migration | | | | |
| 9 | State architecture | | | | |
| 10 | Firebase architecture | | | | |
| 11 | IndexedDB/local-first | | | | |
| 12 | PWA/offline | | | | |
| 13 | Performance optimization | | | | |
| 14 | Mobile UX | | | | |
| 15 | Accessibility | | | | |
| 16 | Production hardening | | | | |

Adjust the phases after auditing the actual project.

---

# PROGRESS-LOG.md

After every completed step, record:

DATE
STEP
WHAT CHANGED
FILES CHANGED
WHAT WAS TESTED
RESULT
PERFORMANCE IMPACT
KNOWN PROBLEMS
NEXT STEP

Never erase historical entries.

---

# DECISIONS.md

Record important architecture decisions.

For example:

- Why a library was selected
- Why another library was rejected
- Why client/server rendering was chosen
- Why Zustand is or is not used
- Why IndexedDB is or is not used for a specific feature
- Why a particular PWA approach is selected

Do not make architecture decisions silently.

Record them.

---

# PERFORMANCE-BASELINE.md

Measure the current application before optimization.

Record as many as possible:

- Lighthouse Performance
- Lighthouse Accessibility
- Lighthouse Best Practices
- Lighthouse SEO
- FCP
- LCP
- CLS
- INP/TBT
- TTFB
- total transfer size
- JS transfer size
- CSS transfer size
- HTML size
- number of requests
- DOM size
- JavaScript execution time
- long tasks
- Firebase network activity
- initial page load time
- mobile performance
- desktop performance

Take measurements before major optimization phases.

After major phases, measure again.

Do not claim performance improvement without measurement.

---

# TECHNOLOGY STRATEGY

Do not assume the exact technology/version beforehand.

For every major technology, verify the current stable and compatible version at the time of implementation.

Prefer:

- actively maintained
- production proven
- lightweight where practical
- compatible with Next.js
- compatible with React
- good TypeScript support
- good mobile performance
- good accessibility
- good Vercel support

Avoid technology simply because it is trendy.

Avoid unnecessary dependencies.

Every dependency must justify its inclusion.

---

# PERFORMANCE STRATEGY

Treat performance as an architectural requirement, not a final polish step.

The plan must specifically address:

## JavaScript

Reduce:

- initial JS
- client-side code
- unnecessary hydration
- duplicate logic
- duplicate event listeners
- unnecessary libraries
- unnecessary global code
- huge bundles
- synchronous work
- repeated calculations

Use:

- route-level code splitting
- lazy loading
- dynamic imports when appropriate
- tree-shaking
- smaller modules
- Server Components where appropriate
- client components only when required
- efficient state subscriptions
- event delegation where appropriate
- Web APIs where appropriate

Do not blindly convert every function into a React hook.

---

# INDEX.HTML PROBLEM

The current index/HTML files are large.

Analyze why.

Determine:

- repeated markup
- static markup
- dynamic markup
- configuration
- templates
- page-specific markup
- modal markup
- navigation
- dashboard widgets
- duplicated components
- inline scripts
- inline CSS
- hidden DOM
- unused DOM

Move functionality toward modular components.

Do not simply split files into arbitrary pieces.

Use actual component boundaries.

---

# LARGE JS PROBLEM

The current JavaScript is still very large.

Analyze it by responsibility.

Identify:

- authentication
- Firebase
- database
- state
- navigation
- dashboard
- timer
- exams
- analytics
- tasks
- modals
- forms
- DOM utilities
- notifications
- settings
- profile
- charts
- utilities
- event handling
- initialization
- page-specific logic

Then separate genuine domains.

Do NOT create another giant `utils.js`.

Do NOT move feature-specific code into generic utility files.

Do NOT refactor purely for style.

Refactor when it improves:

- performance
- maintainability
- architecture
- testability
- reuse
- loading behavior

---

# REACT / NEXT.JS MIGRATION STRATEGY

Eventually move toward:

Current Vanilla architecture
→ modular architecture
→ React
→ Next.js App Router
→ TypeScript

Do this incrementally.

Decide carefully:

SERVER COMPONENT
vs
CLIENT COMPONENT

Prefer server-side rendering/server components where they provide a real benefit.

Use client components only where browser APIs, interactivity, client state, or event handling actually require them.

Avoid putting `"use client"` at the top of entire application trees unnecessarily.

---

# TYPESCRIPT STRATEGY

Do not blindly rename every `.js` file to `.ts`.

First identify:

- data models
- function contracts
- Firebase data shapes
- API types
- component props
- application state
- configuration
- utility types

Migrate progressively.

Prioritize the most important/core code first.

Avoid using `any` as a shortcut unless there is a documented reason.

---

# STATE MANAGEMENT

Analyze all current state.

Classify it:

1. local component state
2. URL state
3. server/database state
4. persistent client state
5. global application state
6. temporary UI state

Only use Zustand where global client state genuinely benefits from it.

Do NOT create one giant global store containing everything.

Keep state close to where it is used whenever possible.

---

# FIREBASE / FIRESTORE

Preserve Firestore functionality.

Analyze:

- reads
- writes
- realtime listeners
- queries
- duplicated requests
- unnecessary listeners
- data fetching
- caching
- security rules
- server/client boundaries
- Firebase initialization

Optimize:

- number of reads
- listener lifetime
- duplicated requests
- unnecessary subscriptions
- payload size
- data access patterns

Do not break security rules or authentication.

---

# LOCAL-FIRST / INDEXEDDB

Determine which X-29 data actually benefits from IndexedDB.

Do not add IndexedDB merely because it is available.

Consider:

- offline study data
- task data
- timer/session state
- cached user data
- temporary application state
- pending writes
- synchronization

Design an explicit synchronization strategy:

LOCAL
↕
SYNC QUEUE
↕
FIRESTORE

Handle:

- offline
- reconnect
- retry
- duplicate writes
- conflicts
- stale data

Do not implement this until the data model is understood.

---

# PWA

Design a proper PWA strategy.

Check:

- manifest
- icons
- metadata
- service worker
- installability
- caching
- offline fallback
- update behavior
- cache invalidation
- runtime caching

Use the most appropriate current solution compatible with the selected Next.js version.

Do not cache sensitive/private data incorrectly.

---

# CSS / RESPONSIVENESS

The application must be mobile-first.

Audit:

- viewport
- layout
- fixed widths
- overflow
- tables
- cards
- navigation
- modals
- forms
- buttons
- touch targets
- typography
- spacing
- grids
- charts
- dashboards

Target:

mobile
→ tablet
→ laptop
→ desktop
→ large desktop

Avoid designing desktop first and shrinking it afterward.

---

# MOBILE UX

Specifically test on narrow widths.

At minimum consider:

360px
375px
390px
412px
768px
1024px
1366px
1920px

Check:

- horizontal scrolling
- button accessibility
- touch targets
- sticky navigation
- modal behavior
- keyboard behavior
- form usability
- text wrapping
- charts
- tables
- dropdowns
- bottom navigation where appropriate
- loading states
- error states

The application must feel designed for mobile, not merely fit inside a mobile viewport.

---

# ACCESSIBILITY

Use semantic HTML.

Check:

- keyboard navigation
- focus management
- focus visibility
- labels
- aria attributes
- dialog accessibility
- color contrast
- reduced motion
- screen-reader semantics
- button vs div misuse
- form validation

Use Radix UI only where it gives a real accessibility/component benefit.

Do not add libraries unnecessarily.

---

# UX

Improve:

- loading states
- skeleton states
- empty states
- error states
- success feedback
- confirmations
- navigation
- search
- filtering
- forms
- dialogs
- notifications
- undo where appropriate
- offline indicators
- saving indicators

The application should clearly communicate what is happening.

---

# IMAGES / FONTS / STATIC ASSETS

Audit:

- image sizes
- image formats
- unnecessary images
- lazy loading
- responsive images
- font loading
- unused fonts
- oversized assets

Use the framework's optimized image/font mechanisms where appropriate.

---

# NETWORK OPTIMIZATION

Analyze:

- number of requests
- request waterfalls
- Firebase requests
- API requests
- unnecessary requests
- duplicate requests
- request timing
- payload sizes

Prefer:

- parallel fetching
- caching
- deduplication
- smaller payloads
- lazy loading
- streaming where appropriate
- route-level loading states

Avoid unnecessary client-side waterfalls.

---

# RENDERING STRATEGY

For every page/section determine whether it should be:

STATIC
SERVER RENDERED
DYNAMIC
CLIENT RENDERED
LAZY LOADED
STREAMED

Document why.

Do not make the whole application client-rendered by default.

---

# SECURITY

During modernization verify:

- environment variables
- Firebase credentials
- service account files
- secrets
- Firestore rules
- API exposure
- client/server boundaries
- authentication checks

Never expose private service-account credentials to the client.

Never commit secrets.

Do not sacrifice security for performance.

---

# TESTING

Before and after significant changes verify:

- authentication
- Firestore reads
- Firestore writes
- realtime listeners
- dashboard
- timer
- tasks
- exams
- analytics
- settings
- forms
- navigation
- mobile UI
- desktop UI

Create automated tests where practical.

Do not rely only on visual inspection.

---

# PERFORMANCE GATES

Do not declare the modernization complete until measurable performance goals are established.

Create realistic targets based on the actual application.

Examples:

- substantially smaller initial JS
- substantially smaller HTML
- reduced initial network transfer
- reduced main-thread work
- improved LCP
- improved INP/TBT
- reduced CLS
- faster navigation
- faster mobile load
- no unnecessary client hydration

Targets must be based on measured baselines, not arbitrary claims.

---

# MIGRATION RULE

After the audit and roadmap are created:

STOP.

Do not implement the entire roadmap.

Do not install the entire stack.

Do not rewrite the application.

Instead, tell me:

1. Current architecture summary
2. Largest technical problems
3. Biggest performance bottlenecks
4. Biggest mobile/UX problems
5. Proposed target architecture
6. Complete phase roadmap
7. Dependencies that are actually needed
8. Risks
9. Recommended FIRST implementation step

Then wait for my instruction to continue.

---

# ONE-STEP-AT-A-TIME EXECUTION

After I approve a phase, work only on that phase.

For every phase:

1. Read the roadmap
2. Read the previous progress log
3. Inspect the relevant existing code
4. Make the smallest safe change
5. Test it
6. Compare against the previous state
7. Update documentation
8. Record the result in `PROGRESS-LOG.md`
9. Update `MIGRATION-STATUS.md`
10. Clearly state the next step

Never lose the project history.

---

# IMPORTANT: DO NOT DO THESE THINGS

Do NOT:

- rewrite the whole project at once
- delete working functionality
- blindly convert files
- create giant utility files
- duplicate existing logic
- install unnecessary libraries
- introduce React everywhere immediately
- turn every component into a client component
- put everything into Zustand
- put everything into IndexedDB
- add unnecessary abstractions
- optimize without measurement
- claim improvement without evidence
- change Firebase security rules casually
- expose credentials
- remove working features just to simplify code
- change behavior unless required
- perform destructive cleanup without recording it

---

# DEFINITION OF SUCCESS

The final X-29 architecture should look conceptually like:

Next.js
│
├── app/
│   ├── authenticated routes
│   ├── public routes
│   └── layouts/loading/error boundaries
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── features/
│   ├── dashboard/
│   ├── tasks/
│   ├── exams/
│   ├── analytics/
│   ├── timer/
│   └── profile/
│
├── lib/
│   ├── firebase/
│   ├── database/
│   ├── offline/
│   ├── utils/
│   └── validation/
│
├── stores/
│
├── hooks/
│
├── types/
│
├── public/
│
└── docs/
    └── x29-modernization/

The exact structure must be decided from the actual codebase rather than forced blindly.

---

# FINAL INSTRUCTION

Treat this as a LONG-TERM ENGINEERING PROJECT.

The documentation files are the project's memory.

Always read them before continuing.

Always update them after meaningful work.

Never lose track of:

- what was changed
- why it was changed
- what remains
- what was measured
- what broke
- what was fixed
- what should happen next

FIRST ACTION:

Perform the complete audit.

Create the documentation/roadmap files.

Do NOT begin the migration yet.

Finish by giving me the audit, architecture proposal, complete roadmap, baseline measurements, risks, and the single recommended FIRST implementation step.