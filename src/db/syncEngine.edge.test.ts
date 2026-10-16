import { describe, expect, it } from 'vitest';
import { baselineOf, cleanForWrite, isSuspiciousWipe, planCollectionSync, planSingleSync, stableJson } from './syncEngine';

const item = (id: string, extra: Record<string, unknown> = {}) => ({ id, navn: 'T', ...extra });

describe('stableJson', () => {
  it.each([
    [null, 'null'],
    [undefined, 'null'],
    [1, '1'],
    ['a', '"a"'],
    [true, 'true'],
    [[], '[]'],
    [{}, '{}'],
    [[3, 1, 2], '[3,1,2]'],
    [{ b: 1, a: 2 }, '{"a":2,"b":1}'],
    [{ a: { d: 1, c: 2 } }, '{"a":{"c":2,"d":1}}'],
    [{ a: undefined }, '{}'],
    [{ a: null }, '{"a":null}'],
    [{ a: [{ z: 1, y: 2 }] }, '{"a":[{"y":2,"z":1}]}'],
    [{ n: NaN }, '{"n":null}'],
    [{ d: new Date('2026-01-01T00:00:00Z') }, '{"d":"2026-01-01T00:00:00.000Z"}'],
  ])('stableJson(%j) = %s', (input, expected) => {
    expect(stableJson(input)).toBe(expected);
  });
  it('listerekkefolge har betydning', () => {
    expect(stableJson([1, 2])).not.toBe(stableJson([2, 1]));
  });
  it('tallverdi 0, tom streng og false skilles fra manglende felt', () => {
    expect(stableJson({ a: 0 })).not.toBe(stableJson({}));
    expect(stableJson({ a: '' })).not.toBe(stableJson({}));
    expect(stableJson({ a: false })).not.toBe(stableJson({}));
  });
  it('tegn utenfor ASCII bevares (norske tegn og fransk)', () => {
    expect(stableJson({ n: 'Ærlig Øyvind Åse, élève' })).toContain('Ærlig Øyvind Åse, élève');
  });
});

describe('cleanForWrite', () => {
  it('fjerner undefined dypt, beholder null/0/tom streng', () => {
    expect(cleanForWrite({ a: undefined, b: null, c: 0, d: '', e: { f: undefined, g: 1 }, h: [undefined, 1] })).toEqual({ b: null, c: 0, d: '', e: { g: 1 }, h: [null, 1] });
  });
  it('gir en kopi (ingen delt referanse)', () => {
    const src = { a: { b: 1 } };
    const copy = cleanForWrite(src);
    copy.a.b = 2;
    expect(src.a.b).toBe(1);
  });
});

describe('planCollectionSync', () => {
  it('tom baseline og tom liste gir ingenting', () => {
    expect(planCollectionSync(new Map(), [])).toMatchObject({ sets: [], deletes: [] });
  });
  it('nye dokumenter skrives, ingen slettes', () => {
    const plan = planCollectionSync(new Map(), [item('a'), item('b')]);
    expect(plan.sets.map((s) => s.id)).toEqual(['a', 'b']);
    expect(plan.deletes).toEqual([]);
  });
  it('endret felt gir skriving av hele dokumentet', () => {
    const base = baselineOf([item('a', { x: 1 })]);
    expect(planCollectionSync(base, [item('a', { x: 2 })]).sets).toEqual([item('a', { x: 2 })]);
  });
  it('endret nokkelrekkefolge gir ingen skriving', () => {
    const base = baselineOf([{ id: 'a', x: 1, y: 2 }]);
    expect(planCollectionSync(base, [{ y: 2, x: 1, id: 'a' }]).sets).toEqual([]);
  });
  it('felt satt til undefined regnes som uendret mot manglende felt', () => {
    const base = baselineOf([{ id: 'a' }]);
    expect(planCollectionSync(base, [{ id: 'a', fadder: undefined }]).sets).toEqual([]);
  });
  it('felt som fjernes (blir undefined) gir skriving', () => {
    const base = baselineOf([{ id: 'a', fadder: 's1' }]);
    const plan = planCollectionSync(base, [{ id: 'a', fadder: undefined }]);
    expect(plan.sets).toEqual([{ id: 'a' }]);
  });
  it('neste baseline speiler listen (for videre sammenligning)', () => {
    const plan = planCollectionSync(baselineOf([item('a')]), [item('a'), item('b')]);
    expect([...plan.next.keys()]).toEqual(['a', 'b']);
  });
  it('to lagringer i rad: den andre er tom (idempotent)', () => {
    const items = [item('a'), item('b')];
    const first = planCollectionSync(new Map(), items);
    const second = planCollectionSync(first.next, items);
    expect(second.sets).toEqual([]);
    expect(second.deletes).toEqual([]);
  });
  it('flytting av element i listen gir ingen skriving', () => {
    const base = baselineOf([item('a'), item('b')]);
    expect(planCollectionSync(base, [item('b'), item('a')]).sets).toEqual([]);
  });
  it('duplikat-id i listen: siste vinner i baseline og begge sammenlignes mot baseline', () => {
    const plan = planCollectionSync(new Map(), [item('a', { v: 1 }), item('a', { v: 2 })]);
    expect(plan.sets).toHaveLength(2);
    expect(plan.next.size).toBe(1);
    expect(JSON.parse(plan.next.get('a') as string).v).toBe(2);
  });
  it('1000 dokumenter planlegges raskt og riktig', () => {
    const many = Array.from({ length: 1000 }, (_, i) => item(`d${i}`));
    const base = baselineOf(many);
    const changed = many.map((d, i) => (i % 100 === 0 ? { ...d, navn: 'Endret' } : d));
    const t0 = Date.now();
    const plan = planCollectionSync(base, changed);
    expect(Date.now() - t0).toBeLessThan(1000);
    expect(plan.sets).toHaveLength(10);
  });
});

describe('isSuspiciousWipe: vern mot utilsiktet masse-sletting', () => {
  const base = (n: number) => baselineOf(Array.from({ length: n }, (_, i) => item(`d${i}`)));
  it.each([
    [0, 0, false],
    [1, 1, false],
    [2, 2, false],
    [3, 3, true],
    [3, 2, false],
    [10, 10, true],
    [10, 9, false],
    [100, 100, true],
  ])('baseline %i, %i slettes -> mistenkelig=%s', (size, deleted, expected) => {
    expect(isSuspiciousWipe(base(size), Array.from({ length: deleted }, (_, i) => `d${i}`))).toBe(expected);
  });
  it('KJENT AVVIK F-27: en samling med 1-2 dokumenter kan tommes uten advarsel (f.eks. siste fadder, siste koordinator)', () => {
    expect(isSuspiciousWipe(base(2), ['d0', 'd1'])).toBe(false);
  });
  it('KJENT AVVIK F-27: stor andel (9 av 10) slettes uten advarsel', () => {
    expect(isSuspiciousWipe(base(10), Array.from({ length: 9 }, (_, i) => `d${i}`))).toBe(false);
  });
});

describe('planSingleSync', () => {
  it('foerste lagring skriver, identisk innhold skriver ikke', () => {
    const a = planSingleSync(null, { x: 1 });
    expect(a.write).toBe(true);
    expect(planSingleSync(a.json, { x: 1 }).write).toBe(false);
  });
  it('nokkelrekkefolge paavirker ikke', () => {
    const a = planSingleSync(null, { x: 1, y: 2 });
    expect(planSingleSync(a.json, { y: 2, x: 1 }).write).toBe(false);
  });
  it('data er renset for undefined', () => {
    expect(planSingleSync(null, { x: 1, y: undefined }).data).toEqual({ x: 1 });
  });
  it('null som baseline betyr aldri lest: alltid skriv', () => {
    expect(planSingleSync(null, {}).write).toBe(true);
  });
});
