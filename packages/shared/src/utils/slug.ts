/**
 * Generates a URL-safe slug from a string.
 *
 * @param input - The string to convert to a slug
 * @returns A URL-safe slug (lowercase, hyphens, no special characters)
 *
 * @example
 * generateSlug('Beautiful Villa in Tel Aviv') // => 'beautiful-villa-in-tel-aviv'
 * generateSlug('Apartment #42 -- City Center!') // => 'apartment-42-city-center'
 */
export function generateSlug(input: string): string {
  return input
    .toString()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (except spaces and hyphens)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens
}

/**
 * Generates a unique slug by appending a suffix if needed.
 *
 * @param input - The string to convert to a slug
 * @param existingSlugs - An array of existing slugs to check against
 * @returns A unique slug
 */
export function generateUniqueSlug(input: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(input);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let slug = `${baseSlug}-${counter}`;
  while (existingSlugs.includes(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}
