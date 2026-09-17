/**
 * X-29 Service Module: Curriculum Taxonomy (taxonomy.js)
 *
 * Responsibilities:
 * 1. Global Subjects Taxonomy Resolution (getAllSubjects):
 *    - Aggregates subjects across all tracks defined in window.tracks & syllabusStructure.
 *    - Applies hierarchical sorting: priority ASC (default 3), then order ASC (default 999).
 * 2. Global Programs Taxonomy Resolution (getAllPrograms):
 *    - Aggregates custom programs across all tracks defined in window.tracks & window.customPrograms.
 *    - Enriches programs with _trackId and _trackName.
 *    - Applies hierarchical sorting: priority ASC (default 999), then order ASC (default 999).
 * 3. Track-Specific Sorting & Filtering:
 *    - getSortedPrograms(track): Resolves programs for a specific track.
 *    - sortAllSubjects(subjects, track): Sorts an array of subject definitions.
 *    - getSortedTrackSubjects(track): Resolves subjects for a specific track.
 *
 * State & Compatibility:
 * - Reads window.tracks, window.syllabusStructure, window.customPrograms.
 * - Exposes methods on Taxonomy namespace, window, global, and module.exports.
 */

(function (global) {
    'use strict';

    const window = global;

    /**
     * Aggregates and sorts all subjects across all configured tracks
     */
    function getAllSubjects() {
        const tracks = (typeof window !== 'undefined' && window.tracks)
            || (typeof global !== 'undefined' && global.tracks)
            || [];
        const syllabus = (typeof window !== 'undefined' && window.syllabusStructure)
            || (typeof global !== 'undefined' && global.syllabusStructure)
            || (typeof syllabusStructure !== 'undefined' ? syllabusStructure : {});

        let all = [];
        tracks.forEach(t => {
            if (t && t.id && syllabus[t.id]) {
                all = all.concat(syllabus[t.id]);
            }
        });

        return all.sort((a, b) => {
            const pA = a.priority !== undefined ? a.priority : 3;
            const pB = b.priority !== undefined ? b.priority : 3;
            if (pA !== pB) return pA - pB;
            const oA = a.order !== undefined ? a.order : 999;
            const oB = b.order !== undefined ? b.order : 999;
            return oA - oB;
        });
    }

    /**
     * Aggregates and sorts all custom programs across all configured tracks
     */
    function getAllPrograms() {
        const tracks = (typeof window !== 'undefined' && window.tracks)
            || (typeof global !== 'undefined' && global.tracks)
            || [];
        const programs = (typeof window !== 'undefined' && window.customPrograms)
            || (typeof global !== 'undefined' && global.customPrograms)
            || (typeof customPrograms !== 'undefined' ? customPrograms : {});

        let all = [];
        tracks.forEach(t => {
            if (t && t.id && programs[t.id]) {
                programs[t.id].forEach(p => {
                    all.push({ ...p, _trackId: t.id, _trackName: t.name });
                });
            }
        });

        return all.sort((a, b) => {
            const pA = a.priority !== undefined ? a.priority : 999;
            const pB = b.priority !== undefined ? b.priority : 999;
            if (pA !== pB) return pA - pB;
            const oA = a.order !== undefined ? a.order : 999;
            const oB = b.order !== undefined ? b.order : 999;
            return oA - oB;
        });
    }

    /**
     * Resolves sorted programs for a specific track ID
     */
    function getSortedPrograms(track) {
        const programs = (typeof window !== 'undefined' && window.customPrograms)
            || (typeof global !== 'undefined' && global.customPrograms)
            || (typeof customPrograms !== 'undefined' ? customPrograms : {});

        if (!programs || !programs[track]) return [];
        return [...programs[track]];
    }

    /**
     * Sorts an arbitrary array of subjects by priority and order
     */
    function sortAllSubjects(subjects, track) {
        if (!Array.isArray(subjects)) return [];
        return [...subjects].sort((a, b) => {
            const pA = a.priority !== undefined ? a.priority : 3;
            const pB = b.priority !== undefined ? b.priority : 3;
            if (pA !== pB) return pA - pB;
            const oA = a.order !== undefined ? a.order : 999;
            const oB = b.order !== undefined ? b.order : 999;
            return oA - oB;
        });
    }

    /**
     * Resolves sorted subjects for a specific track ID
     */
    function getSortedTrackSubjects(track) {
        const syllabus = (typeof window !== 'undefined' && window.syllabusStructure)
            || (typeof global !== 'undefined' && global.syllabusStructure)
            || (typeof syllabusStructure !== 'undefined' ? syllabusStructure : {});

        if (!syllabus || !syllabus[track]) return [];
        return [...syllabus[track]];
    }

    const Taxonomy = {
        getAllSubjects,
        getAllPrograms,
        getSortedPrograms,
        sortAllSubjects,
        getSortedTrackSubjects
    };

    // Global environment compatibility
    if (typeof window !== 'undefined') {
        window.Taxonomy = Taxonomy;
        window.getAllSubjects = getAllSubjects;
        window.getAllPrograms = getAllPrograms;
        window.getSortedPrograms = getSortedPrograms;
        window.sortAllSubjects = sortAllSubjects;
        window.getSortedTrackSubjects = getSortedTrackSubjects;
    }
    if (typeof global !== 'undefined') {
        global.Taxonomy = Taxonomy;
        global.getAllSubjects = getAllSubjects;
        global.getAllPrograms = getAllPrograms;
        global.getSortedPrograms = getSortedPrograms;
        global.sortAllSubjects = sortAllSubjects;
        global.getSortedTrackSubjects = getSortedTrackSubjects;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Taxonomy;
    }

})(typeof window !== 'undefined' ? window : global);
