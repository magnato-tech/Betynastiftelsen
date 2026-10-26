import type { Sponsor, SponsorAssignment } from '../types';

export interface ChildSponsorHistoryItem {
  sponsorId: string;
  navn: string;
  startDato: string;
  sluttDato?: string;
  /** Satt bare når raden er reservekopi fra fadderens registrering (tidligere koblinger uten tildelingspost). */
  kilde?: 'registrering';
}

/**
 * Fadderhistorikk for ett barn, nyest først. Ved samme startdato kommer en åpen tildeling
 * før en avsluttet, og senere lagt til før tidligere (bytte samme dag).
 * Ukjent fadder-id vises med id-en som navn.
 *
 * Reserve: koblinger laget før SponsorAssignment-postene fantes har ingen åpen tildeling.
 * Har barnet en nåværende fadder uten åpen tildeling, legges fadderen først med
 * registreringsdatoen sin som startdato.
 */
export function sponsorHistoryForChild(
  assignments: SponsorAssignment[],
  sponsors: Sponsor[],
  childId: string,
  currentSponsorId?: string
): ChildSponsorHistoryItem[] {
  const historikk = assignments
    .map((a, indeks) => ({ a, indeks }))
    .filter(({ a }) => a.childId === childId)
    .sort((x, y) => {
      if (x.a.startDato !== y.a.startDato) return x.a.startDato < y.a.startDato ? 1 : -1;
      const xApen = x.a.sluttDato ? 0 : 1;
      const yApen = y.a.sluttDato ? 0 : 1;
      if (xApen !== yApen) return yApen - xApen;
      return y.indeks - x.indeks;
    })
    .map(({ a }) => ({
      sponsorId: a.sponsorId,
      navn: sponsors.find((s) => s.id === a.sponsorId)?.navn ?? a.sponsorId,
      startDato: a.startDato,
      sluttDato: a.sluttDato,
    }));

  const harAapen = assignments.some((a) => a.childId === childId && !a.sluttDato);
  if (!currentSponsorId || harAapen) return historikk;
  const naaverende = sponsors.find((s) => s.id === currentSponsorId);
  if (!naaverende) return historikk;
  return [
    {
      sponsorId: naaverende.id,
      navn: naaverende.navn,
      startDato: naaverende.startDato,
      sluttDato: undefined,
      kilde: 'registrering',
    },
    ...historikk,
  ];
}
