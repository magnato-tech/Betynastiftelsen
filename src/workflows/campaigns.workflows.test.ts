import { describe, expect, it } from 'vitest';
import { INITIAL_CAMPAIGNS, INITIAL_CHILDREN } from '../data/initialData';
import { migrateCampaigns } from '../utils/campaignMigrate';
import type { Campaign } from '../types';

describe('Aksjoner knyttet til barn', () => {
  it('samler ikke inn til bøker for skoleklasser', () => {
    const text = INITIAL_CAMPAIGNS.map((c) => `${c.tittel} ${c.beskrivelse}`).join(' ').toLowerCase();
    expect(text).not.toMatch(/lærebøker|40 bøker|felles lærebok/);
  });

  it('hver aksjon er knyttet til minst ett barn', () => {
    expect(INITIAL_CAMPAIGNS.length).toBeGreaterThan(0);
    for (const camp of INITIAL_CAMPAIGNS) {
      expect(camp.barnIds.length).toBeGreaterThan(0);
      for (const id of camp.barnIds) {
        expect(INITIAL_CHILDREN.some((c) => c.id === id)).toBe(true);
      }
    }
  });

  it('fjerner gammel klassebok-aksjon fra lagret data', () => {
    const leftover = {
      id: 'camp-books',
      tittel: 'Felles lærebøker og regneregler for barnetrinnet',
      beskrivelse: 'Innkjøp av 40 offisielt godkjente lærebøker.',
      maalbelop: 6500,
      innsamletBelop: 6500,
      enhetBeskrivelse: '40 bøker + frakt',
      status: 'fullfort' as const,
      antallGivere: 7,
      barnIds: [],
    } satisfies Campaign;
    expect(migrateCampaigns([...INITIAL_CAMPAIGNS, leftover])).toEqual(INITIAL_CAMPAIGNS);
  });

  it('aktiv innsamling er symaskiner til jenter i fadderordningen', () => {
    const active = INITIAL_CAMPAIGNS.filter((c) => c.status === 'aktiv');
    expect(active).toHaveLength(1);
    expect(active[0].tittel.toLowerCase()).toContain('symaskin');
    expect(active[0].barnIds).toHaveLength(3);
  });
});
