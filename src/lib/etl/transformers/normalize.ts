import type { UniversalPermit } from '@/types';
import { permitSlug } from '@/lib/utils/slugify';

export function normalizePermit(permit: UniversalPermit): UniversalPermit & { slug: string } {
  return {
    ...permit,
    propertyAddress: normalizeAddress(permit.propertyAddress),
    workDescription: permit.workDescription?.trim() || null,
    permitCategory: permit.permitCategory.toLowerCase(),
    slug: permitSlug(permit.globalPermitId, permit.permitCategory),
  };
}

function normalizeAddress(address: string): string {
  return address
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
}
