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

    function initMasterConfigEventListeners() {
        if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        if (window._masterConfigEventsInitialized) return;
        window._masterConfigEventsInitialized = true;

        document.addEventListener('click', (e) => {
            // Tab switching
            const tabBtn = e.target.closest('[id^="sys-tab-"]');
            if (tabBtn) {
                const tab = tabBtn.id.replace('sys-tab-', '');
                if (typeof window.switchSysTab === 'function') window.switchSysTab(tab);
                return;
            }
            if (e.target.closest('#btn-append-new-chapter')) {
                if (typeof window.appendNewChapter === 'function') window.appendNewChapter();
                return;
            }
            if (e.target.closest('#btn-append-new-subject')) {
                if (typeof window.appendNewSubject === 'function') window.appendNewSubject();
                return;
            }
            if (e.target.closest('#btn-append-new-program')) {
                if (typeof window.appendNewProgram === 'function') window.appendNewProgram();
                return;
            }
            if (e.target.closest('#btn-execute-manage-edit')) {
                if (typeof window.executeManageEdit === 'function') window.executeManageEdit();
                return;
            }
            if (e.target.closest('#btn-request-manage-delete')) {
                if (typeof window.requestManageDelete === 'function') window.requestManageDelete();
                return;
            }
            if (e.target.closest('#btn-save-header-config')) {
                if (typeof window.saveHeaderConfigFromForm === 'function') window.saveHeaderConfigFromForm();
                return;
            }
            if (e.target.closest('#btn-reset-clean-slate')) {
                if (typeof window.resetToCleanSlate === 'function') window.resetToCleanSlate();
                return;
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.closest('#add-ch-track')) {
                if (typeof window.updateChProgDropdown === 'function') window.updateChProgDropdown();
                return;
            }
            if (e.target.closest('#add-ch-program')) {
                if (typeof window.updateChSubjDropdown === 'function') window.updateChSubjDropdown();
                return;
            }
            if (e.target.closest('#add-sub-track')) {
                if (typeof window.updateSubProgDropdown === 'function') window.updateSubProgDropdown();
                return;
            }
            if (e.target.closest('#add-sub-bulk-cb')) {
                const bulkNum = document.getElementById('add-sub-bulk-num');
                if (bulkNum) bulkNum.classList.toggle('hidden', !e.target.checked);
                return;
            }
            if (e.target.closest('#manage-type, #manage-track')) {
                if (typeof window.updateManageDropdown === 'function') window.updateManageDropdown();
                return;
            }
            if (e.target.closest('#manage-program')) {
                if (typeof window.updateManageSubjects === 'function') window.updateManageSubjects();
                return;
            }
        });
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initMasterConfigEventListeners);
        } else {
            initMasterConfigEventListeners();
        }
    }

    // Auto-init if container exists and is visible on initial load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-master-config');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.MasterConfigPage.init();
        }
    }
})();
