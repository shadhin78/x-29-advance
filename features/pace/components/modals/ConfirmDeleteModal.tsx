'use client';

/**
 * X-29 Confirm Delete Modal (features/pace/components/modals/ConfirmDeleteModal.tsx)
 * 
 * 100% Parity with index.html lines 1345-1371 (#confirm-modal):
 * - Warning icon
 * - Title (#cm-title) & message (#cm-message)
 * - Cancel (#cm-cancel-btn) and Delete (#cm-confirm-btn) actions
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onOpenChange,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  onConfirm,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          id="cm-backdrop"
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[999999] animate-in fade-in duration-200"
        />
        <Dialog.Content
          id="cm-content"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999] bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200/50 dark:border-slate-700/50 flex flex-col text-center mx-4 focus:outline-none animate-in zoom-in-95 duration-200"
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <Dialog.Title className="text-lg font-black text-slate-900 dark:text-white" id="cm-title">
            {title}
          </Dialog.Title>
          <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 mb-6" id="cm-message">
            {message}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              id="cm-cancel-btn"
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              id="cm-confirm-btn"
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition-colors shadow-md active:scale-95"
            >
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
