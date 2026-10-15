import type { FieldFact, Report } from '../types';
import { factsWaitingForStory } from './fieldFacts';

export type AdminContentKind = 'historie' | 'rapport';
export type AdminContentStatus = 'venter' | 'publisert';
export type AdminContentSortKey = 'dato' | 'barnNavn' | 'kind' | 'status';
export type AdminContentSortDir = 'asc' | 'desc';

export interface AdminContentQueueItem {
  kind: AdminContentKind;
  id: string;
  barnId: string;
  barnNavn: string;
  dato: string;
  excerpt: string;
  from?: string;
  status: AdminContentStatus;
}

export function seedStoryFromFacts(input: {
  fornavn: string;
  skoleNavn: string;
  klassetrinn: string;
  trivsel: string;
}): string {
  const trivsel = input.trivsel.trim();
  return `${input.fornavn} går i ${input.klassetrinn} ved ${input.skoleNavn}.\n\n${trivsel}`;
}

export function buildAdminContentQueue(facts: FieldFact[], reports: Report[]): AdminContentQueueItem[] {
  const stories: AdminContentQueueItem[] = factsWaitingForStory(facts).map((f) => ({
    kind: 'historie' as const,
    id: f.id,
    barnId: f.barnId,
    barnNavn: f.barnNavn,
    dato: f.dato,
    excerpt: f.trivsel,
    from: 'Fakta fra koordinator',
    status: 'venter',
  }));
  const pendingReports: AdminContentQueueItem[] = reports
    .filter((r) => r.status === 'innsendt')
    .map((r) => ({
      kind: 'rapport' as const,
      id: r.id,
      barnId: r.barnId,
      barnNavn: r.barnNavn,
      dato: r.dato,
      excerpt: r.innholdFransk,
      from: r.koordinatorNavn,
      status: 'venter',
    }));
  return [...stories, ...pendingReports].sort((a, b) => a.dato.localeCompare(b.dato));
}

/** Køen pluss publiserte rapporter — én tabell, status skiller dem. */
export function buildAdminContentRegister(facts: FieldFact[], reports: Report[]): AdminContentQueueItem[] {
  const waiting = buildAdminContentQueue(facts, reports);
  const published: AdminContentQueueItem[] = reports
    .filter((r) => r.status === 'godkjent')
    .map((r) => ({
      kind: 'rapport' as const,
      id: r.id,
      barnId: r.barnId,
      barnNavn: r.barnNavn,
      dato: r.godkjentDato || r.dato,
      excerpt: r.tittelNorsk,
      from: r.koordinatorNavn,
      status: 'publisert' as const,
    }));
  return [...waiting, ...published];
}

export function sortAdminContentItems(
  items: AdminContentQueueItem[],
  key: AdminContentSortKey,
  dir: AdminContentSortDir
): AdminContentQueueItem[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return a.dato.localeCompare(b.dato) * sign;
  });
}
