/**
 * X-29 Module: core/state.js
 * Master state management & hydration module
 */
import '../state.js';

export const migrateLegacyData = (typeof window !== 'undefined' && typeof window.migrateLegacyData === 'function')
    ? window.migrateLegacyData
    : ((typeof global !== 'undefined' && typeof global.migrateLegacyData === 'function') ? global.migrateLegacyData : null);

export const ensureConfigDefaults = (typeof window !== 'undefined' && typeof window.ensureConfigDefaults === 'function')
    ? window.ensureConfigDefaults
    : ((typeof global !== 'undefined' && typeof global.ensureConfigDefaults === 'function') ? global.ensureConfigDefaults : null);

export default {
    migrateLegacyData,
    ensureConfigDefaults
};
