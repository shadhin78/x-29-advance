/**
 * X-29 Module: utils/sanitize.js
 * HTML entity escaping and deep object/array data sanitization.
 */

/**
 * Safely escapes HTML special characters to prevent XSS.
 * 
 * @param {string} str - Raw string
 * @returns {string} Sanitized string
 */
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Deeply sanitizes values, stripping HTML tags recursively from strings, objects, and arrays.
 * Preserves Date objects and Firestore Timestamps.
 * 
 * @param {*} val - Value to sanitize
 * @returns {*} Sanitized value
 */
export function sanitizeAllData(val) {
    if (val === undefined) return undefined;
    if (typeof val === 'string') {
        return val.replace(/<[^>]*>/g, '');
    } else if (Array.isArray(val)) {
        return val.map(sanitizeAllData).filter(item => item !== undefined);
    } else if (val !== null && typeof val === 'object') {
        if (val instanceof Date) return val;
        if (typeof val.toDate === 'function') return val;
        const cleaned = {};
        for (const key in val) {
            if (Object.prototype.hasOwnProperty.call(val, key)) {
                const cleanVal = sanitizeAllData(val[key]);
                if (cleanVal !== undefined) {
                    cleaned[key] = cleanVal;
                }
            }
        }
        return cleaned;
    }
    return val;
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.sanitizeAllData = sanitizeAllData;
}
