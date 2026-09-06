/**
 * X-29 Module: shared/deletion.js
 * Universal confirmation modal & item deletion execution helpers.
 */

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

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.pendingDeleteAction = null;
    window.openConfirmModal = openConfirmModal;
    window.closeConfirmModal = closeConfirmModal;
    window.executeConfirmedDelete = executeConfirmedDelete;
}
