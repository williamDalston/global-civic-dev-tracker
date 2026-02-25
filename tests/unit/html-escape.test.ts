import { describe, it, expect } from 'vitest';

// Replicate the escape function used in map popups
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

describe('HTML escape for map popups', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('123 "Main" St')).toBe('123 &quot;Main&quot; St');
  });

  it('handles normal addresses unchanged', () => {
    expect(escapeHtml('123 Oak Street NW')).toBe('123 Oak Street NW');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('escapes mixed dangerous content', () => {
    expect(escapeHtml('<img onerror="alert(1)" src=x>')).toBe('&lt;img onerror=&quot;alert(1)&quot; src=x&gt;');
  });
});
