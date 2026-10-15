import type { FieldFact, Report } from '../types';
import { factsWaitingForStory } from './fieldFacts';

export type AdminContentKind = 'historie' | 'rapport';

export interface AdminContentQueueItem {
  kind: AdminContentKind;
  id: string;
  barnId: string;
  barnNavn: string;
  dato: string;
  excerpt: string;
  from?: string;
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
    }));
  return [...stories, ...pendingReports].sort((a, b) => a.dato.localeCompare(b.dato));
}
