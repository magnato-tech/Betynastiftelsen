import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ensureFirestoreUserOnLogin } from './firestoreUser';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteField: vi.fn(),
}));

const DB = {} as Firestore;
const UID = 'uid-1';
const EMAIL = 'Synelle@Example.com';
const DIR_ID = 'synelle@example.com';

/** Dokumentdata per sti, f.eks. `users/uid-1` → data eller undefined (finnes ikke). */
let dokumenter: Record<string, Record<string, unknown> | undefined>;

beforeEach(() => {
  vi.clearAllMocks();
  dokumenter = {};
  vi.mocked(doc).mockImplementation(((_db: unknown, col: string, id: string) =>
    `${col}/${id}`) as unknown as typeof doc);
  vi.mocked(getDoc).mockImplementation((async (ref: unknown) => {
    const data = dokumenter[ref as string];
    return { exists: () => data !== undefined, data: () => data };
  }) as unknown as typeof getDoc);
  vi.mocked(setDoc).mockResolvedValue(undefined);
  vi.mocked(updateDoc).mockResolvedValue(undefined);
  vi.mocked(deleteField).mockReturnValue('__delete__' as unknown as ReturnType<typeof deleteField>);
});

describe('ensureFirestoreUserOnLogin', () => {
  it('a: synkroniserer endrede felt fra katalogen og fjerner sponsorId', async () => {
    dokumenter[`users/${UID}`] = {
      id: UID,
      role: 'sponsor',
      email: DIR_ID,
      displayName: 'Gammelt navn',
      sponsorId: 'S1',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    dokumenter[`userDirectory/${DIR_ID}`] = {
      email: DIR_ID,
      role: 'admin',
      displayName: 'Synelle',
      status: 'aktiv',
    };

    const result = await ensureFirestoreUserOnLogin(DB, UID, EMAIL, null);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(vi.mocked(updateDoc).mock.calls[0][1]).toEqual({
      role: 'admin',
      displayName: 'Synelle',
      sponsorId: '__delete__',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.role).toBe('admin');
    expect(result.profile.displayName).toBe('Synelle');
    expect(result.profile).not.toHaveProperty('sponsorId');
  });

  it('b: skriver ikke når profilen allerede samsvarer med katalogen', async () => {
    dokumenter[`users/${UID}`] = {
      id: UID,
      role: 'coordinator',
      email: DIR_ID,
      displayName: 'Synelle',
      coordinatorId: 'K1',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    dokumenter[`userDirectory/${DIR_ID}`] = {
      email: DIR_ID,
      role: 'coordinator',
      displayName: 'Synelle',
      coordinatorId: 'K1',
      status: 'aktiv',
    };

    const result = await ensureFirestoreUserOnLogin(DB, UID, EMAIL, null);

    expect(updateDoc).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it('c: updateDoc feiler, men innlogging lykkes med lagret profil', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(updateDoc).mockRejectedValue(new Error('permission-denied'));
    const lagret = {
      id: UID,
      role: 'sponsor',
      email: DIR_ID,
      displayName: 'Gammelt navn',
      sponsorId: 'S1',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    dokumenter[`users/${UID}`] = lagret;
    dokumenter[`userDirectory/${DIR_ID}`] = {
      email: DIR_ID,
      role: 'admin',
      displayName: 'Synelle',
      status: 'aktiv',
    };

    const result = await ensureFirestoreUserOnLogin(DB, UID, EMAIL, null);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, profile: lagret });
    warn.mockRestore();
  });

  it('d: sperret i katalogen gir nekting og ingen oppdatering', async () => {
    dokumenter[`users/${UID}`] = {
      id: UID,
      role: 'sponsor',
      email: DIR_ID,
      displayName: 'Synelle',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    dokumenter[`userDirectory/${DIR_ID}`] = {
      email: DIR_ID,
      role: 'admin',
      displayName: 'Synelle',
      status: 'sperret',
    };

    const result = await ensureFirestoreUserOnLogin(DB, UID, EMAIL, null);

    expect(result).toEqual({ ok: false, reason: 'sperret' });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('e: ny profil uten koblings-id-er inneholder ingen undefined-verdier', async () => {
    dokumenter[`userDirectory/${DIR_ID}`] = {
      email: DIR_ID,
      role: 'sponsor',
      displayName: 'Synelle',
      status: 'aktiv',
    };

    const result = await ensureFirestoreUserOnLogin(DB, UID, EMAIL, null);

    expect(setDoc).toHaveBeenCalledTimes(1);
    const data = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
    expect(Object.values(data).every((v) => v !== undefined)).toBe(true);
    expect(data).not.toHaveProperty('coordinatorId');
    expect(data).not.toHaveProperty('sponsorId');
    expect(result.ok).toBe(true);
  });
});
