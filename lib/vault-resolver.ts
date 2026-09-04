import { ClientGallery } from './types';
import { INITIAL_DEMO_GALLERIES, getGalleries } from './storage';

/**
 * Standardizes a string into a clean URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves a gallery from the demo initial galleries list or an optional custom list.
 * Works on both server and client environments.
 */
export function resolveGalleryFromMasterList(
  idOrSlug: string,
  customList?: ClientGallery[]
): ClientGallery | undefined {
  if (!idOrSlug) return undefined;

  const normalized = idOrSlug.trim().toLowerCase();
  const list = customList && customList.length > 0 ? customList : INITIAL_DEMO_GALLERIES;

  // 1. Direct match on ID
  const directIdMatch = list.find((g) => g.id.toLowerCase() === normalized);
  if (directIdMatch) return directIdMatch;

  // 2. Direct match on vanitySlug
  const directSlugMatch = list.find(
    (g) => g.vanitySlug && g.vanitySlug.toLowerCase() === normalized
  );
  if (directSlugMatch) return directSlugMatch;

  // 3. Fallback matching without 'gallery_' prefix (e.g. 'vogue_editorial_2026' or 'vogue-editorial-2026')
  const stripped = normalized.replace(/^gallery_/, '').replace(/[_-]/g, '');
  const prefixMatch = list.find((g) => {
    const gStripped = g.id.toLowerCase().replace(/^gallery_/, '').replace(/[_-]/g, '');
    if (gStripped === stripped) return true;
    if (g.vanitySlug && g.vanitySlug.toLowerCase().replace(/[_-]/g, '') === stripped) return true;
    return false;
  });
  if (prefixMatch) return prefixMatch;

  // 4. Client-name or title slug matching
  const semanticMatch = list.find((g) => {
    const titleSlug = slugify(g.title);
    const clientSlug = slugify(g.clientName);
    return titleSlug.includes(normalized) || clientSlug.includes(normalized) || normalized.includes(titleSlug);
  });
  if (semanticMatch) return semanticMatch;

  // 5. If run on client, check localStorage as additional fallback
  if (typeof window !== 'undefined') {
    try {
      const stored = getGalleries();
      const storedMatch = stored.find(
        (g) =>
          g.id.toLowerCase() === normalized ||
          (g.vanitySlug && g.vanitySlug.toLowerCase() === normalized)
      );
      if (storedMatch) return storedMatch;
    } catch {
      // ignore
    }
  }

  return undefined;
}

export type VaultLinkFormat = 'clean' | 'short' | 'classic';

/**
 * Builds a clean, professional vault URL without ugly query parameters.
 */
export function buildVaultUrl(
  gallery: ClientGallery,
  origin: string = '',
  format: VaultLinkFormat = 'clean',
  options?: { role?: string; pin?: string; passcode?: string }
): string {
  const base = origin.replace(/\/+$/, '');
  const slug = gallery.vanitySlug?.trim() || slugify(gallery.title) || gallery.id;

  let path = '';
  switch (format) {
    case 'clean':
      path = `/vault/${slug}`;
      break;
    case 'short':
      path = `/v/${slug}`;
      break;
    case 'classic':
      path = `/?vault=${encodeURIComponent(gallery.id)}`;
      break;
  }

  const searchParams = new URLSearchParams();
  if (options?.role && options.role !== 'primary_client') {
    searchParams.set('role', options.role);
  }
  if (options?.pin) {
    searchParams.set('pin', options.pin);
  }

  const query = searchParams.toString();
  const urlPath = format === 'classic' && query ? `${path}&${query}` : query ? `${path}?${query}` : path;
  return `${base}${urlPath}`;
}
