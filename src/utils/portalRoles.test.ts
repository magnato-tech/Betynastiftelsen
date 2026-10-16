import { describe, expect, it } from 'vitest';
import { canOpenPortalRole, portalRolesForProfile } from './portalRoles';
import type { FirestoreUser } from '../db/firestoreProfile';

const admin: FirestoreUser = {
  id: 'u1',
  role: 'admin',
  email: 'a@b.no',
  displayName: 'A',
  createdAt: '',
};

const sponsor: FirestoreUser = {
  id: 'u2',
  role: 'sponsor',
  email: 's@b.no',
  displayName: 'S',
  sponsorId: 'sp-1',
  createdAt: '',
};

describe('portalRoles', () => {
  it('admin kan alle portaler', () => {
    expect(portalRolesForProfile(admin)).toEqual(['public', 'sponsor', 'coordinator', 'admin']);
    expect(canOpenPortalRole(admin, 'coordinator')).toBe(true);
  });

  it('fadder kun fadder og offentlig', () => {
    expect(canOpenPortalRole(sponsor, 'admin')).toBe(false);
    expect(canOpenPortalRole(sponsor, 'sponsor')).toBe(true);
  });
});
