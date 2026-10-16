import { describe, expect, it } from 'vitest';
import { DEFAULT_EMAIL_AUTO_SEND } from '../email/autoSendPrefs';
import { EMPTY_APP_CONTENT } from './emptyContent';
import {
  EMPTY_CMS_CONTENT,
  LIVE_LAUNCH_VERSION,
  SEED_LOCK_COLLECTION,
  SEED_LOCK_DOC_ID,
  bootStoredOrLive,
  contentIsLocked,
  createSeedLock,
  mergeSeedWithoutOverwrite,
  shouldRunSeedJob,
} from './seedPolicy';

const LISTS = ['coordinators', 'sponsors', 'children', 'catalogPhotos', 'facts', 'reports', 'milestones', 'inquiries', 'payments', 'campaigns', 'testimonials', 'notifications', 'auditLogs', 'emailOutbox'] as const;

describe('appen har ingen innebygde data', () => {
  it.each(LISTS)('%s er tom', (key) => {
    expect(EMPTY_APP_CONTENT[key]).toEqual([]);
  });
  it('CMS har bare tomme tekster og tomme lister', () => {
    const cms = EMPTY_APP_CONTENT.cms;
    expect(cms).toBe(EMPTY_CMS_CONTENT);
    for (const value of [cms.hero.kicker, cms.hero.title, cms.hero.subtitle, cms.hero.primaryButtonText, cms.hero.secondaryButtonText, cms.ctaBanner?.title, cms.ctaBanner?.subtitle, cms.ctaBanner?.buttonText]) {
      expect(value).toBe('');
    }
    expect(cms.steps).toEqual([]);
    expect(cms.aboutCards).toEqual([]);
    expect(cms.kpiStats).toEqual([]);
  });
  it('e-postinnstillinger er standardverdiene', () => {
    expect(EMPTY_APP_CONTENT.emailAutoSend).toEqual(DEFAULT_EMAIL_AUTO_SEND);
  });
  it('har noyaktig de forventede nokklene', () => {
    expect(Object.keys(EMPTY_APP_CONTENT).sort()).toEqual([...LISTS, 'cms', 'emailAutoSend'].sort());
  });
  it('ingen personnavn, e-postadresser eller telefonnummer ligger i tomt innhold', () => {
    const json = JSON.stringify(EMPTY_APP_CONTENT);
    expect(json).not.toMatch(/@|\+\d{6,}|\b\d{8}\b/);
  });
});

describe('seedPolicy', () => {
  it('lanseringsversjon og laasedokument er stabile navn', () => {
    expect(LIVE_LAUNCH_VERSION).toBe('2026-10-15-live');
    expect(`${SEED_LOCK_COLLECTION}/${SEED_LOCK_DOC_ID}`).toBe('system/seedLock');
  });
  it('lagret verdi har alltid forrang over lanseringsinnhold, ogsaa tom liste og 0', () => {
    expect(bootStoredOrLive([], [1])).toEqual([]);
    expect(bootStoredOrLive(0, 5)).toBe(0);
    expect(bootStoredOrLive('', 'x')).toBe('');
    expect(bootStoredOrLive(undefined, [1])).toEqual([1]);
  });
  it('seed kjorer aldri naar den er av eller naar laas finnes', () => {
    const lock = createSeedLock('v1', new Date('2026-10-16T10:00:00Z'));
    expect(shouldRunSeedJob({ seedEnabled: false, lock: null })).toBe(false);
    expect(shouldRunSeedJob({ seedEnabled: true, lock })).toBe(false);
    expect(shouldRunSeedJob({ seedEnabled: true, lock: null })).toBe(true);
  });
  it('laas gir laast innhold', () => {
    expect(contentIsLocked(null)).toBe(false);
    expect(contentIsLocked(createSeedLock('v1'))).toBe(true);
  });
  it('seed overskriver aldri eksisterende dokumenter', () => {
    const existing = [{ id: 'a' }];
    expect(mergeSeedWithoutOverwrite(existing, [{ id: 'b' }], true)).toBe(existing);
    expect(mergeSeedWithoutOverwrite([], [{ id: 'b' }], false)).toEqual([]);
    expect(mergeSeedWithoutOverwrite([], [{ id: 'b' }], true)).toEqual([{ id: 'b' }]);
  });
  it('laas har tidsstempel og versjon', () => {
    expect(createSeedLock('v9', new Date('2026-01-02T03:04:05Z'))).toEqual({ completed: true, lockedAt: '2026-01-02T03:04:05.000Z', seedVersion: 'v9' });
  });
});
