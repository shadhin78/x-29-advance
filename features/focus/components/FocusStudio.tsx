'use client';

/**
 * X-29 Focus Studio (features/focus/components/FocusStudio.tsx)
 * 
 * Master Focus Studio coordinating the active Chronograph,
 * digital display, mode presets, subject tracking, session history,
 * and distraction-free fullscreen focus experience.
 * 100% visual and structural parity with legacy Focus.html and Focus.js.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useTimer } from '@/features/focus/hooks/useTimer';
import { useFullscreen } from '@/features/focus/hooks/useFullscreen';
import { getAvailableSubjectGroups } from '@/features/focus/services/focusSubjectAdapter';
import { ChronographDial } from './ChronographDial';
import { TimerDisplay } from './TimerDisplay';
import { TimerModeSelector } from './TimerModeSelector';
import { PresetButtons } from './PresetButtons';
import { AlarmRangeControls } from './AlarmRangeControls';
import { TimerControls } from './TimerControls';
import { SubjectTargetLive } from './SubjectTargetLive';
import { FocusStats } from './FocusStats';
import { SessionHistory } from './SessionHistory';

export const FocusStudio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen(containerRef);

  const {
    activeTimer,
    timerLogs,
    sessionHistoryFilter,
    subjectFocusTargets,
    elapsedMs,
    digits,
    angles,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setMode,
    setPreset,
    setAlarmConfig,
    setSelectedSubject,
    saveCurrentSession,
    addManualSession,
    deleteSession,
    setSessionHistoryFilter,
    setSubjectTarget,
    deleteSubjectTarget,
  } = useTimer();

  const subjectGroups = useMemo(() => getAvailableSubjectGroups(), []);

  const handleToggle = React.useCallback(() => {
    if (activeTimer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [activeTimer.isRunning, pauseTimer, startTimer]);

  const activeRunningElapsedSec = activeTimer.isRunning
    ? Math.floor(elapsedMs / 1000)
    : 0;

  // Toggle timer-fullscreen-active body class for hardware acceleration & scroll lock
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isFullscreen) {
        document.body.classList.add('timer-fullscreen-active');
      } else {
        document.body.classList.remove('timer-fullscreen-active');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('timer-fullscreen-active');
      }
    };
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      id="page-timer"
      className="space-y-6 md:space-y-8 animate-page-enter w-full"
    >
      {/* Primary Grid: Active Panel (Left) & Stats Panel (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Left Column: Active Focus Panel */}
        <div
          id="timer-active-panel"
          className={`xl:col-span-2 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 bg-slate-900/80 border border-slate-800/80 shadow-lg backdrop-blur-md ${
            isFullscreen ? 'timer-fullscreen dark' : ''
          }`}
        >
          {/* Fullscreen Top-Right Control Bar (Pause/Resume & Exit Fullview) */}
          <div
            id="timer-fs-actions"
            className={`${
              isFullscreen ? 'flex' : 'hidden'
            } absolute top-3 right-3 sm:top-5 sm:right-5 z-30 items-center gap-2`}
          >
            {/* Fullscreen Pause / Resume Button */}
            <button
              id="timer-fs-btn-toggle"
              type="button"
              onClick={handleToggle}
              className="px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all touch-manipulation flex items-center justify-center min-h-[40px]"
            >
              {activeTimer.isRunning ? 'PAUSE' : 'START'}
            </button>

            {/* Exit Fullscreen Button */}
            <button
              id="timer-fs-btn-exit"
              type="button"
              onClick={exitFullscreen}
              className="p-2 sm:p-2.5 bg-slate-800/90 hover:bg-slate-700/90 rounded-xl transition-all active:scale-95 text-slate-300 border border-slate-700/60 shadow-md touch-manipulation flex items-center justify-center min-h-[40px]"
              title="Exit Fullscreen"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 14h6m0 0v6m0-6L4 20m16-6h-6m0 0v6m0-6l6 6M4 10h6m0 0V4m0 6L4 4m16 6h-6m0 0V4m0 6l6-6"
                />
              </svg>
            </button>
          </div>

          <div className="relative z-10 w-full max-w-xl flex flex-col items-center gap-4 sm:gap-5">
            {/* Mode Switcher Tabs & Subject Selector Grid (Balanced Horizontal Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full items-end">
              {/* Toggle Tabs */}
              <TimerModeSelector
                currentMode={activeTimer.mode}
                onSelectMode={setMode}
              />

              {/* Subject/Program Selector + Side Fullscreen Button */}
              <div id="timer-subject-select-container" className="w-full min-w-0 max-w-full text-left flex flex-col gap-1">
                <label
                  htmlFor="timer-subject-select"
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400"
                >
                  Track Time Against:
                </label>
                <div className="flex items-center gap-2 w-full min-w-0 max-w-full">
                  <select
                    id="timer-subject-select"
                    value={activeTimer.selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500 font-bold flex-1 min-w-0 cursor-pointer shadow-sm outline-none touch-manipulation h-[46px] truncate"
                  >
                    {subjectGroups.map((group) => (
                      <optgroup key={group.program} label={group.program}>
                        {group.subjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* Fullscreen Toggle Button (Positioned right on the side of dropdown) */}
                  <button
                    id="timer-btn-fullscreen"
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-2.5 sm:p-3 bg-slate-800/90 hover:bg-slate-700/90 rounded-2xl transition-all active:scale-95 text-slate-300 border border-slate-700/60 shadow-md touch-manipulation flex items-center justify-center h-[46px] w-[46px] min-w-[46px] min-h-[46px] shrink-0"
                    title="Toggle Fullscreen"
                    aria-label="Toggle Fullscreen"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Alarm / Range Mode Controls (Visible only in alarm mode) */}
            {activeTimer.mode === 'alarm' && (
              <AlarmRangeControls
                alarmStart={activeTimer.alarmStart || ''}
                alarmEnd={activeTimer.alarmEnd || ''}
                useCurrent={activeTimer.alarmUseCurrent !== false}
                onConfigChange={setAlarmConfig}
              />
            )}

            {/* Big Chronograph Clock Display (Flat Responsive Design) */}
            <ChronographDial
              mode={activeTimer.mode}
              elapsedMs={elapsedMs}
              targetDurationSec={activeTimer.targetDuration}
              angles={angles}
            />

            {/* Digital Time & Status Display (Outside Below Clock) */}
            <TimerDisplay
              digits={digits}
              isRunning={activeTimer.isRunning}
              elapsedMs={elapsedMs}
              mode={activeTimer.mode}
              targetDurationSec={activeTimer.targetDuration}
            />

            {/* Preset Timers & Targets (Visible in Stopwatch & Timer mode) */}
            {activeTimer.mode !== 'alarm' && (
              <PresetButtons
                mode={activeTimer.mode}
                targetDurationSec={activeTimer.targetDuration}
                onSelectPreset={setPreset}
              />
            )}

            {/* Control Buttons Bar */}
            <TimerControls
              isRunning={activeTimer.isRunning}
              elapsedMs={elapsedMs}
              onToggle={handleToggle}
              onReset={resetTimer}
              onSave={saveCurrentSession}
            />
          </div>
        </div>

        {/* Right Column: Stats Panel */}
        <div className="space-y-6">
          <FocusStats
            timerLogs={timerLogs}
            activeRunningElapsedSec={activeRunningElapsedSec}
          />
        </div>
      </div>

      {/* Subject Focus Target Section */}
      <SubjectTargetLive
        subjectFocusTargets={subjectFocusTargets}
        timerLogs={timerLogs}
        activeRunningSubject={activeTimer.isRunning ? activeTimer.selectedSubject : null}
        activeRunningElapsedSec={activeRunningElapsedSec}
        onSetSubjectTarget={setSubjectTarget}
        onDeleteSubjectTarget={deleteSubjectTarget}
      />

      {/* Bottom Panel: History of Sessions */}
      <SessionHistory
        timerLogs={timerLogs}
        activeFilter={sessionHistoryFilter}
        onSelectFilter={setSessionHistoryFilter}
        onDeleteSession={deleteSession}
        onAddManualSession={addManualSession}
      />
    </div>
  );
};
