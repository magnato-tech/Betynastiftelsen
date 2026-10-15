/**
 * Lagringsmotor: regner ut hva som må skrives til og slettes fra databasen
 * ved å sammenligne dagens tilstand med det som sist ble lest eller lagret.
 * Ren logikk uten Firebase, slik at den kan testes.
 */

/** JSON uten undefined (Firestore tåler det ikke), med faste nøkkelrekkefølge. */
export function stableJson(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = sort((v as Record<string, unknown>)[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return JSON.stringify(sort(JSON.parse(JSON.stringify(value ?? null))));
}

/** Kopi uten undefined, klar til å skrives. */
export function cleanForWrite<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type Baseline = Map<string, string>;

export function baselineOf<T extends { id: string }>(items: T[]): Baseline {
  return new Map(items.map((i) => [i.id, stableJson(i)]));
}

export interface CollectionPlan<T extends { id: string }> {
  sets: T[];
  deletes: string[];
  next: Baseline;
}

export function planCollectionSync<T extends { id: string }>(baseline: Baseline, items: T[]): CollectionPlan<T> {
  const next: Baseline = new Map();
  const sets: T[] = [];
  for (const item of items) {
    const json = stableJson(item);
    next.set(item.id, json);
    if (baseline.get(item.id) !== json) sets.push(cleanForWrite(item));
  }
  const deletes = [...baseline.keys()].filter((id) => !next.has(id));
  return { sets, deletes, next };
}

/**
 * Vern mot ulykker: å fjerne hele samlingen i én lagring (når den hadde flere dokumenter)
 * ser ut som en feil, ikke som et bevisst valg. Slikt stoppes og meldes.
 */
export function isSuspiciousWipe(baseline: Baseline, deletes: string[]): boolean {
  return baseline.size >= 3 && deletes.length === baseline.size;
}

export function planSingleSync<T>(baselineJson: string | null, value: T): { write: boolean; json: string; data: T } {
  const json = stableJson(value);
  return { write: json !== baselineJson, json, data: cleanForWrite(value) };
}
