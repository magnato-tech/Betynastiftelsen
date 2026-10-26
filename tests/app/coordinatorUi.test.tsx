// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersonRow } from '../../src/utils/peopleDirectory';
import { makeChild, makeCoordinator } from '../../src/test/testData';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));

import { AdminPeoplePanel } from '../../src/components/admin/AdminPeoplePanel';
import { PersonCard } from '../../src/components/admin/PersonCard';

const spies = () => ({
  reassignChildCoordinator: vi.fn(),
  reassignAllChildren: vi.fn(() => 2),
  archiveCoordinatorAndMoveChildren: vi.fn(async () => undefined),
  addChild: vi.fn(),
  assignSponsorToChild: vi.fn(),
  endSponsorship: vi.fn(),
  updateCoordinator: vi.fn(),
  updateSponsor: vi.fn(),
  addPersonComment: vi.fn(),
  deactivatePerson: vi.fn(async () => undefined),
  reactivatePerson: vi.fn(async () => undefined),
  deletePerson: vi.fn(async () => undefined),
});

// Koordinatorer: Kari (aktiv), Ola (arkivert), Ine (aktiv).
const koordinatorer = () => [
  makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann' }),
  makeCoordinator({ id: 'k2', fornavn: 'Ola', etternavn: 'Hansen', aktiv: false }),
  makeCoordinator({ id: 'k3', fornavn: 'Ine', etternavn: 'Berg' }),
];

// Barn: Mia har gyldig koordinator, Ola-barnet har arkivert, Per har ingen.
const barn = () => [
  makeChild({ id: 'c1', internKode: 'T-01', fornavn: 'Mia', koordinatorId: 'k1', status: 'aktiv' }),
  makeChild({ id: 'c2', internKode: 'T-02', fornavn: 'Ole', koordinatorId: 'k2', status: 'aktiv' }),
  makeChild({ id: 'c3', internKode: 'T-03', fornavn: 'Per', koordinatorId: undefined, status: 'aktiv' }),
];

const setApp = (extra: Record<string, unknown> = {}) => {
  const fns = spies();
  appState.value = {
    coordinators: koordinatorer(),
    sponsors: [],
    childrenList: barn(),
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

const kariRow: PersonRow = {
  key: 'coord:k1',
  name: 'Kari Nordmann',
  email: 'kari@example.com',
  role: 'coordinator',
  loginStatus: 'ikke-invitert',
  coordinatorId: 'k1',
  distrikt: 'Test',
  isBootstrapOnly: false,
  archived: false,
};

const renderPanel = () => render(<AdminPeoplePanel />);

const renderCard = (row: PersonRow = kariRow) => {
  const handlers = { onClose: vi.fn(), onChangeStatus: vi.fn(), onInvite: vi.fn() };
  render(<PersonCard row={row} statusBusy={false} inviteBusy={false} {...handlers} />);
  return handlers;
};

const gaTilFane = (navn: string) => {
  fireEvent.click(screen.getByRole('tab', { name: navn }));
};

beforeEach(() => {
  setApp();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Barn-siden: koordinatorkolonne og filter', () => {
  it('viser koordinatornavn, Mangler koordinator og Arkivert i tabellen', () => {
    renderPanel();
    expect(screen.getAllByText('Kari Nordmann').length).toBeGreaterThan(0);
    expect(screen.getByText('Mangler koordinator')).toBeTruthy();
    expect(screen.getByText('Arkivert: Ola Hansen')).toBeTruthy();
  });

  it('viser infolinje med antall og filtrerer til barn uten gyldig koordinator med Vis', () => {
    renderPanel();
    expect(screen.getByText('2 barn trenger koordinator')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Vis' }));

    expect(screen.queryByText('T-01')).toBeNull();
    expect(screen.getByText('T-02')).toBeTruthy();
    expect(screen.getByText('T-03')).toBeTruthy();
  });

  it('koordinatorfilteret viser bare barn hos valgt koordinator', () => {
    renderPanel();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrer på koordinator' }), {
      target: { value: 'k1' },
    });
    expect(screen.getByText('T-01')).toBeTruthy();
    expect(screen.queryByText('T-03')).toBeNull();
  });
});

describe('Barn-siden: bytt koordinator i barnekortet', () => {
  it('Bytt koordinator bekrefter og kaller reassignChildCoordinator', () => {
    const fns = setApp();
    renderPanel();
    fireEvent.click(screen.getByText('T-01'));

    const velg = screen.getByLabelText('Ny koordinator');
    fireEvent.change(velg, { target: { value: 'k3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bytt koordinator' }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Flytte Mia til Ine Berg? Rapporter, fakta, bilder og spørsmål om barnet følger med, og Kari Nordmann mister tilgangen.'
    );
    expect(fns.reassignChildCoordinator).toHaveBeenCalledWith('c1', 'k3');
  });

  it('knappen er deaktivert når valgt koordinator er den samme', () => {
    renderPanel();
    fireEvent.click(screen.getByText('T-01'));
    expect((screen.getByRole('button', { name: 'Bytt koordinator' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('barn uten gyldig koordinator får knappen Velg koordinator', () => {
    renderPanel();
    fireEvent.click(screen.getByText('T-03'));
    expect(screen.getByRole('button', { name: 'Velg koordinator' })).toBeTruthy();
  });

  it('viser feil inline når flyttingen kaster', () => {
    setApp({
      reassignChildCoordinator: vi.fn(() => {
        throw new Error('Eleven må knyttes til en aktiv koordinator.');
      }),
    });
    renderPanel();
    fireEvent.click(screen.getByText('T-03'));
    fireEvent.change(screen.getByLabelText('Ny koordinator'), { target: { value: 'k3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Velg koordinator' }));
    expect(screen.getByRole('alert').textContent).toBe('Eleven må knyttes til en aktiv koordinator.');
  });
});

describe('Koble barn og fadder: kun barn med gyldig koordinator', () => {
  it('lister bare barn med gyldig koordinator og viser merknad om resten', () => {
    renderPanel();
    expect(screen.getByRole('option', { name: 'T-01 — Mia' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'T-02 — Ole' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'T-03 — Per' })).toBeNull();
    expect(screen.getByText(/2 barn uten fadder mangler koordinator og kan ikke kobles ennå/)).toBeTruthy();
  });
});

describe('Legg til barn: koordinator må velges', () => {
  it('Lagre barn er deaktivert til koordinator er valgt, og bare aktive koordinatorer listes', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Legg til barn' }));

    const velg = screen.getByLabelText('Koordinator for nytt barn') as HTMLSelectElement;
    expect(velg.value).toBe('');
    expect(within(velg).getByRole('option', { name: 'Ine Berg' })).toBeTruthy();
    expect(within(velg).queryByRole('option', { name: 'Ola Hansen' })).toBeNull();

    const knapp = screen.getByRole('button', { name: 'Lagre barn' }) as HTMLButtonElement;
    expect(knapp.disabled).toBe(true);

    fireEvent.change(velg, { target: { value: 'k1' } });
    expect(knapp.disabled).toBe(false);
  });
});

describe('Koordinatorkort: fanen Elever', () => {
  it('lister aktive elever og Flytt alle kaller reassignAllChildren', () => {
    const fns = setApp({
      childrenList: [
        makeChild({ id: 'c1', internKode: 'T-01', fornavn: 'Mia', koordinatorId: 'k1', status: 'aktiv' }),
        makeChild({ id: 'c4', internKode: 'T-04', fornavn: 'Lise', koordinatorId: 'k1', status: 'aktiv' }),
      ],
    });
    renderCard();

    expect(screen.getByRole('tab', { name: 'Elever (2)' })).toBeTruthy();
    gaTilFane('Elever (2)');
    expect(screen.getAllByText('Venter på fadder').length).toBe(2);

    fireEvent.change(screen.getByLabelText('Flytt alle til'), { target: { value: 'k3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Flytt alle' }));

    expect(window.confirm).toHaveBeenCalledWith('Flytte alle 2 elever fra Kari Nordmann til Ine Berg?');
    expect(fns.reassignAllChildren).toHaveBeenCalledWith('k1', 'k3');
    expect(screen.getByText('2 elever flyttet.')).toBeTruthy();
  });

  it('viser Ingen aktive elever når koordinatoren ikke har barn', () => {
    setApp({ childrenList: [] });
    renderCard();
    gaTilFane('Elever (0)');
    expect(screen.getByText('Ingen aktive elever.')).toBeTruthy();
  });
});

describe('Koordinatorkort: arkiver med elever', () => {
  it('arkiv-fanen med elever kaller archiveCoordinatorAndMoveChildren', async () => {
    const fns = setApp({
      childrenList: [makeChild({ id: 'c1', internKode: 'T-01', koordinatorId: 'k1', status: 'aktiv' })],
    });
    renderCard();
    gaTilFane('Arkiver / slett');

    expect(screen.getByText('Kari Nordmann følger 1 aktive elever. Velg hvem som skal ta over før arkivering.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Arkiver Kari Nordmann' })).toBeNull();

    const knapp = screen.getByRole('button', { name: 'Flytt elevene og arkiver' }) as HTMLButtonElement;
    expect(knapp.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Ny koordinator for elevene'), { target: { value: 'k3' } });
    fireEvent.click(knapp);
    expect(fns.archiveCoordinatorAndMoveChildren).toHaveBeenCalledWith('k1', 'k3');
  });

  it('koordinator uten elever får vanlig arkiveringsknapp', () => {
    setApp({ childrenList: [] });
    renderCard();
    gaTilFane('Arkiver / slett');
    expect(screen.getByRole('button', { name: 'Arkiver Kari Nordmann' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Flytt elevene og arkiver' })).toBeNull();
  });
});
