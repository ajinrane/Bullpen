/**
 * Storage utility for non-sensitive UI preferences only.
 * NEVER store identity/auth data here.
 *
 * This abstraction allows easy replacement with AsyncStorage on mobile.
 */

const STORAGE_PREFIX = 'bullpen_';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Get a UI preference value
 * @param {string} key - The preference key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} The stored value or default
 */
export const getPreference = (key, defaultValue = null) => {
  if (!isBrowser) return defaultValue;

  try {
    const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading preference ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Set a UI preference value
 * @param {string} key - The preference key
 * @param {any} value - The value to store
 */
export const setPreference = (key, value) => {
  if (!isBrowser) return;

  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving preference ${key}:`, error);
  }
};

/**
 * Remove a UI preference
 * @param {string} key - The preference key to remove
 */
export const removePreference = (key) => {
  if (!isBrowser) return;

  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch (error) {
    console.warn(`Error removing preference ${key}:`, error);
  }
};

/**
 * Clear all Bullpen preferences
 */
export const clearAllPreferences = () => {
  if (!isBrowser) return;

  try {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => window.localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing preferences:', error);
  }
};

// Allowed preference keys (whitelist for safety)
export const PREF_KEYS = {
  THEME: 'theme',
  VIEW_MODE: 'view_mode',
  SORT_BY: 'sort_by',
  SHOW_FILTERS: 'show_filters',
  LAST_WATCHLIST_SLUG: 'last_watchlist_slug', // For convenience, not identity
};

export default {
  get: getPreference,
  set: setPreference,
  remove: removePreference,
  clear: clearAllPreferences,
  KEYS: PREF_KEYS,
};
