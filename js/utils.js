/**
 * X-29 Utilities Module (js/utils.js)
 * Synchronously loaded core utilities namespace for X-29 Advance.
 * Attaches directly to window.Utils and legacy global bindings.
 */

(function (global) {
    'use strict';

    /**
     * DOM Safe Manipulation Helpers
     */
    function safeSetText(idOrEl, text) {
        if (!idOrEl) return;
        const el = (typeof idOrEl === 'string') ? document.getElementById(idOrEl) : idOrEl;
        if (el && text !== undefined && text !== null) {
            el.textContent = String(text);
        }
    }

    function safeSetHtml(idOrEl, html) {
        if (!idOrEl) return;
        const el = (typeof idOrEl === 'string') ? document.getElementById(idOrEl) : idOrEl;
        if (el && html !== undefined && html !== null) {
            el.innerHTML = String(html);
        }
    }

    function safeSetClass(idOrEl, addClasses = [], removeClasses = []) {
        if (!idOrEl) return;
        const el = (typeof idOrEl === 'string') ? document.getElementById(idOrEl) : idOrEl;
        if (!el) return;
        const toAdd = Array.isArray(addClasses) ? addClasses : [addClasses];
        const toRemove = Array.isArray(removeClasses) ? removeClasses : [removeClasses];
        toRemove.forEach(cls => { if (cls) el.classList.remove(cls); });
        toAdd.forEach(cls => { if (cls) el.classList.add(cls); });
    }

    /**
     * Unique ID Generator
     */
    function generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    /**
     * HTML escaping
     */
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Sanitization helper for deep objects
     */
    function sanitizeAllData(data) {
        if (typeof data === 'string') {
            return escapeHtml(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => sanitizeAllData(item));
        }
        if (data !== null && typeof data === 'object') {
            const sanitized = {};
            for (const key of Object.keys(data)) {
                sanitized[key] = sanitizeAllData(data[key]);
            }
            return sanitized;
        }
        return data;
    }

    /**
     * Safe LocalStorage wrapper with namespace isolation ('x29_adv_')
     */
    const safeStorage = {
        PREFIX: 'x29_adv_',
        fallbackStore: {},
        _k: function (key) {
            return String(key).startsWith(this.PREFIX) ? key : this.PREFIX + key;
        },
        getItem: function (key) {
            const namespacedKey = this._k(key);
            try {
                return localStorage.getItem(namespacedKey);
            } catch (e) {
                console.warn(`localStorage.getItem failed for key "${namespacedKey}":`, e);
                return this.fallbackStore[namespacedKey] || null;
            }
        },
        setItem: function (key, value) {
            const namespacedKey = this._k(key);
            try {
                localStorage.setItem(namespacedKey, value);
            } catch (e) {
                console.warn(`localStorage.setItem failed for key "${namespacedKey}":`, e);
                this.fallbackStore[namespacedKey] = String(value);
            }
        },
        removeItem: function (key) {
            const namespacedKey = this._k(key);
            try {
                localStorage.removeItem(namespacedKey);
            } catch (e) {
                console.warn(`localStorage.removeItem failed for key "${namespacedKey}":`, e);
                delete this.fallbackStore[namespacedKey];
            }
        },
        clearNamespace: function () {
            try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith(this.PREFIX)) {
                        keysToRemove.push(k);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            } catch (e) {}
            this.fallbackStore = {};
        }
    };

    /**
     * Converts a 24-hour time string (HH:MM) to total minutes from midnight.
     */
    function toMinutes(t) {
        if (!t) return 0;
        const p = t.split(':').map(Number);
        return (p[0] || 0) * 60 + (p[1] || 0);
    }

    function timeToMinutes(t) {
        return toMinutes(t);
    }

    /**
     * Formats a 24-hour time string (HH:MM) to 12-hour display format with AM/PM.
     */
    function formatTime12h(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':').map(Number);
        let hrs = parts[0] || 0;
        const mins = parts[1] || 0;
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        if (hrs === 0) hrs = 12;
        return `${hrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
    }

    /**
     * Extracts trailing numeric value from string.
     */
    function extractNum(chStr) {
        if (chStr === 'Rev') return 9999;
        const match = String(chStr || '').match(/(\d+)(?!.*\d)/);
        return match ? parseInt(match[0], 10) : 999;
    }

    /**
     * Safe date parser for string, timestamp, Firestore Timestamp, or Date.
     */
    function parseDateSafe(dateStr) {
        if (!dateStr) return new Date();
        if (dateStr instanceof Date) return new Date(dateStr.getTime());
        if (typeof dateStr === 'object') {
            if (typeof dateStr.toDate === 'function') return dateStr.toDate();
            if (dateStr.seconds !== undefined) return new Date(dateStr.seconds * 1000);
        }
        if (typeof dateStr === 'string') {
            const trimmed = dateStr.trim();
            if (trimmed === '' || trimmed.includes('Invalid') || trimmed.includes('NaN')) {
                return new Date(NaN);
            }
            if (trimmed.includes('-')) {
                const parts = trimmed.split('T')[0].split('-');
                if (parts.length === 3) {
                    const [y, m, d] = parts.map(Number);
                    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                        return new Date(y, m - 1, d);
                    }
                }
            }
            if (trimmed.includes('/')) {
                const parts = trimmed.split('/');
                if (parts.length === 3) {
                    let [p1, p2, p3] = parts.map(Number);
                    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                        let y = p3 < 100 ? 2000 + p3 : p3;
                        let m = p1;
                        let d = p2;
                        if (m > 12 && d <= 12) {
                            m = p2;
                            d = p1;
                        }
                        return new Date(y, m - 1, d);
                    }
                }
            }
            const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
            const mMatch = trimmed.match(/^([A-Za-z]{3,})\s+(\d{1,2})(?:[,\s]+(\d{4}))?$/);
            if (mMatch) {
                const mon = monthMap[mMatch[1].toLowerCase().slice(0, 3)];
                const day = parseInt(mMatch[2], 10);
                const yr = mMatch[3] ? parseInt(mMatch[3], 10) : new Date().getFullYear();
                if (mon !== undefined && !isNaN(day)) {
                    return new Date(yr, mon, day);
                }
            }
            const dMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})(?:[,\s]+(\d{4}))?$/);
            if (dMatch) {
                const day = parseInt(dMatch[1], 10);
                const mon = monthMap[dMatch[2].toLowerCase().slice(0, 3)];
                const yr = dMatch[3] ? parseInt(dMatch[3], 10) : new Date().getFullYear();
                if (mon !== undefined && !isNaN(day)) {
                    return new Date(yr, mon, day);
                }
            }
        }
        let parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) return parsed;
        return new Date(NaN);
    }

    function getDailyActionDate(d = new Date()) {
        return new Date(d.getTime());
    }

    function parseStart(wkStr) {
        if (!wkStr) return new Date(0);
        const parts = wkStr.split(' - ');
        return parts[0] ? parseDateSafe(parts[0]) : new Date(0);
    }

    function parseEnd(wkStr) {
        if (!wkStr) return new Date(0);
        const parts = wkStr.split(' - ');
        return parts[1] ? parseDateSafe(parts[1]) : new Date(0);
    }

    function isDateInWeekRange(date, wkStr) {
        if (!date || !wkStr) return false;
        const parts = wkStr.split(' - ');
        if (parts.length < 2) return false;
        const dObj = (date instanceof Date) ? date : parseDateSafe(date);
        const start = parseDateSafe(parts[0]);
        const end = parseDateSafe(parts[1]);
        if (isNaN(dObj.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        const dTime = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()).getTime();
        const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
        return dTime >= startTime && dTime <= endTime;
    }

    function formatDaysPassed(daysPassed) {
        if (daysPassed > 30) {
            const months = Math.floor(daysPassed / 30);
            const days = daysPassed % 30;
            const monthStr = months === 1 ? "1 Month" : `${months} Months`;
            if (days > 0) {
                const dayStr = days === 1 ? "1 Day" : `${days} Days`;
                return `${monthStr}, ${dayStr}`;
            }
            return monthStr;
        }
        return daysPassed === 1 ? "1 Day" : `${daysPassed} Days`;
    }

    function formatDate(dateObj) {
        if (!dateObj) return '';
        const d = (dateObj instanceof Date) ? dateObj : parseDateSafe(dateObj);
        if (!d || isNaN(d.getTime())) return '';
        return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
    }

    function formatDateMobile(d) {
        if (!d) return '';
        const dateObj = parseDateSafe(d);
        if (isNaN(dateObj.getTime())) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    }

    function formatDatePC(d) {
        if (!d) return '';
        const dateObj = parseDateSafe(d);
        if (isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function formatDateResponsive(d) {
        if (!d) return '';
        const mobile = formatDateMobile(d);
        const pc = formatDatePC(d);
        if (!mobile && !pc) return '';
        return `<span class="inline md:hidden">${mobile}</span><span class="hidden md:inline">${pc}</span>`;
    }

    function formatDateRangeResponsive(start, end, sep = ' &rarr; ') {
        if (!start || !end) return '';
        const mobileStart = formatDateMobile(start);
        const mobileEnd = formatDateMobile(end);
        const pcStart = formatDatePC(start);
        const pcEnd = formatDatePC(end);
        return `<span class="inline md:hidden">${mobileStart}${sep}${mobileEnd}</span><span class="hidden md:inline">${pcStart}${sep}${pcEnd}</span>`;
    }

    function mapGradeToNumeric(grade, evalType = 'cgpa') {
        if (!grade) return 0.0;
        const g = grade.toUpperCase().trim();
        if (evalType === 'grade') {
            switch (g) {
                case 'A': return 4.0;
                case 'B': return 3.0;
                case 'C': return 2.25;
                case 'D': return 2.00;
                case 'E': return 0.0;
                case 'F': return 0.0;
                default: return 0.0;
            }
        } else {
            switch (g) {
                case 'A+': return 4.0;
                case 'A': return 3.75;
                case 'A-': return 3.50;
                case 'B+': return 3.25;
                case 'B': return 3.00;
                case 'B-': return 2.75;
                case 'C+': return 2.50;
                case 'C': return 2.25;
                case 'D': return 2.00;
                case 'F': return 0.00;
                default: return 0.0;
            }
        }
    }

    function mapCgpaToGrade(cgpa, evalType = 'cgpa') {
        const v = parseFloat(cgpa);
        if (isNaN(v)) return '';
        if (evalType === 'grade') {
            if (v >= 4.0) return 'A';
            if (v >= 3.0) return 'B';
            if (v >= 2.25) return 'C';
            if (v >= 2.0) return 'D';
            if (v >= 0.01) return 'E';
            return 'F';
        } else {
            if (v >= 4.0) return 'A+';
            if (v >= 3.75) return 'A';
            if (v >= 3.5) return 'A-';
            if (v >= 3.25) return 'B+';
            if (v >= 3.0) return 'B';
            if (v >= 2.75) return 'B-';
            if (v >= 2.5) return 'C+';
            if (v >= 2.25) return 'C';
            if (v >= 2.0) return 'D';
            return 'F';
        }
    }

    function formatCgpaMin2Dec(val) {
        let parsed = parseFloat(val);
        if (isNaN(parsed)) return '';
        return parsed.toFixed(2);
    }

    function validateAndFormatCgpa(valStr) {
        if (!valStr || valStr.trim() === '') return '';
        let val = parseFloat(valStr);
        if (isNaN(val)) return '';
        if (val < 0) val = 0.00;
        if (val > 4.0) val = 4.00;
        return formatCgpaMin2Dec(val);
    }

    function isChapterMatch(ch1, ch2) {
        if (ch1 === ch2) return true;
        if (!ch1 || !ch2) return false;
        const s1 = String(ch1).replace(/[★⭐*]/g, '').trim();
        const s2 = String(ch2).replace(/[★⭐*]/g, '').trim();
        if (s1.toLowerCase() === s2.toLowerCase()) return true;

        const clean1 = s1.replace(/^(ch\.|chapter)\s*/i, '').trim();
        const clean2 = s2.replace(/^(ch\.|chapter)\s*/i, '').trim();
        if (clean1.toLowerCase() === clean2.toLowerCase()) return true;

        const prefix1 = s1.split(':')[0].trim();
        const prefix2 = s2.split(':')[0].trim();
        if (prefix1.toLowerCase() === prefix2.toLowerCase()) return true;

        const cleanPrefix1 = prefix1.replace(/^(ch\.|chapter)\s*/i, '').trim();
        const cleanPrefix2 = prefix2.replace(/^(ch\.|chapter)\s*/i, '').trim();
        if (cleanPrefix1.toLowerCase() === cleanPrefix2.toLowerCase()) return true;

        const n1 = extractNum(s1);
        const n2 = extractNum(s2);
        if (n1 !== null && n2 !== null && n1 !== 999 && n2 !== 999 && n1 === n2) return true;
        return false;
    }

    // Unified Utils Namespace Object
    const Utils = {
        getDailyActionDate,
        toMinutes,
        timeToMinutes,
        formatTime12h,
        extractNum,
        parseStart,
        parseEnd,
        isDateInWeekRange,
        formatDaysPassed,
        formatDate,
        formatDateMobile,
        formatDatePC,
        formatDateResponsive,
        formatDateRangeResponsive,
        parseDateSafe,
        mapGradeToNumeric,
        mapCgpaToGrade,
        formatCgpaMin2Dec,
        validateAndFormatCgpa,
        storage: safeStorage,
        escapeHtml,
        sanitizeAllData,
        isChapterMatch,
        generateId,
        safeSetText,
        safeSetHtml,
        safeSetClass
    };

    // Global Bindings for synchronous availability
    global.Utils = Utils;
    global.safeStorage = safeStorage;
    global.safeSetText = safeSetText;
    global.safeSetHtml = safeSetHtml;
    global.safeSetClass = safeSetClass;
    global.generateId = generateId;
    global.escapeHtml = escapeHtml;
    global.sanitizeAllData = sanitizeAllData;
    global.toMinutes = toMinutes;
    global.timeToMinutes = timeToMinutes;
    global.formatTime12h = formatTime12h;
    global.extractNum = extractNum;
    global.parseDateSafe = parseDateSafe;
    global.getDailyActionDate = getDailyActionDate;
    global.parseStart = parseStart;
    global.parseEnd = parseEnd;
    global.isDateInWeekRange = isDateInWeekRange;
    global.formatDaysPassed = formatDaysPassed;
    global.formatDate = formatDate;
    global.formatDateMobile = formatDateMobile;
    global.formatDatePC = formatDatePC;
    global.formatDateResponsive = formatDateResponsive;
    global.formatDateRangeResponsive = formatDateRangeResponsive;
    global.mapGradeToNumeric = mapGradeToNumeric;
    global.mapCgpaToGrade = mapCgpaToGrade;
    global.formatCgpaMin2Dec = formatCgpaMin2Dec;
    global.validateAndFormatCgpa = validateAndFormatCgpa;
    global.isChapterMatch = isChapterMatch;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Utils;
    }
})(typeof window !== 'undefined' ? window : globalThis);
