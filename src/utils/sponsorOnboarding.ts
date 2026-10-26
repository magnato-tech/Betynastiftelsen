import type { Child, Sponsor, SponsorOnboardingStep } from '../types';

export type SponsorDirectoryStatus = 'aktiv' | 'invitert' | 'sperret' | null;

/** Steg der admin har noe å gjøre. */
const ADMIN_STEG: SponsorOnboardingStep[] = ['ny', 'godkjent', 'barn_tildelt'];

/** Har fadderen fått barn, enten via sponsor-listen eller via barnets tildeltFadderId? */
function harTildeltBarn(sponsor: Sponsor, childrenList: Child[]): boolean {
  if (sponsor.tildeltBarnIds?.length) return true;
  return childrenList.some((c) => c.tildeltFadderId === sponsor.id);
}

/**
 * Onboarding-steget til en fadder, eller null hvis fadderen ikke er i onboarding.
 * Eldre nettside-registreringer uten onboarding-felt regnes som 'ny' hvis de ikke er avsluttet og ikke har barn.
 */
export function onboardingStepOf(
  sponsor: Sponsor,
  childrenList: Child[],
  directoryStatus?: SponsorDirectoryStatus
): SponsorOnboardingStep | null {
  if (sponsor.onboarding) {
    // Innlogget første gang → onboarding er ferdig.
    if (sponsor.onboarding.steg === 'invitert' && directoryStatus === 'aktiv') return 'ferdig';
    return sponsor.onboarding.steg;
  }
  if (sponsor.registrertKilde === 'nettside' && !sponsor.avsluttet && !harTildeltBarn(sponsor, childrenList)) {
    return 'ny';
  }
  return null;
}

/** Steg der admin må gjøre noe (vises som oppgave i varselklokken). */
export function isOpenAdminTask(step: SponsorOnboardingStep | null): boolean {
  return step !== null && ADMIN_STEG.includes(step);
}

export function onboardingTaskTitle(sponsor: Sponsor, step: SponsorOnboardingStep): string {
  switch (step) {
    case 'ny':
      return `Ny fadder: ${sponsor.navn} – venter på godkjenning`;
    case 'godkjent':
      return `${sponsor.navn} – tildel barn`;
    case 'barn_tildelt':
      return `${sponsor.navn} – send velkomst-e-post`;
    default:
      return sponsor.navn;
  }
}

/** Åpne admin-oppgaver for onboarding. Beregnes fra data, lagres ikke. */
export function buildOnboardingTasks(
  sponsors: Sponsor[],
  childrenList: Child[]
): { id: string; sponsorId: string; title: string; step: SponsorOnboardingStep }[] {
  const oppgaver: { id: string; sponsorId: string; title: string; step: SponsorOnboardingStep }[] = [];
  for (const sponsor of sponsors) {
    const step = onboardingStepOf(sponsor, childrenList);
    if (!step || !isOpenAdminTask(step)) continue;
    oppgaver.push({
      id: `onboarding-${sponsor.id}`,
      sponsorId: sponsor.id,
      title: onboardingTaskTitle(sponsor, step),
      step,
    });
  }
  return oppgaver;
}

/** Forenklet tekst til HTML for e-post: escaper tegn, linjeskift blir <br>. */
export function escapeHtml(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plainTextToHtml(tekst: string): string {
  return escapeHtml(tekst).replace(/\r?\n/g, '<br>');
}

function barnTekst(navn: string[]): string {
  if (navn.length === 0) return 'et barn i Brazzaville';
  if (navn.length === 1) return navn[0];
  return `${navn.slice(0, -1).join(', ')} og ${navn[navn.length - 1]}`;
}

/** Utkast til velkomst-e-post. Ren tekst, med fornavn på barn og innloggingslenke. */
export function buildWelcomeEmailDraft(input: {
  sponsorName: string;
  childFirstNames: string[];
  loginUrl: string;
}): { subject: string; body: string } {
  const fornavn = input.sponsorName.trim().split(/\s+/)[0] || 'deg';
  const body = [
    `Hei ${fornavn},`,
    '',
    'Velkommen som fadder i Betyna! Takk for at du vil være med.',
    '',
    `Du følger nå ${barnTekst(input.childFirstNames)}. Vi sender deg gjerne nyheter etter hvert, og du kan se hvordan det går i portalen.`,
    '',
    'Slik logger du inn:',
    `${input.loginUrl}`,
    'Du kan logge inn med Google-kontoen din, eller få en innloggingslenke på e-post til denne adressen.',
    '',
    'Vennlig hilsen',
    'Betyna',
  ].join('\n');
  return { subject: 'Velkommen som fadder i Betyna', body };
}
