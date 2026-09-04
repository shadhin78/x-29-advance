/**
 * X-29 Utilities Module
 * Established in window.Utils namespace for compatibility.
 */

window.Utils = {
    /**
     * Returns the active Date for Daily Actions based on standard 12:00 AM midnight reset.
     * The daily actions cycle cleanly rolls over to the new calendar day at 12:00 AM.
     */
    getDailyActionDate: function(d = new Date()) {
        return new Date(d.getTime());
    },

    /**
     * Converts a 24-hour time string (HH:MM) to total minutes from midnight.
     */
    toMinutes: function(t) {
        if (!t) return 0;
        const p = t.split(':').map(Number);
        return (p[0] || 0) * 60 + (p[1] || 0);
    },

    /**
     * Converts a 24-hour time string (HH:MM) to total minutes from midnight.
     * Alias for toMinutes.
     */
    timeToMinutes: function(t) {
        return window.Utils.toMinutes(t);
    },

    /**
     * Formats a 24-hour time string (HH:MM) to 12-hour display format with AM/PM.
     */
    formatTime12h: function(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':').map(Number);
        let hrs = parts[0] || 0;
        const mins = parts[1] || 0;
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        if (hrs === 0) hrs = 12;
        return `${hrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
    },

    /**
     * Extracts the trailing numeric value from a string.
     */
    extractNum: function(chStr) {
        if (chStr === 'Rev') return 9999;
        const match = chStr.match(/(\d+)(?!.*\d)/);
        return match ? parseInt(match[0]) : 999;
    },

    /**
     * Parses the start date of a weekly target date range string.
     */
    parseStart: function(wkStr) {
        if (!wkStr) return new Date(0);
        const parts = wkStr.split(' - ');
        return parts[0] ? (window.Utils && typeof window.Utils.parseDateSafe === 'function' ? window.Utils.parseDateSafe(parts[0]) : new Date(parts[0])) : new Date(0);
    },

    /**
     * Parses the end date of a weekly target date range string.
     */
    parseEnd: function(wkStr) {
        if (!wkStr) return new Date(0);
        const parts = wkStr.split(' - ');
        return parts[1] ? (window.Utils && typeof window.Utils.parseDateSafe === 'function' ? window.Utils.parseDateSafe(parts[1]) : new Date(parts[1])) : new Date(0);
    },

    /**
     * Checks if a date falls strictly within a week range key.
     */
    isDateInWeekRange: function(date, wkStr) {
        if (!date || !wkStr) return false;
        const parts = wkStr.split(' - ');
        if (parts.length < 2) return false;
        const parseFn = window.Utils && typeof window.Utils.parseDateSafe === 'function' ? window.Utils.parseDateSafe : (d => new Date(d));
        const dObj = (date instanceof Date) ? date : parseFn(date);
        const start = parseFn(parts[0]);
        const end = parseFn(parts[1]);
        if (isNaN(dObj.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        const dTime = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate()).getTime();
        const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
        const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
        return dTime >= startTime && dTime <= endTime;
    },

    /**
     * Formats elapsed days into readable months and days.
     */
    formatDaysPassed: function(daysPassed) {
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
    },

    /**
     * Formats Date object into MMM DD format.
     */
    formatDate: function(dateObj) {
        if (!dateObj) return '';
        const d = (dateObj instanceof Date) ? dateObj : window.Utils.parseDateSafe(dateObj);
        if (!d || isNaN(d.getTime())) return '';
        return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
    },

    /**
     * Formats Date into DD-MM-YY format for Mobile.
     */
    formatDateMobile: function(d) {
        if (!d) return '';
        const dateObj = window.Utils.parseDateSafe(d);
        if (isNaN(dateObj.getTime())) return '';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    },

    /**
     * Formats Date into DD month YYYY format for PC.
     */
    formatDatePC: function(d) {
        if (!d) return '';
        const dateObj = window.Utils.parseDateSafe(d);
        if (isNaN(dateObj.getTime())) return '';
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    },

    /**
     * Returns responsive HTML span string for mobile (DD-MM-YY) and PC (DD month YYYY).
     */
    formatDateResponsive: function(d) {
        if (!d) return '';
        const mobile = window.Utils.formatDateMobile(d);
        const pc = window.Utils.formatDatePC(d);
        if (!mobile && !pc) return '';
        return `<span class="inline md:hidden">${mobile}</span><span class="hidden md:inline">${pc}</span>`;
    },

    /**
     * Returns responsive HTML span string for date ranges (start -> end) for mobile and PC.
     */
    formatDateRangeResponsive: function(start, end, sep = ' &rarr; ') {
        if (!start || !end) return '';
        const mobileStart = window.Utils.formatDateMobile(start);
        const mobileEnd = window.Utils.formatDateMobile(end);
        const pcStart = window.Utils.formatDatePC(start);
        const pcEnd = window.Utils.formatDatePC(end);
        return `<span class="inline md:hidden">${mobileStart}${sep}${mobileEnd}</span><span class="hidden md:inline">${pcStart}${sep}${pcEnd}</span>`;
    },

    /**
     * Safely parses any date string or object representation into a Date object.
     */
    parseDateSafe: function(dateStr) {
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
            // Parse Month Name strings like 'Aug 26' or 'August 26, 2026'
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
            // Parse Day Month strings like '28 Aug' or '28 Aug 2026' or '28 August 2026'
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
    },

    /**
     * Maps letter grades to numeric CGPA values.
     */
    mapGradeToNumeric: function(grade, evalType = 'cgpa') {
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
    },

    /**
     * Maps numeric CGPA to letter grades.
     */
    mapCgpaToGrade: function(cgpa, evalType = 'cgpa') {
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
    },

    /**
     * Formats GPA numbers to exactly 2 decimal points string.
     */
    formatCgpaMin2Dec: function(val) {
        let parsed = parseFloat(val);
        if (isNaN(parsed)) return '';
        return parsed.toFixed(2);
    },

    /**
     * Validates and formats CGPA inputs within 0.00 - 4.00 constraints.
     */
    validateAndFormatCgpa: function(valStr) {
        if (!valStr || valStr.trim() === '') return '';
        let val = parseFloat(valStr);
        if (isNaN(val)) return '';
        if (val < 0) val = 0.00;
        if (val > 4.0) val = 4.00;
        return window.Utils.formatCgpaMin2Dec(val);
    },

    /**
     * Safe wrapper for LocalStorage to avoid crashes under the file:// protocol or private/sandboxed browsing.
     */
    storage: {
        fallbackStore: {},
        getItem: function(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn(`localStorage.getItem failed for key "${key}":`, e);
                return this.fallbackStore[key] || null;
            }
        },
        setItem: function(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn(`localStorage.setItem failed for key "${key}":`, e);
                this.fallbackStore[key] = String(value);
            }
        },
        removeItem: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn(`localStorage.removeItem failed for key "${key}":`, e);
                delete this.fallbackStore[key];
            }
        }
    },
    escapeHtml: function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Flexibly matches two chapter identifiers (e.g., "Ch. 1", "1", "Chapter 1", "Ch. 11: Assurance", "Ch. 11 ★").
     */
    isChapterMatch: function(ch1, ch2) {
        if (ch1 === ch2) return true;
        if (!ch1 || !ch2) return false;
        const s1 = String(ch1).replace(/[★⭐*]/g, '').trim();
        const s2 = String(ch2).replace(/[★⭐*]/g, '').trim();
        if (s1.toLowerCase() === s2.toLowerCase()) return true;

        const clean1 = s1.replace(/^(ch\.|chapter)\s*/i, '').trim();
        const clean2 = s2.replace(/^(ch\.|chapter)\s*/i, '').trim();
        if (clean1.toLowerCase() === clean2.toLowerCase()) return true;

        // Split on colon if present (e.g. "Ch. 11: Assurance" -> "Ch. 11")
        const prefix1 = s1.split(':')[0].trim();
        const prefix2 = s2.split(':')[0].trim();
        if (prefix1.toLowerCase() === prefix2.toLowerCase()) return true;

        const cleanPrefix1 = prefix1.replace(/^(ch\.|chapter)\s*/i, '').trim();
        const cleanPrefix2 = prefix2.replace(/^(ch\.|chapter)\s*/i, '').trim();
        if (cleanPrefix1.toLowerCase() === cleanPrefix2.toLowerCase()) return true;

        if (typeof window.Utils.extractNum === 'function') {
            const n1 = window.Utils.extractNum(s1);
            const n2 = window.Utils.extractNum(s2);
            if (n1 !== null && n2 !== null && n1 !== 999 && n2 !== 999 && n1 === n2) return true;
        }
        return false;
    }
};

// Global legacy compatibility bindings
window.toMinutes = window.Utils.toMinutes;
window.timeToMinutes = window.Utils.timeToMinutes;
window.formatTime12h = window.Utils.formatTime12h;
window.extractNum = window.Utils.extractNum;
window.isChapterMatch = window.Utils.isChapterMatch;
window.parseStart = window.Utils.parseStart;
window.parseEnd = window.Utils.parseEnd;
window.isDateInWeekRange = window.Utils.isDateInWeekRange;
window.formatDaysPassed = window.Utils.formatDaysPassed;
window.formatDate = window.Utils.formatDate;
window.formatDateMobile = window.Utils.formatDateMobile;
window.formatDatePC = window.Utils.formatDatePC;
window.formatDateResponsive = window.Utils.formatDateResponsive;
window.formatDateRangeResponsive = window.Utils.formatDateRangeResponsive;
window.parseDateSafe = window.Utils.parseDateSafe;
window.mapGradeToNumeric = window.Utils.mapGradeToNumeric;
window.mapCgpaToGrade = window.Utils.mapCgpaToGrade;
window.formatCgpaMin2Dec = window.Utils.formatCgpaMin2Dec;
window.validateAndFormatCgpa = window.Utils.validateAndFormatCgpa;
window.safeStorage = window.Utils.storage;
window.escapeHtml = window.Utils.escapeHtml;


