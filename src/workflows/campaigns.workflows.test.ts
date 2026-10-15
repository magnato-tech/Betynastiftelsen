import { describe, expect, it } from 'vitest';
import { INITIAL_CAMPAIGNS, INITIAL_CHILDREN } from '../data/initialData';

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

  it('aktiv innsamling er symaskiner til jenter i fadderordningen', () => {
    const active = INITIAL_CAMPAIGNS.filter((c) => c.status === 'aktiv');
    expect(active).toHaveLength(1);
    expect(active[0].tittel.toLowerCase()).toContain('symaskin');
    expect(active[0].barnIds).toHaveLength(3);
  });
});
