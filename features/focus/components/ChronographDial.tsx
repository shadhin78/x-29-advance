'use client';

/**
 * X-29 Chronograph Dial Component (features/focus/components/ChronographDial.tsx)
 * 
 * High-performance React SVG rendering of the X-29 Chronograph Dial.
 * - Static geometry pre-calculated outside render to guarantee 0 GC pressure
 * - Needle rotations driven by memoized SVG transforms
 * - Dynamic tick & number highlighting for targeted stopwatch and countdown timers
 * - Zero direct DOM manipulation, zero innerHTML
 */

import React, { useMemo } from 'react';
import type { TimerMode, DialAngles } from '@/types/timer';
import { calculateDialTickHighlight } from '@/features/focus/services/timerEngine';

interface ChronographDialProps {
  mode: TimerMode;
  elapsedMs: number;
  targetDurationSec: number;
  angles: DialAngles;
  className?: string;
}

// --- PRE-COMPUTED STATIC GEOMETRY (Zero per-render computation) ---
const MAIN_TICKS = Array.from({ length: 60 }, (_, i) => ({
  index: i,
  angle: i * 6,
  isMajor: i % 5 === 0,
  y2: i % 5 === 0 ? 24 : 18,
  strokeWidth: i % 5 === 0 ? 2.5 : 1.2,
}));

const MAIN_NUMBERS = Array.from({ length: 12 }, (_, i) => {
  const angleRad = (i * 30) * (Math.PI / 180);
  const nx = Number((150 + 118 * Math.sin(angleRad)).toFixed(2));
  const ny = Number((150 - 118 * Math.cos(angleRad)).toFixed(2));
  const tickIndex = i * 5;
  const text = i === 0 ? '60' : String(i * 5);
  return { tickIndex, nx, ny, text };
});

const SUBDIAL_TICKS = Array.from({ length: 30 }, (_, j) => ({
  index: j,
  angle: j * 12,
  isMajor: j % 5 === 0,
  y2: j % 5 === 0 ? 176 : 173,
  strokeWidth: j % 5 === 0 ? 1.8 : 1.0,
}));

const SUBDIAL_NUMBERS = Array.from({ length: 6 }, (_, k) => {
  const subRad = (k * 60) * (Math.PI / 180);
  const snx = Number((150 + 26 * Math.sin(subRad)).toFixed(2));
  const sny = Number((205 - 26 * Math.cos(subRad)).toFixed(2));
  const text = k === 0 ? '30' : String(k * 5);
  return { snx, sny, text };
});

export const ChronographDial: React.FC<ChronographDialProps> = React.memo(function ChronographDial({
  mode,
  elapsedMs,
  targetDurationSec,
  angles,
  className = '',
}) {
  const tickHighlight = useMemo(() => {
    return calculateDialTickHighlight(mode, elapsedMs, targetDurationSec);
  }, [mode, elapsedMs, targetDurationSec]);

  return (
    <div
      id="timer-clock-container"
      className={`relative flex items-center justify-center w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 transition-all duration-500 select-none rounded-full bg-transparent my-1 sm:my-2 ${className}`}
      role="img"
      aria-label={`Chronograph dial: ${mode} mode`}
    >
      <svg
        id="chronograph-svg"
        className="w-full h-full overflow-visible"
        viewBox="0 0 300 300"
      >
        {/* Outer subtle guide circle */}
        <circle
          cx="150"
          cy="150"
          r="142"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.05"
          strokeWidth="1"
          className="text-slate-400 dark:text-slate-600"
        />

        {/* 60 Main Dial Ticks */}
        <g id="chrono-ticks-container">
          {MAIN_TICKS.map((t) => {
            let strokeColor = t.isMajor ? 'var(--chrono-tick-major)' : 'var(--chrono-tick-minor)';
            let strokeOpacity = t.isMajor ? 0.9 : 0.6;

            if (tickHighlight.isTargeted) {
              const isHighlighted = tickHighlight.isForwardFill
                ? t.index <= tickHighlight.highlightThreshold
                : t.index >= tickHighlight.highlightThreshold;

              if (isHighlighted) {
                strokeColor = '#3b82f6'; // Electric Blue
                strokeOpacity = 1;
              } else {
                strokeOpacity = 0.2;
              }
            }

            return (
              <line
                key={t.index}
                id={`chrono-tick-${t.index}`}
                x1="150"
                y1="12"
                x2="150"
                y2={t.y2}
                stroke={strokeColor}
                strokeWidth={t.strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinecap="round"
                style={{
                  transformOrigin: '150px 150px',
                  transform: `rotate(${t.angle}deg)`,
                }}
                className="transition-colors duration-150"
              />
            );
          })}
        </g>

        {/* 12 Main Dial Radial Numbers */}
        <g id="chrono-numbers-container">
          {MAIN_NUMBERS.map((n) => {
            let fillColor = 'var(--chrono-text-number)';
            let fillOpacity = 1;

            if (tickHighlight.isTargeted) {
              const isHighlighted = tickHighlight.isForwardFill
                ? n.tickIndex <= tickHighlight.highlightThreshold
                : n.tickIndex >= tickHighlight.highlightThreshold;

              if (isHighlighted) {
                fillColor = '#3b82f6';
                fillOpacity = 1;
              } else {
                fillOpacity = 0.25;
              }
            }

            return (
              <text
                key={n.tickIndex}
                id={`chrono-num-${n.tickIndex}`}
                x={n.nx}
                y={n.ny}
                fill={fillColor}
                fillOpacity={fillOpacity}
                fontSize="13"
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                className="transition-colors duration-150"
              >
                {n.text}
              </text>
            );
          })}
        </g>

        {/* Subdial (30-Minute Accumulator at 6 o'clock: CX=150, CY=205, R=38) */}
        <g id="chrono-subdial-group">
          {/* Subdial outer ring */}
          <circle
            cx="150"
            cy="205"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="1.5"
            className="text-slate-400 dark:text-slate-600"
          />

          {/* Subdial 30 ticks */}
          <g id="chrono-subdial-ticks">
            {SUBDIAL_TICKS.map((st) => (
              <line
                key={st.index}
                x1="150"
                y1="170"
                x2="150"
                y2={st.y2}
                stroke={st.isMajor ? 'var(--chrono-subdial-tick-major)' : 'var(--chrono-subdial-tick-minor)'}
                strokeWidth={st.strokeWidth}
                strokeOpacity={st.isMajor ? 0.7 : 0.35}
                strokeLinecap="round"
                style={{
                  transformOrigin: '150px 205px',
                  transform: `rotate(${st.angle}deg)`,
                }}
              />
            ))}
          </g>

          {/* Subdial 6 numbers (30, 5, 10, 15, 20, 25) */}
          <g id="chrono-subdial-numbers">
            {SUBDIAL_NUMBERS.map((sn, idx) => (
              <text
                key={idx}
                x={sn.snx}
                y={sn.sny}
                fill="var(--chrono-subdial-text)"
                fillOpacity="0.8"
                fontSize="8"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {sn.text}
              </text>
            ))}
          </g>

          {/* Subdial Needle - Rotates smoothly at (150, 205) */}
          <line
            id="chrono-subdial-hand"
            x1="150"
            y1="205"
            x2="150"
            y2="175"
            stroke="var(--chrono-subdial-hand)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              transformOrigin: '150px 205px',
              transform: `rotate(${angles.subdialDeg}deg)`,
              transition: 'transform 0.05s linear',
            }}
          />
          <circle cx="150" cy="205" r="2.5" fill="var(--chrono-subdial-hand)" />
        </g>

        {/* Center Axle Pivot Dot */}
        <circle
          cx="150"
          cy="150"
          r="6"
          fill="var(--chrono-center-hub-outer)"
        />
        <circle
          cx="150"
          cy="150"
          r="3"
          fill="var(--chrono-center-hub-inner)"
        />

        {/* Electric Blue Sweep Hand Needle - Pivot (150, 150) -> Top (150, 22) */}
        <line
          id="chrono-main-hand"
          x1="150"
          y1="150"
          x2="150"
          y2="22"
          stroke="var(--chrono-main-hand)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transformOrigin: '150px 150px',
            transform: `rotate(${angles.mainHandDeg}deg)`,
            transition: 'transform 0.05s linear',
          }}
        />
      </svg>
    </div>
  );
});
