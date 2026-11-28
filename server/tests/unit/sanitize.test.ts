import { describe, it, expect } from 'vitest';
import { sanitizeHtml, escapePlainText } from '../../src/utils/sanitize.js';

describe('Sanitization & XSS Protection Utility', () => {
  it('strips <script> tags and inner code', () => {
    const malicious = '<p>Normal legal text</p><script>alert("pwned")</script>';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Normal legal text</p>');
  });

  it('strips inline event handlers (onload, onerror, onclick)', () => {
    const malicious = '<img src="x" onerror="alert(1)" /><button onclick="evil()">Click</button>';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('alert(1)');
  });

  it('strips javascript: and data: pseudo-protocols', () => {
    const malicious = '<a href="javascript:alert(1)">Link</a><a href="data:text/html,<script>alert(1)</script>">Bad</a>';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('data:');
  });

  it('strips iframes, embeds, and objects', () => {
    const malicious = '<p>Safe</p><iframe src="https://evil.com"></iframe><embed src="flash.swf">';
    const result = sanitizeHtml(malicious);
    expect(result).not.toContain('iframe');
    expect(result).not.toContain('embed');
    expect(result).toContain('<p>Safe</p>');
  });

  it('preserves legitimate legal markup formatting', () => {
    const safe = '<h3>Section 1.0</h3><p>The party agrees to <strong>confidentiality</strong> and <em>non-disclosure</em>.</p><ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeHtml(safe);
    expect(result).toBe(safe);
  });

  it('escapePlainText turns angle brackets and quotes into safe HTML entities', () => {
    const text = 'Notice <Company & Partners> "Special"';
    const escaped = escapePlainText(text);
    expect(escaped).toBe('Notice &lt;Company &amp; Partners&gt; &quot;Special&quot;');
  });
});
