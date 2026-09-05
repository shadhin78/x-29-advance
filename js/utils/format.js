/**
 * X-29 Module: utils/format.js
 * Academic CGPA/Grade mapping, number extraction, and chapter identifier matching.
 */

/**
 * Extracts the trailing numeric value from a string (e.g. "Ch. 5" -> 5, "Rev" -> 9999).
 */
export function extractNum(chStr) {
    if (chStr === 'Rev') return 9999;
    const match = String(chStr).match(/(\d+)(?!.*\d)/);
    return match ? parseInt(match[0], 10) : 999;
}

/**
 * Maps letter grades to numeric CGPA values.
 */
export function mapGradeToNumeric(grade, evalType = 'cgpa') {
    if (!grade) return 0.0;
    const g = String(grade).toUpperCase().trim();
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

/**
 * Maps numeric CGPA to letter grades.
 */
export function mapCgpaToGrade(cgpa, evalType = 'cgpa') {
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

/**
 * Formats GPA numbers to exactly 2 decimal points string.
 */
export function formatCgpaMin2Dec(val) {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return '';
    return parsed.toFixed(2);
}

/**
 * Validates and formats CGPA inputs within 0.00 - 4.00 constraints.
 */
export function validateAndFormatCgpa(valStr) {
    if (!valStr || String(valStr).trim() === '') return '';
    let val = parseFloat(valStr);
    if (isNaN(val)) return '';
    if (val < 0) val = 0.00;
    if (val > 4.0) val = 4.00;
    return formatCgpaMin2Dec(val);
}

/**
 * Flexibly matches two chapter identifiers (e.g., "Ch. 1", "1", "Chapter 1", "Ch. 11: Assurance", "Ch. 11 ★").
 */
export function isChapterMatch(ch1, ch2) {
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

    const n1 = extractNum(s1);
    const n2 = extractNum(s2);
    if (n1 !== null && n2 !== null && n1 !== 999 && n2 !== 999 && n1 === n2) return true;
    return false;
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.extractNum = extractNum;
    window.mapGradeToNumeric = mapGradeToNumeric;
    window.mapCgpaToGrade = mapCgpaToGrade;
    window.formatCgpaMin2Dec = formatCgpaMin2Dec;
    window.validateAndFormatCgpa = validateAndFormatCgpa;
    window.isChapterMatch = isChapterMatch;
}
