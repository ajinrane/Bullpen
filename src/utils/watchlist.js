/**
 * Watchlist slug utilities.
 * Isolated for easy replacement with deep links on mobile.
 */

const STORAGE_KEY = 'bullpen_last_watchlist';

/**
 * Parse watchlist slug from URL, storage, or return null
 * @param {object} options - Options object
 * @param {string} options.urlSearch - URL search string (e.g., window.location.search)
 * @param {string} options.deepLinkSlug - Slug from deep link (mobile)
 * @returns {string|null} The watchlist slug or null if none
 */
export const parseWatchlistSlug = ({ urlSearch = '', deepLinkSlug = null } = {}) => {
  // Priority: deep link > URL param > stored > null
  if (deepLinkSlug) {
    return deepLinkSlug;
  }

  // Parse from URL search params
  if (urlSearch) {
    try {
      const params = new URLSearchParams(urlSearch);
      const slug = params.get('watchlist');
      if (slug && slug.trim()) {
        return slug.trim().toLowerCase();
      }
    } catch (error) {
      console.warn('Error parsing watchlist slug:', error);
    }
  }

  // Check localStorage for last used watchlist
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        return stored.trim().toLowerCase();
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  // No watchlist found - return null
  return null;
};

/**
 * Save the current watchlist slug to storage
 * @param {string} slug - The watchlist slug to save
 */
export const saveWatchlistSlug = (slug) => {
  if (typeof window === 'undefined' || !slug) return;
  try {
    localStorage.setItem(STORAGE_KEY, slug);
  } catch (e) {
    // Ignore storage errors
  }
};

/**
 * Generate a watchlist URL
 * @param {string} slug - The watchlist slug
 * @param {string} baseUrl - Base URL (optional)
 * @returns {string} Full URL with watchlist param
 */
export const generateWatchlistUrl = (slug, baseUrl = '') => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}?watchlist=${encodeURIComponent(slug)}`;
};

/**
 * Generate a random watchlist code (6 chars, alphanumeric, no confusing chars)
 * @returns {string} Random code
 */
export const generateWatchlistCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Update browser URL with watchlist slug (web only)
 * @param {string} slug - The watchlist slug
 */
export const updateBrowserUrl = (slug) => {
  if (typeof window === 'undefined' || !window.history) return;

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('watchlist', slug);
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.warn('Error updating browser URL:', error);
  }
};

export default {
  parse: parseWatchlistSlug,
  generateUrl: generateWatchlistUrl,
  generateCode: generateWatchlistCode,
  updateUrl: updateBrowserUrl,
  saveSlug: saveWatchlistSlug,
};
