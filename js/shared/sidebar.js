/**
 * X-29 Module: shared/sidebar.js
 * Mobile Drawer & Sidebar Coordinator:
 * - Responsive drawer toggle (toggleMobileSidebar)
 * - Backdrop click & navigation auto-close (closeMobileSidebar)
 * - Preserves exact CSS classes ('translate-x-0', '-translate-x-full', 'opacity-0', 'pointer-events-none', 'opacity-100')
 */
(function (global) {
    'use strict';

    function toggleMobileSidebar() {
        if (typeof document === 'undefined') return;
        const sidebar = document.getElementById('sidebar-container');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) {
            const isOpen = sidebar.classList.contains('translate-x-0');
            if (isOpen) {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
                if (backdrop) {
                    backdrop.classList.add('opacity-0', 'pointer-events-none');
                    backdrop.classList.remove('opacity-100');
                }
            } else {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                if (backdrop) {
                    backdrop.classList.remove('opacity-0', 'pointer-events-none');
                    backdrop.classList.add('opacity-100');
                }
            }
        }
    }

    function closeMobileSidebar() {
        if (typeof document === 'undefined') return;
        const sidebar = document.getElementById('sidebar-container');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
        }
        if (backdrop) {
            backdrop.classList.add('opacity-0', 'pointer-events-none');
            backdrop.classList.remove('opacity-100');
        }
    }

    const Sidebar = {
        toggleMobileSidebar,
        closeMobileSidebar
    };

    global.Sidebar = Sidebar;
    global.toggleMobileSidebar = toggleMobileSidebar;
    global.closeMobileSidebar = closeMobileSidebar;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Sidebar;
    }
})(typeof window !== 'undefined' ? window : globalThis);
