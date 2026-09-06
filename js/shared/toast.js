/**
 * X-29 Module: shared/toast.js
 * Toast notification UI system
 */

/**
 * Displays an animated toast message notification.
 * 
 * @param {string} msg - Message to display
 * @param {'success'|'error'|'info'|'warning'} [type='success'] - Notification style type
 */
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast-message');
    if (!t) return;
    t.textContent = msg;
    t.className = `mt-5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl px-5 py-3 text-center transition-all duration-300 w-full md:w-auto self-start border shadow-md ${
        type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
    }`;
    t.classList.remove('hidden');
    setTimeout(() => {
        if (t) t.classList.add('hidden');
    }, 4000);
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.showToast = showToast;
}
