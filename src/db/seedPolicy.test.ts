import { describe, expect, it } from 'vitest';
import {
  LIVE_LAUNCH_VERSION,
  bootStoredOrLive,
  contentIsLocked,
  createSeedLock,
  mergeSeedWithoutOverwrite,
  shouldRunSeedJob,
} from './seedPolicy';
import { shouldReplaceKpiStats } from '../utils/cmsKpiMigrate';

describe('lås og overskriving', () => {
  it('lagret innhold vinner alltid over standardverdi', () => {
    expect(bootStoredOrLive([{ id: 'a', navn: 'Ekte' }], [{ id: 'a', navn: 'Standard' }])).toEqual([
      { id: 'a', navn: 'Ekte' },
    ]);
  });

  it('uten lagring brukes standardverdien (tom)', () => {
    expect(bootStoredOrLive<unknown[]>(undefined, [])).toEqual([]);
  });

  it('andre import gjør ingenting når låsen finnes, også om basen er tom', () => {
    const lock = createSeedLock(LIVE_LAUNCH_VERSION);
    expect(shouldRunSeedJob({ seedEnabled: true, lock })).toBe(false);
    expect(contentIsLocked(lock)).toBe(true);
  });

  it('første import kan kjøre når låsen mangler', () => {
    expect(shouldRunSeedJob({ seedEnabled: true, lock: null })).toBe(true);
  });

  it('seed-jobb er av i produksjon', () => {
    expect(shouldRunSeedJob({ seedEnabled: false, lock: null })).toBe(false);
  });

  it('eksisterende dokumenter overskrives aldri', () => {
    expect(
      mergeSeedWithoutOverwrite([{ id: 'a', navn: 'Ekte' }], [{ id: 'a', navn: 'Standard' }], true)
    ).toEqual([{ id: 'a', navn: 'Ekte' }]);
  });

  it('KPI-migrering overskriver ikke ekte tall', () => {
    expect(shouldReplaceKpiStats([])).toBe(false);
    expect(
      shouldReplaceKpiStats([{ id: 'kpi-1', value: '12', label: 'Barn vi følger', sublabel: 'Brazzaville' }])
    ).toBe(false);
  });
});
