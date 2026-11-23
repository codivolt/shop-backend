/**
 * Builds a URL friendly slug. Persian/Arabic letters and digits are kept so
 * Persian product names still produce readable slugs.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
