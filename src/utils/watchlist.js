/**
 * Watchlist slug utilities.
 * Isolated for easy replacement with deep links on mobile.
 */

const DEFAULT_WATCHLIST_SLUG = 'bullpen';

/**
 * Parse watchlist slug from URL or params
 * @param {object} options - Options object
 * @param {string} options.urlSearch - URL search string (e.g., window.location.search)
 * @param {string} options.deepLinkSlug - Slug from deep link (mobile)
 * @returns {string} The watchlist slug
 */
export const parseWatchlistSlug = ({ urlSearch = '', deepLinkSlug = null } = {}) => {
  // Priority: deep link > URL param > default
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

  return DEFAULT_WATCHLIST_SLUG;
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
  DEFAULT_SLUG: DEFAULT_WATCHLIST_SLUG,
};
