import { describe, expect, it } from 'vitest';
import {
  baselineOf,
  cleanForWrite,
  isSuspiciousWipe,
  planCollectionSync,
  planSingleSync,
  stableJson,
} from './syncEngine';

const item = (id: string, extra: Record<string, unknown> = {}) => ({ id, navn: 'Test', ...extra });

describe('syncEngine', () => {
  it('ser ikke forskjell på nøkkelrekkefølge eller undefined', () => {
    expect(stableJson({ a: 1, b: undefined, c: [{ y: 1, x: 2 }] })).toBe(stableJson({ c: [{ x: 2, y: 1 }], a: 1 }));
  });

  it('fjerner undefined før skriving', () => {
    expect(cleanForWrite({ id: 'a', fadder: undefined })).toEqual({ id: 'a' });
  });

  it('skriver bare det som er endret eller nytt', () => {
    const base = baselineOf([item('a'), item('b')]);
    const plan = planCollectionSync(base, [item('a'), item('b', { navn: 'Endret' }), item('c')]);
    expect(plan.sets.map((s) => s.id)).toEqual(['b', 'c']);
    expect(plan.deletes).toEqual([]);
  });

  it('sletter det som er fjernet fra listen', () => {
    const base = baselineOf([item('a'), item('b'), item('c')]);
    const plan = planCollectionSync(base, [item('a'), item('c')]);
    expect(plan.deletes).toEqual(['b']);
    expect(plan.sets).toEqual([]);
    expect([...plan.next.keys()]).toEqual(['a', 'c']);
  });

  it('sletter aldri det appen ikke har lest fra databasen', () => {
    const plan = planCollectionSync(new Map(), [item('ny')]);
    expect(plan.deletes).toEqual([]);
    expect(plan.sets).toHaveLength(1);
  });

  it('stopper når hele samlingen forsvinner på én gang', () => {
    const base = baselineOf([item('a'), item('b'), item('c')]);
    const plan = planCollectionSync(base, []);
    expect(isSuspiciousWipe(base, plan.deletes)).toBe(true);
    const one = planCollectionSync(base, [item('a'), item('b')]);
    expect(isSuspiciousWipe(base, one.deletes)).toBe(false);
  });

  it('enkeltdokument skrives bare når det er endret', () => {
    const first = planSingleSync(null, { a: 1 });
    expect(first.write).toBe(true);
    expect(planSingleSync(first.json, { a: 1 }).write).toBe(false);
    expect(planSingleSync(first.json, { a: 2 }).write).toBe(true);
  });
});
