/**
 * X-29 Module: utils/dom.js
 * Safe DOM manipulation helpers with existence guards.
 */

/**
 * Safely sets the text content of a DOM element by ID if it exists.
 * 
 * @param {string} id - Element ID
 * @param {string|number} text - Text to set
 */
export function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = (text !== undefined && text !== null) ? text : '';
}

/**
 * Safely sets the inner HTML of a DOM element by ID if it exists.
 * 
 * @param {string} id - Element ID
 * @param {string} html - HTML string
 */
export function safeSetHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = (html !== undefined && html !== null) ? html : '';
}

/**
 * Safely sets the class name of a DOM element by ID if it exists.
 * 
 * @param {string} id - Element ID
 * @param {string} className - CSS class name string
 */
export function safeSetClass(id, className) {
    const el = document.getElementById(id);
    if (el) el.className = className || '';
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.safeSetText = safeSetText;
    window.safeSetHtml = safeSetHtml;
    window.safeSetClass = safeSetClass;
}
