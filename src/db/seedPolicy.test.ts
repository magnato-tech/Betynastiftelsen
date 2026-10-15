import { describe, expect, it } from 'vitest';
import {
  bootStoredOrLive,
  contentIsLocked,
  createSeedLock,
  mergeSeedWithoutOverwrite,
  shouldRunSeedJob,
} from './seedPolicy';
import { shouldReplaceKpiStats } from '../utils/cmsKpiMigrate';
import { planCreateOnly, planLiveLaunchImport } from './importLiveContent';
import { LIVE_LAUNCH_VERSION, liveLaunchContent } from './liveLaunchContent';

describe('lanseringsinnhold som ekte data', () => {
  it('lagret admin-innhold vinner over frosset lansering', () => {
    expect(bootStoredOrLive([{ id: 'child-01', fornavn: 'Ekte' }], [{ id: 'child-01', fornavn: 'Lansering' }])).toEqual([
      { id: 'child-01', fornavn: 'Ekte' },
    ]);
  });

  it('første gang uten lagring brukes dagens nettside', () => {
    expect(bootStoredOrLive(undefined, liveLaunchContent.children).length).toBeGreaterThan(0);
    expect(liveLaunchContent.cms.hero.title).toContain('fagbrev');
  });

  it('import oppretter bare manglende id — aldri overwrite', () => {
    const plan = planCreateOnly('children', ['child-01'], [
      { id: 'child-01', x: 'mock' },
      { id: 'child-99', x: 'ny' },
    ]);
    expect(plan.created).toEqual([{ id: 'child-99', x: 'ny' }]);
    expect(plan.skippedIds).toEqual(['child-01']);
  });

  it('andre import gjør ingenting når låsen finnes, også om basen er tom', () => {
    const lock = createSeedLock(LIVE_LAUNCH_VERSION);
    const plan = planLiveLaunchImport({
      lock,
      existingIds: { children: [] },
      existingCms: null,
      incoming: { collections: { children: [{ id: 'child-01' }] }, cms: {} },
    });
    expect(plan.ran).toBe(false);
    expect(plan.writes).toEqual([]);
    expect(plan.cmsWrite).toBe(false);
    expect(contentIsLocked(lock)).toBe(true);
  });

  it('første import kan kjøre og setter lås', () => {
    const plan = planLiveLaunchImport({
      lock: null,
      existingIds: { children: [] },
      existingCms: null,
      incoming: { collections: { children: liveLaunchContent.children }, cms: liveLaunchContent.cms },
    });
    expect(plan.ran).toBe(true);
    expect(plan.cmsWrite).toBe(true);
    expect(plan.nextLock.completed).toBe(true);
    expect(shouldRunSeedJob({ seedEnabled: true, lock: plan.nextLock })).toBe(false);
  });

  it('seed-jobb er av i produksjon', () => {
    expect(shouldRunSeedJob({ seedEnabled: false, lock: null })).toBe(false);
  });

  it('eksisterende dokumenter overskrives aldri', () => {
    expect(
      mergeSeedWithoutOverwrite([{ id: 'child-01', fornavn: 'Ekte' }], [{ id: 'child-01', fornavn: 'Mock' }], true)
    ).toEqual([{ id: 'child-01', fornavn: 'Ekte' }]);
  });

  it('KPI-migrering overskriver ikke ekte tall', () => {
    expect(shouldReplaceKpiStats([])).toBe(false);
    expect(
      shouldReplaceKpiStats([{ id: 'kpi-1', value: '12', label: 'Barn vi følger', sublabel: 'Brazzaville' }])
    ).toBe(false);
  });
});
