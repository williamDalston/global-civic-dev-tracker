import { describe, it, expect } from 'vitest';
import { timingSafeEqual, verifyAuth } from '@/lib/config/env';

describe('timingSafeEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqual('secret123', 'secret123')).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(timingSafeEqual('secret123', 'secret456')).toBe(false);
  });

  it('returns false for different lengths', () => {
    expect(timingSafeEqual('short', 'longer-string')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });

  it('returns false for single character difference', () => {
    expect(timingSafeEqual('abcdef', 'abcdeg')).toBe(false);
  });

  // Regression: old code compared dummy[i] ^ dummy[i] (always 0) for mismatched lengths
  it('returns false when a is prefix of b', () => {
    expect(timingSafeEqual('abc', 'abcdef')).toBe(false);
  });

  it('returns false when b is prefix of a', () => {
    expect(timingSafeEqual('abcdef', 'abc')).toBe(false);
  });

  it('returns false for completely different lengths', () => {
    expect(timingSafeEqual('x', 'this-is-much-longer')).toBe(false);
  });
});

describe('verifyAuth', () => {
  it('returns false when secret is undefined', () => {
    expect(verifyAuth('Bearer token', undefined)).toBe(false);
  });

  it('returns false when auth header is null', () => {
    expect(verifyAuth(null, 'my-secret')).toBe(false);
  });

  it('returns true for valid Bearer token', () => {
    expect(verifyAuth('Bearer my-secret', 'my-secret')).toBe(true);
  });

  it('returns false for wrong Bearer token', () => {
    expect(verifyAuth('Bearer wrong-token', 'my-secret')).toBe(false);
  });

  it('handles token without Bearer prefix', () => {
    expect(verifyAuth('my-secret', 'my-secret')).toBe(true);
  });

  it('returns false when both are undefined/null', () => {
    expect(verifyAuth(null, undefined)).toBe(false);
  });

  // Regression: verify length-mismatch tokens are rejected via timingSafeEqual
  it('returns false when token is a prefix of the secret', () => {
    expect(verifyAuth('Bearer sec', 'secret123')).toBe(false);
  });

  it('returns false when token is longer than secret', () => {
    expect(verifyAuth('Bearer secret123-extra-long', 'secret123')).toBe(false);
  });
});
