// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppDataSnapshot } from './firestoreData';
import { commitChanges, loadAllFromFirestore } from './firestoreData';
import { FIRESTORE_COLLECTIONS } from './firestoreProfile';
import type { FirestoreUser } from './firestoreProfile';
import { SAVE_DELAY_MS } from './firestoreSyncConstants';
import { useFirestoreSyncPersist } from './useFirestoreSyncPersist';

vi.mock('../config/firebase', () => ({ auth: null, db: { __fake: true } }));
vi.mock('./firestoreData', () => ({
  commitChanges: vi.fn(async () => undefined),
  importBrowserSnapshotToFirestore: vi.fn(),
  loadAllFromFirestore: vi.fn(async () => null),
}));

const adminProfile = { uid: 'a1', email: 'admin@test.no', role: 'admin', displayName: 'Admin' } as unknown as FirestoreUser;

/** Komplett snapshot med tomme lister, overstyres per test. */
function snapshot(overrides: Partial<Record<string, unknown>> = {}): AppDataSnapshot {
  return {
    coordinators: [],
    children: [],
    sponsors: [{ id: 's1', navn: 'Ola' }],
    catalogPhotos: [],
    mediaLibrary: [],
    facts: [],
    reports: [],
    milestones: [],
    inquiries: [],
    payments: [],
    sponsorAssignments: [],
    campaigns: [],
    testimonials: [],
    notifications: [],
    auditLogs: [],
    emailOutbox: [],
    cms: {},
    emailAutoSend: {},
    ...overrides,
  } as unknown as AppDataSnapshot;
}

const DB_DATA = { sponsors: [{ id: 's1', navn: 'Ola' }], auditLogs: [] };

function setup() {
  const setHydration = vi.fn();
  const hook = renderHook(() =>
    useFirestoreSyncPersist({
      firestoreUserProfile: adminProfile,
      setHydration: setHydration as never,
      markFullLoadedAfterImport: vi.fn(),
      onSignOutReset: vi.fn(),
    })
  );
  act(() => {
    hook.result.current.confirmHydrated(DB_DATA as never, { enableSave: true });
  });
  return { ...hook, setHydration };
}

/** Lar lagringsforsinkelsen løpe ut og alle asynkrone steg fullføres. */
async function runSaveTimer() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SAVE_DELAY_MS + 10);
  });
}

function committedChanges(): { collection: string; id: string }[] {
  const calls = vi.mocked(commitChanges).mock.calls;
  return calls.flatMap((c) => (c[1] as { collection: string; id: string }[]) ?? []);
}

describe('useFirestoreSyncPersist: skrivebeskyttet visning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(commitChanges).mockClear();
    vi.mocked(loadAllFromFirestore).mockReset();
    vi.mocked(loadAllFromFirestore).mockResolvedValue(null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lagrer endringer normalt når ikke skrivebeskyttet', async () => {
    const { result } = setup();
    act(() => {
      result.current.schedulePersist(snapshot({ sponsors: [{ id: 's1', navn: 'Ola Nordmann' }] }));
    });
    await runSaveTimer();
    expect(commitChanges).toHaveBeenCalledTimes(1);
    expect(committedChanges().some((c) => c.collection === 'sponsors' && c.id === 's1')).toBe(true);
  });

  it('i skrivebeskyttet modus lagres bare vis-som-loggen', async () => {
    const { result } = setup();
    act(() => result.current.enterReadOnly());
    expect(result.current.readOnly).toBe(true);

    act(() => {
      result.current.schedulePersist(
        snapshot({
          sponsors: [{ id: 's1', navn: 'Endret av admin' }],
          auditLogs: [{ id: 'log-1', handling: 'Så siden som fadder' }],
        })
      );
    });
    await runSaveTimer();

    expect(commitChanges).toHaveBeenCalledTimes(1);
    const changes = committedChanges();
    expect(changes).toHaveLength(1);
    expect(changes[0].collection).toBe(FIRESTORE_COLLECTIONS.auditLogs);
    expect(changes[0].id).toBe('log-1');
  });

  it('endringer som ikke er logg gir ingen lagring og ingen beforeunload-advarsel', async () => {
    const { result } = setup();
    act(() => result.current.enterReadOnly());
    act(() => {
      result.current.schedulePersist(snapshot({ sponsors: [{ id: 's1', navn: 'Endret' }] }));
    });
    await runSaveTimer();
    expect(commitChanges).not.toHaveBeenCalled();

    const ev = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('saveNow gjør ingenting mens skrivebeskyttet', async () => {
    const { result } = setup();
    act(() => result.current.enterReadOnly());
    act(() => {
      result.current.schedulePersist(snapshot({ sponsors: [{ id: 's1', navn: 'Endret' }] }));
    });
    await act(async () => {
      await result.current.saveNow();
    });
    expect(commitChanges).not.toHaveBeenCalled();
  });

  it('exitReadOnly laster fra databasen og slår på lagring igjen', async () => {
    const { result, setHydration } = setup();
    act(() => result.current.enterReadOnly());
    vi.mocked(loadAllFromFirestore).mockResolvedValue(DB_DATA as never);

    await act(async () => {
      await result.current.exitReadOnly();
    });
    expect(setHydration).toHaveBeenCalledWith({ data: DB_DATA, full: true });
    // Still skrivebeskyttet til innholdet faktisk er tatt inn i appen
    expect(result.current.readOnly).toBe(true);

    act(() => result.current.confirmHydrated(DB_DATA as never, { enableSave: true }));
    expect(result.current.readOnly).toBe(false);

    act(() => {
      result.current.schedulePersist(snapshot({ sponsors: [{ id: 's1', navn: 'Lagres igjen' }] }));
    });
    await runSaveTimer();
    expect(commitChanges).toHaveBeenCalledTimes(1);
  });

  it('exitReadOnly forblir skrivebeskyttet og viser feil når innlasting feiler', async () => {
    const { result } = setup();
    act(() => result.current.enterReadOnly());
    vi.mocked(loadAllFromFirestore).mockResolvedValue(null);

    await act(async () => {
      await result.current.exitReadOnly();
    });
    expect(result.current.readOnly).toBe(true);
    expect(result.current.saveStatus.state).toBe('error');
    expect(result.current.saveStatus.error).toBe(
      'Kunne ikke laste data på nytt etter visning. Last siden på nytt.'
    );
  });
});
