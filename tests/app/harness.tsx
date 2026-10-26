import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppProvider, useApp } from '../../src/context/AppContext';
import { fakeSync } from './fakeSync';

export type AppApi = ReturnType<typeof useApp>;

const PREFIX = 'betyna_v1_';
export const T0 = new Date('2026-10-16T10:00:00Z');

/** Montert app: `app` er alltid siste tilstand, `run` kjorer en handling inni act(). */
export interface Mounted {
  readonly app: AppApi;
  run(fn: (app: AppApi) => void): void;
  /** Flytter klokken fram (ellers faar to handlinger i samme ms samme id). */
  tick(ms?: number): void;
  utils: ReturnType<typeof render>;
}

/** Navn i testdata (som i gamle localStorage-nokler) -> navn i databasesnapshot. */
const SNAPSHOT_KEY: Record<string, string> = { fieldFacts: 'facts', stories: 'testimonials' };
const LISTS = [
  'coordinators',
  'children',
  'sponsors',
  'catalogPhotos',
  'facts',
  'reports',
  'milestones',
  'inquiries',
  'payments',
  'campaigns',
  'testimonials',
  'notifications',
  'auditLogs',
  'emailOutbox',
];

/**
 * Monterer hele AppProvider. Som standard kommer data fra databasen (fake hydration, "full"),
 * akkurat som for en innlogget admin. Med `{ local: true }` leses data fra localStorage i stedet.
 */
export function mountApp(
  data: Record<string, unknown> = {},
  extra?: (app: AppApi) => React.ReactNode,
  options: {
    local?: boolean;
    keepStorage?: boolean;
    /** Egen hydration, f.eks. delvis (offentlig) innlasting med full:false. */
    hydration?: { data: Record<string, unknown>; full: boolean };
    /** Innlogget Firestore-profil, f.eks. admin som ser som fadder. */
    profile?: { role: string; displayName: string; email: string };
  } = {},
): Mounted {
  if (!options.keepStorage) localStorage.clear();
  fakeSync.reset();
  fakeSync.profile = options.profile ?? null;
  if (options.hydration) {
    fakeSync.hydration = options.hydration;
  } else if (options.keepStorage) {
    // Gjenapner uten aa roere lagringen (simulerer at brukeren laster siden paa nytt).
  } else if (options.local) {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    }
  } else {
    const snapshot: Record<string, unknown> = {};
    for (const list of LISTS) snapshot[list] = [];
    for (const [key, value] of Object.entries(data)) snapshot[SNAPSHOT_KEY[key] ?? key] = value;
    fakeSync.hydration = { data: snapshot, full: true };
  }
  const ref: { current: AppApi | null } = { current: null };
  const Probe = () => {
    ref.current = useApp();
    return extra ? <>{extra(ref.current)}</> : null;
  };
  const utils = render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  return {
    get app() {
      return ref.current as AppApi;
    },
    run(fn) {
      act(() => fn(ref.current as AppApi));
    },
    tick(ms = 10) {
      vi.setSystemTime(Date.now() + ms);
    },
    utils,
  };
}

/** Kall i hver testfil: stiller klokken, stubber nettverk og rydder DOM. */
export function useAppTestLifecycle() {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: T0 });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 503, ok: false, json: async () => ({ ok: false, code: 'NOT_CONFIGURED' }) })),
    );
  });
  afterEach(() => {
    cleanup();
    fakeSync.reset();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });
}

export function stored<T>(key: string): T | undefined {
  const raw = localStorage.getItem(PREFIX + key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}
