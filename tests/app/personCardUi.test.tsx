// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersonRow } from '../../src/utils/peopleDirectory';
import { makeChild, makeCoordinator, makeSponsor } from '../../src/test/testData';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));

import { PersonCard } from '../../src/components/admin/PersonCard';

const spies = () => ({
  updateCoordinator: vi.fn(),
  updateSponsor: vi.fn(),
  addPersonComment: vi.fn(),
  deactivatePerson: vi.fn(async () => undefined),
  reactivatePerson: vi.fn(async () => undefined),
  deletePerson: vi.fn(async () => undefined),
});

const kariRow: PersonRow = {
  key: 'coord:k1',
  name: 'Kari Nordmann',
  email: 'kari@example.com',
  role: 'coordinator',
  loginStatus: 'ikke-invitert',
  coordinatorId: 'k1',
  distrikt: 'Test',
  isBootstrapOnly: false,
};

const adminRow: PersonRow = {
  key: 'dir:admin@example.com',
  name: 'Admin Person',
  email: 'admin@example.com',
  role: 'admin',
  loginStatus: 'aktiv',
  isBootstrapOnly: true,
};

const setApp = (extra: Record<string, unknown> = {}) => {
  const fns = spies();
  appState.value = {
    coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann', telefon: '111' })],
    sponsors: [],
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
    ...fns,
    ...extra,
  };
  return fns;
};

const renderCard = (row: PersonRow) => {
  const handlers = {
    onClose: vi.fn(),
    onChangeStatus: vi.fn(),
    onInvite: vi.fn(),
  };
  const utils = render(
    <PersonCard
      row={row}
      statusBusy={false}
      inviteBusy={false}
      {...handlers}
    />
  );
  return { ...utils, ...handlers };
};

const gaTilFane = (navn: string) => {
  fireEvent.click(screen.getByRole('tab', { name: navn }));
};

beforeEach(() => {
  setApp();
});

afterEach(() => {
  cleanup();
});

describe('personkort: sletting', () => {
  it('sletteknappen er deaktivert til fullt navn er skrevet eksakt', () => {
    const fns = setApp({
      coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann' })],
    });
    renderCard(kariRow);
    gaTilFane('Avslutt / slett');

    const knapp = screen.getByRole('button', { name: 'Slett for godt' });
    const felt = screen.getByLabelText(/Skriv fullt navn/);
    expect((knapp as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(felt, { target: { value: 'kari nordmann' } });
    expect((knapp as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(felt, { target: { value: 'Kari' } });
    expect((knapp as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(felt, { target: { value: '  Kari Nordmann  ' } });
    expect((knapp as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(knapp);
    expect(fns.deletePerson).toHaveBeenCalledWith(
      { type: 'coordinator', id: 'k1', navn: 'Kari Nordmann' },
      '  Kari Nordmann  '
    );
  });

  it('viser lenkene og holder sletting deaktivert når koblinger finnes', () => {
    setApp({
      coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann' })],
      childrenList: [
        makeChild({ id: 'c1', koordinatorId: 'k1', status: 'aktiv' }),
        makeChild({ id: 'c2', koordinatorId: 'k1', status: 'avsluttet' }),
      ],
    });
    renderCard(kariRow);
    gaTilFane('Avslutt / slett');

    expect(screen.getByText(/Personen har koblinger og kan ikke slettes/)).toBeTruthy();
    expect(screen.getByText('2 barn')).toBeTruthy();

    const felt = screen.getByLabelText(/Skriv fullt navn/);
    expect((felt as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(felt, { target: { value: 'Kari Nordmann' } });
    expect((screen.getByRole('button', { name: 'Slett for godt' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('administratorer får ingen slettedel', () => {
    renderCard(adminRow);
    gaTilFane('Avslutt / slett');

    expect(screen.getByText('Administratorer kan ikke avsluttes eller slettes her.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Slett for godt' })).toBeNull();
    expect(screen.queryByLabelText(/Skriv fullt navn/)).toBeNull();
  });
});

describe('personkort: kommentarer', () => {
  it('kommentar kaller addPersonComment og tømmer feltet', async () => {
    const fns = setApp();
    renderCard(kariRow);
    gaTilFane('Logg');

    const felt = screen.getByLabelText('Skriv en kommentar');
    const knapp = screen.getByRole('button', { name: 'Legg til kommentar' });
    expect((knapp as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(felt, { target: { value: 'Ringte i dag' } });
    fireEvent.click(knapp);

    expect(fns.addPersonComment).toHaveBeenCalledWith(
      { type: 'coordinator', id: 'k1', navn: 'Kari Nordmann' },
      'Ringte i dag'
    );
    await waitFor(() => expect((felt as HTMLTextAreaElement).value).toBe(''));
  });
});

describe('personkort: opplysninger', () => {
  it('lagrer bare endret felt', () => {
    const fns = setApp();
    renderCard(kariRow);

    const lagre = screen.getByRole('button', { name: 'Lagre endringer' });
    expect((lagre as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Telefon'), { target: { value: '456' } });
    expect((lagre as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(lagre);

    expect(fns.updateCoordinator).toHaveBeenCalledTimes(1);
    expect(fns.updateCoordinator).toHaveBeenCalledWith('k1', { telefon: '456' });
    expect(screen.getByText('Lagret')).toBeTruthy();
  });

  it('admin ser skrivebeskyttet info uten redigeringsskjema', () => {
    renderCard(adminRow);
    expect(screen.getByText('Administratorer redigeres ikke her.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Lagre endringer' })).toBeNull();
  });

  it('fadder: lagrer endret månedsbeløp som tall', () => {
    const fns = setApp({ sponsors: [makeSponsor({ id: 's1', navn: 'Fadder Ett', maanedsbelop: 250 })] });
    renderCard({
      key: 'sponsor:s1',
      name: 'Fadder Ett',
      email: 'fadder.a@example.com',
      role: 'sponsor',
      loginStatus: 'ikke-invitert',
      sponsorId: 's1',
      isBootstrapOnly: false,
    });

    fireEvent.change(screen.getByLabelText('Månedsbeløp (kr)'), { target: { value: '350' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));

    expect(fns.updateSponsor).toHaveBeenCalledWith('s1', { maanedsbelop: 350 });
  });
});

describe('personkort: innlogging', () => {
  it('ikke-invitert viser Inviter-knapp som kaller onInvite', () => {
    const { onInvite } = renderCard(kariRow);
    gaTilFane('Innlogging');

    fireEvent.click(screen.getByRole('button', { name: 'Inviter' }));
    expect(onInvite).toHaveBeenCalledWith(kariRow);
    expect(
      screen.getByText(/Invitasjon sender ingen e-post/)
    ).toBeTruthy();
  });
});
