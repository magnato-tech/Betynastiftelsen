/** Hjelpere for «fadder siden»: varighet og norske datoer. Ingen eksterne avhengigheter. */

const ISO_DATO = /^(\d{4})-(\d{2})-(\d{2})/;

/** Leser YYYY-MM-DD (evt. med klokkeslett etter) som lokal dato. Null ved ugyldig verdi. */
function parseIsoDato(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const m = ISO_DATO.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mnd = Number(m[2]) - 1;
  const dag = Number(m[3]);
  const d = new Date(y, mnd, dag);
  // Avviser datoer som «glir over», f.eks. 2025-02-30.
  if (d.getFullYear() !== y || d.getMonth() !== mnd || d.getDate() !== dag) return null;
  return d;
}

/** Antall dager i en måned (måned 0–11). Tar hensyn til skuddår. */
function dagerIMaaned(aar: number, maaned: number): number {
  return new Date(aar, maaned + 1, 0).getDate();
}

/** Antall fulle måneder mellom to datoer. Dag 29–31 i startmåneden klemmes til sluttmånedens lengde. */
function fulleMaaneder(fra: Date, til: Date): number {
  let maaneder = (til.getFullYear() - fra.getFullYear()) * 12 + (til.getMonth() - fra.getMonth());
  const ankerDag = Math.min(fra.getDate(), dagerIMaaned(til.getFullYear(), til.getMonth()));
  if (til.getDate() < ankerDag) maaneder -= 1;
  return maaneder;
}

/**
 * Varighet på norsk, f.eks. «2 år 7 mnd», «5 mnd», «1 år» eller «Under 1 mnd».
 * `toIso` er valgfri og står for dagens dato. Tom streng ved ugyldig eller fremtidig periode.
 */
export function formatDuration(fromIso: string, toIso?: string): string {
  const fra = parseIsoDato(fromIso);
  const til = toIso === undefined ? new Date() : parseIsoDato(toIso);
  if (!fra || !til || til < fra) return '';

  const maaneder = fulleMaaneder(fra, til);
  if (maaneder < 1) return 'Under 1 mnd';

  const aar = Math.floor(maaneder / 12);
  const rest = maaneder % 12;
  const deler: string[] = [];
  if (aar > 0) deler.push(`${aar} år`);
  if (rest > 0) deler.push(`${rest} mnd`);
  return deler.join(' ');
}

/** Dato på norsk, f.eks. «1. mars 2024». Tom streng ved ugyldig eller manglende verdi. */
export function formatNorwegianDate(iso: string | undefined | null): string {
  const d = parseIsoDato(iso);
  if (!d) return '';
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
