import { describe, expect, it } from 'vitest';
import { shouldReplaceKpiStats } from './cmsKpiMigrate';

describe('CMS nøkkeltall', () => {
  it('bytter ut oppmøte og lederlønn', () => {
    expect(
      shouldReplaceKpiStats([
        { id: 'kpi-1', value: '10', label: 'Elever under oppfølging', sublabel: 'Kinshasa' },
        { id: 'kpi-4', value: '0 kr', label: 'Lederlønninger i Norge', sublabel: 'Ideell' },
      ])
    ).toBe(true);
  });

  it('lar tom eller ekte CMS-tekst stå — fyller ikke inn mock på nytt', () => {
    expect(shouldReplaceKpiStats([])).toBe(false);
    expect(
      shouldReplaceKpiStats([
        { id: 'kpi-1', value: '15', label: 'Barn har fått skolegang', sublabel: 'Brazzaville' },
        { id: 'kpi-2', value: '—', label: 'Fullført videregående', sublabel: '' },
      ])
    ).toBe(false);
  });

  it('beholder nye utdanningstall', () => {
    expect(
      shouldReplaceKpiStats([
        { id: 'kpi-1', value: '15', label: 'Barn har fått skolegang', sublabel: 'Brazzaville' },
        { id: 'kpi-2', value: '8', label: 'Fullført videregående', sublabel: 'prototype' },
        { id: 'kpi-3', value: '4', label: 'Fagbrev (métier)', sublabel: 'prototype' },
        { id: 'kpi-4', value: '2', label: 'Bachelor', sublabel: 'prototype' },
      ])
    ).toBe(false);
  });
});
