/**
 * Watchlist slug utilities.
 * Isolated for easy replacement with deep links on mobile.
 */

const DEFAULT_WATCHLIST_SLUG = 'bullpen';

// Supabase auth params to ignore when parsing slug
const AUTH_PARAMS = ['access_token', 'refresh_token', 'token_type', 'expires_in', 'expires_at', 'type', 'error', 'error_description'];

/**
 * Check if URL contains only auth params (no watchlist param)
 * This happens after magic link redirect
 */
const isAuthOnlyUrl = (urlSearch, urlHash) => {
  // Check if hash contains auth tokens (Supabase puts them there)
  if (urlHash && (urlHash.includes('access_token') || urlHash.includes('error'))) {
    return true;
  }

  // Check if search params are auth-only
  if (urlSearch) {
    try {
      const params = new URLSearchParams(urlSearch);
      const keys = Array.from(params.keys());
      // If all params are auth params, this is an auth redirect
      if (keys.length > 0 && keys.every(k => AUTH_PARAMS.includes(k))) {
        return true;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  return false;
};

/**
 * Parse watchlist slug from URL or params
 * @param {object} options - Options object
 * @param {string} options.urlSearch - URL search string (e.g., window.location.search)
 * @param {string} options.urlHash - URL hash string (e.g., window.location.hash)
 * @param {string} options.deepLinkSlug - Slug from deep link (mobile)
 * @returns {string} The watchlist slug
 */
export const parseWatchlistSlug = ({ urlSearch = '', urlHash = '', deepLinkSlug = null } = {}) => {
  // Priority: deep link > URL param > default
  if (deepLinkSlug) {
    return deepLinkSlug;
  }

  // If this is an auth-only URL (magic link redirect), use default
  if (isAuthOnlyUrl(urlSearch, urlHash)) {
    console.log('Auth redirect detected, using default watchlist');
    return DEFAULT_WATCHLIST_SLUG;
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
