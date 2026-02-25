import baseSlugify from 'slugify';

export function slugify(text: string): string {
  return baseSlugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function permitSlug(permitId: string, category?: string): string {
  const prefix = category ? slugify(category) : 'permit';
  const cleanId = permitId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  return `${prefix}-${cleanId}`;
}
