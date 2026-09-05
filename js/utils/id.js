/**
 * X-29 Module: utils/id.js
 * Unique identifier generation utilities.
 */

/**
 * Generates a unique string identifier using timestamp and random base36 component.
 * 
 * @param {string} [prefix='id'] - Optional prefix for the identifier (e.g. 'task', 'wt', 'mt')
 * @returns {string} Unique identifier
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.generateId = generateId;
}
