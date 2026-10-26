// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersonRow } from '../../src/utils/peopleDirectory';
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
import {
  ARKIVERT_STATUS_FEIL,
  PersonCard,
  blokkerStatusForArkivert,
} from '../../src/components/admin/PersonCard';

const spies = () => ({
  updateCoordinator: vi.fn(),
  updateSponsor: vi.fn(),
  addPersonComment: vi.fn(),
  deactivatePerson: vi.fn(async () => undefined),
  reactivatePerson: vi.fn(async () => undefined),
  updateUserDirectoryStatus: vi.fn(async () => undefined),
  inviteUserToDirectory: vi.fn(async () => undefined),
  addSponsor: vi.fn(),
  deletePerson: vi.fn(async () => undefined),
});

const setApp = (extra: Record<string, unknown> = {}) => {
  const fns = spies();
  appState.value = {
    coordinators: [
      makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann', epost: 'kari@example.com' }),
      makeCoordinator({ id: 'k2', fornavn: 'Ola', etternavn: 'Olsen', epost: 'ola@example.com', aktiv: false }),
    ],
    sponsors: [
      makeSponsor({ id: 's1', navn: 'Fadder A', epost: 'fa@example.com' }),
      makeSponsor({ id: 's2', navn: 'Fadder B', epost: 'fb@example.com', avsluttet: '2026-01-01' }),
    ],
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
    ...extra,
  };
  return fns;
};

const olaSubject = { type: 'coordinator', id: 'k2', navn: 'Ola Olsen' };

const arkivertRad: PersonRow = {
  key: 'coord:k2',
  name: 'Ola Olsen',
  email: 'ola@example.com',
  role: 'coordinator',
  loginStatus: 'ikke-invitert',
  coordinatorId: 'k2',
  distrikt: 'Test',
  isBootstrapOnly: false,
  archived: true,
};

const kariRow: PersonRow = {
  key: 'coord:k1',
  name: 'Kari Nordmann',
  email: 'kari@example.com',
  role: 'coordinator',
  loginStatus: 'aktiv',
  coordinatorId: 'k1',
  distrikt: 'Test',
  isBootstrapOnly: false,
  archived: false,
};

beforeEach(() => {
  setApp();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('brukerlisten: arkiverte rader har låst innlogging', () => {
  it('arkivert rad har ingen statusvelger og ingen Inviter, men viser låst etikett', () => {
    render(<AdminUsersPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Arkivert \(2\)$/ }));

    expect(screen.queryByRole('combobox', { name: /Innlogging for/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Inviter' })).toBeNull();
    expect(screen.getAllByText('Sperret (arkivert)')).toHaveLength(2);
  });

  it('Gjenopprett-knappen er synlig tekst og kaller reactivatePerson', async () => {
    const fns = setApp();
    render(<AdminUsersPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Arkivert \(2\)$/ }));

    const knapp = screen.getByRole('button', { name: 'Gjenopprett Ola Olsen' });
    expect(knapp.textContent).toContain('Gjenopprett');
    fireEvent.click(knapp);

    await waitFor(() => expect(fns.reactivatePerson).toHaveBeenCalledWith(olaSubject));
    expect(fns.updateUserDirectoryStatus).not.toHaveBeenCalled();
  });
});

describe('personkort: låst innlogging for arkiverte', () => {
  it('arkivert person viser låst etikett og hint, uten statusvelger', () => {
    render(
      <PersonCard
        row={arkivertRad}
        onClose={vi.fn()}
        onChangeStatus={vi.fn()}
        onInvite={vi.fn()}
        statusBusy={false}
        inviteBusy={false}
      />
    );
    const innlogging = document.querySelector('aside[aria-label="Innlogging"]') as HTMLElement;
    expect(innlogging).toBeTruthy();
    expect(innlogging.textContent).toContain('Sperret (arkivert)');
    expect(innlogging.textContent).toContain('Gjenopprett personen for å gi innlogging igjen.');
    expect(screen.queryByRole('combobox', { name: /Endre status/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Inviter' })).toBeNull();
  });

  it('aktiv person har fortsatt statusvelger', () => {
    render(
      <PersonCard
        row={kariRow}
        onClose={vi.fn()}
        onChangeStatus={vi.fn()}
        onInvite={vi.fn()}
        statusBusy={false}
        inviteBusy={false}
      />
    );
    expect(screen.getByRole('combobox', { name: /Endre status/ })).toBeTruthy();
  });
});

describe('vakt mot statusendring for arkiverte', () => {
  it('blokkerer aktiv og invitert for arkiverte, men tillater sperret', () => {
    expect(blokkerStatusForArkivert(true, 'aktiv')).toBe(true);
    expect(blokkerStatusForArkivert(true, 'invitert')).toBe(true);
    expect(blokkerStatusForArkivert(true, 'sperret')).toBe(false);
    expect(blokkerStatusForArkivert(false, 'aktiv')).toBe(false);
    expect(ARKIVERT_STATUS_FEIL).toBe('Personen er arkivert. Bruk «Gjenopprett» først.');
  });
});
