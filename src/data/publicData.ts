import { Child, Report, Sponsor, Inquiry, PaymentRecord, Campaign, AdultGraduateStory, AuditLogItem, AppNotification, CmsContent, ChildMilestone } from '../types';

export const INITIAL_CHILDREN: Child[] = [];
export const INITIAL_SPONSORS: Sponsor[] = [];
export const INITIAL_REPORTS: Report[] = [];
export const INITIAL_INQUIRIES: Inquiry[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
export const INITIAL_CAMPAIGNS: Campaign[] = [];
export const INITIAL_STORIES: AdultGraduateStory[] = [];
export const INITIAL_AUDIT_LOG: AuditLogItem[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_MILESTONES: ChildMilestone[] = [];

export const INITIAL_CMS_CONTENT: CmsContent = {
  hero: {
    kicker: 'Betyna · Norge & Kongo',
    title: 'Vi følger barn i Kongo gjennom hele utdanningsløpet',
    subtitle: 'En personlig fadderordning. For 250 eller 350 kroner i måneden, 3 500 kroner i året, går beløpet uavkortet til det barnet trenger for å fullføre skolegangen.',
    primaryButtonText: 'Bli fadder i dag',
    secondaryButtonText: 'Slik fungerer ordningen',
    backgroundImageUrl: 'IMG_1194.jpg',
    backgroundPreset: 'custom',
    scrimOpacity: 70,
  },
  steps: [
    {
      number: 1,
      title: 'Personlig tildeling',
      description: 'Når du blir fadder, knyttes du til ett barn. Private barneprofiler legges ikke ut på den åpne siden.',
    },
    {
      number: 2,
      title: 'Oppfølging fra Kongo',
      description: 'Koordinator skriver det som har skjedd. Teksten godkjennes før den vises til fadderen.',
    },
    {
      number: 3,
      title: 'Frem til skolegangen er fullført',
      description: 'Målet er at barnet fullfører skolegangen. Bidraget dekker det som trengs underveis.',
    },
  ],
  aboutCards: [
    {
      id: 'principle-1',
      title: 'Verdighet',
      description: 'Vi bruker ikke sykdom, tap eller nød som innsamlingstekst. Barna omtales med respekt.',
      iconName: 'Scale',
    },
    {
      id: 'principle-2',
      title: 'Ingen oppdiktede historier',
      description: 'Enkeltnavn og historier legges ut først når samtykke er dokumentert.',
      iconName: 'FileCheck',
    },
    {
      id: 'principle-3',
      title: 'Lite på den åpne siden',
      description: 'Den åpne siden viser arbeidet samlet. Det enkelte barnets opplysninger holdes unna.',
      iconName: 'ShieldCheck',
    },
    {
      id: 'principle-4',
      title: 'Oppfølging i Kongo',
      description: 'Koordinatorene følger barna der de går på skole, og sender fakta som godkjennes før noe legges ut.',
      iconName: 'Users',
    },
  ],
  kpiStats: [
    {
      id: 'kpi-1',
      value: '15',
      label: 'Barn har fått skolegang',
      sublabel: 'Over 10–15 år',
    },
    {
      id: 'kpi-2',
      value: '10',
      label: 'Faddere',
      sublabel: '3 500 kr i året hver',
    },
    {
      id: 'kpi-3',
      value: '35 000 kr',
      label: 'I året til skolegangen',
      sublabel: 'Går uavkortet',
    },
    {
      id: 'kpi-4',
      value: '0 kr',
      label: 'Lønn',
      sublabel: 'Frivillig arbeid',
    },
  ],
  ctaBanner: {
    title: 'Vil du bli fadder?',
    subtitle: 'Fadderbeløpet er 250 eller 350 kr/mnd og går uavkortet til det barnet trenger for å fullføre skolegangen.',
    buttonText: 'Les hvordan avtalen gjøres',
    backgroundImageUrl: '',
    backgroundPreset: 'pattern',
    scrimOpacity: 75,
  },
};
