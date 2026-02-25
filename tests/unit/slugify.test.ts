import { describe, it, expect } from 'vitest';
import { slugify, permitSlug } from '@/lib/utils/slugify';

describe('slugify', () => {
  it('converts text to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('Adams Morgan / U Street')).toBe('adams-morgan-u-street');
  });

  it('handles already-slugified text', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug');
  });

  it('trims whitespace', () => {
    expect(slugify('  spaces around  ')).toBe('spaces-around');
  });
});

describe('permitSlug', () => {
  it('generates slug with category prefix', () => {
    const slug = permitSlug('B2401234', 'Renovation');
    expect(slug).toBe('renovation-b2401234');
  });

  it('falls back to permit prefix when no category', () => {
    const slug = permitSlug('B2401234');
    expect(slug).toBe('permit-b2401234');
  });

  it('handles special characters in permit id', () => {
    const slug = permitSlug('DC/2024/001', 'electrical');
    expect(slug).toBe('electrical-dc-2024-001');
  });
});
