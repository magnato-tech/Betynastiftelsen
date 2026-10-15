import { describe, expect, it } from 'vitest';
import {
  CMS_PUBLIC_DOC_ID,
  FIRESTORE_COLLECTIONS,
  FIRESTORE_IMPORT_ORDER,
  FIRESTORE_INDEXES,
  FIRESTORE_RELATIONS,
  SETTINGS_EMAIL_DOC_ID,
  SYSTEM_SEED_LOCK_DOC_ID,
} from './firestoreProfile';

describe('Firestore-profil', () => {
  it('har samling for alle kjerneobjekter', () => {
    expect(Object.keys(FIRESTORE_COLLECTIONS)).toEqual(
      expect.arrayContaining([
        'children',
        'sponsors',
        'coordinators',
        'facts',
        'reports',
        'campaigns',
        'catalogPhotos',
        'users',
      ])
    );
  });

  it('importrekkefølge starter med koordinatorer før barn', () => {
    expect(FIRESTORE_IMPORT_ORDER[0]).toBe('coordinators');
    expect(FIRESTORE_IMPORT_ORDER.indexOf('children')).toBeGreaterThan(
      FIRESTORE_IMPORT_ORDER.indexOf('coordinators')
    );
  });

  it('CMS er ett dokument', () => {
    expect(CMS_PUBLIC_DOC_ID).toBe('public');
    expect(FIRESTORE_INDEXES.some((i) => i.collection === 'facts')).toBe(true);
  });

  it('har relasjoner for barn–fadder–koordinator og seed-lås utenom innhold', () => {
    expect(FIRESTORE_RELATIONS.some((r) => r.from === 'children' && r.to === 'sponsors')).toBe(true);
    expect(FIRESTORE_RELATIONS.some((r) => r.from === 'sponsors' && r.field === 'tildeltBarnIds[]')).toBe(
      true
    );
    expect(FIRESTORE_COLLECTIONS.system).toBe('system');
    expect(SYSTEM_SEED_LOCK_DOC_ID).toBe('seedLock');
    expect(SETTINGS_EMAIL_DOC_ID).toBe('emailAutoSend');
    const names = Object.values(FIRESTORE_COLLECTIONS);
    expect(FIRESTORE_RELATIONS.every((r) => names.includes(r.from) && names.includes(r.to))).toBe(true);
  });
});
