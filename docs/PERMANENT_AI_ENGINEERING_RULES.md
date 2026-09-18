# X-29 — PERMANENT AI ENGINEERING RULES

## PROJECT IDENTITY

Project: X-29 / Study Dashboard

This is a long-running production-oriented study dashboard.

The existing application contains valuable working functionality and user data.

The PRIMARY OBJECTIVE is:

> Improve architecture, performance, responsiveness, maintainability, accessibility, and reliability WITHOUT unintentionally changing existing functionality, data, or visual identity.

---

# 1. GOLDEN RULE

Before changing anything:

```text
UNDERSTAND
    ↓
AUDIT
    ↓
PLAN
    ↓
IMPLEMENT
    ↓
TEST
    ↓
COMPARE
    ↓
VERIFY
```

Never jump directly from:

```text
old code
↓
rewrite
```

without understanding the existing behavior.

---

# 2. FUNCTIONAL PARITY IS REQUIRED

When modifying or migrating an existing feature:

The NEW implementation must preserve the existing behavior unless an intentional change has been explicitly requested.

Preserve:

* calculations
* business rules
* CRUD behavior
* authentication behavior
* permissions
* data relationships
* persistence
* navigation
* timers
* filters
* sorting
* forms
* validation
* modals
* charts
* keyboard behavior
* edge cases
* error handling

Do NOT silently simplify or remove functionality.

If an existing behavior appears inefficient or poorly designed:

1. Understand why it exists.
2. Preserve the behavior.
3. Improve the implementation safely.
4. Report the architectural change.

---

# 3. VISUAL PARITY IS REQUIRED

The existing X-29 design is the visual reference.

When migrating or refactoring a page:

Preserve unless explicitly asked to redesign:

* overall layout
* information hierarchy
* colors
* spacing
* typography
* cards
* buttons
* icons
* tables
* dialogs
* charts
* visual states
* animations
* hover states
* selected states
* loading states
* empty states
* error states

Do not redesign a page merely because React/Next.js allows a different implementation.

Architecture may change.

The user's familiar experience should not unexpectedly change.

---

# 4. MOBILE PARITY + MOBILE IMPROVEMENT

Mobile is a first-class requirement.

For every UI change, test at least:

```text
360px
390px
414px
768px
1024px
1280px+
```

Ensure:

* no horizontal overflow
* touch-friendly controls
* readable text
* usable dialogs
* usable tables
* responsive navigation
* no clipped content
* no accidental desktop-only interaction

Do not "fix mobile later."

---

# 5. THREE ACCEPTANCE TESTS

Every migrated/refactored feature must pass:

```text
FUNCTIONAL PARITY
VISUAL PARITY
PERFORMANCE / UX
```

Also verify when relevant:

```text
MOBILE
DATA
ACCESSIBILITY
SECURITY
```

A successful build alone does NOT mean the feature is complete.

---

# 6. NEVER PERFORM A BIG-BANG REWRITE

Do NOT:

```text
convert the whole project
rewrite all files
replace all architecture at once
```

Instead:

```text
one domain
    ↓
one feature
    ↓
small components
    ↓
tests
    ↓
verify
    ↓
next feature
```

Keep the migration incremental.

---

# 7. PROTECT THE WORKING REFERENCE

Until parity is proven, the current working implementation is the reference implementation.

Never delete legacy code simply because it has been replaced conceptually.

Before deleting anything:

1. Search all references.
2. Confirm the NEW application no longer depends on it.
3. Confirm tests no longer depend on it.
4. Confirm production no longer loads it.
5. Confirm equivalent behavior exists.
6. Confirm data is preserved.
7. Keep a recoverable backup/archive.

---

# 8. USER DATA HAS HIGHEST PRIORITY

Never risk data loss.

Do NOT:

* overwrite databases blindly
* reset Firestore data
* delete documents
* change IDs unnecessarily
* change schema without migration planning
* remove legacy fields without compatibility handling
* overwrite IndexedDB stores carelessly
* destroy local data during migration

Before data-model changes:

```text
UNDERSTAND CURRENT DATA
        ↓
DESIGN COMPATIBILITY
        ↓
MIGRATE
        ↓
VERIFY
```

If uncertain, preserve compatibility rather than guessing.

---

# 9. FIREBASE / FIRESTORE RULES

Never expose private credentials.

Never send:

```text
firebase-service-account.json
firebase-admin credentials
private server secrets
```

to the browser.

Client code may use public Firebase configuration only.

Server-only credentials remain server-only.

Do not weaken Firestore security rules to make development easier.

Do not move privileged operations to the client.

---

# 10. FIRESTORE PERFORMANCE

Do not blindly read or write the entire database.

Avoid:

```text
every click
    ↓
entire state serialized
    ↓
Firestore write
```

Avoid:

```text
timer tick
    ↓
Firestore write
```

Prefer:

```text
user action
    ↓
local state
    ↓
local persistence
    ↓
coherent sync
```

Use realtime listeners only where they are actually needed.

Reduce unnecessary reads, listeners, and duplicate writes without changing required behavior.

---

# 11. INDEXEDDB / OFFLINE-FIRST

IndexedDB should be used for appropriate high-volume/local/offline data.

Use it deliberately.

Do NOT blindly persist the entire application state.

Separate:

```text
UI state
domain state
local cache
offline queue
cloud state
```

The UI should not block unnecessarily waiting for Firestore.

Prefer:

```text
user action
    ↓
local update
    ↓
instant UI
    ↓
background synchronization
```

---

# 12. NEXT.JS ARCHITECTURE

Target architecture:

```text
Next.js 16
React 19
TypeScript
Tailwind CSS
Radix UI
Lucide
Zustand
Firebase
IndexedDB
PWA / Service Worker
Vercel
```

Use Server Components by default.

Use Client Components only when required by:

* interaction
* browser APIs
* Zustand
* IndexedDB
* timers
* Firebase client APIs
* event listeners

Do NOT mark the whole application `"use client"` for convenience.

---

# 13. REACT ARCHITECTURE

Use:

```text
Components
Hooks
Stores
Services
Selectors
Pure domain functions
```

Keep responsibilities separate.

Do NOT create:

```text
one giant component
one giant hook
one giant store
one giant service
one giant utils file
```

Prefer domain-driven organization.

---

# 14. STATE MANAGEMENT

Do NOT recreate:

```text
window.AppState
```

inside React.

Use domain-specific stores.

Examples:

```text
useAuthStore
useTimerStore
useTaskStore
useTaxonomyStore
useTargetStore
useExamStore
useScheduleStore
useOutcomeStore
usePaceStore
```

Each store should own only its domain.

Do not duplicate the same source of truth across multiple stores.

Use local React state for temporary UI state whenever possible.

Use derived selectors instead of storing unnecessary duplicated values.

---

# 15. DOM RULE

New React code must NOT rely on:

```text
window.AppState
window.Router
window.FirebaseService
window.renderUI
innerHTML
manual DOM rendering
manual HTML injection
legacy script injection
```

Do not use imperative DOM manipulation when normal React rendering can solve the problem.

Browser APIs should live inside:

```text
hooks
services
```

not scattered throughout components.

---

# 16. BUSINESS LOGIC RULE

Pure calculations belong outside UI.

For example:

```text
CGPA calculation
pace calculation
timer math
target allocation
taxonomy normalization
progress calculations
date calculations
```

should be pure/testable functions whenever possible.

They must not depend on:

```text
React
DOM
window
document
Firebase
```

unless the functionality genuinely requires it.

---

# 17. TIMER RULES

Timers must be timestamp-based.

Do NOT rely solely on accumulated interval increments.

Do NOT:

```text
every second
↓
update entire application
```

Do NOT:

```text
every second
↓
write IndexedDB
↓
write Firestore
```

Only the timer-related UI should refresh.

Handle:

* background tabs
* sleep/wake
* visibility changes
* pause/resume
* refresh
* clock changes
* cleanup

without introducing drift or memory leaks.

---

# 18. PERFORMANCE RULE

Never claim something is "faster" without evidence.

Measure before/after using appropriate tools.

Check:

```text
LCP
INP
CLS
FCP
TBT
JS size
route size
network requests
Firestore reads/writes
IndexedDB operations
React renders
memory usage
```

Optimize based on actual bottlenecks.

Do not add libraries merely because they sound fast.

---

# 19. CODE SPLITTING RULE

Do not load every X-29 feature at startup.

Prefer:

```text
App shell
    ↓
current route
    ↓
required feature
    ↓
optional heavy feature
```

Examples of potentially deferred code:

* charts
* large tables
* analytics
* advanced target allocation
* heavy visualizations

Do not add dynamic imports everywhere without evidence.

---

# 20. ACCESSIBILITY RULE

New UI should use semantic HTML.

Prefer:

```text
button
a
label
input
select
textarea
dialog
```

over clickable generic elements.

Preserve:

* keyboard access
* focus handling
* labels
* visible focus
* appropriate ARIA
* error feedback
* dialog accessibility
* readable contrast

Accessibility is part of feature completeness.

---

# 21. DEPENDENCY RULE

Before installing a library:

1. Confirm it solves a real project problem.
2. Check compatibility with the current stack.
3. Check whether the functionality can reasonably be implemented without it.
4. Avoid duplicate libraries.

Do not install packages simply because they are popular.

---

# 22. TYPESCRIPT RULE

Use strict TypeScript.

Do NOT use:

```text
any
```

just to make errors disappear.

Prefer:

```text
unknown
type guards
proper interfaces
unions
generics
```

when legacy data is uncertain.

Do not invent data structures without checking the real application.

---

# 23. TESTING RULE

Every meaningful migration should include appropriate tests.

Test:

```text
pure calculations
state transitions
CRUD
data transformation
edge cases
```

Then test in the browser:

```text
desktop
mobile
authentication
real user flows
```

Do not rely only on:

```text
npm run build
```

A build passing is not equivalent to application parity.

---

# 24. LEGACY VS NEW COMPARISON

For migrated functionality, compare:

```text
LEGACY
vs
NEW
```

Check:

```text
same inputs
same outputs
same calculations
same data
same user actions
same expected visual behavior
```

When intentionally changing something, clearly state:

```text
OLD BEHAVIOR
NEW BEHAVIOR
WHY CHANGED
```

Never hide intentional behavioral differences.

---

# 25. DESIGN CHANGE RULE

Architecture migration does NOT automatically authorize UI redesign.

If the task is:

```text
migrate
refactor
optimize
modernize
```

assume:

> Preserve the existing design and behavior.

A redesign should happen only when explicitly requested or when required for usability/accessibility, and any substantial change must be documented.

---

# 26. ERROR HANDLING

Never silently ignore errors.

Report:

* build errors
* type errors
* runtime errors
* console warnings
* hydration issues
* Firebase errors
* IndexedDB errors
* browser compatibility issues
* migration issues

Do not report:

```text
"Everything passed"
```

when something was not actually tested.

---

# 27. VALIDATION BEFORE COMPLETION

Before declaring a task complete, verify relevant:

```text
typecheck
build
unit tests
integration tests
browser tests
mobile
desktop
data persistence
authentication
```

Use actual results.

Do not fabricate measurements or test results.

---

# 28. STOP CONDITIONS

STOP and report instead of continuing when:

* data integrity is uncertain
* a migration could cause data loss
* a security boundary is unclear
* two implementations conflict and the authoritative one is unknown
* a required behavior cannot be verified
* a build/runtime blocker exists
* an architectural decision would materially change user behavior

Do not guess silently.

---

# 29. UNRELATED CHANGE RULE

When working on one feature:

Do NOT casually refactor unrelated features.

Example:

If migrating Focus:

Do not simultaneously rewrite:

```text
Dashboard
Targets
Analytics
Master Config
```

unless explicitly required.

Record unrelated issues for later.

---

# 30. FILE SIZE RULE

Large files should be split based on responsibility.

Do NOT split files artificially just to reduce line count.

Good:

```text
component
hook
service
selector
store
utility
```

Bad:

```text
random 30-line files
```

The goal is cohesive architecture.

---

# 31. MIGRATION ORDER

When dependencies matter, prefer:

```text
Foundation
↓
Shared domain
↓
Independent features
↓
Dependent features
↓
Aggregators
↓
Global sync
↓
PWA
↓
Performance
↓
Decommission legacy
```

For the X-29 Phase 4 migration:

```text
Next.js Foundation
↓
Auth + Shell
↓
Focus
↓
Taxonomy
↓
Subjects
↓
Exam
↓
Schedule
↓
Outcome
↓
Pace
↓
Master Config
↓
Daily Actions
↓
Targets
↓
Analytics
↓
Dashboard
↓
Sync / Offline
↓
PWA
↓
Performance
↓
Legacy Removal
```

Do not reverse dependency order without a clear reason.

---

# 32. LEGACY DECOMMISSIONING RULE

Never remove the legacy implementation simply because the new implementation exists.

Remove legacy code only after:

```text
functional parity
visual parity
mobile parity
data parity
security verification
performance verification
production validation
```

and after confirming no remaining dependency exists.

Keep a recoverable backup before deletion.

---

# 33. FINAL REPORT FORMAT

After meaningful work, report:

## CHANGED

Files modified.

## CREATED

Files created.

## DELETED

Files deleted.

## FUNCTIONAL PARITY

What was preserved and tested.

## VISUAL PARITY

What was preserved and tested.

## MOBILE

What was tested.

## PERFORMANCE

Actual measurements.

## DATA

What was migrated/preserved.

## SECURITY

What was verified.

## TESTS

Actual command/test results.

## WARNINGS

Anything unresolved.

## NEXT STEP

The smallest safe next migration boundary.

---

# 34. MOST IMPORTANT PRINCIPLE

X-29 must evolve like this:

```text
WORKING SYSTEM
      ↓
UNDERSTAND
      ↓
ISOLATE
      ↓
MIGRATE
      ↓
VERIFY
      ↓
OPTIMIZE
      ↓
REPEAT
```

NOT:

```text
WORKING SYSTEM
      ↓
BIG REWRITE
      ↓
HOPE
```

Preserve what already works.

Improve what is demonstrably problematic.

Change behavior only intentionally.

Protect user data.

Protect the familiar X-29 experience.

Build for speed, maintainability, accessibility, responsiveness, and long-term reliability.
Follow the permanent X-29 AI Engineering Rules before performing any work.
The permanent rules take priority over convenience, speed, or a simpler implementation.

```text
PERMANENT AI RULES
        ↓
INDIVIDUAL PHASE/PROMPT
        ↓
ACTUAL WORK
```
