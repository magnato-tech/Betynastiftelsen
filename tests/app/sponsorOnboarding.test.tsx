// @vitest-environment jsdom
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChild, makeSponsor } from '../../src/test/testData';
import { saveUserDirectoryEntry, listUserDirectoryEntries } from '../../src/db/firestoreData';
import { mountApp, useAppTestLifecycle } from './harness';

const email = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('../../src/email/client', () => ({
  postBetynaEmail: (...args: unknown[]) => email.post(...args),
  fetchResendStatus: vi.fn(),
}));
// Innlogging (userDirectory) skal kunne kalles uten ekte Firestore.
vi.mock('../../src/config/firebase', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  db: { __fake: true },
}));
vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  onSnapshot: () => () => undefined,
}));
vi.mock('../../src/db/firestoreData', () => ({
  saveUserDirectoryEntry: vi.fn(async () => undefined),
  listUserDirectoryEntries: vi.fn(async () => []),
  updateUserDirectoryStatus: vi.fn(async () => undefined),
  deleteUserDirectoryEntry: vi.fn(async () => undefined),
}));

useAppTestLifecycle();

const admin = { role: 'admin', displayName: 'Admin', email: 'admin@example.com' };
const kilde = { navn: 'Pia Hansen', epost: 'Pia@Example.com', telefon: '1', poststed: 'Bergen', maanedsbelop: 350, betalingsmetode: 'vipps' as const };

const nyFadder = () =>
  makeSponsor({
    id: 's-ny',
    navn: 'Pia Hansen',
    epost: 'Pia@Example.com',
    registrertKilde: 'nettside',
    tildeltBarnIds: [],
    onboarding: { steg: 'ny' },
  });

const mail = { subject: 'Velkommen som fadder i Betyna', body: 'Hei Pia,\n\nVelkommen.\n\nVennlig hilsen\nBetyna' };

beforeEach(() => {
  vi.clearAllMocks();
  email.post.mockReset();
});

describe('registrering fra nettsiden', () => {
  it('ny fadder får onboarding-steg "ny"', () => {
    const m = mountApp();
    m.run((a) => a.registerNewSponsorInterest(kilde));
    expect(m.app.sponsors[0].onboarding).toEqual({ steg: 'ny' });
  });

  it('første betaling er ikke "fullfort" før den er registrert', () => {
    const m = mountApp();
    m.run((a) => a.registerNewSponsorInterest(kilde));
    expect(m.app.payments[0].status).toBe('forventet');
  });
});

describe('onboarding: godkjenning og tildeling', () => {
  it('approveSponsorOnboarding setter steg "godkjent" med dato og logger', () => {
    const m = mountApp({ sponsors: [nyFadder()] }, undefined, { profile: admin });
    m.run((a) => a.approveSponsorOnboarding('s-ny'));
    expect(m.app.sponsors[0].onboarding).toMatchObject({ steg: 'godkjent', godkjentDato: '2026-10-16' });
    expect(m.app.auditLogs[0]).toMatchObject({ handling: 'Fadder godkjent', gjelderType: 'sponsor', gjelderId: 's-ny' });
  });

  it('assignChildInOnboarding kobler barnet og setter steg "barn_tildelt"', () => {
    const m = mountApp(
      {
        sponsors: [makeSponsor({ ...nyFadder(), onboarding: { steg: 'godkjent', godkjentDato: '2026-10-16' } })],
        children: [makeChild({ id: 'c1', fornavn: 'Amara', tildeltFadderId: undefined })],
      },
      undefined,
      { profile: admin },
    );
    m.run((a) => a.assignChildInOnboarding('s-ny', 'c1'));
    expect(m.app.childrenList[0].tildeltFadderId).toBe('s-ny');
    expect(m.app.sponsors[0].tildeltBarnIds).toEqual(['c1']);
    expect(m.app.sponsors[0].onboarding?.steg).toBe('barn_tildelt');
  });

  it('tildeling via vanlig assignSponsorToChild flytter godkjent fadder til "barn_tildelt"', () => {
    const m = mountApp(
      {
        sponsors: [makeSponsor({ ...nyFadder(), onboarding: { steg: 'godkjent' } })],
        children: [makeChild({ id: 'c1', tildeltFadderId: undefined })],
      },
      undefined,
      { profile: admin },
    );
    m.run((a) => a.assignSponsorToChild('c1', 's-ny'));
    expect(m.app.sponsors[0].onboarding?.steg).toBe('barn_tildelt');
  });

  it('rejectSponsorOnboarding setter steg "avvist" og arkiverer fadderen', async () => {
    const m = mountApp({ sponsors: [nyFadder()] }, undefined, { profile: admin });
    await act(async () => {
      await m.app.rejectSponsorOnboarding('s-ny');
    });
    expect(m.app.sponsors[0].onboarding?.steg).toBe('avvist');
    expect(m.app.sponsors[0].avsluttet).toBeDefined();
  });
});

describe('sendSponsorWelcome', () => {
  const sponsorKlarForUtsending = () =>
    makeSponsor({
      ...nyFadder(),
      tildeltBarnIds: ['c1'],
      onboarding: { steg: 'barn_tildelt' },
    });

  it('200: sender e-post, gir innlogging og setter steg "invitert"', async () => {
    email.post.mockResolvedValueOnce({ status: 200, json: { ok: true, id: 're_1' } });
    const m = mountApp(
      { sponsors: [sponsorKlarForUtsending()], children: [makeChild({ id: 'c1', fornavn: 'Amara', tildeltFadderId: 's-ny' })] },
      undefined,
      { profile: admin },
    );

    let resultat: { sent: boolean; message: string } | undefined;
    await act(async () => {
      resultat = await m.app.sendSponsorWelcome('s-ny', mail);
    });

    expect(resultat).toEqual({ sent: true, message: 'Velkomst-e-post sendt til pia@example.com' });
    expect(saveUserDirectoryEntry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ email: 'pia@example.com', role: 'sponsor', sponsorId: 's-ny' }),
    );
    expect(email.post).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'system', templateId: 'sponsor_invitation', emails: ['pia@example.com'] }),
    );
    expect(m.app.sponsors[0].onboarding).toMatchObject({ steg: 'invitert' });
    expect(m.app.sponsors[0].onboarding?.invitasjonSendt).toBeDefined();
    expect(m.app.emailOutbox[0].status).toBe('sendt');
    expect(m.app.auditLogs.some((l) => l.handling === 'Velkomst-e-post sendt')).toBe(true);
  });

  it('hopper over innloggingsinvitasjon når personen allerede har en rad', async () => {
    vi.mocked(listUserDirectoryEntries).mockResolvedValueOnce([
      { email: 'pia@example.com', role: 'sponsor', sponsorId: 's-ny', status: 'invitert' },
    ] as never);
    email.post.mockResolvedValueOnce({ status: 200, json: { ok: true } });
    const m = mountApp({ sponsors: [sponsorKlarForUtsending()] }, undefined, { profile: admin });

    await act(async () => {
      await m.app.sendSponsorWelcome('s-ny', mail);
    });

    expect(saveUserDirectoryEntry).not.toHaveBeenCalled();
    expect(m.app.sponsors[0].onboarding?.steg).toBe('invitert');
  });

  it('503 (e-post ikke satt opp): e-posten ligger i køen, steget blir "barn_tildelt"', async () => {
    email.post.mockResolvedValueOnce({ status: 503, json: { ok: false, code: 'NOT_CONFIGURED' } });
    const m = mountApp({ sponsors: [sponsorKlarForUtsending()] }, undefined, { profile: admin });

    let resultat: { sent: boolean; message: string } | undefined;
    await act(async () => {
      resultat = await m.app.sendSponsorWelcome('s-ny', mail);
    });

    expect(resultat?.sent).toBe(false);
    expect(resultat?.message).toContain('ikke satt opp');
    expect(m.app.sponsors[0].onboarding?.steg).toBe('barn_tildelt');
    expect(m.app.emailOutbox[0].status).toBe('venter_nøkkel');
    // Innlogging er gitt selv om e-posten ikke gikk.
    expect(saveUserDirectoryEntry).toHaveBeenCalled();
  });

  it('annen feil: outbox-raden blir "feilet" og steget endres ikke', async () => {
    email.post.mockResolvedValueOnce({ status: 500, json: { ok: false, message: 'Resend nede' } });
    const m = mountApp({ sponsors: [sponsorKlarForUtsending()] }, undefined, { profile: admin });

    let resultat: { sent: boolean; message: string } | undefined;
    await act(async () => {
      resultat = await m.app.sendSponsorWelcome('s-ny', mail);
    });

    expect(resultat).toEqual({ sent: false, message: 'Resend nede' });
    expect(m.app.emailOutbox[0].status).toBe('feilet');
    expect(m.app.sponsors[0].onboarding?.steg).toBe('barn_tildelt');
  });

  it('postBetynaEmail er kalt med den redigerte teksten (ikke malen)', async () => {
    email.post.mockResolvedValueOnce({ status: 503, json: { ok: false } });
    const m = mountApp({ sponsors: [sponsorKlarForUtsending()] }, undefined, { profile: admin });
    await act(async () => {
      await m.app.sendSponsorWelcome('s-ny', { subject: 'Eget emne', body: 'Hei <Pia>\nVelkommen' });
    });
    expect(email.post).toHaveBeenCalledWith(expect.objectContaining({ subject: 'Eget emne', html: 'Hei &lt;Pia&gt;<br>Velkommen' }));
  });
});

describe('markSponsorOnboardingDone', () => {
  it('setter steg "ferdig" med dato', () => {
    const m = mountApp({ sponsors: [makeSponsor({ ...nyFadder(), onboarding: { steg: 'invitert' } })] }, undefined, {
      profile: admin,
    });
    m.run((a) => a.markSponsorOnboardingDone('s-ny'));
    expect(m.app.sponsors[0].onboarding).toMatchObject({ steg: 'ferdig', ferdigDato: '2026-10-16' });
  });
});
