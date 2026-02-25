import { describe, it, expect } from 'vitest';
import { ensureValidCategory } from '@/lib/etl/transformers/categorize';

describe('ensureValidCategory', () => {
  it('returns exact match for known categories', () => {
    expect(ensureValidCategory('electrical')).toBe('electrical');
    expect(ensureValidCategory('plumbing')).toBe('plumbing');
    expect(ensureValidCategory('renovation')).toBe('renovation');
  });

  it('fuzzy matches partial matches', () => {
    // "new construction" contains a space, doesn't match "new-construction" via includes
    // but "fire" is contained within "fire-safety"
    expect(ensureValidCategory('fire')).toBe('fire-safety');
    expect(ensureValidCategory('roofing work')).toBe('roofing');
    expect(ensureValidCategory('general building')).toBe('general');
  });

  it('returns other for unknown categories', () => {
    expect(ensureValidCategory('completely-unknown-type')).toBe('other');
  });
});
