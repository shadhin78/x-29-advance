# Phase 2 / Batch 5: Extract Pace and Outcome Systems

## Overview
Extract and modularize the Pace Management and Outcome systems from monolithic files (`js/script.js`, `pages/Pace Management/Pace Management.js`, `pages/Outcome/Outcome.js`) into cohesive, reusable feature modules under `js/features/pace/` and `js/features/outcome/`.

Preserve all existing dependencies between Pace (reading task completion data), Outcome (participating in Dashboard metrics and congratulations flow), and Dashboard without modifying protected components (`updateMetrics()`, Tasks engine, Target cascade, Dashboard orchestrator, Firebase internals, and AppState structure).

---

## User Review Required
> [!IMPORTANT]
> - All extracted features will be exposed globally on `window` and as CommonJS modules (`module.exports`) to ensure backwards compatibility with existing UI handlers (`onclick`, router transitions, `updateMetrics()`) as well as automated unit tests.
> - `pages/Pace Management/Pace Management.js` and `pages/Outcome/Outcome.js` will become lightweight page lifecycle controllers delegating directly to the extracted modules.
> - `index.html` will load the extracted modules directly so that Dashboard, Metrics, and other pages have immediate access to pace velocity calculations and outcome results without requiring a prior page visit.
> - Protected components (`updateMetrics()`, Tasks engine, Target cascade, Dashboard orchestrator, Firebase internals, AppState structure) will NOT be modified.

---

## Proposed Architecture & Changes

### 1. Pace Feature Modules (`js/features/pace/`)

#### [MODIFY] [paceEstimator.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/pace/paceEstimator.js)
Extract statistical estimation, velocity calculations, and target resolution:
- `getTargetedSubjectsForGoal(goal)`: Resolves subject sets for global, bundle, program, and individual subject goals.
- `calculatePaceGoalStats(goal, subjectStats)`: Computes total, completed, remaining, percentage, required pace (`reqPaceVal`), current pace (`curPaceVal`), finish date estimation (`finishDisplay`, `projectedDate`, `estDaysNeededStr`), and day allocations (`diffDaysTG`, `timeGoalCountdownStr`, `totalDays`, `daysElapsed`, `daysRemaining`).
- `calculateIndependentEstFinish()`: Computes independent pace projections across active filters.

#### [MODIFY] [paceManager.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/pace/paceManager.js)
Extract pace goal management, UI interactions, day allocations, and visual charts:
- Pace Goal Editor & CRUD: `addPaceGoal`, `openEditPaceModal`, `savePaceEdit`, `requestDeletePaceGoal`, `deletePaceGoal`, `togglePaceBundleType`, `updatePaceSubjects`.
- Dashboard Pace Settings: `setPaceToggleState`, `togglePaceSwitch`, `openEditTrendsPaceModal`, `selectActivePaceGoal`.
- Day Allocation & Goal Details: `openGoalDetailsModal` (timeline breakdown, chapter daily distribution).
- Pace Trend Chart: `openPaceTrendModal`, `renderPaceTrendChart`.
- Candlestick Chart: `openPaceCandleChartModal` (daily completion aggregation from `AppState.tasks`, interval wick/body candlestick bars).
- Grid Renderer: `renderPaceGoals(subjectStats)`.
- Page Lifecycle: `PaceManagementPage` (`init`, `mount`, `destroy`).

---

### 2. Outcome Feature Modules (`js/features/outcome/`)

#### [NEW] [outcomeResults.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/outcome/outcomeResults.js)
Extract exam result logging, CGPA / Grade computations, and results list UI:
- Exam Results CRUD: `openResultModal`, `saveResult`, `deleteResult`, `deleteProgramGroup`.
- CGPA & Grade Calculation:
  - `getProcessedResults()`: Aggregates success results by program and date, computes dynamic estimated program CGPA/grade from subject results, and merges fallback main targets.
  - `getProgramMainTarget(progName)`: Resolves target CGPA and letter grade from custom programs or historical records.
  - Interactive input helpers: `onCgpaInput`, `onCgpaBlur`, `updateCgpaBadge`, `onGradeSelect`, `updateSubjectTargets`, `updateModalEstScore`.
- Results UI & Filtering: `renderResults()`, `renderOutcomeProgramToggles()`, `toggleOutcomeProgram()`, `toggleOutcomeDateSort()`.
- Page Lifecycle: `OutcomePage` (`init`, `mount`, `destroy`).

#### [NEW] [outcomeAnalytics.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/outcome/outcomeAnalytics.js)
Extract program and subject analytics and trend charting:
- Trend Charts: `renderProgramTrendModal(progName)`, `renderSubjectWiseTrend(progName)`.
- Dataset Toggles: `toggleTrendDataset(type)`, `toggleProgramTrendDataset(type)`.
- Analytics Modal Views: `showProgramAnalytics(progName)`, `switchProgramAnalyticsView(view)`.

#### [NEW] [outcomePassConfig.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/outcome/outcomePassConfig.js)
Extract course passing, freezing, and curriculum completion controls:
- `renderPassConfig(forceRebuild)`: Renders track/program/subject pass checklist and frozen indicators.
- State Toggles: `togglePassProgram(pName)`, `togglePassSubject(subName)`, `bulkPassProgram(pName, passAll)`.
- Status Sync: Syncs with `window.passedItems` and `AppState.passedItems`.

#### [NEW] [outcomeCelebration.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/outcome/outcomeCelebration.js)
Extract milestone celebration criteria setup, live celebration status, and congratulations modal:
- Celebration Setup: `renderCelebrationConfig(forceRebuild)`, `openCelebrationSetupModal()`, `saveCelebrationSetup()`, `selectCelebrationModalTargets(mode)`, `selectAllCelebrationTargets(mode)`, `filterCelebrationSetupItems(query)`, `toggleCelebrationProg()`, `toggleCelebrationSub()`.
- Congratulations Modal & Confetti Integration:
  - `showCongratsModal(isCustom, corePassed, coreTotal)`: Opens the congratulations overlay and triggers confetti animation via `window.fireConfetti()`.
  - `switchCongratsPage(pageNum)`, `renderCongratsSummary()`, `closeCongratsModal()`.
- Live Status Card: `updateCelebrationLiveStatus(corePassed, coreTotal, hasCustomCeleb, celebrationMet)`.

---

### 3. Page Controller Modernization

#### [MODIFY] [pages/Pace Management/Pace Management.js](file:///d:/X-29-ADVANCE/X-29-advance-code/pages/Pace%20Management/Pace%20Management.js)
Refactor into a slim page coordinator delegating to `js/features/pace/paceManager.js` and `js/features/pace/paceEstimator.js`, mirroring the pattern established in `pages/Master Config/Master Config.js`.

#### [MODIFY] [pages/Outcome/Outcome.js](file:///d:/X-29-ADVANCE/X-29-advance-code/pages/Outcome/Outcome.js)
Refactor into a slim page coordinator delegating to `js/features/outcome/` modules (`outcomeResults.js`, `outcomeAnalytics.js`, `outcomePassConfig.js`, `outcomeCelebration.js`).

---

### 4. Global Script Integration & Monolith Cleanup

#### [MODIFY] [index.html](file:///d:/X-29-ADVANCE/X-29-advance-code/index.html)
Add script tags in `<head>` for the extracted feature modules:
```html
<script src="js/features/pace/paceEstimator.js?v=1.0.18"></script>
<script src="js/features/pace/paceManager.js?v=1.0.18"></script>
<script src="js/features/outcome/outcomeResults.js?v=1.0.18"></script>
<script src="js/features/outcome/outcomeAnalytics.js?v=1.0.18"></script>
<script src="js/features/outcome/outcomePassConfig.js?v=1.0.18"></script>
<script src="js/features/outcome/outcomeCelebration.js?v=1.0.18"></script>
```

#### [MODIFY] [js/script.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/script.js)
Remove duplicate implementations of extracted Pace and Outcome functions, providing safe backward-compatibility stubs and comments, while leaving `updateMetrics()`, `tasks engine`, `dashboard orchestrator`, and `target cascade` completely intact.

---

### 5. Automated Tests & Verification

#### [NEW] [tests/pace-outcome.test.js](file:///d:/X-29-ADVANCE/X-29-advance-code/tests/pace-outcome.test.js)
Comprehensive Node.js test suite with mock DOM/AppState environment validating:
1. **PACE Tests**:
   - Create goal (subject, program, bundle, global)
   - Edit goal (change dates, target selection)
   - Delete goal (item deletion tracking)
   - Velocity calculations (required pace & actual pace formulas)
   - Estimated finish date (on-track, behind, finished, future)
   - Day allocation (`totalDays`, `daysElapsed`, `daysRemaining`, `diffDaysTG`)
   - Pace trend chart data generation
   - Candlestick chart interval wicks and bodies calculation
2. **OUTCOME Tests**:
   - Create result (program and subject results)
   - Edit result (score, grade, date, targets)
   - Delete result & delete program group
   - CGPA calculation & dynamic estimation in `getProcessedResults`
   - Grade mapping (`mapCgpaToGrade`, `mapGradeToNumeric`)
   - Trend charts (program trend and subject-wise data groupings)
   - Pass/freeze configuration toggles and status checks
   - Celebration setup (selection, saving, filtering)
   - Congratulations modal lifecycle & summary rendering
   - Confetti integration (`window.fireConfetti` trigger check)
3. **Dashboard Integration**:
   - Verification that Dashboard cards (`renderDashboardOutcomeCard`, `updateTrendsBar`) consume pace and outcome outputs seamlessly without errors.

#### [MODIFY] [package.json](file:///d:/X-29-ADVANCE/X-29-advance-code/package.json)
Add `"test:pace-outcome": "node tests/pace-outcome.test.js"` script.

---

## Verification Plan

### Automated Tests
- Run `npm run test:config` to verify existing Batch 4 configuration tests remain green.
- Run `node tests/pace-outcome.test.js` to verify all Pace and Outcome unit tests pass.

### Browser Verification
- Use browser testing on `http://localhost:3000/`:
  - Verify Dashboard loads cleanly with no console errors.
  - Verify Dashboard outcome section displays correctly.
  - Navigate to Pace Management page: verify pace goals render, create/edit/delete modals work, candlestick chart modal opens.
  - Navigate to Outcome page: verify results table renders, result modal opens, pass/freeze toggles work, celebration criteria setup opens, congratulations preview functions.
