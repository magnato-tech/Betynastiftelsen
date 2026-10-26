// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { makeChild, makeCoordinator, makeReport, makeSponsor } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const world = (extra: Record<string, unknown> = {}) => ({
  coordinators: [makeCoordinator({ id: 'k1', fornavn: 'Kari', etternavn: 'Kongo' })],
  children: [
    makeChild({ id: 'c1', fornavn: 'Ange', koordinatorId: 'k1', tildeltFadderId: 's1' }),
    makeChild({ id: 'c2', fornavn: 'Beni', koordinatorId: 'k1' }),
  ],
  sponsors: [makeSponsor({ id: 's1', tildeltBarnIds: ['c1'], navn: 'Fadder Ett', epost: 'ett@example.com' })],
  ...extra,
});

describe('Rapportering fra koordinator (Kongo)', () => {
  it('innsendt rapport faar status innsendt, dato og koordinatorinfo', () => {
    const m = mountApp(world());
    m.run((a) => a.setCurrentCoordinatorId('k1'));
    m.run((a) => a.submitReport({ barnId: 'c1', tittelFransk: 'Titre', innholdFransk: 'Contenu', skoleprestasjon: 'God', oppmoteProsent: 88 }));
    const r = m.app.reports[0];
    expect(r).toMatchObject({ barnId: 'c1', barnNavn: 'Ange', koordinatorId: 'k1', status: 'innsendt', dato: '2026-10-16', tittelFransk: 'Titre', oppmoteProsent: 88 });
    expect(r.koordinatorNavn).toBe('Kari Kongo (Brazzaville)');
    expect(r.id).toMatch(/^rep-/);
  });
  it('rapport er IKKE synlig for fadder foer godkjenning (status innsendt)', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({ barnId: 'c1' }));
    expect(m.app.reports.filter((r) => r.status === 'godkjent')).toHaveLength(0);
  });
  it('varsler admin om rapport til godkjenning og bekrefter til koordinator', () => {
    const m = mountApp(world());
    m.run((a) => a.setCurrentCoordinatorId('k1'));
    m.run((a) => a.submitReport({ barnId: 'c1' }));
    const types = m.app.notifications.map((n) => `${n.targetRole}:${n.type}`).sort();
    expect(types).toEqual(['admin:report_needs_approval', 'coordinator:report_needs_approval']);
    expect(m.app.notifications.find((n) => n.targetRole === 'coordinator')?.recipientId).toBe('k1');
  });
  it('koordinatorvarsel er paa fransk, adminvarsel paa norsk', () => {
    const m = mountApp(world());
    m.run((a) => a.setCurrentCoordinatorId('k1'));
    m.run((a) => a.submitReport({ barnId: 'c1' }));
    expect(m.app.notifications.find((n) => n.targetRole === 'coordinator')?.title).toContain('Rapport envoyée');
    expect(m.app.notifications.find((n) => n.targetRole === 'admin')?.title).toContain('krever godkjenning');
  });
  it('rapport knyttes til barnets koordinator, ikke bare innlogget koordinator', () => {
    const m = mountApp(world({ coordinators: [makeCoordinator({ id: 'k1' }), makeCoordinator({ id: 'k2' })] }));
    m.run((a) => a.setCurrentCoordinatorId('k2'));
    m.run((a) => a.submitReport({ barnId: 'c1' }));
    expect(m.app.reports[0].koordinatorId).toBe('k1');
  });
  it('innsending logges i revisjonsloggen', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({ barnId: 'c1' }));
    expect(m.app.auditLogs[0].handling).toBe('Sendte rapport til godkjenning');
  });
  it('nyeste rapport vises forst', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({ barnId: 'c1', tittelFransk: 'Forste' }));
    m.tick();
    m.run((a) => a.submitReport({ barnId: 'c1', tittelFransk: 'Andre' }));
    expect(m.app.reports.map((r) => r.tittelFransk)).toEqual(['Andre', 'Forste']);
  });
});

describe('KJENT AVVIK: rapportinnsending skaper og endrer data (F-18, F-21)', () => {
  it('F-18: oppmote 0 % blir 95 % (|| i stedet for ??) - feil data om barnet', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({ barnId: 'c1', oppmoteProsent: 0 }));
    expect(m.app.reports[0].oppmoteProsent).toBe(95);
  });
  it('F-18: manglende felt fylles med standardtekst ("God fremgang", 95 %, generisk fransk tekst)', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({ barnId: 'c1' }));
    expect(m.app.reports[0]).toMatchObject({ skoleprestasjon: 'God fremgang', oppmoteProsent: 95, tittelFransk: 'Rapport de suivi scolaire' });
  });
  it('F-18: rapport kan sendes inn uten barn (barnId tom)', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({}));
    expect(m.app.reports[0].barnId).toBe('');
    expect(m.app.reports[0].barnNavn).toBe('Elev');
  });
  it('F-18: norsk tekst blir automatisk "[Oversettelse] ..." uten ekte oversettelse', () => {
    const m = mountApp(world());
    m.run((a) => a.submitReport({ barnId: 'c1', tittelFransk: 'Titre', innholdFransk: 'Contenu' }));
    expect(m.app.reports[0].tittelNorsk).toBe('[Oversettelse] Titre');
    expect(m.app.reports[0].innholdNorsk).toContain('[Automatisk utkast til revisjon: Contenu]');
  });
  it('F-21: to rapporter i samme millisekund faar samme id (data overskrives/dupliseres)', () => {
    const m = mountApp(world());
    m.run((a) => {
      a.submitReport({ barnId: 'c1', tittelFransk: 'A' });
      a.submitReport({ barnId: 'c2', tittelFransk: 'B' });
    });
    const ids = m.app.reports.map((r) => r.id);
    expect(new Set(ids).size).toBeLessThan(ids.length);
  });
  it('F-21: varsler i samme millisekund kan faa samme id', () => {
    const m = mountApp(world());
    m.run((a) => {
      a.submitReport({ barnId: 'c1' });
      a.submitReport({ barnId: 'c2' });
    });
    const ids = m.app.notifications.map((n) => n.id);
    expect(new Set(ids).size).toBeLessThan(ids.length);
  });
});

describe('Godkjenning og avvisning i Norge (admin)', () => {
  const withReports = () =>
    mountApp(
      world({
        reports: [
          makeReport({ id: 'r1', barnId: 'c1', barnNavn: 'Ange', koordinatorId: 'k1', tittelNorsk: 'Orig tittel', innholdNorsk: 'Orig innhold' }),
          makeReport({ id: 'r2', barnId: 'c2', barnNavn: 'Beni', koordinatorId: 'k1' }),
        ],
      }),
    );

  it('godkjenning setter status, dato og kvalitetsnotat', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r1'));
    expect(m.app.reports.find((r) => r.id === 'r1')).toMatchObject({ status: 'godkjent', godkjentDato: '2026-10-16' });
    expect(m.app.reports.find((r) => r.id === 'r1')?.adminNotat).toContain('godkjent');
  });
  it('godkjenning kan redigere norsk tittel og innhold', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r1', 'Ny tittel', 'Nytt innhold'));
    expect(m.app.reports[0]).toMatchObject({ tittelNorsk: 'Ny tittel', innholdNorsk: 'Nytt innhold' });
  });
  it('tom redigering beholder opprinnelig norsk tekst', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r1', '', ''));
    expect(m.app.reports[0]).toMatchObject({ tittelNorsk: 'Orig tittel', innholdNorsk: 'Orig innhold' });
  });
  it('godkjenning paavirker bare valgt rapport', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r1'));
    expect(m.app.reports.find((r) => r.id === 'r2')?.status).toBe('innsendt');
  });
  it('godkjenning av rapport om barn uten fadder varsler ingen fadder', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r2'));
    expect(m.app.notifications.filter((x) => x.targetRole === 'sponsor')).toHaveLength(0);
  });
  it('godkjenning logges', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r1'));
    expect(m.app.auditLogs[0].handling).toBe('Godkjente rapport');
  });
  it('e-post til fadder koes IKKE naar automatisk utsending er av (standard)', () => {
    const m = withReports();
    m.run((a) => a.approveReport('r1'));
    expect(m.app.emailOutbox).toHaveLength(0);
  });
  it('e-post koes ikke for barn uten fadder selv om utsending er paa', () => {
    const m = withReports();
    m.run((a) => a.setEmailAutoSendEvent('report_approved', true));
    m.run((a) => a.approveReport('r2'));
    expect(m.app.emailOutbox).toHaveLength(0);
  });
  it('avvisning setter status avvist med begrunnelse til koordinator', () => {
    const m = withReports();
    m.run((a) => a.rejectReport('r1', 'Mangler oppmote'));
    expect(m.app.reports[0].status).toBe('avvist');
    expect(m.app.reports[0].adminNotat).toBe('Retur til koordinator: Mangler oppmote');
  });
  it('avvisning varsler kun koordinator, aldri fadder', () => {
    const m = withReports();
    m.run((a) => a.rejectReport('r1', 'Mangler oppmote'));
    expect(m.app.notifications).toHaveLength(1);
    expect(m.app.notifications[0]).toMatchObject({ targetRole: 'coordinator', type: 'report_rejected' });
  });
  it('avvist rapport er ikke synlig for fadder', () => {
    const m = withReports();
    m.run((a) => a.rejectReport('r1', 'x'));
    expect(m.app.reports.filter((r) => r.status === 'godkjent')).toHaveLength(0);
  });
  it('avvisning logges med begrunnelse', () => {
    const m = withReports();
    m.run((a) => a.rejectReport('r1', 'Mangler oppmote'));
    expect(m.app.auditLogs[0].detaljer).toContain('Mangler oppmote');
  });
});

describe('KJENT AVVIK: feil ved godkjenning (F-19)', () => {
  it('F-19: godkjenning av ukjent rapport varsler ikke koordinatorer (tom recipientId skjules nå, jf. personvern)', () => {
    const m = mountApp(world({ reports: [] }));
    m.run((a) => a.approveReport('finnes-ikke'));
    expect(m.app.notifications).toHaveLength(1);
    expect(m.app.notifications[0].recipientId).toBe('');
    m.run((a) => a.setRole('coordinator'));
    m.run((a) => a.setCurrentCoordinatorId('k1'));
    expect(m.app.currentRoleNotifications).toHaveLength(0);
  });
  it('F-19: godkjenning av ukjent rapport skriver likevel "Godkjente rapport" i revisjonsloggen', () => {
    const m = mountApp(world({ reports: [] }));
    m.run((a) => a.approveReport('finnes-ikke'));
    expect(m.app.auditLogs[0].handling).toBe('Godkjente rapport');
  });
  const approvable = () =>
    mountApp(
      world({
        reports: [makeReport({ id: 'r1', barnId: 'c1', barnNavn: 'Ange', koordinatorId: 'k1' })],
      }),
    );
  it('RETTET F-19: godkjenning varsler fadderen til barnet', () => {
    const m = approvable();
    m.run((a) => a.approveReport('r1'));
    expect(m.app.reports[0].status).toBe('godkjent');
    const tilFadder = m.app.notifications.filter((n) => n.targetRole === 'sponsor');
    expect(tilFadder).toHaveLength(1);
    expect(tilFadder[0].recipientId).toBe(m.app.childrenList.find((c) => c.id === 'c1')?.tildeltFadderId);
  });
  it('RETTET F-19: koordinatorvarselet ved godkjenning gaar til riktig koordinator med barnenavn', () => {
    const m = approvable();
    m.run((a) => a.approveReport('r1'));
    const n = m.app.notifications.filter((x) => x.targetRole === 'coordinator');
    expect(n).toHaveLength(1);
    expect(n[0].recipientId).toBe('k1');
    expect(n[0].title).toContain('(Ange)');
  });
  it('RETTET F-19: e-post til fadder om godkjent rapport koes naar automatisk utsending er paa', () => {
    const m = approvable();
    m.run((a) => a.setEmailAutoSendEvent('report_approved', true));
    m.run((a) => a.approveReport('r1'));
    expect(m.app.emailOutbox.length).toBeGreaterThan(0);
  });
  it('RETTET F-19: avvisning gir koordinatorvarsel til riktig koordinator med barnenavn', () => {
    const m = approvable();
    m.run((a) => a.rejectReport('r1', 'Mangler oppmote'));
    expect(m.app.notifications[0].recipientId).toBe('k1');
    expect(m.app.notifications[0].title).toContain('Ange');
  });
});
