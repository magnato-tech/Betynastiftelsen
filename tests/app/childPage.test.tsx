// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChild, makeCoordinator, makeFact, makeReport, makeSponsor } from '../../src/test/testData';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));

import { AdminPeoplePanel } from '../../src/components/admin/AdminPeoplePanel';

const spies = () => ({
  updateChild: vi.fn(),
  reassignChildCoordinator: vi.fn(),
  assignSponsorToChild: vi.fn(),
  reassignChildSponsor: vi.fn(),
  removeChildSponsor: vi.fn(),
  endSponsorship: vi.fn(),
  reopenChild: vi.fn(),
  addPersonComment: vi.fn(),
  addChild: vi.fn(),
  answerInquiry: vi.fn(),
  forwardInquiryToCoordinator: vi.fn(),
  approveReport: vi.fn(),
  rejectReport: vi.fn(),
  approveChildPhoto: vi.fn(),
  rejectChildPhoto: vi.fn(),
});

const koordinatorer = () => [
  makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Nordmann' }),
  makeCoordinator({ id: 'k3', fornavn: 'Ine', etternavn: 'Berg' }),
];

/** Mia (T-01) har koordinator Kari og fadder Fadder A. */
const miaMedFadder = () =>
  makeChild({
    id: 'c1',
    internKode: 'T-01',
    fornavn: 'Mia',
    koordinatorId: 'k1',
    status: 'aktiv',
    tildeltFadderId: 's1',
    skoleNavn: 'Gamle skole',
    klassetrinn: '4',
    interesser: ['Fotball', 'Tegning'],
  });

const setApp = (extra: Record<string, unknown> = {}) => {
  const fns = spies();
  appState.value = {
    coordinators: koordinatorer(),
    sponsors: [
      makeSponsor({ id: 's1', navn: 'Fadder A', tildeltBarnIds: ['c1'] }),
      makeSponsor({ id: 's2', navn: 'Fadder B' }),
    ],
    childrenList: [miaMedFadder()],
    reports: [],
    inquiries: [],
    sponsorAssignments: [],
    auditLogs: [],
    campaigns: [],
    recurringCharges: [],
    paymentAllocations: [],
    milestones: [],
    fieldFacts: [],
    payments: [],
    ...fns,
    ...extra,
  };
  return fns;
};

const aapneMia = () => {
  fireEvent.click(screen.getByText('T-01'));
};

beforeEach(() => {
  setApp();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Barnesiden: åpne og gå tilbake', () => {
  it('klikk på en rad viser hele barnesiden, og Tilbake til Barn viser listen igjen', () => {
    render(<AdminPeoplePanel />);
    aapneMia();

    expect(screen.getByRole('heading', { name: 'T-01 — Mia' })).toBeTruthy();
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Barn (1)' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '← Tilbake til Barn' }));

    expect(screen.getByRole('heading', { name: 'Barn (1)' })).toBeTruthy();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('focusChildId åpner barnesiden og nullstiller fokus', () => {
    const onClear = vi.fn();
    render(<AdminPeoplePanel focusChildId="c1" onClearChildFocus={onClear} />);
    expect(screen.getByRole('heading', { name: 'T-01 — Mia' })).toBeTruthy();
    expect(onClear).toHaveBeenCalled();
  });

  it('har fanene Oversikt, Opplysninger og Logg, med Oversikt valgt først', () => {
    render(<AdminPeoplePanel />);
    aapneMia();
    expect(screen.getByRole('tab', { name: 'Oversikt' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Opplysninger' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tab', { name: 'Logg' })).toBeTruthy();
  });
});

describe('Opplysninger', () => {
  it('lagre er deaktivert før noe er endret, og lagrer bare det som er endret', () => {
    const fns = setApp();
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Opplysninger' }));

    const lagre = screen.getByRole('button', { name: 'Lagre endringer' }) as HTMLButtonElement;
    expect(lagre.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText(/Skolens navn/), { target: { value: 'Ny skole' } });
    expect(lagre.disabled).toBe(false);

    fireEvent.click(lagre);
    expect(fns.updateChild).toHaveBeenCalledTimes(1);
    expect(fns.updateChild).toHaveBeenCalledWith('c1', { skoleNavn: 'Ny skole' });
    expect(screen.getByText('Lagret. Koordinatoren er varslet.')).toBeTruthy();
  });

  it('interesser lagres som liste fra kommaseparert tekst', () => {
    const fns = setApp();
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Opplysninger' }));

    fireEvent.change(screen.getByLabelText(/Interesser/), { target: { value: 'Fotball, Musikk , ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));
    expect(fns.updateChild).toHaveBeenCalledWith('c1', { interesser: ['Fotball', 'Musikk'] });
  });

  it('viser lesemodus-note og intern kode', () => {
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Opplysninger' }));
    expect(screen.getByText('Admin og koordinator kan endre opplysningene. Fadderen ser dem, men kan ikke endre.')).toBeTruthy();
    expect(screen.getByText(/Intern kode: T-01/)).toBeTruthy();
  });
});

describe('Fadder i header-kortet', () => {
  it('Bytt fadder ber om bekreftelse og kaller reassignChildSponsor', () => {
    const fns = setApp();
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.change(screen.getByLabelText('Ny fadder'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bytt' }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Bytte fadder for Mia fra Fadder A til Fadder B? Fadder A mister tilgangen til Mia i fadderportalen.'
    );
    expect(fns.reassignChildSponsor).toHaveBeenCalledWith('c1', 's2');
  });

  it('avbrutt bekreftelse ved bytte av fadder kaller ikke reassignChildSponsor', () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    const fns = setApp();
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.change(screen.getByLabelText('Ny fadder'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bytt' }));
    expect(fns.reassignChildSponsor).not.toHaveBeenCalled();
  });

  it('Fjern fadder ber om bekreftelse og kaller removeChildSponsor', () => {
    const fns = setApp();
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.click(screen.getByRole('button', { name: 'Fjern fadder' }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Fadder A er ikke lenger fadder for Mia. Mia blir stående og venter på ny fadder.'
    );
    expect(fns.removeChildSponsor).toHaveBeenCalledWith('c1');
  });

  it('viser feil fra fadderbytte inline', () => {
    setApp({
      reassignChildSponsor: vi.fn(() => {
        throw new Error('Barnet følges allerede av Fadder B.');
      }),
    });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.change(screen.getByLabelText('Ny fadder'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bytt' }));
    expect(screen.getByRole('alert').textContent).toBe('Barnet følges allerede av Fadder B.');
  });
});

describe('Barn uten aktiv koordinator', () => {
  it('fadderkontrollene er deaktivert med forklaring', () => {
    setApp({ childrenList: [makeChild({ id: 'c3', internKode: 'T-03', fornavn: 'Per', koordinatorId: '', status: 'aktiv' })] });
    render(<AdminPeoplePanel />);
    fireEvent.click(screen.getByText('T-03'));

    expect(screen.getByText('Barnet må ha aktiv koordinator før det kan få fadder.')).toBeTruthy();
    expect((screen.getByLabelText('Velg fadder') as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Koble' }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Trenger oppmerksomhet', () => {
  it('viser brikker for innsendt rapport, åpent spørsmål og bilde til godkjenning', () => {
    setApp({
      reports: [makeReport({ id: 'r1', barnId: 'c1', status: 'innsendt' })],
      inquiries: [
        {
          id: 'q1',
          fadderId: 's1',
          fadderNavn: 'Fadder A',
          barnId: 'c1',
          barnNavn: 'Mia',
          sporsmaal: 'Hvordan går det?',
          datoSendt: '2026-10-01',
          status: 'mottatt',
        },
      ],
      childrenList: [{ ...miaMedFadder(), ventendeFotoStatus: 'innsendt' }],
    });
    render(<AdminPeoplePanel />);
    aapneMia();

    expect(screen.getByText('1 rapport venter på godkjenning')).toBeTruthy();
    expect(screen.getByText('1 ubesvart spørsmål')).toBeTruthy();
    expect(screen.getByText('Bilde venter på godkjenning')).toBeTruthy();
  });

  it('viser ingen brikker når ingenting venter', () => {
    render(<AdminPeoplePanel />);
    aapneMia();
    expect(screen.queryByText('Trenger oppmerksomhet')).toBeNull();
  });
});

describe('Logg', () => {
  it('viser hendelser for barnet, og kommentar lagres med barnets subjekt', () => {
    const fns = setApp({
      auditLogs: [
        {
          id: 'log-1700000000000',
          tidspunkt: '2026-10-10T09:30:00',
          brukerRolle: 'admin',
          brukerNavn: 'Admin',
          handling: 'Barn oppdatert',
          detaljer: 'Skole endret',
          gjelderType: 'child',
          gjelderId: 'c1',
          gjelderNavn: 'Mia (T-01)',
        },
      ],
    });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Logg' }));

    expect(screen.getByText('Skole endret')).toBeTruthy();
    expect(screen.getByText('Skriv saklige notater.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Ny kommentar'), { target: { value: 'Møte med familien.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lagre kommentar' }));

    expect(fns.addPersonComment).toHaveBeenCalledWith({ type: 'child', id: 'c1', navn: 'Mia (T-01)' }, 'Møte med familien.');
  });

  it('viser tom-melding når barnet ikke har hendelser', () => {
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Logg' }));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Ingen hendelser registrert ennå.')).toBeTruthy();
  });
});

describe('Oversikt', () => {
  it('viser fadderhistorikk med nå for åpen tildeling', () => {
    setApp({
      sponsorAssignments: [
        { id: 'a1', sponsorId: 's1', childId: 'c1', koordinatorId: 'k1', startDato: '2026-01-01', andelOre: 0 },
      ],
    });
    render(<AdminPeoplePanel />);
    aapneMia();
    expect(screen.getByText(/Fadder siden 1\. januar 2026/)).toBeTruthy();
    expect(screen.getByText(/– nå/)).toBeTruthy();
  });
});

describe('Trenger oppmerksomhet: dialoger', () => {
  const spoersmaal = (id: string, sporsmaal = 'Hvordan går det?') => ({
    id,
    fadderId: 's1',
    fadderNavn: 'Fadder A',
    barnId: 'c1',
    barnNavn: 'Mia',
    sporsmaal,
    datoSendt: '2026-10-01',
    status: 'mottatt' as const,
  });

  const LANG_RAPPORTTEKST = 'Mia har hatt en fin høst og trives godt på skolen med venner.';

  it('ubesvart spørsmål åpner dialogen, svar lagres og dialogen lukkes, barnesiden står igjen', () => {
    const fns = setApp({ inquiries: [spoersmaal('q1')] });
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.click(screen.getByRole('button', { name: '1 ubesvart spørsmål' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Spørsmål om Mia')).toBeTruthy();

    fireEvent.change(within(dialog).getByPlaceholderText('Skriv svar...'), { target: { value: 'Det går fint' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publiser svar til fadder' }));

    expect(fns.answerInquiry).toHaveBeenCalledWith('q1', 'Det går fint');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('T-01 — Mia')).toBeTruthy();
  });

  it('flere spørsmål: listen først, og «Alle spørsmål» går tilbake', () => {
    setApp({ inquiries: [spoersmaal('q1', 'Første'), spoersmaal('q2', 'Andre')] });
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.click(screen.getByRole('button', { name: '2 ubesvarte spørsmål' }));
    fireEvent.click(screen.getByRole('button', { name: /Andre/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Fra: Fadder A vedr. Mia')).toBeTruthy();

    fireEvent.click(within(dialog).getByRole('button', { name: '← Alle spørsmål' }));
    expect(within(screen.getByRole('dialog')).getAllByRole('button').some((b) => /Første/.test(b.textContent ?? ''))).toBe(true);
  });

  it('Escape lukker dialogen og viser barnesiden igjen', () => {
    setApp({ inquiries: [spoersmaal('q1')] });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('button', { name: '1 ubesvart spørsmål' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('T-01 — Mia')).toBeTruthy();
  });

  it('rapport åpner gjennomgang, og godkjenning sender tittel og tekst', () => {
    const fns = setApp({
      reports: [
        makeReport({
          id: 'r1',
          barnId: 'c1',
          status: 'innsendt',
          tittelFransk: 'Rapport',
          innholdFransk: 'Texte',
          tittelNorsk: 'Høstrapport',
          innholdNorsk: LANG_RAPPORTTEKST,
        }),
      ],
    });
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.click(screen.getByRole('button', { name: '1 rapport venter på godkjenning' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Rapporter om Mia til godkjenning')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publiser til fadder' }));

    expect(fns.approveReport).toHaveBeenCalledWith('r1', 'Høstrapport', LANG_RAPPORTTEKST);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('rapportdialogen har ingen «Send tilbake»-knapp, admin retter selv', () => {
    setApp({
      reports: [makeReport({ id: 'r1', barnId: 'c1', status: 'innsendt', tittelNorsk: 'Tittel', innholdNorsk: LANG_RAPPORTTEKST })],
    });
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.click(screen.getByRole('button', { name: '1 rapport venter på godkjenning' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Send tilbake til koordinator' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Behold i kø' })).toBeTruthy();
  });

  it('bilde til godkjenning åpner dialog med godkjenn-knapp', () => {
    const fns = setApp({
      childrenList: [{ ...miaMedFadder(), ventendeFotoStatus: 'innsendt', ventendeFotoUrl: 'data:image/png;base64,AAAA' }],
    });
    render(<AdminPeoplePanel />);
    aapneMia();

    fireEvent.click(screen.getByRole('button', { name: 'Bilde venter på godkjenning' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Godkjenn og publiser' }));

    expect(fns.approveChildPhoto).toHaveBeenCalledWith('c1');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Fadderhistorikk: reserve for eldre kobling', () => {
  it('viser nåværende fadder med registreringsdato når det ikke finnes tildelingspost', () => {
    setApp({
      sponsors: [
        makeSponsor({ id: 's1', navn: 'Fadder A', tildeltBarnIds: ['c1'], startDato: '2026-01-05' }),
        makeSponsor({ id: 's2', navn: 'Fadder B' }),
      ],
    });
    render(<AdminPeoplePanel />);
    aapneMia();

    expect(screen.getByText(/^Fadder A · fra .+ \(fadderens registreringsdato\) – nå$/)).toBeTruthy();
  });
});

describe('Rapporter-fanen', () => {
  const rapporter = () => [
    makeReport({
      id: 'r-ny',
      barnId: 'c1',
      dato: '2026-10-01',
      status: 'innsendt',
      tittelNorsk: 'Oktoberrapport',
      tittelFransk: 'Rapport octobre',
      innholdNorsk: 'Norsk tekst om Mia og hennes skole.',
      innholdFransk: 'Texte français sur Mia et son école.',
      koordinatorNavn: 'Kari Nordmann',
    }),
    makeReport({
      id: 'r-gammel',
      barnId: 'c1',
      dato: '2026-08-01',
      status: 'godkjent',
      tittelNorsk: 'Sommerrapport',
      tittelFransk: 'Rapport été',
      innholdNorsk: 'Sommertekst.',
      innholdFransk: 'Été texte.',
      godkjentDato: '2026-08-05',
      koordinatorNavn: 'Kari Nordmann',
    }),
    makeReport({ id: 'r-annen', barnId: 'c2', dato: '2026-10-02', status: 'innsendt', tittelNorsk: 'Annen rapport' }),
  ];

  it('lister barnets rapporter nyeste først, med statusbrikker og fanen med antall', () => {
    setApp({ reports: rapporter() });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Rapporter (2)' }));

    const tekst = document.body.textContent ?? '';
    expect(tekst.indexOf('Oktoberrapport')).toBeLessThan(tekst.indexOf('Sommerrapport'));
    expect(screen.getByText('Innsendt')).toBeTruthy();
    expect(screen.getByText('Godkjent')).toBeTruthy();
    expect(screen.queryByText('Annen rapport')).toBeNull();
    expect(screen.getByText(/Godkjent 5\. august 2026/)).toBeTruthy();
  });

  it('ekspanderer rapporten og viser norsk og fransk tekst side om side', () => {
    setApp({ reports: rapporter() });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Rapporter (2)' }));
    fireEvent.click(screen.getByRole('button', { name: /Oktoberrapport/ }));

    expect(screen.getByText('Norsk tekst om Mia og hennes skole.')).toBeTruthy();
    expect(screen.getByText('Texte français sur Mia et son école.')).toBeTruthy();
  });

  it('«Skriv og publiser» åpner skriveflaten, og publisering kaller approveReport', () => {
    const fns = setApp({ reports: rapporter() });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Rapporter (2)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skriv og publiser' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publiser til fadder' }));

    expect(fns.approveReport).toHaveBeenCalledWith('r-ny', 'Oktoberrapport', 'Norsk tekst om Mia og hennes skole.');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('tom tilstand når barnet ikke har rapporter', () => {
    setApp({ reports: [] });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Rapporter (0)' }));
    expect(screen.getByText('Ingen rapporter om Mia ennå.')).toBeTruthy();
  });
});

describe('Tidslinje-fanen', () => {
  it('viser barnets milepæler og fakta fra feltet', () => {
    setApp({
      milestones: [
        {
          id: 'm1',
          barnId: 'c1',
          barnNavn: 'Mia (T-01)',
          dato: '2026-09-15',
          kategori: 'skole',
          tittelFransk: 'Rentrée',
          beskrivelseFransk: '',
          tittelNorsk: 'Startet på skolen',
          beskrivelseNorsk: 'Første skoledag.',
          koordinatorNavn: 'Kari Nordmann',
          opprettetDato: '2026-09-15',
        },
      ],
      fieldFacts: [makeFact({ id: 'f1', barnId: 'c1', trivsel: 'Trives godt i klassen.', status: 'publisert' })],
    });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('tab', { name: 'Tidslinje (2)' }));

    expect(screen.getByText('Startet på skolen')).toBeTruthy();
    expect(screen.getByText('Trives godt i klassen.')).toBeTruthy();
    expect(screen.getByText('Publisert som historie')).toBeTruthy();
  });
});

describe('Oversikt: Siste fra feltet', () => {
  it('viser de tre nyeste, og klikk bytter til riktig fane', () => {
    setApp({
      reports: [
        makeReport({ id: 'r-ny', barnId: 'c1', dato: '2026-10-01', status: 'innsendt', tittelNorsk: 'Oktoberrapport', tittelFransk: 'R', innholdNorsk: 'x', innholdFransk: 'y' }),
        makeReport({ id: 'r-gammel', barnId: 'c1', dato: '2026-08-01', status: 'godkjent', tittelNorsk: 'Sommerrapport', tittelFransk: 'R', innholdNorsk: 'x', innholdFransk: 'y' }),
        makeReport({ id: 'r-kladd', barnId: 'c1', dato: '2026-10-20', status: 'kladd', tittelNorsk: 'Kladdrapport' }),
      ],
      milestones: [
        {
          id: 'm1',
          barnId: 'c1',
          barnNavn: 'Mia (T-01)',
          dato: '2026-09-15',
          kategori: 'skole',
          tittelFransk: 'Rentrée',
          beskrivelseFransk: '',
          tittelNorsk: 'Startet på skolen',
          beskrivelseNorsk: '',
          koordinatorNavn: 'Kari Nordmann',
          opprettetDato: '2026-09-15',
        },
        {
          id: 'm0',
          barnId: 'c1',
          barnNavn: 'Mia (T-01)',
          dato: '2026-01-01',
          kategori: 'skole',
          tittelFransk: 'Vieux',
          beskrivelseFransk: '',
          tittelNorsk: 'Eldste milepæl',
          beskrivelseNorsk: '',
          koordinatorNavn: 'Kari Nordmann',
          opprettetDato: '2026-01-01',
        },
      ],
    });
    render(<AdminPeoplePanel />);
    aapneMia();

    const kort = screen.getByText('Siste fra feltet').closest('section') as HTMLElement;
    const rader = within(kort).getAllByRole('button').map((b) => b.textContent ?? '');
    expect(rader).toHaveLength(3);
    expect(rader[0]).toContain('Oktoberrapport');
    expect(rader[1]).toContain('Startet på skolen');
    expect(rader[2]).toContain('Sommerrapport');
    expect(within(kort).queryByText(/Kladdrapport|Eldste milepæl/)).toBeNull();

    fireEvent.click(within(kort).getByRole('button', { name: /Startet på skolen/ }));
    expect(screen.getByRole('tab', { name: 'Tidslinje (2)' }).getAttribute('aria-selected')).toBe('true');
  });
});

describe('Rapportdialog fra oppmerksomhet', () => {
  it('har ingen «Send tilbake»-knapp', () => {
    setApp({
      reports: [makeReport({ id: 'r1', barnId: 'c1', status: 'innsendt', tittelNorsk: 'Tittel', innholdNorsk: 'Tekst som er lang nok til publisering.' })],
    });
    render(<AdminPeoplePanel />);
    aapneMia();
    fireEvent.click(screen.getByRole('button', { name: '1 rapport venter på godkjenning' }));
    expect(screen.queryByRole('button', { name: /Send tilbake/ })).toBeNull();
  });
});
