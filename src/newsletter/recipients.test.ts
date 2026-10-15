import { describe, expect, it } from 'vitest';
import { INITIAL_COORDINATORS } from '../data/simulationCoordinators';
import { buildSimulationSponsors } from '../data/simulationSponsors';
import { buildNewsletterRecipients } from './recipients';

describe('ADM-10 mottakerliste', () => {
  it('admin kan samle faddere med e-post', () => {
    const list = buildNewsletterRecipients(buildSimulationSponsors(), INITIAL_COORDINATORS, 'sponsors');
    expect(list.length).toBeGreaterThanOrEqual(7);
    expect(list.every((r) => r.role === 'sponsor')).toBe(true);
  });

  it('admin kan samle de tre koordinatorene', () => {
    const list = buildNewsletterRecipients(buildSimulationSponsors(), INITIAL_COORDINATORS, 'coordinators');
    expect(list).toHaveLength(3);
    expect(list.map((r) => r.email)).toContain('jb.mukeba@betyna.test');
  });
});
