/**
 * X-29 Module: shared/deletion.js
 * Universal confirmation modal & item deletion execution helpers.
 */

(function () {
    'use strict';

    const _root = (typeof window !== 'undefined') ? window : ((typeof global !== 'undefined') ? global : globalThis);

    let _pendingDeleteAction = null;

/**
 * Returns the currently pending deletion callback action.
 */
function getPendingDeleteAction() {
    return _pendingDeleteAction;
}

/**
 * Sets the currently pending deletion callback action.
 */
function setPendingDeleteAction(fn) {
    _pendingDeleteAction = fn;
    if (typeof window !== 'undefined') {
        window.pendingDeleteAction = fn;
    }
}

/**
 * Opens the universal confirmation modal with custom title, message, and callback.
 * 
 * @param {string} title - Modal heading
 * @param {string} message - Warning message or confirmation question
 * @param {Function} actionCallback - Callback to execute if user confirms
 */
function openConfirmModal(title, message, actionCallback) {
    const titleEl = document.getElementById('cm-title');
    const msgEl = document.getElementById('cm-message');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    setPendingDeleteAction(actionCallback);

    const modal = document.getElementById('confirm-modal');
    const backdrop = document.getElementById('cm-backdrop');
    const content = document.getElementById('cm-content');
    if (!modal || !backdrop || !content) return;

    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    modal.style.zIndex = '9999999';
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    backdrop.classList.remove('opacity-0');
    backdrop.classList.add('opacity-100');
    content.classList.remove('scale-95', 'opacity-0', 'translate-y-4');
    content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
    document.body.classList.add('overflow-hidden');
}

/**
 * Closes the confirmation modal and resets pending action.
 */
function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    const backdrop = document.getElementById('cm-backdrop');
    const content = document.getElementById('cm-content');
    if (!modal || !backdrop || !content) return;

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    content.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
    content.classList.add('scale-95', 'opacity-0', 'translate-y-4');

    setTimeout(() => {
        if (modal) modal.classList.add('hidden');
        setPendingDeleteAction(null);
        document.body.classList.remove('overflow-hidden');
    }, 300);
}

/**
 * Executes the stored pending deletion callback and closes the modal.
 */
function executeConfirmedDelete() {
    const callback = getPendingDeleteAction() || (typeof window !== 'undefined' ? window.pendingDeleteAction : null);
    if (typeof callback === 'function') {
        callback();
    }
    closeConfirmModal();
}
function closeTimerWarningModal() {
    const modal = document.getElementById('timer-warning-modal');
    const backdrop = document.getElementById('tw-backdrop');
    const content = document.getElementById('tw-content');
    if (!modal) return;

    if (backdrop) {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
    }
    if (content) {
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
        content.classList.add('scale-95', 'opacity-0', 'translate-y-4');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.remove('overflow-hidden');
        }
    }, 300);
}

function initDeletionEventListeners() {
    if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    if (_root._deletionListenersInitialized) return;
    _root._deletionListenersInitialized = true;

    document.addEventListener('click', (e) => {
        if (e.target.closest('#cm-backdrop, #cm-cancel-btn, [data-confirm-cancel]')) {
            closeConfirmModal();
            return;
        }
        if (e.target.closest('#cm-confirm-btn, [data-confirm-delete]')) {
            executeConfirmedDelete();
            return;
        }
        if (e.target.closest('#tw-backdrop, #tw-confirm-btn, [data-warning-close]')) {
            closeTimerWarningModal();
            return;
        }
    });
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDeletionEventListeners);
    } else {
        initDeletionEventListeners();
    }
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.pendingDeleteAction = null;
    window.openConfirmModal = openConfirmModal;
    window.closeConfirmModal = closeConfirmModal;
    window.closeTimerWarningModal = closeTimerWarningModal;
    window.executeConfirmedDelete = executeConfirmedDelete;
    window.initDeletionEventListeners = initDeletionEventListeners;
}
if (typeof global !== 'undefined') {
    global.openConfirmModal = openConfirmModal;
    global.closeConfirmModal = closeConfirmModal;
    global.closeTimerWarningModal = closeTimerWarningModal;
    global.executeConfirmedDelete = executeConfirmedDelete;
    global.initDeletionEventListeners = initDeletionEventListeners;
}

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            getPendingDeleteAction,
            setPendingDeleteAction,
            openConfirmModal,
            closeConfirmModal,
            closeTimerWarningModal,
            executeConfirmedDelete,
            initDeletionEventListeners
        };
    }
})();

