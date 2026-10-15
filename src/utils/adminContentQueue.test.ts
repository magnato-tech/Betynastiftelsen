import { describe, expect, it } from 'vitest';
import { makeFact, makeReport } from '../test/testData';
import {
  buildAdminContentQueue,
  buildAdminContentRegister,
  seedStoryFromFacts,
  sortAdminContentItems,
} from './adminContentQueue';

const facts = [
  makeFact({ id: 'f-new', barnNavn: 'Barn B', fornavn: 'Barn B', dato: '2026-09-20' }),
  makeFact({ id: 'f-old', barnNavn: 'Barn A', fornavn: 'Barn A', dato: '2026-09-02' }),
  makeFact({ id: 'f-done', status: 'publisert', dato: '2026-08-01' }),
];
const reports = [
  makeReport({ id: 'r-wait', status: 'innsendt', dato: '2026-09-10' }),
  makeReport({ id: 'r-ok', status: 'godkjent', dato: '2026-09-05', godkjentDato: '2026-09-06' }),
  makeReport({ id: 'r-draft', status: 'kladd', dato: '2026-09-07' }),
];

describe('Admin innholdskø', () => {
  it('ADM-05: eldst først, historie og rapport i samme kø', () => {
    const queue = buildAdminContentQueue(facts, reports);
    expect(queue.map((i) => i.id)).toEqual(['f-old', 'r-wait', 'f-new']);
    expect(queue.some((i) => i.kind === 'historie')).toBe(true);
    expect(queue.some((i) => i.kind === 'rapport')).toBe(true);
  });

  it('lager historietekst fra fakta uten å finne på nytt', () => {
    const text = seedStoryFromFacts({
      fornavn: 'Barn A',
      skoleNavn: 'Testskole',
      klassetrinn: '4. klasse',
      trivsel: 'Trives i klassen.',
    });
    expect(text).toContain('Barn A');
    expect(text).toContain('Trives i klassen.');
    expect(text).not.toContain('malaria');
  });

  it('samme tabell har ventende og publiserte rapporter med status', () => {
    const register = buildAdminContentRegister(facts, reports);
    expect(register.some((i) => i.status === 'venter' && i.kind === 'rapport')).toBe(true);
    expect(register.some((i) => i.status === 'publisert' && i.kind === 'rapport')).toBe(true);
    const newestFirst = sortAdminContentItems(register, 'dato', 'desc');
    for (let i = 1; i < newestFirst.length; i++) {
      expect(newestFirst[i - 1].dato >= newestFirst[i].dato).toBe(true);
    }
  });
});
