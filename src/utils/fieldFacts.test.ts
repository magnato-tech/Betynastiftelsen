import { describe, expect, it } from 'vitest';
import { INITIAL_CHILDREN, INITIAL_FACTS } from '../data/initialData';
import { buildFieldFact, factsWaitingForStory } from './fieldFacts';

describe('Sprint 1 KOORD-03 / ADM-05 (fakta)', () => {
  it('KOORD-03: koordinator sender fakta uten ferdig historie', () => {
    const child = INITIAL_CHILDREN.find((c) => c.id === 'child-05')!;
    const fact = buildFieldFact({
      child,
      koordinatorId: 'coord-02',
      trivsel: 'Jonathan er nysgjerrig og møter opp.',
      dato: '2026-10-15',
    });
    expect(fact.status).toBe('sendt');
    expect(fact.fornavn).toBe('Jonathan');
    expect(fact.skoleNavn).toContain('Brazzaville');
    expect(fact.trivsel.length).toBeGreaterThan(5);
  });

  it('ADM-05: sendte fakta ligger i kø eldst først', () => {
    const queue = factsWaitingForStory(INITIAL_FACTS);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue[0].barnNavn).toBe('Ephraim');
  });
});
