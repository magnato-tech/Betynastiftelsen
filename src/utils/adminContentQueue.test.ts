import { describe, expect, it } from 'vitest';
import { INITIAL_FACTS, INITIAL_REPORTS } from '../data/initialData';
import {
  buildAdminContentQueue,
  buildAdminContentRegister,
  seedStoryFromFacts,
  sortAdminContentItems,
} from './adminContentQueue';

describe('Admin innholdskø', () => {
  it('ADM-05: eldst først, historie og rapport i samme kø', () => {
    const queue = buildAdminContentQueue(INITIAL_FACTS, INITIAL_REPORTS);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.some((i) => i.kind === 'historie' && i.barnNavn === 'Ephraim')).toBe(true);
    expect(queue.some((i) => i.kind === 'rapport')).toBe(true);
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i - 1].dato <= queue[i].dato).toBe(true);
    }
  });

  it('lager historietekst fra fakta uten å finne på nytt', () => {
    const text = seedStoryFromFacts({
      fornavn: 'Ephraim',
      skoleNavn: 'École Primaire Sainte-Thérèse, Brazzaville',
      klassetrinn: '4. klasse',
      trivsel: 'Trives i klassen.',
    });
    expect(text).toContain('Ephraim');
    expect(text).toContain('Trives i klassen.');
    expect(text).not.toContain('malaria');
  });

  it('samme tabell har ventende og publiserte rapporter med status', () => {
    const register = buildAdminContentRegister(INITIAL_FACTS, INITIAL_REPORTS);
    expect(register.some((i) => i.status === 'venter' && i.kind === 'rapport')).toBe(true);
    expect(register.some((i) => i.status === 'publisert' && i.kind === 'rapport')).toBe(true);
    const newestFirst = sortAdminContentItems(register, 'dato', 'desc');
    for (let i = 1; i < newestFirst.length; i++) {
      expect(newestFirst[i - 1].dato >= newestFirst[i].dato).toBe(true);
    }
  });
});
