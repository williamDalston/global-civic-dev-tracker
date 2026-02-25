import { describe, it, expect } from 'vitest';
import { checkNarrativeQuality, checkUniqueness } from '@/lib/etl/ai/quality-gate';

describe('checkNarrativeQuality', () => {
  // Generate long text with sufficient unique sentences to avoid repetitiveness check
  const longText = Array.from({ length: 100 }, (_, i) =>
    `Sentence number ${i} covers a different topic about urban development in area ${i}.`
  ).join(' ');

  it('passes for long enough text without issues', () => {
    const result = checkNarrativeQuality(longText);
    expect(result.passed).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('fails for short text', () => {
    const result = checkNarrativeQuality('This is too short.');
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes('Word count'))).toBe(true);
  });

  it('fails for AI self-reference', () => {
    const text = longText + ' As an AI language model, I cannot provide real data.';
    const result = checkNarrativeQuality(text);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes('AI self-reference'))).toBe(true);
  });

  it('fails for markdown formatting', () => {
    const text = '## Heading\n\n' + longText;
    const result = checkNarrativeQuality(text);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes('markdown'))).toBe(true);
  });

  it('detects repetitive content', () => {
    const repeated = Array(10).fill('The exact same sentence is repeated here.').join('. ');
    const result = checkNarrativeQuality(repeated);
    expect(result.reasons.some((r) => r.includes('repetitive'))).toBe(true);
  });
});

describe('checkUniqueness', () => {
  it('returns 1.0 for no comparisons', () => {
    expect(checkUniqueness('some text here', [])).toBe(1.0);
  });

  it('returns high uniqueness for different texts', () => {
    const narrative = 'The new renovation project at 123 Oak Street brings modern updates to a historic neighborhood.';
    const comparisons = [
      'A large commercial development is planned for the downtown waterfront district.',
    ];
    const uniqueness = checkUniqueness(narrative, comparisons);
    expect(uniqueness).toBeGreaterThan(0.5);
  });

  it('returns low uniqueness for identical texts', () => {
    const text = 'This permit represents a significant development in the neighborhood area.';
    const uniqueness = checkUniqueness(text, [text]);
    expect(uniqueness).toBe(0);
  });
});
