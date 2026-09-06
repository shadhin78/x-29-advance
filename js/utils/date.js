/**
 * X-29 Module: utils/date.js
 * Timezone-safe date parsing, calculations, and responsive date/time formatting.
 */

/**
 * Safely parses any date string, Firestore Timestamp, or Date representation into a Date object.
 * 
 * @param {string|Date|Object} dateStr - Date representation
 * @returns {Date} Parsed Date object (or Date(NaN) on invalid)
 */
export function parseDateSafe(dateStr) {
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
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
    return new Date(NaN);
}

/**
 * Returns the active Date for Daily Actions based on standard 12:00 AM midnight reset.
 */
export function getDailyActionDate(d = new Date()) {
    return new Date(d.getTime());
}

/**
 * Converts a 24-hour time string (HH:MM) to total minutes from midnight.
 */
export function toMinutes(t) {
    if (!t) return 0;
    const p = t.split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
}

/**
 * Converts a 24-hour time string (HH:MM) to total minutes from midnight (alias for toMinutes).
 */
export function timeToMinutes(t) {
    return toMinutes(t);
}

/**
 * Formats a 24-hour time string (HH:MM) to 12-hour display format with AM/PM.
 */
export function formatTime12h(timeStr) {
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
 * Parses the start date of a weekly target date range string.
 */
export function parseStart(wkStr) {
    if (!wkStr) return new Date(0);
    const parts = wkStr.split(' - ');
    return parts[0] ? parseDateSafe(parts[0]) : new Date(0);
}

/**
 * Parses the end date of a weekly target date range string.
 */
export function parseEnd(wkStr) {
    if (!wkStr) return new Date(0);
    const parts = wkStr.split(' - ');
    return parts[1] ? parseDateSafe(parts[1]) : new Date(0);
}

/**
 * Checks if a date falls strictly within a week range key.
 */
export function isDateInWeekRange(date, wkStr) {
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

/**
 * Formats elapsed days into readable months and days.
 */
export function formatDaysPassed(daysPassed) {
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

/**
 * Formats Date object into MMM DD format.
 */
export function formatDate(dateObj) {
    if (!dateObj) return '';
    const d = (dateObj instanceof Date) ? dateObj : parseDateSafe(dateObj);
    if (!d || isNaN(d.getTime())) return '';
    return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
}

/**
 * Formats Date into DD-MM-YY format for Mobile.
 */
export function formatDateMobile(d) {
    if (!d) return '';
    const dateObj = parseDateSafe(d);
    if (isNaN(dateObj.getTime())) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
}

/**
 * Formats Date into DD month YYYY format for PC.
 */
export function formatDatePC(d) {
    if (!d) return '';
    const dateObj = parseDateSafe(d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Returns responsive HTML span string for mobile (DD-MM-YY) and PC (DD month YYYY).
 */
export function formatDateResponsive(d) {
    if (!d) return '';
    const mobile = formatDateMobile(d);
    const pc = formatDatePC(d);
    if (!mobile && !pc) return '';
    return `<span class="inline md:hidden">${mobile}</span><span class="hidden md:inline">${pc}</span>`;
}

/**
 * Returns responsive HTML span string for date ranges (start -> end) for mobile and PC.
 */
export function formatDateRangeResponsive(start, end, sep = ' &rarr; ') {
    if (!start || !end) return '';
    const mobileStart = formatDateMobile(start);
    const mobileEnd = formatDateMobile(end);
    const pcStart = formatDatePC(start);
    const pcEnd = formatDatePC(end);
    return `<span class="inline md:hidden">${mobileStart}${sep}${mobileEnd}</span><span class="hidden md:inline">${pcStart}${sep}${pcEnd}</span>`;
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.parseDateSafe = parseDateSafe;
    window.getDailyActionDate = getDailyActionDate;
    window.toMinutes = toMinutes;
    window.timeToMinutes = timeToMinutes;
    window.formatTime12h = formatTime12h;
    window.parseStart = parseStart;
    window.parseEnd = parseEnd;
    window.isDateInWeekRange = isDateInWeekRange;
    window.formatDaysPassed = formatDaysPassed;
    window.formatDate = formatDate;
    window.formatDateMobile = formatDateMobile;
    window.formatDatePC = formatDatePC;
    window.formatDateResponsive = formatDateResponsive;
    window.formatDateRangeResponsive = formatDateRangeResponsive;
}
