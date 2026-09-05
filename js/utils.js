/**
 * X-29 Utilities Aggregator Module
 * Re-exports dedicated leaf utility modules and provides window.Utils compatibility namespace.
 */

import {
    parseDateSafe,
    getDailyActionDate,
    toMinutes,
    timeToMinutes,
    formatTime12h,
    parseStart,
    parseEnd,
    isDateInWeekRange,
    formatDaysPassed,
    formatDate,
    formatDateMobile,
    formatDatePC,
    formatDateResponsive,
    formatDateRangeResponsive
} from './utils/date.js';

import {
    extractNum,
    mapGradeToNumeric,
    mapCgpaToGrade,
    formatCgpaMin2Dec,
    validateAndFormatCgpa,
    isChapterMatch
} from './utils/format.js';

import {
    escapeHtml,
    sanitizeAllData
} from './utils/sanitize.js';

import { safeStorage } from './utils/storage.js';
import { safeSetText, safeSetHtml, safeSetClass } from './utils/dom.js';
import { generateId } from './utils/id.js';

export {
    // Date & Time
    parseDateSafe,
    getDailyActionDate,
    toMinutes,
    timeToMinutes,
    formatTime12h,
    parseStart,
    parseEnd,
    isDateInWeekRange,
    formatDaysPassed,
    formatDate,
    formatDateMobile,
    formatDatePC,
    formatDateResponsive,
    formatDateRangeResponsive,
    // Formatting & Grading
    extractNum,
    mapGradeToNumeric,
    mapCgpaToGrade,
    formatCgpaMin2Dec,
    validateAndFormatCgpa,
    isChapterMatch,
    // Sanitization
    escapeHtml,
    sanitizeAllData,
    // Storage
    safeStorage,
    // DOM
    safeSetText,
    safeSetHtml,
    safeSetClass,
    // ID
    generateId
};

// Assemble unified Utils namespace object
export const Utils = {
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
    generateId
};

// Global legacy compatibility bindings
if (typeof window !== 'undefined') {
    window.Utils = Utils;
    window.toMinutes = toMinutes;
    window.timeToMinutes = timeToMinutes;
    window.formatTime12h = formatTime12h;
    window.extractNum = extractNum;
    window.isChapterMatch = isChapterMatch;
    window.parseStart = parseStart;
    window.parseEnd = parseEnd;
    window.isDateInWeekRange = isDateInWeekRange;
    window.formatDaysPassed = formatDaysPassed;
    window.formatDate = formatDate;
    window.formatDateMobile = formatDateMobile;
    window.formatDatePC = formatDatePC;
    window.formatDateResponsive = formatDateResponsive;
    window.formatDateRangeResponsive = formatDateRangeResponsive;
    window.parseDateSafe = parseDateSafe;
    window.mapGradeToNumeric = mapGradeToNumeric;
    window.mapCgpaToGrade = mapCgpaToGrade;
    window.formatCgpaMin2Dec = formatCgpaMin2Dec;
    window.validateAndFormatCgpa = validateAndFormatCgpa;
    window.safeStorage = safeStorage;
    window.escapeHtml = escapeHtml;
    window.sanitizeAllData = sanitizeAllData;
    window.safeSetText = safeSetText;
    window.safeSetHtml = safeSetHtml;
    window.safeSetClass = safeSetClass;
    window.generateId = generateId;
}
