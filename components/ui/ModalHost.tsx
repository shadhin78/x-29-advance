'use client';

import React from 'react';
import { useModalStore } from '@/stores/useModalStore';

export const ModalHost: React.FC = () => {
  const { activeModal, closeModal } = useModalStore();

  if (!activeModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={closeModal}
    >
      <div
        className="glass-card max-w-lg w-full p-6 rounded-3xl border border-slate-800 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl"
          aria-label="Close modal"
        >
          ✕
        </button>
        <div className="mt-2 text-slate-200">
          <p className="text-xs uppercase font-black tracking-widest text-slate-400 mb-2">Modal</p>
          <p className="text-sm font-semibold">Active Modal ID: {activeModal}</p>
        </div>
      </div>
    </div>
  );
};

export default ModalHost;
