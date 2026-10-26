// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SponsorPortal } from '../../src/components/sponsor/SponsorPortal';
import { makeChild, makeCoordinator, makeReport, makeSponsor } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const SKOLENAVN = 'École Primaire Sainte-Thérèse';

const world = () => ({
  coordinators: [makeCoordinator({ id: 'k1' })],
  children: [
    makeChild({
      id: 'c1',
      fornavn: 'Ange',
      internKode: 'BET-CD-01',
      koordinatorId: 'k1',
      tildeltFadderId: 's1',
      skoleNavn: SKOLENAVN,
      skoleType: 'offentlig_barneskole',
      skoleBy: 'Brazzaville',
      bakgrunnskontekst: 'Bakgrunn om Ange',
      interesser: ['Fotball'],
      behovSammendrag: 'Skolesaker til Ange',
    }),
  ],
  sponsors: [makeSponsor({ id: 's1', navn: 'Fadder Ett', tildeltBarnIds: ['c1'] })],
  reports: [
    makeReport({
      id: 'r1',
      barnId: 'c1',
      barnNavn: 'Ange',
      status: 'godkjent',
      tittelNorsk: 'Rapport for Ange',
      innholdNorsk: 'Ring mor på +242 06 123 45 67 eller skriv til mor@example.com for mer info.',
    }),
  ],
});

function portal(section: string) {
  const m = mountApp(world(), () => <SponsorPortal activeSection={section} setActiveSection={() => undefined} />);
  m.run((a) => {
    a.setRole('sponsor');
    a.setCurrentSponsorId('s1');
  });
  const text = () => m.utils.container.textContent ?? '';
  return { text };
}

describe('Fadderportalen: skole og kontaktopplysninger', () => {
  it('viser skoletype og by i stedet for skolens navn', () => {
    const { text } = portal('barn');
    expect(text()).toContain('Offentlig barneskole i Brazzaville');
    expect(text()).not.toContain(SKOLENAVN);
    expect(text()).not.toContain('Sainte');
  });

  it('viser aldri skolens navn i noen seksjon', () => {
    for (const section of ['barn', 'rapporter', 'tidslinje', 'sporsmaal']) {
      expect(portal(section).text()).not.toContain('Sainte-Thérèse');
    }
  });

  it('maskerer telefonnummer og e-post i en rapport som vises til fadder', () => {
    const { text } = portal('rapporter');
    expect(text()).toContain('Rapport for Ange');
    expect(text()).not.toContain('+242 06 123 45 67');
    expect(text()).not.toContain('mor@example.com');
    expect(text()).toContain('[skjult]');
  });
});
