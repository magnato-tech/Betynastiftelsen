import { describe, expect, it } from 'vitest';
import { defaultPortalSection, defaultPortalSectionForProfile } from './portalSession';

describe('portalSession', () => {
  it('velger startfane per rolle', () => {
    expect(defaultPortalSection('admin')).toBe('godkjenning');
    expect(defaultPortalSection('coordinator')).toBe('eleves');
    expect(defaultPortalSection('sponsor')).toBe('barn');
    expect(defaultPortalSection('public')).toBe('home');
  });

  it('bruker profilens rolle', () => {
    expect(
      defaultPortalSectionForProfile({
        id: 'u1',
        role: 'sponsor',
        email: 'a@b.no',
        displayName: 'A',
        sponsorId: 'sponsor-1',
        createdAt: '',
      })
    ).toBe('barn');
  });
});
