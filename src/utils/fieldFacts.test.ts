import { describe, expect, it } from 'vitest';
import { makeChild, makeFact } from '../test/testData';
import { buildFieldFact, factsWaitingForStory } from './fieldFacts';

describe('Sprint 1 KOORD-03 / ADM-05 (fakta)', () => {
  it('KOORD-03: koordinator sender fakta uten ferdig historie', () => {
    const child = makeChild({ id: 'child-b', fornavn: 'Barn B', skoleNavn: 'Testskole Brazzaville' });
    const fact = buildFieldFact({
      child,
      koordinatorId: 'coord-b',
      trivsel: 'Barn B er nysgjerrig og møter opp.',
      dato: '2026-10-15',
    });
    expect(fact.status).toBe('sendt');
    expect(fact.fornavn).toBe('Barn B');
    expect(fact.skoleNavn).toContain('Brazzaville');
    expect(fact.trivsel.length).toBeGreaterThan(5);
  });

  it('ADM-05: sendte fakta ligger i kø eldst først', () => {
    const queue = factsWaitingForStory([
      makeFact({ id: 'f2', barnNavn: 'Nyere', dato: '2026-09-20' }),
      makeFact({ id: 'f1', barnNavn: 'Eldst', dato: '2026-09-02' }),
      makeFact({ id: 'f3', status: 'publisert' }),
    ]);
    expect(queue).toHaveLength(2);
    expect(queue[0].barnNavn).toBe('Eldst');
  });
});
