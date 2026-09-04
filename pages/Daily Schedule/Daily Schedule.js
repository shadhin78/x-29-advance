/**
 * Daily Schedule Page Module (pages/Daily Schedule/Daily Schedule.js)
 * Canonical single source of truth for Daily Schedule page logic, routine switcher,
 * schedule block management, group organization, and lifecycle management.
 */

(function () {
    'use strict';

    // Page-specific state variables
    window.selectedScheduleColor = window.selectedScheduleColor || '#6366f1';
    window.editingScheduleBlockId = null;
    window.editingScheduleGroupId = null;
    window.editingScheduleSet = 1;
    if (!window.scheduleGroups) window.scheduleGroups = [];

    /**
     * Toggles between Routine 1 and Routine 2 sets.
     */
    window.switchRoutineSet = function (direction) {
        window.activeRoutineSet = window.activeRoutineSet === 1 ? 2 : 1;
        const badge = document.getElementById('active-routine-badge');
        if (badge) {
            badge.textContent = `Routine ${window.activeRoutineSet}`;
        }
        if (window.renderSchedulePage) {
            window.renderSchedulePage();
        }
    };

    /**
     * Color selection handler for modal block creator
     */
    window.selectScheduleColor = function (color, btnEl) {
        window.selectedScheduleColor = color;
        const picker = document.getElementById('schedule-color-picker');
        if (picker) {
            picker.querySelectorAll('button').forEach(btn => {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500');
            });
        }
        if (btnEl) {
            btnEl.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
        }
    };

    /**
     * Cascading track to program dropdown updater in add/edit slot modal
     */
    window.onScheduleTrackChange = function (selectedProgram) {
        const trackSelect = document.getElementById('schedule-input-track');
        const programSelect = document.getElementById('schedule-input-program');
        if (!trackSelect || !programSelect) return;

        const selectedTrackId = trackSelect.value;
        let programHtml = '<option value="">None (Optional)</option>';

        if (selectedTrackId) {
            const programs = window.customPrograms ? (window.customPrograms[selectedTrackId] || []) : [];
            programs.forEach(p => {
                const pName = (typeof p === 'string') ? p : (p.name || '');
                if (pName) programHtml += `<option value="${pName}">${pName}</option>`;
            });
        }
        programSelect.innerHTML = programHtml;
        if (selectedProgram) {
            programSelect.value = selectedProgram;
        } else {
            programSelect.value = '';
        }
    };

    /**
     * Opens Add Schedule Block Modal initialized for active routine set
     */
    window.openAddScheduleModal = function () {
        window.editingScheduleBlockId = null;
        const currentSet = window.activeRoutineSet || 1;
        window.editingScheduleSet = currentSet;

        const startInput = document.getElementById('schedule-input-start');
        if (startInput) startInput.value = '09:00';

        const endInput = document.getElementById('schedule-input-end');
        if (endInput) endInput.value = '10:00';

        const taskInput = document.getElementById('schedule-input-task');
        if (taskInput) taskInput.value = '';

        const trackSelect = document.getElementById('schedule-input-track');
        const programSelect = document.getElementById('schedule-input-program');
        if (trackSelect) {
            let trackHtml = '<option value="">None (Optional)</option>';
            (window.tracks || []).forEach(t => {
                trackHtml += `<option value="${t.id}">${t.name}</option>`;
            });
            trackSelect.innerHTML = trackHtml;
            trackSelect.value = '';
        }
        if (programSelect) {
            programSelect.innerHTML = '<option value="">None (Optional)</option>';
            programSelect.value = '';
        }

        const defaultColor = currentSet === 2 ? '#8b5cf6' : '#6366f1';
        const pickerBtn = document.querySelector(`#schedule-color-picker button[data-color="${defaultColor}"]`) || document.querySelector('#schedule-color-picker button');
        window.selectScheduleColor(defaultColor, pickerBtn);

        const dayStartCb = document.getElementById('schedule-input-daystart');
        if (dayStartCb) dayStartCb.checked = false;

        const titleEl = document.querySelector('#add-schedule-modal h2');
        if (titleEl) titleEl.textContent = currentSet === 2 ? 'Add Routine 2 Slot' : 'Add Daily Slot';
        const descEl = document.querySelector('#add-schedule-modal p');
        if (descEl) descEl.textContent = currentSet === 2 ? 'Add a slot to your second routine set' : 'Plan your daily schedule slot';
        const submitBtn = document.querySelector('#add-schedule-modal button[onclick="window.submitAddScheduleBlock()"]');
        if (submitBtn) submitBtn.textContent = 'Add Slot';

        openModal('add-schedule-modal');
    };

    /**
     * Opens Edit Schedule Modal populated with targeted block data
     */
    window.openEditScheduleModal = function (blockId) {
        const currentSet = window.activeRoutineSet || 1;
        window.editingScheduleSet = currentSet;
        const blocks = (currentSet === 2) ? (window.scheduleBlocks2 || []) : (window.scheduleBlocks || []);
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        window.editingScheduleBlockId = blockId;

        const startInput = document.getElementById('schedule-input-start');
        if (startInput) startInput.value = block.startTime || '09:00';

        const endInput = document.getElementById('schedule-input-end');
        if (endInput) endInput.value = block.endTime || '10:00';

        const taskInput = document.getElementById('schedule-input-task');
        if (taskInput) taskInput.value = block.task || '';

        const trackSelect = document.getElementById('schedule-input-track');
        if (trackSelect) {
            let trackHtml = '<option value="">None (Optional)</option>';
            (window.tracks || []).forEach(t => {
                trackHtml += `<option value="${t.id}">${t.name}</option>`;
            });
            trackSelect.innerHTML = trackHtml;
            trackSelect.value = block.track || '';
        }

        window.onScheduleTrackChange(block.program || '');

        const color = block.color || (currentSet === 2 ? '#8b5cf6' : '#6366f1');
        const pickerBtn = document.querySelector(`#schedule-color-picker button[data-color="${color}"]`) || document.querySelector('#schedule-color-picker button');
        window.selectScheduleColor(color, pickerBtn);

        const dayStartCb = document.getElementById('schedule-input-daystart');
        if (dayStartCb) dayStartCb.checked = !!block.isDayStart;

        const titleEl = document.querySelector('#add-schedule-modal h2');
        if (titleEl) titleEl.textContent = currentSet === 2 ? 'Edit Routine 2 Slot' : 'Edit Daily Slot';
        const descEl = document.querySelector('#add-schedule-modal p');
        if (descEl) descEl.textContent = currentSet === 2 ? 'Update your second routine set slot' : 'Update your daily schedule slot';
        const submitBtn = document.querySelector('#add-schedule-modal button[onclick="window.submitAddScheduleBlock()"]');
        if (submitBtn) submitBtn.textContent = 'Save Changes';

        openModal('add-schedule-modal');
    };

    /**
     * Deletes a schedule slot from the active routine set
     */
    window.deleteScheduleBlock = function (blockId) {
        const currentSet = window.activeRoutineSet || 1;
        const title = currentSet === 2 ? "Delete Routine 2 Slot" : "Delete Routine Slot";
        const text = currentSet === 2 ? "Are you sure you want to delete this routine slot from Routine 2?" : "Are you sure you want to delete this routine slot?";
        window.openConfirmModal(title, text, () => {
            if (typeof window.recordItemDeletion === 'function') {
                window.recordItemDeletion(blockId);
            }
            if (currentSet === 2) {
                if (window.scheduleBlocks2) {
                    window.scheduleBlocks2 = window.scheduleBlocks2.filter(b => b.id !== blockId);
                    FirebaseService.saveToCloud(true);
                    renderUI();
                    showToast("Routine 2 slot deleted.", "success");
                }
            } else {
                if (window.scheduleBlocks) {
                    window.scheduleBlocks = window.scheduleBlocks.filter(b => b.id !== blockId);
                    FirebaseService.saveToCloud(true);
                    renderUI();
                    showToast("Routine slot deleted.", "success");
                }
            }
        });
    };

    /**
     * Validates and submits add/edit schedule slot form
     */
    window.submitAddScheduleBlock = function () {
        const startInput = document.getElementById('schedule-input-start');
        const endInput = document.getElementById('schedule-input-end');
        const taskInput = document.getElementById('schedule-input-task');
        const trackSelect = document.getElementById('schedule-input-track');
        const programSelect = document.getElementById('schedule-input-program');
        const dayStartCb = document.getElementById('schedule-input-daystart');

        if (!startInput || !endInput || !taskInput) return;

        const startTime = startInput.value;
        const endTime = endInput.value;
        const task = taskInput.value.trim();
        const track = trackSelect ? trackSelect.value : '';
        const program = programSelect ? programSelect.value : '';
        const isDayStart = dayStartCb ? dayStartCb.checked : false;

        if (!startTime || !endTime) {
            showToast("Please fill in start and end times.", "error");
            return;
        }
        if (!task) {
            showToast("Please enter a work name.", "error");
            return;
        }
        if (startTime >= endTime) {
            showToast("Start time must be before end time.", "error");
            return;
        }

        const currentSet = window.editingScheduleSet || window.activeRoutineSet || 1;
        if (currentSet === 2) {
            if (!window.scheduleBlocks2) window.scheduleBlocks2 = [];
            if (isDayStart) {
                window.scheduleBlocks2.forEach(b => { b.isDayStart = false; });
            }
            if (window.editingScheduleBlockId) {
                const block = window.scheduleBlocks2.find(b => b.id === window.editingScheduleBlockId);
                if (block) {
                    block.day = 'Daily';
                    block.startTime = startTime;
                    block.endTime = endTime;
                    block.task = task;
                    block.track = track;
                    block.program = program;
                    block.color = window.selectedScheduleColor;
                    block.isDayStart = isDayStart;
                }
                window.editingScheduleBlockId = null;
                showToast("Routine 2 slot updated successfully.", "success");
            } else {
                const newBlock = {
                    id: 'schedule-block-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                    day: 'Daily',
                    startTime: startTime,
                    endTime: endTime,
                    task: task,
                    track: track,
                    program: program,
                    color: window.selectedScheduleColor,
                    isDayStart: isDayStart
                };
                window.scheduleBlocks2.push(newBlock);
                showToast("Routine 2 slot added successfully.", "success");
            }
        } else {
            if (!window.scheduleBlocks) window.scheduleBlocks = [];
            if (isDayStart) {
                window.scheduleBlocks.forEach(b => { b.isDayStart = false; });
            }
            if (window.editingScheduleBlockId) {
                const block = window.scheduleBlocks.find(b => b.id === window.editingScheduleBlockId);
                if (block) {
                    block.day = 'Daily';
                    block.startTime = startTime;
                    block.endTime = endTime;
                    block.task = task;
                    block.track = track;
                    block.program = program;
                    block.color = window.selectedScheduleColor;
                    block.isDayStart = isDayStart;
                }
                window.editingScheduleBlockId = null;
                showToast("Routine slot updated successfully.", "success");
            } else {
                const newBlock = {
                    id: 'schedule-block-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                    day: 'Daily',
                    startTime: startTime,
                    endTime: endTime,
                    task: task,
                    track: track,
                    program: program,
                    color: window.selectedScheduleColor,
                    isDayStart: isDayStart
                };
                window.scheduleBlocks.push(newBlock);
                showToast("Schedule slot added successfully.", "success");
            }
        }

        FirebaseService.saveToCloud(true);
        closeModal('add-schedule-modal');
        renderUI();
    };

    /**
     * Deprecated helper retained for backward compatibility
     */
    window.openAddScheduleModal2 = function () {
        window.editingScheduleBlockId = null;
        window.editingScheduleSet = 2;

        const startInput = document.getElementById('schedule-input-start');
        if (startInput) startInput.value = '18:00';
        const endInput = document.getElementById('schedule-input-end');
        if (endInput) endInput.value = '19:00';
        const taskInput = document.getElementById('schedule-input-task');
        if (taskInput) taskInput.value = '';

        const trackSelect = document.getElementById('schedule-input-track');
        const programSelect = document.getElementById('schedule-input-program');
        if (trackSelect) {
            let trackHtml = '<option value="">None (Optional)</option>';
            (window.tracks || []).forEach(t => {
                trackHtml += `<option value="${t.id}">${t.name}</option>`;
            });
            trackSelect.innerHTML = trackHtml;
            trackSelect.value = '';
        }
        if (programSelect) {
            programSelect.innerHTML = '<option value="">None (Optional)</option>';
            programSelect.value = '';
        }

        window.selectScheduleColor('#8b5cf6', document.querySelector('#schedule-color-picker button[data-color="#8b5cf6"]') || document.querySelector('#schedule-color-picker button[data-color="#6366f1"]'));

        const dayStartCb = document.getElementById('schedule-input-daystart');
        if (dayStartCb) dayStartCb.checked = false;

        const titleEl = document.querySelector('#add-schedule-modal h2');
        if (titleEl) titleEl.textContent = 'Add Routine 2 Slot';
        const descEl = document.querySelector('#add-schedule-modal p');
        if (descEl) descEl.textContent = 'Add a slot to your second routine set';
        const submitBtn = document.querySelector('#add-schedule-modal button[onclick="window.submitAddScheduleBlock()"]');
        if (submitBtn) submitBtn.textContent = 'Add Slot';

        openModal('add-schedule-modal');
    };

    /**
     * Opens Create/Edit Work Group Modal
     */
    window.openCreateScheduleGroup = function (groupId) {
        window.editingScheduleGroupId = groupId || null;

        const titleEl = document.getElementById('csgm-title');
        const submitBtn = document.getElementById('csgm-submit-btn');
        const nameInput = document.getElementById('group-input-name');

        let currentGroup = null;
        if (groupId && window.scheduleGroups) {
            currentGroup = window.scheduleGroups.find(g => g.id === groupId);
        }

        if (titleEl) {
            titleEl.textContent = currentGroup ? 'Edit Work Group' : 'Create Work Group';
        }
        if (submitBtn) {
            submitBtn.textContent = currentGroup ? 'Save Changes' : 'Create Group';
        }
        if (nameInput) {
            nameInput.value = currentGroup ? currentGroup.name : '';
        }

        const listEl = document.getElementById('group-modal-ungrouped-list');
        if (listEl) {
            const workTotals = {};
            const blocks = window.scheduleBlocks || [];

            blocks.forEach(b => {
                const name = b.task || 'Untitled Work';
                const startMin = Utils.timeToMinutes(b.startTime);
                const endMin = Utils.timeToMinutes(b.endTime);
                const hours = (endMin - startMin) / 60;
                if (hours > 0) {
                    workTotals[name] = (workTotals[name] || 0) + hours;
                }
            });

            const uniqueNames = Object.keys(workTotals);

            // Show items that are not in any group OR are already in the group we are editing
            const availableNames = uniqueNames.filter(name => {
                const g = window.getGroupForWork(name);
                return g === null || (currentGroup && g.id === currentGroup.id);
            });

            if (availableNames.length === 0) {
                listEl.innerHTML = `<p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider py-2">No work items available to group.</p>`;
            } else {
                listEl.innerHTML = availableNames.map(name => {
                    const isChecked = currentGroup && (currentGroup.items || []).includes(name);
                    return `
                        <label class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all select-none w-full">
                            <input type="checkbox" name="group-work-item" value="${name.replace(/"/g, '&quot;')}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${name}</span>
                        </label>
                    `;
                }).join('');
            }
        }
        openModal('create-schedule-group-modal');
    };

    /**
     * Submits create or edit schedule group
     */
    window.submitCreateScheduleGroup = function () {
        const nameInput = document.getElementById('group-input-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        if (!name) {
            showToast('Please enter a group name.', 'error');
            return;
        }
        if (!window.scheduleGroups) window.scheduleGroups = [];

        const checkboxes = document.querySelectorAll('input[name="group-work-item"]:checked');
        const items = Array.from(checkboxes).map(cb => cb.value);

        if (window.editingScheduleGroupId) {
            // Editing mode
            const grp = window.scheduleGroups.find(g => g.id === window.editingScheduleGroupId);
            if (!grp) return;

            // Name check excluding itself
            if (window.scheduleGroups.some(g => g.id !== window.editingScheduleGroupId && g.name.toLowerCase() === name.toLowerCase())) {
                showToast('Another group with that name already exists.', 'error');
                return;
            }

            grp.name = name;
            grp.items = items;
            window.editingScheduleGroupId = null;
            showToast(`Group "${name}" updated.`, 'success');
        } else {
            // Creation mode
            if (window.scheduleGroups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
                showToast('A group with that name already exists.', 'error');
                return;
            }
            const colors = ['#6366f1', '#10b981', '#f97316', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#64748b'];
            window.scheduleGroups.push({
                id: 'sgrp-' + Date.now(),
                name: name,
                color: colors[window.scheduleGroups.length % colors.length],
                items: items
            });
            showToast(`Group "${name}" created with ${items.length} items.`, 'success');
        }

        FirebaseService.saveToCloud(true);
        closeModal('create-schedule-group-modal');
        if (window.renderSchedulePage) window.renderSchedulePage();
    };

    /**
     * Deletes a schedule group
     */
    window.deleteScheduleGroup = function (groupId) {
        window.openConfirmModal('Delete Group', 'Remove this group? Items will become ungrouped.', () => {
            if (!window.scheduleGroups) return;
            if (typeof window.recordItemDeletion === 'function') {
                window.recordItemDeletion(groupId);
            }
            window.scheduleGroups = window.scheduleGroups.filter(g => g.id !== groupId);
            FirebaseService.saveToCloud(true);
            if (window.renderSchedulePage) window.renderSchedulePage();
            showToast('Group deleted.', 'success');
        });
    };

    /**
     * Assigns a work item to a schedule group
     */
    window.assignSlotToGroup = function (workName, groupId) {
        if (!window.scheduleGroups) return;
        // Remove from all groups first
        window.scheduleGroups.forEach(g => {
            g.items = (g.items || []).filter(n => n !== workName);
        });
        // Add to target group
        const grp = window.scheduleGroups.find(g => g.id === groupId);
        if (grp) {
            if (!grp.items) grp.items = [];
            grp.items.push(workName);
        }
        FirebaseService.saveToCloud(true);
        if (window.renderSchedulePage) window.renderSchedulePage();
    };

    /**
     * Removes a work item from all groups
     */
    window.removeSlotFromGroup = function (workName) {
        if (!window.scheduleGroups) return;
        window.scheduleGroups.forEach(g => {
            g.items = (g.items || []).filter(n => n !== workName);
        });
        FirebaseService.saveToCloud(true);
        if (window.renderSchedulePage) window.renderSchedulePage();
    };

    /**
     * Finds the group that currently owns the given work name
     */
    window.getGroupForWork = function (workName) {
        if (!window.scheduleGroups) return null;
        return window.scheduleGroups.find(g => (g.items || []).includes(workName)) || null;
    };

    /**
     * Dynamically builds time slots elements layout for the schedule grid.
     */
    window.renderSchedulePage = function () {
        const bar = document.getElementById('schedule-visual-timeline-bar');
        const legend = document.getElementById('schedule-visual-legend');
        const grid = document.getElementById('schedule-timeline-grid');
        const hoursSummaryList = document.getElementById('schedule-hours-summary-list');
        const badge = document.getElementById('schedule-slots-count-badge');
        const currentSet = window.activeRoutineSet || 1;
        const blocks = (currentSet === 2) ? (window.scheduleBlocks2 || []) : (window.scheduleBlocks || []);

        const activeRoutineBadge = document.getElementById('active-routine-badge');
        if (activeRoutineBadge) {
            activeRoutineBadge.textContent = `Routine ${currentSet}`;
        }

        // Normalize old weekly blocks if any
        blocks.forEach(b => {
            if (b.day !== 'Daily') b.day = 'Daily';
        });

        // Sort blocks chronologically
        const dailyBlocks = blocks.filter(b => b.day === 'Daily').sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Helper convert minutes to 12-hour AM/PM time string
        const minutesToTime = (m) => {
            let hrs = Math.floor(m / 60);
            const mins = m % 60;
            const ampm = hrs >= 12 ? 'PM' : 'AM';
            hrs = hrs % 12;
            if (hrs === 0) hrs = 12;
            return `${hrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
        };

        // Build 24-Hour Routine Allocation — vertical list: Work - Time Range - Hr
        let totalAllocatedHours = 0;
        if (bar) {
            let listHtml = '';

            if (dailyBlocks.length === 0) {
                listHtml = `<p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">No work hours allocated</p>`;
            } else {
                dailyBlocks.forEach(block => {
                    const startMin = Utils.timeToMinutes(block.startTime);
                    const endMin = Utils.timeToMinutes(block.endTime);
                    if (endMin <= startMin) return;

                    const hours = ((endMin - startMin) / 60);
                    totalAllocatedHours += hours;
                    const hrStr = hours === 1 ? '1.0 hr' : `${hours.toFixed(1)} hrs`;
                    const color = block.color || '#6366f1';
                    const timeRange = `${Utils.formatTime12h(block.startTime)} – ${Utils.formatTime12h(block.endTime)}`;

                    listHtml += `
                        <div class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20 hover:shadow-sm transition-all cursor-pointer"
                             onclick="window.openEditScheduleModal('${block.id}')">
                            <span class="w-2 h-8 rounded-full shrink-0" style="background-color: ${color};"></span>
                            <div class="flex-1 min-w-0">
                                <p class="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">${block.task}</p>
                                <p class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">${timeRange}</p>
                            </div>
                            <span class="text-[11px] font-black text-slate-700 dark:text-slate-300 shrink-0 tabular-nums">${hrStr}</span>
                        </div>
                    `;
                });
            }

            bar.innerHTML = listHtml;
        }

        // Update total hours badge
        const totalBadge = document.getElementById('schedule-allocation-total');
        if (totalBadge) {
            const totalStr = totalAllocatedHours === 0 ? '0 hrs' : (totalAllocatedHours === 1 ? '1.0 hr' : `${totalAllocatedHours.toFixed(1)} hrs`);
            totalBadge.textContent = totalStr;
        }

        // Hide the legend — no longer needed for vertical list view
        if (legend) {
            legend.innerHTML = '';
        }

        // Segment blocks into 1-hour slots
        const segments = [];
        dailyBlocks.forEach(block => {
            const startMin = Utils.timeToMinutes(block.startTime);
            const endMin = Utils.timeToMinutes(block.endTime);

            if (endMin <= startMin) return;

            let currentStart = startMin;
            let isFirst = true;
            while (currentStart < endMin) {
                const currentEnd = Math.min(currentStart + 60, endMin);
                segments.push({
                    id: block.id,
                    task: block.task,
                    track: block.track,
                    program: block.program,
                    color: block.color || '#6366f1',
                    startTime: minutesToTime(currentStart),
                    endTime: minutesToTime(currentEnd),
                    startMin: currentStart,
                    endMin: currentEnd,
                    duration: currentEnd - currentStart,
                    isDayStart: isFirst && !!block.isDayStart
                });
                isFirst = false;
                currentStart = currentEnd;
            }
        });

        // Sort segments chronologically
        segments.sort((a, b) => a.startMin - b.startMin);

        // Re-order: if a dayStart block exists, rotate the array to start from it
        const dayStartIdx = segments.findIndex(s => s.isDayStart);
        let orderedSegments = segments;
        if (dayStartIdx > 0) {
            orderedSegments = [...segments.slice(dayStartIdx), ...segments.slice(0, dayStartIdx)];
        }

        // Render slot count badge
        if (badge) {
            badge.textContent = `${orderedSegments.length} Box${orderedSegments.length === 1 ? '' : 'es'}`;
        }

        // Build timeline grid — compact boxes
        if (grid) {
            if (orderedSegments.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-400 dark:text-slate-500">
                        <span class="text-3xl">📅</span>
                        <h4 class="text-xs font-black uppercase tracking-wider mt-3">No Slots Planned</h4>
                        <p class="text-[10px] opacity-75 mt-1 max-w-xs">Your daily schedule is empty. Add routine blocks to plan your typical day.</p>
                    </div>
                `;
            } else {
                let gridHtml = '';
                orderedSegments.forEach((seg) => {
                    const color = seg.color;
                    let metaHtml = '';
                    if (seg.track || seg.program) {
                        const trackLabel = seg.track ? `<span class="truncate block text-[8px] font-black text-white/75 uppercase tracking-widest leading-none">${seg.track}</span>` : '';
                        const progLabel = seg.program ? `<span class="truncate block text-[8px] font-black text-white/85 uppercase tracking-wider">${seg.program}</span>` : '';
                        metaHtml = `
                            <div class="mt-1 pt-1 border-t border-dashed border-white/15">
                                ${trackLabel}
                                ${progLabel}
                            </div>
                        `;
                    }

                    const dayStartBadge = seg.isDayStart ? `
                        <span class="inline-flex items-center text-[8px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 mb-1" title="Day starts here">☀️ Start</span>
                    ` : '';

                    gridHtml += `
                        <div class="rounded-2xl flex flex-col hover:shadow-lg transition-all relative overflow-hidden group cursor-pointer border border-slate-200/60 dark:border-slate-700/50"
                             style="min-height: 140px;"
                             onclick="window.openEditScheduleModal('${seg.id}')">
                            
                            <!-- Time header (1/4) — stroke only, no BG -->
                            <div class="flex items-center justify-center py-2.5 bg-white dark:bg-slate-800" style="flex: 0 0 25%;">
                                <div class="flex items-center justify-center px-3 py-1.5 rounded-lg" style="border: 1.5px solid ${color}55;">
                                    <span class="text-[10px] font-black tracking-tight" style="color: ${color};">${seg.startTime} - ${seg.endTime}</span>
                                </div>
                            </div>
                            
                            <!-- Work name + meta (3/4) — colored BG, white text, centered -->
                            <div class="flex flex-col items-center justify-center p-3 overflow-hidden text-center rounded-b-2xl" style="flex: 1 1 75%; background-color: ${color}cc;">
                                ${dayStartBadge}
                                <div class="space-y-1 overflow-hidden">
                                    <h4 class="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug line-clamp-2" title="${seg.task}">${seg.task}</h4>
                                    ${metaHtml}
                                </div>
                                
                                <!-- Actions float hover -->
                                <div class="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                    <button onclick="event.stopPropagation(); window.openEditScheduleModal('${seg.id}')" class="p-1 bg-white/20 hover:bg-white/30 border border-white/20 rounded-md text-white transition-colors" title="Edit">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                        </svg>
                                    </button>
                                    <button onclick="event.stopPropagation(); window.deleteScheduleBlock('${seg.id}')" class="p-1 bg-white/20 hover:bg-white/30 border border-white/20 rounded-md text-white transition-colors" title="Delete">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                grid.innerHTML = gridHtml;
            }
        }

        // Build hours summary list — group-based view only
        if (hoursSummaryList) {
            const workTotals = {};
            const workColors = {};

            dailyBlocks.forEach(b => {
                const name = b.task || 'Untitled Work';
                const startMin = Utils.timeToMinutes(b.startTime);
                const endMin = Utils.timeToMinutes(b.endTime);
                const hours = (endMin - startMin) / 60;
                if (hours > 0) {
                    workTotals[name] = (workTotals[name] || 0) + hours;
                    workColors[name] = b.color || '#6366f1';
                }
            });

            const sortedTotals = Object.entries(workTotals).sort((a, b) => b[1] - a[1]);
            const groups = window.scheduleGroups || [];

            // Build group assignment dropdown HTML
            const groupOptionsHtml = groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

            // Render an individual work item row
            const renderWorkRow = (name, hours, color, showGroupActions) => {
                const hrStr = hours === 1 ? '1.0 hr' : `${hours.toFixed(1)} hrs`;
                const currentGrp = window.getGroupForWork(name);

                let actionHtml = '';
                if (showGroupActions && groups.length > 0) {
                    if (currentGrp) {
                        actionHtml = `
                            <button onclick="event.stopPropagation(); window.removeSlotFromGroup('${name.replace(/'/g, "\\'")}')" 
                                class="text-[7px] font-black text-red-400 hover:text-red-600 uppercase tracking-wider px-1 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0" title="Remove from group">✕</button>
                        `;
                    } else {
                        actionHtml = `
                            <select onchange="if(this.value) window.assignSlotToGroup('${name.replace(/'/g, "\\'")}', this.value); this.value='';"
                                class="text-[8px] font-bold bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-500 cursor-pointer outline-none max-w-[60px]">
                                <option value="">+ Grp</option>
                                ${groupOptionsHtml}
                            </select>
                        `;
                    }
                }

                return `
                    <div class="flex items-center justify-between p-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-lg hover:shadow-inner transition-all">
                        <div class="flex items-center space-x-1.5 overflow-hidden flex-1 min-w-0">
                            <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${color};"></span>
                            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title="${name}">${name}</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0 pl-1">
                            ${actionHtml}
                            <span class="text-[11px] font-black text-slate-900 dark:text-white">${hrStr}</span>
                        </div>
                    </div>
                `;
            };

            // Groups-only view: show nothing unless groups exist
            if (groups.length === 0) {
                hoursSummaryList.innerHTML = `<p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">Create a group to see summary</p>`;
            } else {
                let summaryHtml = '';

                groups.forEach(grp => {
                    const groupItems = (grp.items || []).filter(n => workTotals[n] !== undefined);

                    let groupTotal = 0;
                    groupItems.forEach(n => { groupTotal += workTotals[n] || 0; });
                    const grpHrStr = groupTotal === 0 ? '0 hr' : (groupTotal === 1 ? '1.0 hr' : `${groupTotal.toFixed(1)} hrs`);

                    summaryHtml += `
                        <div class="border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden mb-3">
                            <div class="flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" onclick="const items=this.parentElement.querySelector('.grp-items'); const chev=this.querySelector('.grp-chevron'); items.classList.toggle('hidden'); if(chev) chev.style.transform=items.classList.contains('hidden')?'rotate(0deg)':'rotate(180deg)';">
                                <div class="flex items-center gap-2">
                                    <svg class="grp-chevron w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                    <span class="w-2.5 h-2.5 rounded-md shrink-0" style="background-color: ${grp.color};"></span>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">${grp.name}</span>
                                    <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500">(${groupItems.length})</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-black text-slate-900 dark:text-white">${grpHrStr}</span>
                                    <button onclick="event.stopPropagation(); window.openCreateScheduleGroup('${grp.id}')" class="text-slate-400 hover:text-blue-500 transition-colors" title="Edit group">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    <button onclick="event.stopPropagation(); window.deleteScheduleGroup('${grp.id}')" class="text-slate-400 hover:text-red-500 transition-colors" title="Delete group">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div class="grp-items hidden p-2 space-y-1.5 bg-white dark:bg-slate-900/20">
                                ${groupItems.length > 0 ? groupItems.map(n => renderWorkRow(n, workTotals[n], workColors[n], true)).join('') : '<p class="text-[8px] text-slate-400 font-bold text-center py-2">No items assigned</p>'}
                            </div>
                        </div>
                    `;
                });

                hoursSummaryList.innerHTML = summaryHtml;
            }
        }
        if (typeof window.updateActiveScheduleSlot === 'function') {
            window.updateActiveScheduleSlot();
        }
    };

    /**
     * Daily Schedule Page Lifecycle Controller
     */
    window.DailySchedulePage = {
        isMounted: false,

        init: function () {
            this.mount();
        },

        mount: function () {
            this.isMounted = true;

            // 1. Render timeline grid, hours summary, allocation
            if (typeof window.renderSchedulePage === 'function') {
                window.renderSchedulePage();
            }

            // 2. Refresh active slot countdown and card
            if (typeof window.updateActiveScheduleSlot === 'function') {
                window.updateActiveScheduleSlot();
            }
        },

        destroy: function () {
            this.isMounted = false;

            // Safely close modals if open when navigating away
            if (typeof window.closeModal === 'function') {
                const modals = ['add-schedule-modal', 'create-schedule-group-modal'];
                modals.forEach(m => {
                    const el = document.getElementById(m);
                    if (el && !el.classList.contains('hidden')) {
                        window.closeModal(m);
                    }
                });
            }
        }
    };

    // Auto-init if container exists and is visible on initial page load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        const pageEl = document.getElementById('page-schedule');
        if (pageEl && !pageEl.classList.contains('hidden')) {
            window.DailySchedulePage.init();
        }
    }
})();
