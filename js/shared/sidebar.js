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

    function initSidebarEventListeners() {
        if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        if (global._sidebarListenersInitialized) return;
        global._sidebarListenersInitialized = true;

        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobile-sidebar-toggle, [data-sidebar-toggle]')) {
                toggleMobileSidebar();
                return;
            }
            if (e.target.closest('#sidebar-backdrop, #sidebar-close-btn, [data-sidebar-close]')) {
                closeMobileSidebar();
                return;
            }
            // Auto close mobile drawer when selecting navigation item inside sidebar
            const navItem = e.target.closest('#sidebar-container [data-switch-page], #sidebar-container nav button, #sidebar-container nav a');
            if (navItem && typeof window !== 'undefined' && window.innerWidth < 768) {
                closeMobileSidebar();
            }
        });
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSidebarEventListeners);
        } else {
            initSidebarEventListeners();
        }
    }

    const Sidebar = {
        toggleMobileSidebar,
        closeMobileSidebar,
        initSidebarEventListeners
    };

    global.Sidebar = Sidebar;
    global.toggleMobileSidebar = toggleMobileSidebar;
    global.closeMobileSidebar = closeMobileSidebar;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Sidebar;
    }
})(typeof window !== 'undefined' ? window : globalThis);
