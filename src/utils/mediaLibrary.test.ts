import { describe, expect, it } from 'vitest';
import { mediaItemDisplayUrl, sortMediaLibraryNewestFirst } from './mediaLibrary';
import type { MediaLibraryItem } from '../types';

describe('mediaLibrary', () => {
  it('legger til / for relative filnavn', () => {
    expect(mediaItemDisplayUrl('IMG_1194.jpg')).toBe('/IMG_1194.jpg');
    expect(mediaItemDisplayUrl('https://x/y.jpg')).toBe('https://x/y.jpg');
  });

  it('sorterer nyeste først', () => {
    const items: MediaLibraryItem[] = [
      { id: 'a', label: 'A', url: 'a.jpg', uploadedAt: '2026-01-01' },
      { id: 'b', label: 'B', url: 'b.jpg', uploadedAt: '2026-06-01' },
    ];
    expect(sortMediaLibraryNewestFirst(items).map((i) => i.id)).toEqual(['b', 'a']);
  });
});
