# Phase 2 / Batch 10: Extract Tasks, Metrics, and Dashboard Core

## Overview
This is the **final and highest-coupling batch of Phase 2**. We will extract and modularize:
1. **Subjects & Chapter Task Execution** (`taskEngine.js`)
2. **Task Toggle Engine** (`taskEngine.js`)
3. **Task Edit Modal** (`taskEngine.js`)
4. **Subject Daily Time Goals & Subject Management** (`subjectGoals.js`)
5. **KPI Metrics Calculation Engine** (`metrics.js`)
6. **Dashboard Overview & KPI Cards** (`dashboard.js`)
7. **Dashboard Daily/Weekly/Monthly Summaries & Cards** (`dashboard.js`)
8. **Dashboard Orchestrator & UI Lifecycle** (`dashboard.js` and `pages/Dashboard/Dashboard.js`)

All modules will be designed with reentrancy protection against the known circular chains:
- `handleTaskToggle() -> updateMetrics() -> renderTaskList() -> handleTaskToggle()`
- `renderUI() -> updateMetrics() -> renderPaceGoals() -> updateMetrics()`

---

## User Review Required

> [!IMPORTANT]
> - **Zero Logic Alterations**: Task completion semantics, revision mode behavior, streak calculations, pace estimations, Firestore sync triggers, and UI designs will be strictly preserved byte-for-byte.
> - **Universal Global & CommonJS Export**: All extracted modules will attach to `window` (for inline HTML event handlers, onclicks, and cross-module calls) and support CommonJS (`module.exports`) for automated Node.js test suites.
> - **Circular Dependency Safety**: Reentrancy guards (`isUpdatingMetrics`, `isRenderingUI`) will guarantee that downstream invocations cannot cause infinite loops or stack overflows.
> - **Script Loading Order in `index.html`**:
>   1. `js/features/tasks/taskEngine.js`
>   2. `js/features/tasks/subjectGoals.js`
>   3. `js/core/metrics.js`
>   4. `js/features/dashboard/dashboard.js`
>   (followed by existing Targets modules, `js/script.js`, schedule, and exam modules)
> - **Slim Coordinator Pattern for Dashboard**: `pages/Dashboard/Dashboard.js` will be transformed into a slim page coordinator delegating directly to `js/features/dashboard/dashboard.js`, perfectly matching `pages/Analytics/Analytics.js`, `pages/Outcome/Outcome.js`, and `pages/Pace Management/Pace Management.js`.

---

## Proposed Changes

### Component 1: Tasks Feature Area (`js/features/tasks/`)

#### [NEW] [taskEngine.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/tasks/taskEngine.js)
Extract core task scheduling, execution, toggling, editing, and list rendering:
- **Study Plan & Slot Execution Engine**:
  - `generateStudyPlan()`: Generates initial task array with holidays and study slots across tracks.
  - `ensureAvailableSlots(slotsNeeded, track, startIndex)`: Automatically allocates revision slots when needed.
  - `reorderSubjectChapters(prog, subj)`: Re-indexes uncompleted chapters numerically.
  - `rebuildTaskDates(shouldSave)`: Recalculates task dates sequentially from `AppState.PLAN_START_DATE`.
- **Chapter & Subject Status Helpers**:
  - `isSubjectPassed(track, subject, progName)`
  - `isChapterCompleted(track, subject, chapter)`
  - `isChapterSkipped(track, subject, chapter)`
  - `findTaskChapter(track, subject, chapter)`
  - `syncTaskChapterCompletion(track, subject, chapter, isCompleted, completedAt)`
  - `getChaptersForSubject(track, subject)`
  - `getChapterStatus(subName, chNum, trackId)`
  - `getSubjectSkippedCount(subName, trackId)`
  - `isSubjectCompleted(track, subject)`
- **Task Toggle Engine**:
  - `handleTaskToggle(e)`:
    - Optimistic card styling update (`single-task-...`), accent bar color, line-through on title/desc.
    - Optimistic subject progress bar update (`group-text-...`, `group-pct-...`, `group-bar-...`).
    - Optimistic subject time goal analytics card update (`tg-req-...`, `tg-act-...`, `tg-est-...`, etc.).
    - Cascades completion across all identical chapter instances in `AppState.tasks`.
    - Bi-directional sync to `monthlyTargetsDatabase`, `weeklyTargetsDatabase`, and `dailyTargetsDatabase`.
    - Cloud save via `FirebaseService.saveToCloud()` and calls `updateMetrics()`.
    - Debounces `renderTrendCharts`.
- **Task Edit Modal**:
  - `openEditModal(taskId, type, subTaskId)`: Pre-fills subject, chapter number, title, and skip button. Handles unscheduled slot allocations (`unsched-...`).
  - `toggleSkipTask()`: Toggles skipped state, resets completion, and purges skipped records from targets databases with tombstone recording (`recordItemDeletion`).
  - `saveTaskEdit()`: Updates subject, chapter, and title, reordering chapters as needed.
  - `requestDeleteTask()`: Triggers confirmation modal.
  - `deleteTask()`: Clears task slot back to Revision and shifts subsequent uncompleted chapters upward.
- **Task List & Revision Rendering**:
  - `renderTaskList()`: Groups study tasks by subject, filters by `AppState.currentFilter`, and renders task card grid.
  - `generateSingleTaskHtml(dayObj, taskObj, type)`: Produces HTML for single study cards with size-based target indicators.
  - `generateRevisionTaskHtml(sub, chNum, isCompleted)`: Produces HTML for revision practice cards.
  - `setFilter(val)`: Updates active filter and refreshes navigation and tasks.
  - `openRevisionModal()`, `renderRevisionModalContent()`, `toggleRevisionMode(sub)`, `toggleRevisionChapter(sub, chNum, isChecked)`.

#### [NEW] [subjectGoals.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/tasks/subjectGoals.js)
Extract Subject Daily Time Goals, Subject Editing, and Subject Progress Visualizations:
- **Subject Daily Time Goals**:
  - `openSubjectTimeModal(subjectName)`: Populates pace goals and custom date inputs.
  - `saveSubjectTimeGoal()`: Saves time links into `window.subjectTimeLinks[sub]`.
  - `clearSubjectTimeGoal()`: Resets time link with tombstone tracking.
- **Subject Editing & Deletion**:
  - `openSubjectEditModal(subName)`: Opens modal with track, program, and subject name inputs.
  - `updateEsmProgramDropdown()`: Cascades programs when track changes.
  - `saveSubjectEditModal()`: Validates uniqueness, handles cross-track migration, and cascades renames across colors, pace goals, passed items, revision data, and time links.
  - `requestDeleteSubjectFromModal()` & `executeDeleteSubjectFromModal(targetName)`: Confirms and purges subject from syllabus, tasks (converted to Revision), pace goals, passed items, revision data, and time links.
- **Subject Progress & Navigation Visualizations**:
  - `renderSubjectNavigation()`: Program and subject filter pill buttons with active highlights.
  - `renderSubjectProgress(subjectStats)`: Detailed subject progress bars with track summaries and program groupings.
  - `renderCategoryProgress(subjectStats)`: Radial circular progress cards for each program.
  - `renderTrackProgress(subjectStats)`: Radial circular progress cards for each track.
  - `openProgramCompletionsModal(track, programName)`: Modal detailing subject completion percentages for a program or track.

---

### Component 2: Core Metrics (`js/core/`)

#### [NEW] [metrics.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/core/metrics.js)
Extract KPI Metrics Calculation Engine:
- **Calculation Engine (`updateMetrics`)**:
  - Reentrancy protection guard.
  - Calculates `subjectStats` for each subject (active chapters, assigned tasks, completed tasks, effective chapters accounting for pass freeze, earliest completed date, actual pace).
  - Caches `window.lastSubjectStats`.
  - Computes global completion: `percentage`, `scopeCompleted`, `scopeTotalChapters`, updating DOM elements (`progress-title`, `progress-text`, `progress-detail`, `progress-bar`, `db-progress-text`, etc.).
  - Computes pace statistics: `window.latestPaceData`, `globalReqPace`, `globalCurPace`, days elapsed, days needed, days remaining, projected finish date, status labels, and contextual comments.
  - Updates progress doughnut Chart.js instances (`progressChart`, `dbProgressChart`) safely.
  - Orchestrates downstream updates: `renderSubjectProgress`, `renderSubjectNavigation`, `renderCategoryProgress`, `renderTrackProgress`, `renderPaceGoals`, `renderGlobalPaceTrendChart`.
- **Ancillary Metrics & Calculators**:
  - `recalculateTotals()`: Calculates `totalStaticChapters` from `syllabusStructure`.
  - `updateGlobalDates()`: Updates `AppState.PLAN_START_DATE` and `AppState.PLAN_END_DATE`.
  - `updateSuccessScore()`: Computes passed subject %, triggers milestone celebration modal (`showCongratsModal`), and updates live pass celebration status.
  - `updateCountdown()`: Calculates final deadline countdown and days elapsed.
  - `calculateIndependentEstFinish()`, `calculatePaceGoalStats(goal, subjectStats)`, `getTargetedSubjectsForGoal(goal)`.

---

### Component 3: Dashboard Core (`js/features/dashboard/` & `pages/Dashboard/`)

#### [NEW] [dashboard.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/dashboard/dashboard.js)
Extract Dashboard Overview, KPI Cards, Summaries, and Master UI Orchestrator:
- **Dashboard Overview & Header**:
  - Sets top tags, main titles, sub titles, and document titles.
  - Validates `AppState.currentFilter` against available programs/subjects.
  - Focus today button: `setupFocusTodayButton()`.
  - Trends start date controls: `updateTrendsStartDate(newDateStr)`.
  - Trends settings modal: `openTrendsSettingsModal()`, `selectActivePaceGoal(goalId)`, `saveTrendsSettings()`, `togglePaceSwitch(type, rawId)`.
- **Dashboard KPI Cards & Trend Bar**:
  - `updateTrendsBar()`: Renders active pace goal stats (start date, days passed, days remaining, req/act pace, est finish).
- **Dashboard Summaries & Checklists**:
  - `renderDashboardDailyChecklist()`: Today's targets and overdue targets with direct completion toggling.
  - `renderDashboardWeeklyChecklist()`: Active week's targets with range and progress bar.
  - `renderDashboardMonthlyChecklist()`: Active month's targets with month title and progress bar.
  - `renderDashboardOutcomeCard()`: Overall CGPA, letter grade, passed subjects count, credit score, and outcome analytics button.
  - `renderDashboardUpcomingExamCard()`: Nearest scheduled exam routine card with countdown.
  - `renderDashboardPassedSubjectsCard()`: Passed subjects summary with badges.
- **Master UI Orchestrator**:
  - `renderUI()`:
    - Master boot & refresh orchestrator with reentrancy protection.
    - Hides loader, displays dashboard content, syncs header.
    - Updates dates, countdowns, exam tickers, success scores, subject navigation, task list, metrics.
    - Defer renders: charts, trend bar, daily tracker, habit radar, trend charts, outcome results, dashboard checklists and cards, targets, schedule, and exam pages.
    - Synchronizes forms, manage UI, priority config, and timer services.
  - `DashboardPage` lifecycle (`init()`, `mount()`, `render()`, `destroy()`).

#### [MODIFY] [pages/Dashboard/Dashboard.js](file:///d:/X-29-ADVANCE/X-29-advance-code/pages/Dashboard/Dashboard.js)
Refactor `pages/Dashboard/Dashboard.js` to become a slim coordinator delegating to `js/features/dashboard/dashboard.js`.

---

### Component 4: Integration & Script Cleanup

#### [MODIFY] [index.html](file:///d:/X-29-ADVANCE/X-29-advance-code/index.html)
Add script tags in `<head>` in proper dependency order:
```html
<script src="js/features/tasks/taskEngine.js?v=1.0.22"></script>
<script src="js/features/tasks/subjectGoals.js?v=1.0.22"></script>
<script src="js/core/metrics.js?v=1.0.22"></script>
<script src="js/features/dashboard/dashboard.js?v=1.0.22"></script>
```

#### [MODIFY] [js/script.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/script.js)
- Maintain backward-compatible delegation stubs for all extracted functions.
- Remove monolithic implementations of task execution, task toggling, task modals, subject goals, metrics, and dashboard rendering.
- Keep application utilities, core state definition, login auth, account settings, modal helpers, and service worker / PWA handlers intact.

#### [NEW] [tests/tasks-metrics-dashboard.test.js](file:///d:/X-29-ADVANCE/X-29-advance-code/tests/tasks-metrics-dashboard.test.js)
Comprehensive Node.js test suite covering:
1. **Task Execution**: `generateStudyPlan`, `ensureAvailableSlots`, `reorderSubjectChapters`, `rebuildTaskDates`, `findTaskChapter`, `syncTaskChapterCompletion`, `getChaptersForSubject`, `getChapterStatus`, `getSubjectSkippedCount`.
2. **Task Toggle Engine**: `handleTaskToggle` optimistic card update, cross-task sync, targets database sync (`monthlyTargetsDatabase`, `weeklyTargetsDatabase`, `dailyTargetsDatabase`).
3. **Task Edit Modal**: `openEditModal`, `toggleSkipTask` (purge targets + tombstone), `saveTaskEdit`, `deleteTask` (shift up).
4. **Subject Goals & Progress**: `saveSubjectTimeGoal`, `clearSubjectTimeGoal`, `saveSubjectEditModal`, `executeDeleteSubjectFromModal`, `renderSubjectProgress`, `renderCategoryProgress`, `renderTrackProgress`.
5. **KPI Metrics Engine**: `updateMetrics` calculation of `subjectStats`, global completion %, pace data (`curPace`, `reqPace`, `daysNeeded`, `projectedDate`), `recalculateTotals`, `updateSuccessScore`, `updateCountdown`.
6. **Dashboard Overview & KPI Cards**: `updateTrendsBar`, `setupFocusTodayButton`, `openTrendsSettingsModal`.
7. **Dashboard Summaries & Checklists**: `renderDashboardDailyChecklist`, `renderDashboardWeeklyChecklist`, `renderDashboardMonthlyChecklist`, `renderDashboardOutcomeCard`, `renderDashboardUpcomingExamCard`, `renderDashboardPassedSubjectsCard`.
8. **Dashboard Orchestrator**: `renderUI` and `DashboardPage` lifecycle.

#### [MODIFY] [package.json](file:///d:/X-29-ADVANCE/X-29-advance-code/package.json)
Add `"test:tasks-metrics-dashboard": "node tests/tasks-metrics-dashboard.test.js"`.

---

## Verification Plan

### Automated Tests
1. Run newly created test suite:
   ```powershell
   npm run test:tasks-metrics-dashboard
   ```
2. Run all existing test suites to ensure 0 regressions across Phase 2:
   ```powershell
   npm run test:config
   npm run test:pace-outcome
   npm run test:analytics
   npm run test:targets
   npm run test:weekly
   npm run test:monthly
   ```

### Manual & Browser Verification
- Load `http://localhost:3000/` and test:
  - **Dashboard Overview**: KPI cards, Top header tags, Trend bar, Progress doughnut chart.
  - **Dashboard Checklists**: Daily, Weekly, and Monthly target checklists, toggle completion.
  - **Dashboard Cards**: Outcome summary card, upcoming exam card, passed subjects card.
  - **Task List**: Filter by program / subject, complete task, uncomplete task, edit task modal, skip chapter, delete task.
  - **Subject Management**: Subject Daily Time Goals modal, subject edit modal, subject progress bars, track progress, category progress.
  - **Router & Navigation**: Navigate across Dashboard, Analytics, Focus Timer, Daily Schedule, Targets, Exam Routine, Outcome, Pace, Master Config.
  - **Console & Network**: Verify zero JavaScript runtime errors, clean Chart.js instances, and proper Firebase listeners.

### Final Git Commit
Once verified, stage all changes and create the final Phase 2 commit:
```powershell
git add .
git commit -m "refactor: complete X-29 feature modularization"
git status
git log --oneline --decorate -20
```
