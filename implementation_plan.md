# Phase 2 / Batch 6: Extract Analytics and Read-Only Visualization Systems

## Overview
Extract and modularize Analytics and Read-Only Visualization Systems from monolithic sources (`pages/Analytics/Analytics.js`, `shared/services/timerService.js`, `js/script.js`) into cohesive, reusable feature modules under `js/features/analytics/`:
1. **`spectra.js`**: Spectra Analytics, Spectra Circle Charts, Spectra Commitment Matrix, Pace & Trend charts coordination, AnalyticsPage lifecycle.
2. **`heatmap.js`**: Spectra Focus Heatmap, Timeframe range controls (30, 90, 180, 365 days), Focus Heatmap Day Drill-down, Side Note panel, and Day Detail modal.
3. **`history.js`**: Global Timeline History (Timeline Entry, Subject Folder, and Trend Chart tabs), Timeline Search filter, and Timeline Editing modal (`edit-timeline-entry-modal`).
4. **`chapterMap.js`**: Global Chapter Interactive SVG Map (`generateGlobalChaptersSVG`), segmented progress rings, Global Chapters modal (`global-chapters-modal`), Subject Trend circle (`renderSubjectTrendCircle`), and interactive tooltips.

All modules will strictly **READ** application state (`AppState`, `window.tracks`, `window.paceGoals`, `window.customActions`, `window.passedItems`, `window.revisionData`), prevent duplicate state, avoid modifying Firebase models, ensure Chart.js canvas safety (prevent duplicate instances, destroy/reuse correctly), and prevent listener accumulation.

---

## User Review Required

> [!IMPORTANT]
> - All extracted features will be exposed globally on `window` and as CommonJS modules (`module.exports`) to guarantee 100% backward compatibility with existing inline HTML handlers (`onclick`, `onmouseenter`, `onchange`), router transitions (`AnalyticsPage.mount()`, `AnalyticsPage.destroy()`), and automated tests.
> - `pages/Analytics/Analytics.js` will be refactored into a slim page coordinator delegating directly to the extracted modules, mirroring the successful pattern in `pages/Pace Management/Pace Management.js` and `pages/Outcome/Outcome.js`.
> - `index.html` will load `chapterMap.js`, `history.js`, `heatmap.js`, and `spectra.js` directly in `<head>` so that Dashboard, Focus Timer, and Subjects pages have immediate access to heatmap and chapter maps without requiring a prior page visit.
> - Chart.js instances (`globalHistoryChartInstance`, `mainChartPrograms`, `monthlyChartActions`, `yearlyChartActions`, `spectraPaceTrendChartInstance`, `globalPaceTrendChartInstance`) will be cleanly destroyed or updated in-place to eliminate any possibility of "Canvas is already in use" errors during route transitions.

---

## Proposed Changes

### 1. Chapter Interactive SVG Map Feature Module

#### [NEW] [chapterMap.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/analytics/chapterMap.js)
Extract SVG segmented chapter rings, modals, and tooltips:
- `generateGlobalChaptersSVG(isSpectra, spectraFilter, isSubjectModal)`: Computes chapter completion statistics and generates polar segmented arc SVG rings (1-ring subject modal mode and 1-5 ring dynamic multi-ring mode).
- `openGlobalChaptersModal()`: Opens `#global-chapters-modal` and renders the full syllabus SVG map with color legend and quick metrics.
- Tooltip managers:
  - `showChapterTooltip(event, subject, chapterNum, status)` / `hideChapterTooltip()` (for Global Chapters modal `#gcm-tooltip`).
  - `showSubjectChapterTooltip(event, subject, chapterNum, status)` / `hideSubjectChapterTooltip()` (for Subject modal `#stm-tooltip`).
  - `showSpectraChapterTooltip(event, subject, chapterNum, status)` / `hideSpectraChapterTooltip()` (for Analytics page `#spectra-gcm-tooltip`).
- `renderSubjectTrendCircle()`: Renders subject-specific circular chapter progress inside `#subject-trend-circle-container`.

---

### 2. Focus Heatmap Feature Module

#### [NEW] [heatmap.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/analytics/heatmap.js)
Extract Focus Heatmap and Day Drill-down from `shared/services/timerService.js`:
- Range Controls:
  - `spectraHeatmapRange` (default 365).
  - `setSpectraHeatmapRangeUI(days)` & `setSpectraHeatmapRange(days)` (updates active button states for 30, 90, 180, 365 days and re-renders).
- Heatmap Rendering:
  - `renderSpectraFocusHeatmap()`: Reads `AppState.timerLogs` and `AppState.activeTimerState`, computes daily seconds, determines color tier (0h red, 0-2h low, 2-4h moderate, 4-6h target met, 6-8h gold pulse, 8h+ diamond shimmer), calculates streak, and renders both `#spectra-focus-heatmap-grid` and `#dashboard-focus-heatmap-grid`.
  - `renderHeatmap()`: Renders `#yearly-daily-grid` with action completion percentages.
- Heatmap Tooltip:
  - `showSpectraHeatmapTooltip(e, el)`: Shows `#spectra-focus-heatmap-tooltip` with formatted date, duration, and tier badge.
  - `moveSpectraHeatmapTooltip(e)` & `hideSpectraHeatmapTooltip()`.
- Day Drill-down & Side Note Panel:
  - `showSpectraHeatmapDayDetail(dateKey, openModal)`: Highlights selected box, updates `#spectra-heatmap-side-note` (day, date, badge, focus time, target %, subject breakdown), updates `#dash-hm-selected-detail`, and populates `#spectra-heatmap-day-modal`.
  - `closeSpectraHeatmapDayModal()`.

---

### 3. Global Timeline History Feature Module

#### [NEW] [history.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/analytics/history.js)
Extract Global History and Timeline Editing modal from `js/script.js`:
- `openGlobalHistoryModal()`: Opens `#global-history-modal` and renders content.
- `renderGlobalHistoryContent(searchFilter)`:
  - Aggregates completed study chapters from `AppState.tasks` and revisions from `window.revisionData.progress`.
  - Supports search keyword filtering (by subject, chapter name, or type).
  - Renders Timeline tab (`#ghm-view-timeline`), Subject Folder tab (`#ghm-view-subject`), and Trend Chart tab (`#ghm-view-trend`).
  - Manages `window.globalHistoryChartInstance`: ensures previous instance is properly destroyed before constructing new Chart, preventing canvas reuse errors.
- `switchGhmTab(tab)`: Manages active tab state (`currentGhmTab`) and scroll position restoration.
- `filterGlobalHistory(query)`: Instant live search filter across historical timeline records.
- Timeline Editing Modal:
  - `openEditTimelineEntryModal(type, encSubject, encItem, ts, track, chNum)`: Populates `#edit-timeline-entry-modal` datetime input (`#etem-datetime`) and subtitle (`#etem-subtitle`).
  - `saveTimelineEntryDate()`: Parses selected date/time, updates `AppState.tasks` or `window.revisionData.progress`, triggers cloud save (`FirebaseService.saveToCloud`), refreshes UI, and closes modal.

---

### 4. Spectra Analytics Feature Module

#### [NEW] [spectra.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/features/analytics/spectra.js)
Extract Spectra Analytics, Commitment Matrix, Circle Chart controls, and Pace visualization coordination:
- Syllabus Chapters Filter Dropdown:
  - `selectedSpectraFilters` (tracks, programs, subjects, global).
  - `populateSpectraFilterDropdown()`, `updateSpectraFilterDropdownLabel()`, `onSpectraFilterChange(val)`.
  - Prevents accumulating duplicate document click listeners.
- Spectra Circle Chart:
  - `renderSpectraCircleChart()`: Delegates to `generateGlobalChaptersSVG`, updates title, description, and completion counters (`#spectra-legend-complete`, `#spectra-legend-incomplete`, `#spectra-legend-skipped`).
- 7 Officer Commitments Habit Radar (Commitment Matrix):
  - `getCommitmentLabels()`, `saveCommitmentLabelsData()`, `getCommitmentStorageKey()`, `getCommitmentMonthData()`, `saveCommitmentMonthData()`.
  - Polar SVG Grid generation: `renderSpectraCommitmentsChart()`.
  - Month navigation: `prevCommitmentMonth()`, `nextCommitmentMonth()`, `resetCommitmentMonth()`.
  - Cell toggle: `toggleCommitmentCell(dayNum, habitIndex)` with cloud save and cross-tab sync (`X29SyncChannel`).
  - Commitment labels modal: `openCommitmentsModal()`, `closeCommitmentsModal()`, `resetCommitmentLabelsDefault()`, `saveCommitmentLabels()`.
  - Tooltips: `showCommitmentTooltip()`, `hideCommitmentTooltip()`.
- Trend Charts & Pace Visualizations Coordination:
  - `renderTrendCharts()`: Computes program completion and daily actions datasets, updates `#mainChartPrograms`, `#monthlyActionsChart`, `#yearlyActionsChart`, updates Analytics summary cards (`analytics-avg-completion`, `analytics-total-actions`, `analytics-active-streak`, `analytics-days-remaining`), and calls pace trend chart updates.
  - `renderPaceCharts()`: Safely invokes `renderSpectraPaceTrendChart()` and `renderGlobalPaceTrendChart()` from `PaceManager`.
  - Dataset toggles: `toggleDataset(chartKey, dsKey)`, `toggleSubDataset(k)`, `toggleRevSubDataset(k)`, `updateLegends()`, `updateRevisionLegends()`.
  - Trend time filter: `setTrendFilter(f)`.
- AnalyticsPage Lifecycle Object:
  - `init()`, `mount()`, `render()`, `resizeCharts()`, `destroy()`.
  - `destroy()` cleans up tooltips, dropdowns, and destroys or detaches Chart.js instances so navigating away and back is completely clean.

---

### 5. Page Controller & Script Updates

#### [MODIFY] [pages/Analytics/Analytics.js](file:///d:/X-29-ADVANCE/X-29-advance-code/pages/Analytics/Analytics.js)
Refactor into a slim page coordinator delegating to `js/features/analytics/spectra.js`, `heatmap.js`, and `chapterMap.js`.

#### [MODIFY] [shared/services/timerService.js](file:///d:/X-29-ADVANCE/X-29-advance-code/shared/services/timerService.js)
Delegate heatmap functions (`renderSpectraFocusHeatmap`, `setSpectraHeatmapRangeUI`, etc.) to `HeatmapAnalytics` in `heatmap.js`.

#### [MODIFY] [js/script.js](file:///d:/X-29-ADVANCE/X-29-advance-code/js/script.js)
Provide backward-compatible delegation stubs for `generateGlobalChaptersSVG`, `openGlobalChaptersModal`, `showChapterTooltip`, `hideChapterTooltip`, `renderGlobalHistoryContent`, `openGlobalHistoryModal`, `openEditTimelineEntryModal`, `saveTimelineEntryDate`, `renderTrendCharts`, `renderHeatmap`, and remove duplicated monolithic blocks.

#### [MODIFY] [index.html](file:///d:/X-29-ADVANCE/X-29-advance-code/index.html)
Add script tags in `<head>`:
```html
<script src="js/features/analytics/chapterMap.js?v=1.0.19"></script>
<script src="js/features/analytics/heatmap.js?v=1.0.19"></script>
<script src="js/features/analytics/history.js?v=1.0.19"></script>
<script src="js/features/analytics/spectra.js?v=1.0.19"></script>
```
Add search input into `#global-history-modal` to enable quick timeline searching.

---

### 6. Automated Unit Tests

#### [NEW] [tests/analytics-visualization.test.js](file:///d:/X-29-ADVANCE/X-29-advance-code/tests/analytics-visualization.test.js)
Comprehensive Node.js test suite validating:
1. **Chapter SVG Map**:
   - SVG polar ring generation with global, track, program, and subject filters.
   - 1-ring vs multi-ring calculation and completion counts.
   - Modal and tooltip handlers.
2. **Commitment Matrix**:
   - Polar coordinate and arc calculations.
   - Month data retrieval, streak computation, cell toggle for past days vs today.
   - Commitment labels modal and default reset.
3. **Focus Heatmap**:
   - Focus seconds aggregation from logs and running timer.
   - 30, 90, 180, 365 day range generation and tier badge assignment.
   - Day detail drill-down (side note update and modal population).
4. **Global Timeline History**:
   - Study task and revision event extraction and chronological sorting.
   - Search filter matching against subjects, chapters, and types.
   - Date and time editing with timestamp sync.
5. **Spectra Analytics & Pace Visualizations**:
   - Filter dropdown cascading selection.
   - Summary cards calculation.
   - Trend charts datasets generation and `renderPaceCharts` coordination.
6. **Chart.js Instance Safety & Router Lifecycle**:
   - Verification that destroying/re-mounting does not leak instances or cause canvas collisions.

#### [MODIFY] [package.json](file:///d:/X-29-ADVANCE/X-29-advance-code/package.json)
Add `"test:analytics": "node tests/analytics-visualization.test.js"` script.

---

## Verification Plan

### Automated Tests
- `npm run test:config` (Batch 4 verification)
- `npm run test:pace-outcome` (Batch 5 verification)
- `npm run test:analytics` (Batch 6 verification)

### Manual & Browser Verification
- Load `http://localhost:3000/` and navigate to:
  - **Analytics Page**:
    - Verify Circle charts render with filters (Global, Track, Program, Subject).
    - Verify Commitment Matrix renders, cells toggle, and month navigation works.
    - Verify Focus Heatmap renders with 30/90/180/365 range selectors.
    - Hover on heatmap boxes to test tooltips; click box to test Side Note panel and Day Detail modal.
    - Verify Trend Charts and Pacing Trend charts (X Bar and Global Scope) render cleanly.
  - **History Database Modal**:
    - Open modal from Subjects page / global trigger.
    - Test Timeline Entry, Subject Folder, and Trend Chart tabs.
    - Test Timeline search filter.
    - Click edit icon on an entry, update date/time, and verify save.
  - **Navigation**:
    - Navigate away from Analytics to Dashboard / Pace / Outcome and back to Analytics.
    - Verify zero console errors, no duplicate Chart instances, and no blank canvases.
