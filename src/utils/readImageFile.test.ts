// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readImageFileAsDataUrl } from './readImageFile';

const file = (bytes: number, type: string, name = 'f') => new File([new Uint8Array(bytes).fill(65)], name, { type });

describe('readImageFileAsDataUrl', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/heic'])('godtar %s', async (type) => {
    const url = await readImageFileAsDataUrl(file(10, type));
    expect(url.startsWith(`data:${type}`)).toBe(true);
  });
  it.each(['application/pdf', 'text/plain', 'text/html', 'application/javascript', 'video/mp4', ''])('avviser "%s"', async (type) => {
    await expect(readImageFileAsDataUrl(file(10, type))).rejects.toThrow('Not an image');
  });
  it('gir base64-innhold som kan dekodes', async () => {
    const url = await readImageFileAsDataUrl(file(3, 'image/png'));
    expect(url).toBe('data:image/png;base64,QUFB');
  });
  it('tom bildefil gir gyldig (tom) data-URL', async () => {
    const url = await readImageFileAsDataUrl(file(0, 'image/png'));
    expect(url).toMatch(/^data:image\/png/);
  });
  it('KJENT AVVIK F-28: ingen stoerrelsesgrense - 3 MB bilde gir 4 MB tekst som skal inn i ett databasedokument (maks 1 MB)', async () => {
    const url = await readImageFileAsDataUrl(file(3 * 1024 * 1024, 'image/jpeg'));
    expect(url.length).toBeGreaterThan(1024 * 1024);
  });
  it('KJENT AVVIK F-28: SVG godtas som bilde (kan inneholde script)', async () => {
    const svg = new File(['<svg onload="alert(1)"></svg>'], 'x.svg', { type: 'image/svg+xml' });
    await expect(readImageFileAsDataUrl(svg)).resolves.toContain('data:image/svg+xml');
  });
  it('type fra filnavn alene (uten MIME) godtas ikke', async () => {
    await expect(readImageFileAsDataUrl(file(5, '', 'bilde.png'))).rejects.toThrow();
  });
});
