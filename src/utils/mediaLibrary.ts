import type { MediaLibraryItem } from '../types';

/** Visnings-URL for lagret bilde (relativ fil, data-URL, https eller Storage). */
export function mediaItemDisplayUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function sortMediaLibraryNewestFirst(items: MediaLibraryItem[]): MediaLibraryItem[] {
  return [...items].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
