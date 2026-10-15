import type { SeedLock } from './seedPolicy';
import { createSeedLock, shouldRunSeedJob } from './seedPolicy';
import { LIVE_LAUNCH_VERSION } from './liveLaunchContent';

export interface PlannedWrite<T extends { id: string }> {
  collection: string;
  created: T[];
  skippedIds: string[];
}

/** Opprett bare dokumenter som ikke finnes. Aldri overwrite. */
export function planCreateOnly<T extends { id: string }>(
  collection: string,
  existingIds: Iterable<string>,
  incoming: T[]
): PlannedWrite<T> {
  const have = new Set(existingIds);
  const created: T[] = [];
  const skippedIds: string[] = [];
  for (const doc of incoming) {
    if (have.has(doc.id)) skippedIds.push(doc.id);
    else created.push(doc);
  }
  return { collection, created, skippedIds };
}

export function planCmsWrite(
  existingCms: unknown | null,
  incoming: unknown
): { write: boolean; skipped: boolean } {
  if (existingCms != null) return { write: false, skipped: true };
  return { write: true, skipped: false };
}

/**
 * Første (og eneste) import av dagens nettside som ekte data.
 * Hvis låsen finnes: ingenting skrives, selv om samlinger er tomme.
 */
export function planLiveLaunchImport(opts: {
  lock: SeedLock | null;
  existingIds: Record<string, string[]>;
  existingCms: unknown | null;
  incoming: {
    collections: Record<string, { id: string }[]>;
    cms: unknown;
  };
}): {
  ran: boolean;
  writes: PlannedWrite<{ id: string }>[];
  cmsWrite: boolean;
  nextLock: SeedLock;
} {
  const nextLock = opts.lock ?? createSeedLock(LIVE_LAUNCH_VERSION);
  if (!shouldRunSeedJob({ seedEnabled: true, lock: opts.lock })) {
    return { ran: false, writes: [], cmsWrite: false, nextLock };
  }

  const writes = Object.entries(opts.incoming.collections).map(([collection, docs]) =>
    planCreateOnly(collection, opts.existingIds[collection] ?? [], docs)
  );
  const cms = planCmsWrite(opts.existingCms, opts.incoming.cms);
  return { ran: true, writes, cmsWrite: cms.write, nextLock };
}
