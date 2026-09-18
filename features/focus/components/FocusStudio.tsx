'use client';

/**
 * X-29 Focus Studio (features/focus/components/FocusStudio.tsx)
 * 
 * Master Focus Studio coordinating the active Chronograph,
 * digital display, mode presets, subject tracking, session history,
 * and distraction-free fullscreen focus experience.
 */

import React, { useRef } from 'react';
import { useTimer } from '@/features/focus/hooks/useTimer';
import { useFullscreen } from '@/features/focus/hooks/useFullscreen';
import { ChronographDial } from './ChronographDial';
import { TimerDisplay } from './TimerDisplay';
import { TimerModeSelector } from './TimerModeSelector';
import { PresetButtons } from './PresetButtons';
import { AlarmRangeControls } from './AlarmRangeControls';
import { TimerControls } from './TimerControls';
import { SubjectTargetLive } from './SubjectTargetLive';
import { FocusStats } from './FocusStats';
import { SessionHistory } from './SessionHistory';
import { Play, Pause, Minimize2 } from 'lucide-react';

export const FocusStudio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen(containerRef);

  const {
    activeTimer,
    timerLogs,
    dailyFocusHoursTarget,
    sessionHistoryFilter,
    subjectFocusTargets,
    isInitialized,
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
    setDailyFocusHoursTarget,
    setSubjectTarget,
    deleteSubjectTarget,
  } = useTimer();

  const handleToggle = () => {
    if (activeTimer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const activeRunningElapsedSec = activeTimer.isRunning
    ? Math.floor(elapsedMs / 1000)
    : 0;

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-7xl mx-auto space-y-6 md:space-y-8 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-4 sm:p-8 flex flex-col justify-center items-center overflow-y-auto'
          : ''
      }`}
    >
      {/* Primary Grid: Active Panel (Left) & Stats Panel (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">
        {/* Left Column: Active Focus Panel */}
        <div
          id="timer-active-panel"
          className="xl:col-span-2 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 bg-slate-900/90 border border-slate-800/80 shadow-xl backdrop-blur-md w-full"
        >
          {/* Fullscreen Quick Actions Bar (Visible in Fullscreen Mode) */}
          {isFullscreen && (
            <div
              id="timer-fs-actions"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2"
            >
              <button
                id="timer-fs-btn-toggle"
                type="button"
                onClick={handleToggle}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 ${
                  activeTimer.isRunning
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all touch-manipulation flex items-center justify-center gap-1.5 min-h-[40px]`}
              >
                {activeTimer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{activeTimer.isRunning ? 'PAUSE' : 'START'}</span>
              </button>

              <button
                id="timer-fs-btn-exit"
                type="button"
                onClick={exitFullscreen}
                className="p-2 sm:p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all active:scale-95 text-slate-300 border border-slate-700/60 shadow-md touch-manipulation flex items-center justify-center min-h-[40px]"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          <div className="relative z-10 w-full max-w-xl flex flex-col items-center gap-4 sm:gap-5">
            {/* Mode Switcher Tabs */}
            <div className="w-full">
              <TimerModeSelector
                currentMode={activeTimer.mode}
                onSelectMode={setMode}
              />
            </div>

            {/* Subject Dropdown (inside active panel for easy switching) */}
            <div className="w-full text-left">
              <label
                htmlFor="panel-subject-select"
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1"
              >
                Focus Subject:
              </label>
              <select
                id="panel-subject-select"
                value={activeTimer.selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500 font-bold w-full cursor-pointer shadow-sm outline-none"
              >
                <option value="General Study">General Study</option>
                <option value="Revision">Revision</option>
                <option value="Problem Solving">Problem Solving</option>
                <option value="Mock Exam">Mock Exam</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>

            {/* Alarm Range Controls (Visible only in Alarm Mode) */}
            {activeTimer.mode === 'alarm' && (
              <AlarmRangeControls
                alarmStart={activeTimer.alarmStart || ''}
                alarmEnd={activeTimer.alarmEnd || ''}
                useCurrent={activeTimer.alarmUseCurrent !== false}
                onConfigChange={setAlarmConfig}
              />
            )}

            {/* Big Chronograph Clock Dial (Pure React SVG) */}
            <ChronographDial
              mode={activeTimer.mode}
              elapsedMs={elapsedMs}
              targetDurationSec={activeTimer.targetDuration}
              angles={angles}
            />

            {/* Digital Monospace Time & Status Badge */}
            <TimerDisplay
              digits={digits}
              isRunning={activeTimer.isRunning}
              elapsedMs={elapsedMs}
              mode={activeTimer.mode}
              targetDurationSec={activeTimer.targetDuration}
            />

            {/* Preset Buttons (Visible in Stopwatch & Timer mode) */}
            {activeTimer.mode !== 'alarm' && (
              <PresetButtons
                mode={activeTimer.mode}
                targetDurationSec={activeTimer.targetDuration}
                onSelectPreset={setPreset}
              />
            )}

            {/* Controls Bar: Reset, Start/Pause/Resume, Save */}
            <TimerControls
              isRunning={activeTimer.isRunning}
              elapsedMs={elapsedMs}
              onToggle={handleToggle}
              onReset={resetTimer}
              onSave={saveCurrentSession}
            />
          </div>
        </div>

        {/* Right Column: Stats Panel (Hidden in distraction-free fullscreen) */}
        {!isFullscreen && (
          <div className="space-y-6">
            <FocusStats
              timerLogs={timerLogs}
              activeRunningElapsedSec={activeRunningElapsedSec}
              dailyFocusHoursTarget={dailyFocusHoursTarget}
              onSetDailyTarget={setDailyFocusHoursTarget}
            />
          </div>
        )}
      </div>

      {/* Full-width Lower Panels (Hidden in distraction-free fullscreen) */}
      {!isFullscreen && (
        <>
          {/* Subject Focus Target Tracker */}
          <SubjectTargetLive
            selectedSubject={activeTimer.selectedSubject}
            onSelectSubject={setSelectedSubject}
            subjectFocusTargets={subjectFocusTargets}
            timerLogs={timerLogs}
            activeRunningSubject={activeTimer.isRunning ? activeTimer.selectedSubject : null}
            activeRunningElapsedSec={activeRunningElapsedSec}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onSetSubjectTarget={setSubjectTarget}
            onDeleteSubjectTarget={deleteSubjectTarget}
          />

          {/* Session History */}
          <SessionHistory
            timerLogs={timerLogs}
            activeFilter={sessionHistoryFilter}
            onSelectFilter={setSessionHistoryFilter}
            onDeleteSession={deleteSession}
            onAddManualSession={addManualSession}
          />
        </>
      )}
    </div>
  );
};
