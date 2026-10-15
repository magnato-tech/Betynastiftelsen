import { describe, expect, it } from 'vitest';
import {
  CMS_PUBLIC_DOC_ID,
  FIRESTORE_COLLECTIONS,
  FIRESTORE_IMPORT_ORDER,
  FIRESTORE_INDEXES,
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
});
