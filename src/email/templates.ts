export type SystemTemplateId =
  | 'sponsor_welcome'
  | 'report_approved'
  | 'inquiry_answered'
  | 'payment_registered'
  | 'magic_link';

export interface SystemEmailTemplate {
  id: SystemTemplateId;
  title: string;
  subject: string;
  body: string;
  note: string;
}

export const SYSTEM_EMAIL_TEMPLATES: SystemEmailTemplate[] = [
  {
    id: 'sponsor_welcome',
    title: 'Velkommen som fadder',
    subject: 'Velkommen til Betyna',
    body: 'Hei {navn},\n\nTakk for at du følger et barn i Brazzaville. Du får beskjed her når neste godkjente rapport er klar. Bidraget går uavkortet til det barnet trenger.\n\nVennlig hilsen\nBetyna',
    note: 'Når admin registrerer ny fadder, hvis «Velkommen som fadder» er på under Innstillinger.',
  },
  {
    id: 'report_approved',
    title: 'Ny godkjent rapport',
    subject: 'Ny rapport om barnet du følger',
    body: 'Hei {navn},\n\nEn ny skoleoppdatering er klar i fadderportalen. Logg inn med lenken du har fått av Betyna for å lese den.\n\nVennlig hilsen\nBetyna',
    note: 'Når admin godkjenner en rapport, hvis «Ny godkjent rapport» er på under Innstillinger.',
  },
  {
    id: 'inquiry_answered',
    title: 'Svar på spørsmål',
    subject: 'Svar på spørsmålet ditt hos Betyna',
    body: 'Hei {navn},\n\nDet ligger et svar på spørsmålet ditt på faddersiden. Logg inn og les det ved å klikke på lenken:\n\n{lenke}\n\nVennlig hilsen\nBetyna',
    note: 'Når admin trykker «Publiser svar til fadder», hvis det er slått på under Innstillinger. Lenken er prototype til innlogging kommer.',
  },
  {
    id: 'payment_registered',
    title: 'Betaling registrert',
    subject: 'Vi har registrert innbetalingen din',
    body: 'Hei {navn},\n\nInnbetalingen er registrert manuelt hos Betyna. Du ser den under betalingsoversikten i portalen.\n\nVennlig hilsen\nBetyna',
    note: 'Når admin merker innbetaling som avstemt, hvis det er slått på under Innstillinger. Ikke Vipps-kvittering.',
  },
  {
    id: 'magic_link',
    title: 'Engangslenke (fadderinnlogging)',
    subject: 'Logg inn hos Betyna',
    body: 'Hei {navn},\n\nBruk engangslenken for å åpne faddersiden. Lenken lages av innloggingen — denne malen er bare teksten.\n\nVennlig hilsen\nBetyna',
    note: 'Ekte lenke kommer med innlogging (sprint 5). Ikke send som ferdig innlogging ennå.',
  },
];

export function fillTemplate(
  text: string,
  vars: string | { navn?: string; lenke?: string }
): string {
  const navn = (typeof vars === 'string' ? vars : vars.navn)?.trim() || 'deg';
  const lenke = typeof vars === 'string' ? '' : vars.lenke?.trim() || '';
  return text.replaceAll('{navn}', navn).replaceAll('{lenke}', lenke || 'https://betyna.no');
}
