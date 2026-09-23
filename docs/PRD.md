# X-29 Advance — Product Requirements Document (PRD)

> **Document Status**: Production Reference / Active Baseline  
> **Target Audience**: AI Development Agents & Engineering Team  
> **Core Directive**: Strict parity with existing production behavior and visual identity. Zero unsolicited redesigns.

---

## 1. Project Purpose & High-Level Overview

**X-29 Advance** is a private, production-grade study execution dashboard and multi-track academic tracking system. It serves as an ultra-high-efficiency command center for intense study schedules, structured syllabi, daily habits, target roadmaps, examination countdowns, and academic outcome modeling.

The application combines:
- Hierarchical syllabus tracking across multiple educational tracks (e.g., BCS, Engineering, Medical, University).
- Deep study timer and chronograph stopwatch with audio chimes and analytics.
- Multi-tier target planning across Monthly, Weekly, and Daily horizons.
- 24-Hour daily routine schedule block planner.
- Dynamic pace estimation and completion forecasting.
- Academic performance analytics (Spectra Analytics, habit heatmaps, completion radars).
- Examination routine management and countdown counters.
- CGPA simulation and academic milestone honors/celebration.
- Real-time cloud synchronization backed by Firebase Authentication and Firestore.

---

## 2. Target Users & Core Personas

- **Primary User**: High-intensity student, competitive examinee, or professional scholar managing multiple complex subjects simultaneously across long timelines (months to years).
- **Core Needs**:
  1. Instant visibility of daily tasks, upcoming exams, and overall progress without distraction.
  2. Frictionless, one-tap task completion and live timer logging.
  3. Relentless accuracy in schedule and target cascading (Monthly -> Weekly -> Daily).
  4. Real-time sync between devices (Desktop workstation and Android mobile PWA) with offline resilience.
  5. Fast, responsive, snappy UI that does not lag on mobile devices or consume excessive battery during timer sessions.

---

## 3. Real Pages & Feature Specifications

The application consists of 11 distinct functional views organized under a single clean domain architecture:

```text
https://x-29-advance.vercel.app/
├── /login              — Private Access Authentication
├── /                   — Dashboard Command Center (alias /dashboard)
├── /focus              — Study Chronograph & Precision Timer
├── /analytics          — Spectra Analytics Studio
├── /daily-actions      — Daily Actions, Habits & Target Management
├── /schedule           — Daily 24h Schedule Timeline Planner
├── /subjects           — Subjects & Chapter Checklist
├── /pace               — Pace Management & Velocity Forecaster
├── /master-config      — Master Configuration & Syllabus Management
├── /outcome            — Outcome, CGPA Modeling & Celebration
└── /exam               — Examination Routine & Countdowns
```

### 3.1. Authentication & Security (`/login`)
- **Access Model**: Strict single-user private access system.
- **Primary Account**: `ris2k29@gmail.com`.
- **Functionality**:
  - Secure email/password authentication using Firebase Auth.
  - Automatic token persistence (`LOCAL`).
  - Auth state persistence across browser tabs and sessions.
  - Redirect guard preventing unauthenticated access to dashboard views.
  - Offline fallback authentication mode for local development.

### 3.2. Dashboard Overview (`/`)
- **Header Bar**:
  - Branding: X-29 logo sticker, system version pill.
  - Live Exam Countdown: Dynamic countdown to next priority exam with tabular digit flip animation.
  - Network / Cloud Sync Status: Live indicator showing `Saving...`, `Saved`, `Saved Locally`, `Offline (Queued)`, or `Sync Error`.
  - Date & Clock: Current date in regional format.
- **Active Now Widget**: Current active schedule block detected from the 24h routine based on local time.
- **Top KPI Cards**:
  - Global Completion % with radial progress indicator.
  - Total Static Chapters across all tracks.
  - Completed Chapters vs. Remaining Chapters.
  - Active Streak (continuous days of study/habit adherence).
  - Daily Focus Hours Target vs. Actual study time logged today.
- **Daily / Weekly / Monthly Quick Action Checklists**:
  - Overdue and today's scheduled tasks with instant checkbox completion.
  - Weekly milestone progress bars.
  - Monthly targets progress bars with fraction indicators.
- **Outcome & Exam Summaries**:
  - Projected CGPA / Academic score badge.
  - Upcoming exam countdown cards with dates and subject names.
  - Passed courses counter and celebration status.

### 3.3. Focus Studio (`/focus`)
- **Dual Timing Modes**:
  - **Stopwatch Mode**: Count-up chronometer measuring focused study duration.
  - **Countdown / Alarm Mode**: Count-down timer with configurable target duration (15m, 25m Pomodoro, 45m, 60m, 90m, 120m presets or custom input).
- **Interactive Chronograph Dial**:
  - SVG polar gauge with rotating needles (seconds and minutes).
  - Dial tick highlights synchronized with elapsed time.
  - Smooth animation transitions without UI jank or timer drift.
- **Precision Time Engine**:
  - Timestamp-based calculation (`Date.now() - startTime`) preventing background tab throttling and drift.
  - State preservation across page reloads, tab switches, and mobile background states.
- **Audio Chimes & Alarms**:
  - Synthetic Web Audio API synthesizer for bell, chime, digital beep, and gong sounds (no external audio assets required).
- **Session History & Logging**:
  - Logs study sessions with subject name, start time, end time, and duration.
  - Instant session filtering (All, Today, This Week, This Month).
  - Live subject target progress bar updated immediately upon session completion.

### 3.4. Daily Actions & Targets (`/daily-actions`)
- **Daily Habit Tracker (DADB)**:
  - Habit matrix tracking recurring daily commitments (e.g., Core Study, Problem Solving, Revision, Reading, Exercise).
  - Date navigation (Today, Yesterday, Previous Days) with persistent completion records.
  - Habit Radar / Polar visualization showing monthly adherence scores.
- **Multi-Horizon Target Management**:
  - **Monthly Targets**: High-level chapter goals allocated to specific calendar months. Features batch allocation, fraction splitting, and auto-spread.
  - **Weekly Targets**: 7-day milestone targets synchronized from monthly targets or created directly.
  - **Daily Targets**: Daily task allocations bound to specific calendar days.
  - **Bi-directional Cascading Sync**: Completing a daily target automatically marks related weekly and monthly target portions as complete.

### 3.5. Daily Schedule Timeline (`/schedule`)
- **24-Hour Timeline Planner**:
  - Full day schedule broken down into 1-hour segment blocks (00:00 to 24:00).
  - Dual routine set support (Routine 1 vs. Routine 2 switchable with one click).
  - Color-coded activity categorization (Study, Sleep, Classes, Meals, Rest, Revision).
- **Active Slot Detection**: Real-time detection of current active routine block based on system clock.
- **Routine Hours Summary**: Aggregated daily hours allocated per activity category.

### 3.6. Subjects & Syllabus Execution (`/subjects`)
- **Multi-Track Hierarchy**:
  - Track (e.g., Track A, Track B) -> Program (e.g., BCS Preli, Academic) -> Subject (e.g., Bangladesh Affairs, Physics) -> Chapter (Chapter 1, 2, ... N).
- **Chapter Execution & Toggling**:
  - Checkbox completion with optimistic UI updates.
  - Cross-instance synchronization (completing a chapter marks identical instances across all targets).
  - Chapter skip functionality with tombstone recording for deletion safety.
  - Unscheduled revision slot auto-allocation.
- **Subject Daily Time Goals**: Link subjects to pace goals and custom completion target dates.
- **Subject Color Synchronization**: Deterministic 14-color palette mapping ensuring every subject has a consistent accent color across the entire application.

### 3.7. Pace Management & Forecasting (`/pace`)
- **Pace Velocity Calculator**:
  - Analyzes completion rate (chapters completed per day) vs. required velocity to finish syllabus by target deadline.
  - Categorizes subjects into pace status: `Ahead of Schedule`, `On Track`, `Behind Pace`, `Critical Lag`.
- **Projected Completion Dates**: Computes dynamic forecasted end dates based on rolling 7-day and 30-day velocity averages.
- **Independent Pace Goals**: Custom pace targets per track, program, or individual subject.

### 3.8. Spectra Analytics Studio (`/analytics`)
- **Multi-Dimensional Study Analytics**:
  - **Spectra Heatmap**: GitHub-style 365-day study activity heatmap with color intensity tiers based on hours studied.
  - **Completion Matrix**: Polar arc visualization and chapter completion maps.
  - **Trend Analysis**: Cumulative completion curves comparing actual progress vs. target progress trajectories.
  - **Subject Distribution**: Donut and bar breakdowns of time spent per subject.

### 3.9. Outcome & Academic Modeling (`/outcome`)
- **CGPA & Grade Calculator**:
  - Standard university 4.00 grading scale converter (A+, A, A-, B+, B, C, D, F).
  - Weighted CGPA calculations based on credit hours and achieved grade points.
- **Pass / Freeze Management**: Mark subjects or entire programs as officially passed/cleared to freeze progress and celebrate completion.
- **Celebration Mode**: Full-screen canvas confetti animation, sound effects, and milestone badges.

### 3.10. Master Configuration (`/master-config`)
- **System Taxonomy Manager**:
  - Add, edit, reorder, or delete tracks, programs, and subjects.
  - Safe cascading migrations when renaming or reassigning subjects.
- **Priority Configuration**: Configure priority courses and critical milestone weights.
- **Data Backup & Restore**:
  - One-click JSON backup export of complete user application state.
  - Verified restore system with schema validation.
  - Cloud reset and sync diagnostics.

---

## 4. Non-Functional Requirements & Performance Goals

| Metric | Current Baseline (Phase 1) | Target Modernized Value |
|---|---|---|
| **Largest Contentful Paint (LCP)** | 29.9 seconds | < 2.0 seconds |
| **First Contentful Paint (FCP)** | 14.6 seconds | < 1.0 second |
| **Total Blocking Time (TBT)** | 750 ms | < 150 ms |
| **Cumulative Layout Shift (CLS)** | 0.00 | 0.00 (Zero CLS) |
| **Initial JS Payload (Transferred)** | 2,605 KB (2.54 MB unminified) | < 350 KB gzipped |
| **Network Requests on Boot** | 47 requests | < 18 requests |
| **Lighthouse Performance Score** | 37 / 100 | > 90 / 100 |
| **Mobile Responsiveness** | Breakpoints glitching on <414px | Pixel-perfect on 360px - 1440px+ |
| **Offline Capability** | Non-functional (No SW registered) | Full offline read/write with queue |

---

## 5. Absolute Constraints & What Must NOT Change

1. **Zero Redesign**: The visual design of the existing application (dark theme `#0b0f19`, glass cards, fonts, spacings, borders, buttons, colors) is the immutable visual source of truth.
2. **Business Calculations**: Formulas for CGPA, pace velocity, required daily chapters, streak calculation, timer elapsed time, and target cascade must remain byte-for-byte mathematically identical.
3. **Data Integrity**: Existing Firestore document data in `users/{uid}` must load and synchronize without data loss, field drop, or schema breakage.
4. **Clean Single Domain**: The entire application must operate under one domain without subfolder URL artifacts (e.g., `/dashboard`, `/focus`, `/analytics`).
