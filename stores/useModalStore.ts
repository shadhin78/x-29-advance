/**
 * X-29 Modal Store (stores/useModalStore.ts)
 * Global modal manager foundation for dynamic dialog presentation.
 */

import { create } from 'zustand';

interface ModalStoreState {
  activeModal: string | null;
  modalData: unknown | null;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (modalId, data = null) => set({ activeModal: modalId, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null })
}));

export default useModalStore;
