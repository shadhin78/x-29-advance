'use client';

/**
 * X-29 Congratulations & Celebration Modal (features/outcome/components/CongratsModal.tsx)
 * 
 * 2-Page Milestone Celebration Dialog:
 * - Page 1: Greeting & Trophy with Final Success Score status
 * - Page 2: Summary of achievements and completed program scorecards
 * - Full-screen canvas confetti animation
 * 
 * Accessible Radix Dialog implementation preserving authentic legacy visual identity.
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { fireConfetti } from '@/features/outcome/utils/confetti';
import type { SuccessResult } from '@/types/outcome';

interface CongratsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  successResults: SuccessResult[];
  successScore?: number;
}

export const CongratsModal: React.FC<CongratsModalProps> = ({
  open,
  onOpenChange,
  successResults,
  successScore = 100,
}) => {
  const [page, setPage] = useState<1 | 2>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (open) {
      setPage(1);
      // Fire initial celebration burst
      const t = setTimeout(() => {
        if (canvasRef.current) {
          fireConfetti(canvasRef.current);
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleCelebrateAndClose = () => {
    if (canvasRef.current) {
      fireConfetti(canvasRef.current);
    }
    setTimeout(() => {
      onOpenChange(false);
    }, 1200);
  };

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] animate-in fade-in duration-300" />
        
        {/* Full-screen Confetti Canvas */}
        <canvas
          ref={canvasRef}
          id="confetti-canvas"
          className="fixed inset-0 z-[101] pointer-events-none w-full h-full"
        />

        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[102] w-full max-w-xl p-6 sm:p-10 md:p-12 bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.4)] border border-emerald-500/30 text-center focus:outline-none animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {page === 1 ? (
            /* PAGE 1: Greeting */
            <div id="congrats-page-1" className="transition-all duration-300">
              <div className="text-6xl md:text-7xl mb-4 drop-shadow-md animate-bounce select-none">
                🏆
              </div>
              <Dialog.Title className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 mb-4 tracking-tight leading-tight">
                X-29 Complete!
              </Dialog.Title>
              <Dialog.Description className="text-slate-600 dark:text-slate-300 font-bold mb-6 text-sm md:text-base leading-relaxed">
                What an incredible journey. You&apos;ve shown unmatched dedication and perseverance
                from <span className="text-emerald-600 dark:text-emerald-400 font-black">20 Nov 2025</span> to{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-black" id="congrats-end-date">
                  {todayStr}
                </span>
                . Every chapter, every revision, and every pace goal has successfully led to this
                triumphant moment.
              </Dialog.Description>

              <div className="inline-block bg-emerald-50 dark:bg-emerald-900/20 px-8 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 mb-8 shadow-sm">
                <span className="block text-[10px] md:text-xs uppercase font-black text-emerald-600/70 dark:text-emerald-400/70 tracking-widest mb-1.5">
                  Final Status
                </span>
                <span
                  id="congrats-status-badge"
                  className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400"
                >
                  {successScore}% Success Score
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPage(2)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-[11px] md:text-sm uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                View Summary
              </button>
            </div>
          ) : (
            /* PAGE 2: Summary of Success & Results */
            <div
              id="congrats-page-2"
              className="transition-all duration-300 flex flex-col h-full max-h-[65vh]"
            >
              <Dialog.Title className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400 mb-2 tracking-tight leading-tight">
                Your Achievements
              </Dialog.Title>
              <Dialog.Description className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-5 border-b border-slate-200 dark:border-slate-700 pb-3">
                The fruits of your labor
              </Dialog.Description>

              <div
                id="congrats-summary-list"
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 mb-6 text-left pr-2"
              >
                {successResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <span className="text-4xl block mb-3 opacity-50 grayscale">🌟</span>
                    <p className="text-xs font-black uppercase tracking-widest">
                      You conquered the syllabus!
                    </p>
                    <p className="text-[10px] mt-1 font-bold">
                      No explicit achievements logged yet.
                    </p>
                  </div>
                ) : (
                  successResults.map((res) => {
                    const isCgpa = res.type === 'cgpa';
                    let badgeBg = 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50';
                    let badgeText = 'Achievement';
                    let icon = '🌟';
                    let displayTitle = res.title;

                    if (isCgpa) {
                      if (res.subject) {
                        badgeBg = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
                        badgeText = 'Subject CGPA';
                        icon = '📝';
                        displayTitle = `${res.title} - ${res.subject}`;
                      } else {
                        badgeBg = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
                        badgeText = 'Program CGPA';
                        icon = '🎓';
                      }
                    }

                    const dateStr = res.date
                      ? new Date(res.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '';

                    return (
                      <div
                        key={res.id}
                        className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                          <div className="text-2xl sm:text-3xl drop-shadow-sm shrink-0 select-none">
                            {icon}
                          </div>
                          <div className="flex flex-col truncate pr-2">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border inline-block w-fit mb-0.5 ${badgeBg}`}
                            >
                              {badgeText}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                              {displayTitle}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                            {res.value ? `CGPA: ${res.value}` : res.grade ? `Grade: ${res.grade}` : 'PASS'}
                          </div>
                          {dateStr && (
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              {dateStr}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-3 shrink-0 mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  className="w-1/3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] md:text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 border border-slate-200 dark:border-slate-600 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCelebrateAndClose}
                  className="w-2/3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Celebrate & Continue
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
