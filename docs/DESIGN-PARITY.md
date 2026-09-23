> **PERMANENT PARITY MANDATE**:  
> The original X-29 HTML/CSS/JS implementation is the visual source of truth. Technical modernization must not redesign, restyle, reinterpret, or alter the established interface unless the user explicitly requests a design change.  
> The modern Next.js/React/TypeScript implementation must reproduce the original application, not reinterpret it.

---

## 2. Page & Component Parity Checklist

### System Component: Application Shell & Global Navigation
- **Original reference**: `index.html` (lines 77–396), `css/style.css`, `js/shared/sidebar.js`, `router/router.js`
- **Modernized implementation**: `components/shell/AppShell.tsx`, `Sidebar.tsx`, `TopStatsBar.tsx`, `MobileHeader.tsx`, `MobileNavigation.tsx`
- **Audit Checklist**:
  - LAYOUT: [x] Match (Fluid `min-w-0 flex-1`, NO artificial `max-w-7xl` or centering)
  - TYPOGRAPHY: [x] Match (Inter, Outfit, font-countdown, tabular-nums)
  - COLORS: [x] Match (`bg-slate-50 dark:bg-[#0f172a]`, glass card borders, vibrant active nav colors)
  - SPACING: [x] Match (`p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8`, sidebar `p-5 md:p-6`)
  - COMPONENTS: [x] Match (Aura glow tag, nav buttons, profile card, full-width logout button, dual header)
  - ICONS: [x] Match (Raw SVG icons with stroke-width 2.5, NO generic Lucide icon replacements)
  - ANIMATIONS: [x] Match (`animate-aura`, `pageEnter`, `translate-x-0` / `-translate-x-full` drawer)
  - INTERACTIONS: [x] Match (Hover `translate-x-1.5`, active route highlighting, mobile drawer backdrop click)
  - RESPONSIVE: [x] Match (360px, 390px, 430px, 768px, 1024px, 1280px, 1440px)
  - FUNCTIONALITY: [x] Match (Page navigation, live 12h clock, countdown timer, stats sync, sign out)
- **Status**: **COMPLETED (VERIFIED)**
- **Verification**: Verified across Desktop (1440px), Tablet (768px), and Mobile (390px). 0 errors, 100% visual and behavioral parity.

---

### Page 2: Dashboard Overview (`/`)
- **Original reference**: `pages/Dashboard/Dashboard.html`, `pages/Dashboard/Dashboard.css`, `js/features/dashboard/dashboard.js`, `js/core/metrics.js`
- **Modernized implementation**: `app/(dashboard)/page.tsx`, `features/dashboard/components/*`
- **Audit Checklist**:
  - LAYOUT: [x] Match (`grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-6`, Program Completion, X Bar, Track Completion)
  - TYPOGRAPHY: [x] Match (Outfit headers, font-countdown, text-[10px] uppercase font-black tracking-wider)
  - COLORS: [x] Match (Card surfaces `dark:bg-slate-800`, metric boxes `dark:bg-slate-900/40 border-slate-700/60`)
  - SPACING: [x] Match (Card padding `p-4`, rounded-3xl, card height `h-[225px] md:h-[250px] min-h-[225px] md:min-h-[250px]`)
  - COMPONENTS: [x] Match (All 11 KPI cards + Program Completion Grid + TrendsBar (X Bar) + Track Completion Grid)
  - ICONS: [x] Match (Exact raw SVG icons with stroke-width 2.5 and colored badge wrappers)
  - ANIMATIONS: [x] Match (`animate-page-enter`, `dashboardSlideUp 0.32s`, hover borders)
  - INTERACTIONS: [x] Match (Card deep-link navigation buttons, optimistic target checkboxes, settings modals)
  - RESPONSIVE: [x] Match (360px, 390px, 430px, 768px, 1024px, 1280px, 1440px)
  - FUNCTIONALITY: [x] Match (Pace calculations, real-time checklist sync, program & track progress bars)
- **Status**: **COMPLETED (VERIFIED)**
- **Verification**: Exact parity restored across all 11 dashboard cards, 2 completion grids, and X Bar. Multi-viewport browser tested. Zero drift remaining.

-----

### Page 3: Focus & Timer (`/focus` vs `pages/Focus/Focus.html`)
- [ ] **Visual Parity**:
  - Central SVG Chronograph Dial with seconds needle (emerald), minutes needle (blue), and illuminated tick marks.
  - Large tabular digital readout (`font-countdown`, `tabular-nums`) formatted as `00:00:00`.
  - Mode toggle: Stopwatch vs Countdown.
  - Subject selector dropdown with colored left-borders matching subject palette.
  - Start / Pause / Reset button row with high-contrast emerald and slate styles.
  - Session history slide-out drawer with chronological study logs.
- [ ] **Behavioral Parity**:
  - Timestamp-based elapsed math: `Date.now() - startTime` (zero interval drift).
  - Web Audio API chimes play on session start, pause, and countdown completion.
  - Study logs automatically saved to IndexedDB and Firestore on completion.
  - Fullscreen mode toggle via Fullscreen API.
  - Timer tick triggers updates ONLY on dial needles and digital numbers (zero layout re-render).
- [ ] **Responsive Parity**:
  - Dial scales smoothly from 320px diameter on desktop down to 240px on mobile without clipping.
- **Status**: **PENDING VERIFICATION (STEP 013)**
- **Notes**: Engine tested in `tests/timer-engine.test.mjs`.

---

### Page 4: Subjects & Syllabus (`/subjects` vs `pages/Subjects/Subjects.html`)
- [ ] **Visual Parity**:
  - Program -> Track -> Subject card hierarchy.
  - Deterministic 14-subject color accents on card borders and tags.
  - Progress bar showing completed chapters fraction (e.g. `14 / 28`).
  - Passed subject badge ("PASSED" in emerald with lock icon).
  - Chapter Checklist Modal showing scrollable list of all chapters with status pills.
- [ ] **Behavioral Parity**:
  - Chapter checkbox toggle updates task and taxonomy stores immediately.
  - Mark Subject as Passed locks chapters and recalculates CGPA/Success metrics.
  - Search filter input filters subjects by name and track in real-time.
- [ ] **Responsive Parity**:
  - Grid shifts from 3 columns to 2 columns to 1 column on mobile.
  - Chapter checklist modal fits on mobile screens without overflowing.
- **Status**: **PENDING VERIFICATION (STEP 014)**
- **Notes**: Scaffolded in `features/subjects/components/*`.

---

### Page 5: Daily Actions & Targets (`/daily-actions` vs `pages/Daily Actions/*`)
- [ ] **Visual Parity**:
  - Daily Habits checklist (DADB) with streak counters and fire icons.
  - Habit Radar Modal showing polar SVG radar chart with monthly commitment curves.
  - Monthly Target Setup Modal with batch allocator, chapter fractions, and auto-spread toggle.
  - Target database table with status badges (Pending, In Progress, Completed).
- [ ] **Behavioral Parity**:
  - Toggling daily habits calculates monthly adherence percentage.
  - Auto-spread engine assigns chapters evenly across available calendar days.
  - Cascades changes from Monthly -> Weekly -> Daily target databases cleanly.
- [ ] **Responsive Parity**:
  - Table scrolls horizontally with sleek custom scrollbar on mobile; cards remain full-width.
- **Status**: **PENDING VERIFICATION (STEP 015)**
- **Notes**: Scaffolded in `features/daily-actions/components/*`.

---

### Page 6: Daily Schedule (`/schedule` vs `pages/Daily Schedule/*`)
- [ ] **Visual Parity**:
  - 24-hour visual timeline grid segmented into 1-hour slots.
  - Active time slot highlighted with glowing neon cyan border and "ACTIVE NOW" badge.
  - Schedule block cards with color-coded category tags (Study, Routine, Exam, Rest).
  - Routine Allocation summary card showing total hours per activity.
- [ ] **Behavioral Parity**:
  - ScheduleBlockModal allows creating, editing, and deleting 24h blocks.
  - Active slot updates dynamically based on system clock.
  - Validates non-overlapping block boundaries.
- [ ] **Responsive Parity**:
  - Timeline grid wraps or scrolls cleanly; time labels remain visible on small screens.
- **Status**: **PENDING VERIFICATION (STEP 016)**
- **Notes**: Scaffolded in `features/schedule/components/*`.

---

### Page 7: Pace Management (`/pace` vs `pages/Pace Management/*`)
- [ ] **Visual Parity**:
  - PaceStatsBanner with 3 primary metrics: Required Pace (chapters/day), Current Velocity, Forecast Date.
  - Grid of PaceGoalCards for individual subjects with circular completion rings.
  - AddPaceGoalModal with target date picker and velocity calculator.
- [ ] **Behavioral Parity**:
  - Pace velocity formula strictly preserved: `remainingChapters / remainingDays`.
  - Adjusting target date recomputes required pace in real-time.
- [ ] **Responsive Parity**:
  - Banner metrics stack vertically on mobile (360px) and display inline on desktop.
- **Status**: **PENDING VERIFICATION (STEP 017)**
- **Notes**: Scaffolded in `features/pace/components/*`.

---

### Page 8: Outcome & CGPA (`/outcome` vs `pages/Outcome/*`)
- [ ] **Visual Parity**:
  - CGPA summary hero card with large numerical score (e.g. `3.85 / 4.00`) and letter grade badge.
  - PassFreezeSection: List of completed courses with locked grades and credit hours.
  - CelebrationSection: Target threshold gauge, celebration mode toggle, and confetti burst.
  - ResultEntryModal for adding/editing semester course grades.
- [ ] **Behavioral Parity**:
  - 4.00-scale CGPA conversion formula matches legacy engine exactly.
  - Celebration mode triggers confetti animation when CGPA target is reached.
- [ ] **Responsive Parity**:
  - Hero card and tables adapt smoothly to mobile viewports without clipped scores.
- **Status**: **PENDING VERIFICATION (STEP 018)**
- **Notes**: Scaffolded in `features/outcome/components/*`.

---

### Page 9: Exam Routine (`/exam` vs `pages/Exam Routine/*`)
- [ ] **Visual Parity**:
  - CountdownHero card with large tabular countdown digits (`days : hours : mins : secs`).
  - ExamRoutineTable with subject name, date, time slot, venue, and status pills.
  - ExamModal for adding and editing exam routine entries.
- [ ] **Behavioral Parity**:
  - Selecting an active exam sets it as the system-wide countdown featured in the top header.
  - Countdown updates every second using tabular numbers without jitter.
- [ ] **Responsive Parity**:
  - Table transforms to mobile card view on small screens (< 640px).
- **Status**: **PENDING VERIFICATION (STEP 019)**
- **Notes**: Scaffolded in `features/exam/components/*`.

---

### Page 10: Master Config (`/master-config` vs `pages/Master Config/*`)
- [ ] **Visual Parity**:
  - System configuration panel with program visibility toggles and track order.
  - Track & Program editor with color swatch selector and chapter count inputs.
  - Backup & Restore card with JSON download and upload buttons.
- [ ] **Behavioral Parity**:
  - Toggling program visibility immediately updates sidebar and dashboard filters.
  - JSON backup produces complete export matching legacy backup format.
- [ ] **Responsive Parity**:
  - Controls, inputs, and toggle switches meet 44x44px touch ergonomics.
- **Status**: **PENDING VERIFICATION (STEP 020)**
- **Notes**: Scaffolded in `features/config/components/*`.

---

### Page 11: Spectra Analytics (`/analytics` vs `pages/Analytics/*`)
- [ ] **Visual Parity**:
  - FocusHeatmapCard: Multi-week matrix with 5 color intensity tiers for study hours.
  - HabitRadarSection: Polar SVG radar chart with smooth curves for habit dimensions.
  - ChapterMapSection: Stacked progress bars per subject and track.
  - StatFilterToolbar: Range pills (7D, 30D, 90D, All) and grouping toggles.
- [ ] **Behavioral Parity**:
  - Heatmap calculates exact study hours from `timerLogs`.
  - Date range filters update chart data smoothly without full page reload.
- [ ] **Responsive Parity**:
  - Heatmap scrolls horizontally with custom scrollbar on mobile; radar scales smoothly.
- **Status**: **PENDING VERIFICATION (STEP 021)**
- **Notes**: Scaffolded in `features/analytics/components/*`.

---

## 3. Shell & Global Chrome Parity

| Component | Visual Standard | Behavior Standard | Status |
|---|---|---|---|
| **Header Bar** | Fixed 64px, logo sticker, live exam countdown, sync pill | Real-time countdown tick, cloud sync status indicator | Scaffolded |
| **Sidebar Navigation** | 240px expanded, glassmorphism, active blue pill | Route transition without page reload, user profile card | Scaffolded |
| **Mobile Header** | 56px compact header with menu toggle and countdown | Slide-out drawer or bottom navigation on screens < 768px | Scaffolded |
| **Dialog Overlays** | Radix UI dialog with backdrop blur and `Escape` dismiss | Focus trap, keyboard navigation, zero body scroll when open | Scaffolded |

---

## 4. Verification Protocol for Each Step

Before marking any page step COMPLETED:
1. Open the legacy page in one browser window (`npm run dev:legacy` on port 3000).
2. Open the modern page in an adjacent window (`npm run dev` on port 3001).
3. Compare layout, typography, hex colors, shadows, borders, and margins side-by-side.
4. Perform user actions (click, edit, toggle, save) in both; confirm identical results.
5. Resize viewport to 360px, 390px, 768px, 1024px, and 1440px.
6. Check browser console: **0 errors, 0 warnings, 0 layout shifts**.
7. Run `npm run typecheck` and `npm run test:unit`.
8. Check off items in this document and update `MEMORY.md`.
