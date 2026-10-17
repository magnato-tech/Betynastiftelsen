import { describe, expect, it } from 'vitest';
import { isAdminOppfolgingSection, normalizeOppfolgingTab } from './adminOppfolging';

describe('adminOppfolging', () => {
  it('gjenkjenner oppfølgingsseksjoner', () => {
    expect(isAdminOppfolgingSection('godkjenning')).toBe(true);
    expect(isAdminOppfolgingSection('sporsmaal')).toBe(true);
    expect(isAdminOppfolgingSection('logg')).toBe(true);
    expect(isAdminOppfolgingSection('cms')).toBe(false);
  });

  it('normaliserer home til godkjenning', () => {
    expect(normalizeOppfolgingTab('home')).toBe('godkjenning');
  });
});
