// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const setApp = () => {
  const fns = {
    deactivatePerson: vi.fn(async () => undefined),
    reactivatePerson: vi.fn(async () => undefined),
    updateUserDirectoryStatus: vi.fn(async () => undefined),
    inviteUserToDirectory: vi.fn(async () => undefined),
    addSponsor: vi.fn(),
  };
  appState.value = {
    coordinators: [
      makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann', epost: 'kari@example.com' }),
      makeCoordinator({ id: 'k2', fornavn: 'Ola', etternavn: 'Olsen', epost: 'ola@example.com', aktiv: false }),
    ],
    sponsors: [
      makeSponsor({ id: 's1', navn: 'Fadder A', epost: 'fa@example.com' }),
      makeSponsor({ id: 's2', navn: 'Fadder B', epost: 'fb@example.com', avsluttet: '2026-01-01' }),
    ],
    firestoreEnabled: false,
    firestoreUserEmail: null,
    ...fns,
  };
  return fns;
};

const kariSubject = { type: 'coordinator', id: 'k1', navn: 'Kari Nordmann' };
const olaSubject = { type: 'coordinator', id: 'k2', navn: 'Ola Olsen' };
const fadderASubject = { type: 'sponsor', id: 's1', navn: 'Fadder A' };

const filterKnapp = (navn: RegExp) => screen.getByRole('button', { name: navn });

beforeEach(() => {
  setApp();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('brukerlisten: arkiv', () => {
  it('skjuler arkiverte fra Alle og teller riktig', () => {
    render(<AdminUsersPanel />);

    expect(filterKnapp(/^Alle \(2\)$/)).toBeTruthy();
    expect(filterKnapp(/^Koordinatorer \(1\)$/)).toBeTruthy();
    expect(filterKnapp(/^Faddere \(1\)$/)).toBeTruthy();
    expect(filterKnapp(/^Arkivert \(2\)$/)).toBeTruthy();
    expect(screen.queryByText('Ola Olsen')).toBeNull();
    expect(screen.queryByText('Fadder B')).toBeNull();
    expect(screen.getByText('Kari Nordmann')).toBeTruthy();
  });

  it('viser arkiverte under Arkivert og ingen aktive', () => {
    render(<AdminUsersPanel />);
    fireEvent.click(filterKnapp(/^Arkivert \(2\)$/));

    expect(screen.getByText('Ola Olsen')).toBeTruthy();
    expect(screen.getByText('Fadder B')).toBeTruthy();
    expect(screen.queryByText('Kari Nordmann')).toBeNull();
    expect(screen.getByRole('button', { name: 'Gjenopprett Ola Olsen' })).toBeTruthy();
  });

  it('velger to rader og arkiverer valgte etter bekreftelse', async () => {
    const fns = setApp();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminUsersPanel />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Velg Kari Nordmann' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Velg Fadder A' }));
    expect(screen.getByText('2 valgt')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Arkiver valgte' }));

    expect(confirm).toHaveBeenCalledWith(
      'Arkivere 2 personer? De skjules fra listen og mister innlogging. Kan angres under Arkivert.'
    );
    await waitFor(() => expect(fns.deactivatePerson).toHaveBeenCalledTimes(2));
    expect(fns.deactivatePerson).toHaveBeenCalledWith(kariSubject);
    expect(fns.deactivatePerson).toHaveBeenCalledWith(fadderASubject);
    await waitFor(() => expect(screen.getByText('2 arkivert')).toBeTruthy());
    expect(screen.queryByText('2 valgt')).toBeNull();
  });

  it('avbrutt bekreftelse arkiverer ingenting', () => {
    const fns = setApp();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AdminUsersPanel />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Velg Kari Nordmann' }));
    fireEvent.click(screen.getByRole('button', { name: 'Arkiver valgte' }));

    expect(fns.deactivatePerson).not.toHaveBeenCalled();
  });

  it('avkrysning i tabellen åpner ikke personkortet', () => {
    render(<AdminUsersPanel />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Velg Kari Nordmann' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('arkiveringsknappen på en rad kaller deactivatePerson én gang', async () => {
    const fns = setApp();
    render(<AdminUsersPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Arkiver Kari Nordmann' }));

    await waitFor(() => expect(fns.deactivatePerson).toHaveBeenCalledTimes(1));
    expect(fns.deactivatePerson).toHaveBeenCalledWith(kariSubject);
    expect(screen.getByRole('button', { name: 'Angre' })).toBeTruthy();
  });

  it('Angre kaller reactivatePerson', async () => {
    const fns = setApp();
    render(<AdminUsersPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Arkiver Kari Nordmann' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Angre' })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Angre' }));

    await waitFor(() => expect(fns.reactivatePerson).toHaveBeenCalledWith(kariSubject));
  });

  it('Gjenopprett i Arkivert-visningen kaller reactivatePerson', async () => {
    const fns = setApp();
    render(<AdminUsersPanel />);
    fireEvent.click(filterKnapp(/^Arkivert \(2\)$/));

    fireEvent.click(screen.getByRole('button', { name: 'Gjenopprett Ola Olsen' }));

    await waitFor(() => expect(fns.reactivatePerson).toHaveBeenCalledTimes(1));
    expect(fns.reactivatePerson).toHaveBeenCalledWith(olaSubject);
    expect(fns.deactivatePerson).not.toHaveBeenCalled();
  });
});
