// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersonRow } from '../../src/utils/peopleDirectory';
import { makeChild, makeCoordinator, makeSponsor } from '../../src/test/testData';
import type { Sponsor, SponsorOnboardingStep } from '../../src/types';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));
vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  onSnapshot: (_ref: unknown, next: (snap: unknown) => void) => {
    next(snapState.value);
    return () => undefined;
  },
}));
vi.mock('../../src/config/firebase', () => ({ db: {} }));
vi.mock('../../src/config/bootstrapAdmins', () => ({ BOOTSTRAP_ADMIN_EMAILS: [] }));
vi.mock('../../src/db/firestoreData', () => ({ saveUserDirectoryEntry: vi.fn() }));
vi.mock('../../src/components/admin/UserDirectoryInviteForm', () => ({
  UserDirectoryInviteForm: () => null,
}));

const snapState = vi.hoisted(() => ({
  value: { docs: [] as { id: string; data: () => Record<string, unknown> }[] },
}));

import { AdminUsersPanel } from '../../src/components/admin/AdminUsersPanel';
import { PersonCard } from '../../src/components/admin/PersonCard';

const spies = () => ({
  approveSponsorOnboarding: vi.fn(),
  rejectSponsorOnboarding: vi.fn(async () => undefined),
  assignChildInOnboarding: vi.fn(),
  sendSponsorWelcome: vi.fn(async () => ({ sent: true, message: 'Velkomst-e-post sendt.' })),
  markSponsorOnboardingDone: vi.fn(),
  updateSponsor: vi.fn(),
  updateCoordinator: vi.fn(),
  addPersonComment: vi.fn(),
  deactivatePerson: vi.fn(async () => undefined),
  reactivatePerson: vi.fn(async () => undefined),
  deletePerson: vi.fn(async () => undefined),
  updateUserDirectoryStatus: vi.fn(async () => undefined),
  inviteUserToDirectory: vi.fn(async () => undefined),
  addSponsor: vi.fn(),
});

/** En fadder som registrerte seg på nettsiden og ikke har fått barn ennå. */
const nyFadder = (over: Partial<Sponsor> = {}) =>
  makeSponsor({
    id: 's3',
    navn: 'Kari Fadder',
    epost: 'kari.fadder@example.com',
    registrertKilde: 'nettside',
    ...over,
  });

const setApp = (extra: Record<string, unknown> = {}) => {
  const fns = spies();
  appState.value = {
    coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Koordinator' })],
    sponsors: [nyFadder()],
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

const fadderRad = (sponsorId = 's3'): PersonRow => ({
  key: `sponsor:${sponsorId}`,
  name: 'Kari Fadder',
  email: 'kari.fadder@example.com',
  role: 'sponsor',
  loginStatus: 'ikke-invitert',
  sponsorId,
  isBootstrapOnly: false,
  archived: false,
});

const renderCard = (row: PersonRow = fadderRad(), startFane?: 'ny') => {
  const handlers = { onClose: vi.fn(), onChangeStatus: vi.fn(), onInvite: vi.fn() };
  render(
    <PersonCard row={row} statusBusy={false} inviteBusy={false} startFane={startFane} {...handlers} />
  );
  return handlers;
};

const medSteg = (steg: SponsorOnboardingStep, over: Partial<Sponsor> = {}) =>
  nyFadder({ onboarding: { steg }, registrertKilde: 'nettside', ...over });

beforeEach(() => {
  snapState.value = { docs: [] };
  setApp();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('brukerlisten: nye fadder', () => {
  it('viser Ny-merke og filteret Nye (1) for nettside-registrering uten barn', () => {
    render(<AdminUsersPanel />);

    expect(screen.getByLabelText('Ny fadder – trenger behandling')).toBeTruthy();
    const nye = screen.getByRole('button', { name: 'Nye (1)' });
    fireEvent.click(nye);

    expect(screen.getByText('Kari Fadder')).toBeTruthy();
    expect(screen.queryByText('Kari Koordinator')).toBeNull();
  });

  it('Nye-filteret er først og teller ikke faddere uten åpen oppgave', () => {
    setApp({ sponsors: [nyFadder({ registrertKilde: 'admin' })] });
    render(<AdminUsersPanel />);

    const forsteFilter = screen.getAllByRole('button').find((b) => /\(\d+\)$/.test(b.textContent ?? ''));
    expect(forsteFilter?.textContent).toBe('Nye (0)');
    expect(screen.queryByLabelText('Ny fadder – trenger behandling')).toBeNull();
  });

  it('markerer onboarding som ferdig når innlogging er aktiv', async () => {
    const fns = setApp({
      sponsors: [medSteg('invitert')],
      firestoreEnabled: true,
      firestoreUserEmail: 'admin@example.com',
    });
    snapState.value = {
      docs: [
        {
          id: 'kari.fadder@example.com',
          data: () => ({ email: 'kari.fadder@example.com', role: 'sponsor', status: 'aktiv', sponsorId: 's3' }),
        },
      ],
    };
    render(<AdminUsersPanel />);

    await waitFor(() => expect(fns.markSponsorOnboardingDone).toHaveBeenCalledTimes(1));
    expect(fns.markSponsorOnboardingDone).toHaveBeenCalledWith('s3');
  });

  it('åpner personkortet på fanen Ny fadder ved focusSponsorId og nullstiller fokus', () => {
    const onClearFocus = vi.fn();
    setApp({ sponsors: [medSteg('godkjent')] });
    render(<AdminUsersPanel focusSponsorId="s3" onClearFocus={onClearFocus} />);

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Ny fadder' }).getAttribute('aria-selected')).toBe('true');
    expect(onClearFocus).toHaveBeenCalled();
  });
});

describe('personkort: Ny fadder-fanen', () => {
  it('står først og er åpen for en fadder med åpen oppgave', () => {
    renderCard();
    const faner = screen.getAllByRole('tab');
    expect(faner[0].textContent).toBe('Ny fadder');
    expect(screen.getByRole('tab', { name: 'Ny fadder' }).getAttribute('aria-selected')).toBe('true');
  });

  it('finnes ikke for vanlige personer', () => {
    renderCard({
      key: 'coord:k1',
      name: 'Kari Koordinator',
      email: 'kari@example.com',
      role: 'coordinator',
      loginStatus: 'ikke-invitert',
      coordinatorId: 'k1',
      isBootstrapOnly: false,
      archived: false,
    });
    expect(screen.queryByRole('tab', { name: 'Ny fadder' })).toBeNull();
  });

  it('steg 1: viser oppsummering og Godkjenn kaller approveSponsorOnboarding', () => {
    const fns = setApp();
    renderCard();

    expect(screen.getByText('Godkjenn fadder')).toBeTruthy();
    expect(screen.getAllByText('kari.fadder@example.com').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Godkjenn' }));
    expect(fns.approveSponsorOnboarding).toHaveBeenCalledWith('s3');
  });

  it('Avvis krever bekreftelse og kaller rejectSponsorOnboarding', async () => {
    const fns = setApp();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Avvis' }));
    expect(confirm).toHaveBeenCalledWith('Avvise og arkivere Kari Fadder? Kan angres under Arkivert.');
    await waitFor(() => expect(fns.rejectSponsorOnboarding).toHaveBeenCalledWith('s3'));
  });

  it('steg 2: lister barn som venter, og Velg kaller assignChildInOnboarding', () => {
    const fns = setApp({
      sponsors: [medSteg('godkjent')],
      childrenList: [
        makeChild({ id: 'c1', fornavn: 'Mia', fodselsaar: 2016, klassetrinn: '4', skoleNavn: 'Testskole' }),
        makeChild({ id: 'c2', fornavn: 'Ola', tildeltFadderId: 'annen' }),
      ],
    });
    renderCard();

    expect(screen.getByText('Mia')).toBeTruthy();
    expect(screen.queryByText('Ola')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Velg Mia til Kari Fadder' }));
    expect(fns.assignChildInOnboarding).toHaveBeenCalledWith('s3', 'c1');
  });

  it('steg 2: sier fra når ingen barn venter', () => {
    setApp({ sponsors: [medSteg('godkjent')], childrenList: [] });
    renderCard();
    expect(screen.getByText(/Ingen barn venter på fadder/)).toBeTruthy();
  });

  it('steg 3: utkastet har fadderens navn og barnets fornavn, og redigert tekst sendes', async () => {
    const fns = setApp({
      sponsors: [medSteg('barn_tildelt', { tildeltBarnIds: ['c1'] })],
      childrenList: [makeChild({ id: 'c1', fornavn: 'Mia', tildeltFadderId: 's3' })],
    });
    renderCard();

    const brodtekst = screen.getByLabelText('Brødtekst') as HTMLTextAreaElement;
    expect(brodtekst.value).toContain('Hei Kari,');
    expect(brodtekst.value).toContain('Mia');
    expect(screen.getByText('Til: kari.fadder@example.com')).toBeTruthy();
    expect(screen.getByText(/får Kari også lov til å logge inn/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Emne'), { target: { value: 'Hei fra oss' } });
    fireEvent.change(brodtekst, { target: { value: 'Hei Kari, velkommen!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Godkjenn og send' }));

    await waitFor(() =>
      expect(fns.sendSponsorWelcome).toHaveBeenCalledWith('s3', {
        subject: 'Hei fra oss',
        body: 'Hei Kari, velkommen!',
      })
    );
    expect(await screen.findByText('Velkomst-e-post sendt.')).toBeTruthy();
  });

  it('steg 4: viser ventetekst når innlogging gjenstår', () => {
    setApp({
      sponsors: [nyFadder({ onboarding: { steg: 'invitert', invitasjonSendt: '2026-10-01T10:00:00.000Z' } })],
    });
    renderCard(fadderRad(), 'ny');
    expect(screen.getByText(/Når Kari logger inn første gang/)).toBeTruthy();
  });

  it('steg 4: ferdig-tilstand når fadderen har logget inn', () => {
    setApp({ sponsors: [medSteg('ferdig')] });
    renderCard(fadderRad(), 'ny');
    expect(screen.getByText('Ferdig – Kari har logget inn.')).toBeTruthy();
  });

  it('avvist: viser bare Avvist og arkivert', () => {
    setApp({ sponsors: [medSteg('avvist')] });
    renderCard(fadderRad(), 'ny');
    expect(screen.getByText('Avvist og arkivert.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Godkjenn' })).toBeNull();
  });

  it('startFane=ny åpner fanen uansett', () => {
    setApp({ sponsors: [medSteg('invitert')] });
    renderCard(fadderRad(), 'ny');
    expect(screen.getByRole('tab', { name: 'Ny fadder' }).getAttribute('aria-selected')).toBe('true');
  });
});
