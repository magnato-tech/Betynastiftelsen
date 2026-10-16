import type { CmsContent } from '../types';
import { DEFAULT_HERO_LAYOUT } from '../utils/heroLayout';
import { DEFAULT_TESTIMONIALS_SECTION } from '../utils/testimonials';

/** Lås etter første (og eneste) import. Finnes den, skal seed aldri kjøre igjen. */
export interface SeedLock {
  completed: true;
  lockedAt: string;
  seedVersion: string;
}

/** Versjonsmerke på importlåsen i databasen. */
export const LIVE_LAUNCH_VERSION = '2026-10-15-live';

export const SEED_LOCK_COLLECTION = 'system';
export const SEED_LOCK_DOC_ID = 'seedLock';

export const EMPTY_CMS_CONTENT: CmsContent = {
  hero: {
    kicker: '',
    title: '',
    subtitle: '',
    primaryButtonText: '',
    secondaryButtonText: '',
    backgroundPreset: 'pattern',
    scrimOpacity: 70,
    ...DEFAULT_HERO_LAYOUT,
  },
  steps: [],
  aboutCards: [],
  kpiStats: [],
  ctaBanner: {
    title: '',
    subtitle: '',
    buttonText: '',
    backgroundPreset: 'pattern',
    scrimOpacity: 75,
  },
  testimonialsSection: DEFAULT_TESTIMONIALS_SECTION,
};

/**
 * Første visning: bruk frosset lanseringsinnhold (dagens nettside).
 * Har vi allerede lagret data, er det det som gjelder — aldri skriv over.
 */
export function bootStoredOrLive<T>(stored: T | undefined, live: T): T {
  return stored !== undefined ? stored : live;
}

/**
 * Seed skal kjøres én gang, manuelt, mot tom base — aldri fra appen på boot,
 * og aldri når låsen finnes. Tom samling etter lås er ikke grunn til å seede igjen.
 */
export function shouldRunSeedJob(opts: {
  seedEnabled: boolean;
  lock: SeedLock | null;
}): boolean {
  if (!opts.seedEnabled) return false;
  if (opts.lock?.completed === true) return false;
  return true;
}

/** Etter lanseringsimport er automatisk innholdsendring slått av. */
export function contentIsLocked(lock: SeedLock | null): boolean {
  return lock?.completed === true;
}

/** Eksisterende dokumenter overskrives aldri av seed. */
export function mergeSeedWithoutOverwrite<T extends { id: string }>(
  existing: T[],
  seed: T[],
  seedEnabled: boolean
): T[] {
  if (!seedEnabled || existing.length > 0) return existing;
  return seed;
}

export function createSeedLock(seedVersion: string, now = new Date()): SeedLock {
  return {
    completed: true,
    lockedAt: now.toISOString(),
    seedVersion,
  };
}
