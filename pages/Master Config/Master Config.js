/**
* Master Config Page Module (pages/Master Config/Master Config.js)
* Single Source of Truth for Master Configuration Page lifecycle and container routing.
*
* Core logic has been modularized into feature modules:
* - Dynamic Tracks: js/features/config/tracksConfig.js
* - Priority Ordering: js/features/config/priorityConfig.js
* - Master Taxonomy & Clean Slate: js/features/config/masterConfig.js
*/

(function () {
    'use strict';

    /**
     * Page Lifecycle & Manager
     */
    const MasterConfigPage = {
        isMounted: false,
        activeTab: 'chapter',

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Populate dashboard header input fields
            const tagInput = document.getElementById('edit-header-tag');
            if (tagInput && window.dashboardConfig) tagInput.value = window.dashboardConfig.topTag || '';
            const titleInput = document.getElementById('edit-header-title');
            if (titleInput && window.dashboardConfig) titleInput.value = window.dashboardConfig.mainTitle || '';
            const subInput = document.getElementById('edit-header-sub');
            if (subInput && window.dashboardConfig) subInput.value = window.dashboardConfig.subTitle || '';

            // 2. Populate track dropdowns in forms
            if (typeof window.populateTrackDropdowns === 'function') {
                window.populateTrackDropdowns();
            }

            // 3. Mount current or default active tab
            const activeSysTab = document.querySelector('[id^="sys-tab-"].bg-blue-600');
            const currentTab = activeSysTab ? activeSysTab.id.replace('sys-tab-', '') : this.activeTab || 'chapter';
            if (typeof window.switchSysTab === 'function') {
                window.switchSysTab(currentTab);
            }
        },

        destroy: function () {
            this.isMounted = false;

            // Safely close edit-track-modal if open when navigating away
            if (typeof window.closeModal === 'function') {
                const editTrackModal = document.getElementById('edit-track-modal');
                if (editTrackModal && !editTrackModal.classList.contains('hidden')) {
                    window.closeModal('edit-track-modal');
                }
            }
        }
    };

    window.MasterConfigPage = MasterConfigPage;

    // Auto-init if container exists and is visible on initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-master-config');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.MasterConfigPage.init();
        }
    }
})();
