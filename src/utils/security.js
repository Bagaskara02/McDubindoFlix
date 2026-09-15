/**
 * Security utilities for McDubindoFlix
 * Protects against XSS, open redirects, URL injection, and unsafe protocol handlers.
 */

// Allowed safe protocols
const SAFE_PROTOCOLS = new Set(['https:', 'http:']);

/**
 * Validates and sanitizes a URL before passing it to href, src, or iframe.
 * Prevents javascript:, data:, vbscript:, and file: injection attacks.
 */
export function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();

  // Allow relative URLs starting with / (except protocol-relative //)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (SAFE_PROTOCOLS.has(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    // Malformed URL
  }

  return fallback;
}

/**
 * Sanitizes movie/content ID to prevent iframe or query parameter injection.
 * Only allows alphanumeric, hyphen, and underscore.
 */
export function sanitizeId(id) {
  if (!id) return '';
  const str = String(id).trim();
  // Strip any characters that are not letters, digits, underscores, or hyphens
  return str.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Sanitizes user input string: strips dangerous control characters
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  // Remove ASCII control characters (0-31, 127) except standard newline and tab
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}
