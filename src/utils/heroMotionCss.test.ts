import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('hero motion CSS', () => {
  it('slår av zoom og CTA-enter ved prefers-reduced-motion', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('.hero-image-slow-zoom');
    expect(css).toContain('.hero-cta-enter-lg');
  });
});
