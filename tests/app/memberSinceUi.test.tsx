// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCoordinator, makeSponsor } from '../../src/test/testData';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));
vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  onSnapshot: () => () => undefined,
}));
vi.mock('../../src/config/firebase', () => ({ db: null }));
vi.mock('../../src/config/bootstrapAdmins', () => ({ BOOTSTRAP_ADMIN_EMAILS: [] }));
vi.mock('../../src/db/firestoreData', () => ({ saveUserDirectoryEntry: vi.fn() }));
vi.mock('../../src/components/admin/UserDirectoryInviteForm', () => ({
  UserDirectoryInviteForm: () => null,
}));

import { AdminUsersPanel } from '../../src/components/admin/AdminUsersPanel';

const setApp = (sponsors = defaultSponsors()) => {
  const fns = {
    updateSponsor: vi.fn(),
    updateCoordinator: vi.fn(),
    addPersonComment: vi.fn(),
    deactivatePerson: vi.fn(async () => undefined),
    reactivatePerson: vi.fn(async () => undefined),
    deletePerson: vi.fn(async () => undefined),
    updateUserDirectoryStatus: vi.fn(async () => undefined),
    inviteUserToDirectory: vi.fn(async () => undefined),
    addSponsor: vi.fn(),
    markSponsorOnboardingDone: vi.fn(),
  };
  appState.value = {
    coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann', epost: 'kari@example.com' })],
    sponsors,
    childrenList: [],
    auditLogs: [],
    reports: [],
    fieldFacts: [],
    milestones: [],
    inquiries: [],
    payments: [],
    sponsorAssignments: [],
    campaigns: [],
    recurringCharges: [],
    paymentAllocations: [],
    firestoreEnabled: false,
    firestoreUserEmail: null,
    ...fns,
  };
  return fns;
};

const defaultSponsors = () => [
  makeSponsor({ id: 's1', navn: 'Fadder A', epost: 'a@example.com', startDato: '2024-03-01' }),
  makeSponsor({ id: 's2', navn: 'Fadder B', epost: 'b@example.com', startDato: '2026-01-01' }),
  makeSponsor({ id: 's3', navn: 'Fadder C', epost: 'c@example.com', startDato: '2025-06-01' }),
  makeSponsor({ id: 's4', navn: 'Fadder D', epost: 'd@example.com', startDato: '' }),
];

/** Rader i tabellen (tbody), i visningsrekkefølge. */
const radene = () => Array.from(document.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
const rad = (navn: string) => radene().find((r) => r.textContent?.includes(navn)) as HTMLTableRowElement;
const rekkefolge = (navn: string[]) =>
  [...navn].sort((a, b) => radene().findIndex((r) => r.textContent?.includes(a)) - radene().findIndex((r) => r.textContent?.includes(b)));

beforeEach(() => {
  setApp();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('brukerlisten: kolonnen Med siden', () => {
  it('viser dato og varighet for fadder, og — for koordinator', () => {
    render(<AdminUsersPanel />);

    const fadder = within(rad('Fadder A'));
    expect(fadder.getByText('1. mars 2024')).toBeTruthy();
    expect(fadder.getByText(/mnd|år/)).toBeTruthy();

    const koord = within(rad('Kari Nordmann'));
    const streker = koord.getAllByText('—');
    expect(streker.length).toBeGreaterThan(0);
    expect(koord.queryByText(/mnd|år/)).toBeNull();
  });

  it('arkivert fadder viser perioden fra–til', () => {
    setApp([makeSponsor({ id: 's9', navn: 'Fadder Arkiv', epost: 'x@example.com', startDato: '2024-03-01', avsluttet: '2026-10-03' })]);
    render(<AdminUsersPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Arkivert \(/ }));

    expect(within(rad('Fadder Arkiv')).getByText('1. mars 2024 – 3. oktober 2026')).toBeTruthy();
  });

  it('sorteringsknappen bytter mellom eldst og nyest først, og rader uten dato havner sist', () => {
    render(<AdminUsersPanel />);
    const header = screen.getByRole('button', { name: 'Med siden' }).closest('th') as HTMLElement;
    expect(header.getAttribute('aria-sort')).toBe('none');

    fireEvent.click(screen.getByRole('button', { name: 'Med siden' }));
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(rekkefolge(['Fadder A', 'Fadder B', 'Fadder C'])).toEqual(['Fadder A', 'Fadder C', 'Fadder B']);
    // Fadder D (ingen dato) og koordinatoren kommer etter alle med dato.
    const idx = (n: string) => radene().findIndex((r) => r.textContent?.includes(n));
    expect(idx('Fadder D')).toBeGreaterThan(idx('Fadder B'));
    expect(idx('Kari Nordmann')).toBeGreaterThan(idx('Fadder B'));

    fireEvent.click(screen.getByRole('button', { name: 'Med siden' }));
    expect(header.getAttribute('aria-sort')).toBe('descending');
    expect(rekkefolge(['Fadder A', 'Fadder B', 'Fadder C'])).toEqual(['Fadder B', 'Fadder C', 'Fadder A']);
  });
});

describe('personkort: startdato', () => {
  const aapnFadder = (navn: string) => {
    fireEvent.click(screen.getByText(navn));
    fireEvent.click(screen.getByRole('tab', { name: 'Opplysninger' }));
  };

  it('viser «Fadder siden» og lar startdato endres og lagres', async () => {
    const fns = setApp();
    render(<AdminUsersPanel />);
    aapnFadder('Fadder A');

    expect(screen.getByText(/^Fadder siden 1\. mars 2024 \(/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Startdato'), { target: { value: '2024-02-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));

    await waitFor(() => expect(fns.updateSponsor).toHaveBeenCalledTimes(1));
    expect(fns.updateSponsor).toHaveBeenCalledWith('s1', { startDato: '2024-02-15' });
  });
});
