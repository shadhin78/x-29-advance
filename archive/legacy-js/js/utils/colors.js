/**
 * X-29 Module: utils/colors.js
 * Deterministic color hashing, palette mapping & RGBA conversion
 */

/**
 * Standard 14-color palette used for deterministic subject identification.
 */
const SUBJECT_PALETTE_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

/**
 * Deterministically maps any arbitrary string identifier to a color from a palette.
 *
 * @param {string} str - String to hash
 * @param {string[]} [palette=SUBJECT_PALETTE_COLORS] - Optional color palette array
 * @returns {string} Hex color string
 */
function hashStringToColor(str, palette = SUBJECT_PALETTE_COLORS) {
    if (!str) return '#3b82f6';
    const pal = (Array.isArray(palette) && palette.length > 0) ? palette : SUBJECT_PALETTE_COLORS;
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
        hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return pal[Math.abs(hash) % pal.length];
}

/**
 * Resolves a subject color using AppState cache if available, falling back to deterministic hashing.
 *
 * @param {string} subjName - Subject name
 * @param {string[]} [palette=SUBJECT_PALETTE_COLORS] - Optional color palette array
 * @returns {string} Hex color string
 */
function getSubjectColor(subjName, palette = SUBJECT_PALETTE_COLORS) {
    if (!subjName) return '#3b82f6';

    // 1. Check existing AppState subjectColors cache
    if (typeof AppState !== 'undefined' && AppState && AppState.subjectColors && AppState.subjectColors[subjName]) {
        return AppState.subjectColors[subjName];
    }
    if (typeof window !== 'undefined' && window.AppState && window.AppState.subjectColors && window.AppState.subjectColors[subjName]) {
        return window.AppState.subjectColors[subjName];
    }
    if (typeof global !== 'undefined' && global.AppState && global.AppState.subjectColors && global.AppState.subjectColors[subjName]) {
        return global.AppState.subjectColors[subjName];
    }

    // 2. Compute deterministic color
    const color = hashStringToColor(subjName, palette);

    // 3. Cache back into AppState if available
    if (typeof AppState !== 'undefined' && AppState && typeof AppState.subjectColors === 'object') {
        AppState.subjectColors[subjName] = color;
    } else if (typeof window !== 'undefined' && window.AppState && typeof window.AppState.subjectColors === 'object') {
        window.AppState.subjectColors[subjName] = color;
    } else if (typeof global !== 'undefined' && global.AppState && typeof global.AppState.subjectColors === 'object') {
        global.AppState.subjectColors[subjName] = color;
    }

    return color;
}

/**
 * Converts a 3-digit or 6-digit hex color code to rgba string with alpha channel.
 *
 * @param {string} hex - Hex color string (with or without '#')
 * @param {number|string} [alpha=1] - Alpha transparency value (0.0 to 1.0)
 * @returns {string} rgba(...) CSS color string
 */
function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(16, 185, 129, ${alpha})`;
    const cleanHex = String(hex).replace('#', '').trim();
    let r = 0, g = 0, b = 0;

    if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
    } else {
        return `rgba(16, 185, 129, ${alpha})`;
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return `rgba(16, 185, 129, ${alpha})`;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Resolves a program color using AppState.dynamicLineColors and getAllPrograms() index.
 *
 * @param {string} pName - Program name
 * @returns {string} Hex color string
 */
function getProgramColor(pName) {
    if (!pName) return '#6366f1';
    const AppStateRef = (typeof window !== 'undefined' && window.AppState)
        || (typeof global !== 'undefined' && global.AppState)
        || {};
    const dynamicLineColors = (AppStateRef && Array.isArray(AppStateRef.dynamicLineColors) && AppStateRef.dynamicLineColors.length > 0)
        ? AppStateRef.dynamicLineColors
        : ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    const getAllProgs = (typeof window !== 'undefined' && typeof window.getAllPrograms === 'function')
        ? window.getAllPrograms
        : ((typeof global !== 'undefined' && typeof global.getAllPrograms === 'function') ? global.getAllPrograms : () => []);

    const allProgs = getAllProgs().map(p => p.name || p);
    const idx = allProgs.indexOf(pName);
    if (idx !== -1) {
        return dynamicLineColors[idx % dynamicLineColors.length];
    }
    return '#6366f1';
}

// Global window and environment compatibility bridge
if (typeof window !== 'undefined') {
    window.SUBJECT_PALETTE_COLORS = SUBJECT_PALETTE_COLORS;
    window.hashStringToColor = hashStringToColor;
    window.getSubjectColor = getSubjectColor;
    window.getProgramColor = getProgramColor;
    window.hexToRgba = hexToRgba;
}
if (typeof global !== 'undefined') {
    global.SUBJECT_PALETTE_COLORS = SUBJECT_PALETTE_COLORS;
    global.hashStringToColor = hashStringToColor;
    global.getSubjectColor = getSubjectColor;
    global.getProgramColor = getProgramColor;
    global.hexToRgba = hexToRgba;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUBJECT_PALETTE_COLORS,
        hashStringToColor,
        getSubjectColor,
        getProgramColor,
        hexToRgba
    };
}

