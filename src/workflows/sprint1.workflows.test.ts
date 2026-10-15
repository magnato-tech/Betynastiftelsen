import { describe, expect, it } from 'vitest';
import { INITIAL_CHILDREN, INITIAL_FACTS } from '../data/initialData';
import { seedStoryFromFacts } from '../utils/adminContentQueue';
import { factsWaitingForStory } from '../utils/fieldFacts';

/** Sprint 1 — resterende innholdskø. KOORD-03/ADM-05 fakta: se fieldFacts.test.ts */
describe('Sprint 1 testsett (workflows)', () => {
  it.todo('KOORD-04: koordinator sender øyeblikk (ett faktum + dato) separat');

  it('ADM-05: admin skriver historien ut fra koordinatorens fakta', () => {
    const fact = factsWaitingForStory(INITIAL_FACTS)[0];
    const draft = seedStoryFromFacts(fact);
    expect(draft).toContain(fact.fornavn);
    expect(draft).toContain(fact.trivsel);
    expect(draft.length).toBeGreaterThan(40);
  });

  it('ADM-06: forhåndsvisning viser fornavn, skole, klassetrinn og historie — ikke intern kode', () => {
    const child = INITIAL_CHILDREN.find((c) => c.id === 'child-01')!;
    const preview = {
      fornavn: child.fornavn,
      skole: child.skoleNavn,
      klasse: child.klassetrinn,
      historie: child.bakgrunnskontekst,
    };
    expect(JSON.stringify(preview)).not.toContain(child.internKode);
    expect(preview.historie.length).toBeGreaterThan(20);
  });

  it.todo('FAD-03: fadder ser siden først når historie er publisert');
});
