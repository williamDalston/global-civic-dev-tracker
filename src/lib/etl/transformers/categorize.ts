import { PERMIT_CATEGORIES } from '@/lib/config/constants';

const VALID_CATEGORIES = new Set(Object.keys(PERMIT_CATEGORIES));

export function ensureValidCategory(category: string): string {
  if (VALID_CATEGORIES.has(category)) return category;

  // Fuzzy match
  const lower = category.toLowerCase();
  for (const valid of VALID_CATEGORIES) {
    if (lower.includes(valid) || valid.includes(lower)) return valid;
  }

  return 'other';
}
