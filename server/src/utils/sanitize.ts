/**
 * Agree2Met — HTML & Text Sanitization Utility
 *
 * Protects legal clauses and user descriptions against XSS attacks while
 * preserving safe formatting elements (paragraphs, bold, italic, headings, lists).
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<embed\b[^>]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<applet\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, // onmouseover, onclick, onload, etc.
  /javascript\s*:[^"'>]*/gi,
  /data\s*:[^"'>]*/gi,
  /vbscript\s*:[^"'>]*/gi,
];

/**
 * Strips script tags, active content, and javascript handlers from text/HTML.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';

  let sanitized = String(input);

  // Strip all known dangerous elements and handlers
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove dangerous HTML entities that might hide javascript:
  sanitized = sanitized.replace(/&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;/gi, '');
  sanitized = sanitized.replace(/&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;/gi, '');

  return sanitized.trim();
}

/**
 * Escapes characters for plain-text storage when no HTML is permitted.
 */
export function escapePlainText(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}
