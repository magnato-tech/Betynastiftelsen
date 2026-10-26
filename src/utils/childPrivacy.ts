import type { Child, SkoleType } from '../types';

/**
 * Personvern for barn og det fadderen (og KI-assistenten) får se.
 * Alt som kan brukes til å spore opp eller kontakte barnet skal være borte: etternavn, adresse,
 * familie, telefon, e-post, sosiale medier og skolens navn. Modulen er ren og uten avhengigheter.
 */

export const KONTAKT_SKJULT = '[skjult]';

const SKOLETYPE_ETIKETT: Record<SkoleType, string> = {
  offentlig_barneskole: 'Offentlig barneskole',
  privat_barneskole: 'Privat barneskole',
  offentlig_ungdomsskole: 'Offentlig ungdomsskole',
  privat_ungdomsskole: 'Privat ungdomsskole',
  videregaende: 'Videregående skole',
  yrkesskole: 'Yrkesskole',
};

export function skoleTypeLabel(type: SkoleType): string {
  return SKOLETYPE_ETIKETT[type];
}

/**
 * Skole slik fadderen ser den: skoletype og by, aldri skolens navn.
 * Eksempel: «Offentlig barneskole i Brazzaville».
 */
export function sponsorSchoolText(child: Pick<Child, 'skoleType' | 'skoleBy'>): string {
  const by = child.skoleBy?.trim() || 'Brazzaville';
  if (child.skoleType) return `${skoleTypeLabel(child.skoleType)} i ${by}`;
  return `Skole i ${by}`;
}

export type KontaktType = 'telefon' | 'e-post' | 'lenke';
export interface KontaktFunn {
  type: KontaktType;
  match: string;
}

const SOSIALE_DOMENER =
  /\b(?:facebook|fb|instagram|ig|tiktok|snapchat|twitter|x|linkedin|youtube|telegram|t|wa|whatsapp)\.(?:com|me|net|org|co)\b\S*/gi;
const URL_RE = /(?:https?:\/\/|\bwww\.)\S+/gi;
const EPOST_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const HANDLE_RE = /(?<![\w@.])@[A-Za-z0-9_.]{2,}/g;
/** Kandidat til telefonnummer: starter og slutter med siffer, med mellomrom, bindestrek, punktum eller parentes. */
const TELEFON_KANDIDAT_RE = /(?<![\w+])\+?\d[\d\s.()-]{6,}\d(?!\w)/g;

/** Datoer, årsintervaller og klokkeslett som ser ut som telefonnummer, men ikke er det. */
function erDatoEllerAar(kandidat: string): boolean {
  const t = kandidat.trim();
  if (/^\d{1,2}\.?\s*\d{1,2}\.?\s*\d{2,4}$/.test(t)) return true; // 20.10.2026, 20. 10. 2026, 20-10-26
  if (/^\d{4}\s*[-–./]\s*\d{1,2}\s*[-–./]\s*\d{1,2}$/.test(t)) return true; // 2026-10-20
  if (/^(?:19|20)\d{2}\s*[-–]\s*(?:19|20)\d{2}$/.test(t)) return true; // 2025-2026
  return false;
}

/** Beløp som ender på kr/kroner/NOK står etter kandidaten. */
function erBelop(tekst: string, slutt: number): boolean {
  return /^\s*(?:kr\b|kroner\b|NOK\b|€|\$)/i.test(tekst.slice(slutt));
}

type Erstatning = (match: string, type: KontaktType) => string;

/** Kjører alle mønstrene i rekkefølge. Treff erstattes med `erstatt`. Brukes både til skjuling og til å finne funn. */
function kjorMonstre(text: string, erstatt: Erstatning): string {
  let ut = text;
  ut = ut.replace(URL_RE, (m) => erstatt(m, 'lenke'));
  ut = ut.replace(SOSIALE_DOMENER, (m) => erstatt(m, 'lenke'));
  ut = ut.replace(EPOST_RE, (m) => erstatt(m, 'e-post'));
  ut = ut.replace(HANDLE_RE, (m) => erstatt(m, 'lenke'));
  ut = ut.replace(TELEFON_KANDIDAT_RE, (m, offset: number, hel: string) => {
    const siffer = m.replace(/\D/g, '');
    if (siffer.length < 8 || siffer.length > 15) return m;
    if (erDatoEllerAar(m)) return m;
    if (erBelop(hel, offset + m.length)) return m;
    return erstatt(m, 'telefon');
  });
  return ut;
}

/** Erstatter telefonnumre, e-postadresser og lenker/sosiale profiler med «[skjult]». */
export function maskContactInfo(text: string): string {
  if (!text) return text;
  return kjorMonstre(text, () => KONTAKT_SKJULT);
}

/** Finner kontaktopplysninger i teksten (samme regler som maskContactInfo). Funn samles per type, ikke i tekstrekkefølge. */
export function findContactInfo(text: string): KontaktFunn[] {
  if (!text) return [];
  const funn: KontaktFunn[] = [];
  kjorMonstre(text, (match, type) => {
    funn.push({ type, match });
    return KONTAKT_SKJULT;
  });
  return funn;
}

