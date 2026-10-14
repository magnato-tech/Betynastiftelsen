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
    title: 'Vi følger barnet til fagbrev, utdanning og en reell jobb',
    subtitle:
      'Betyna er unik fordi vi ikke stopper ved skolegang alene. For 250 eller 350 kroner i måneden følger vi barnet helt til det har fullført et fagbrev eller en utdanning og faktisk kan forsørge sin familie.',
    primaryButtonText: 'Bli fadder i dag',
    secondaryButtonText: 'Slik fungerer ordningen',
    backgroundImageUrl: 'IMG_1194.jpg',
    backgroundPreset: 'custom',
    scrimOpacity: 70,
  },
  steps: [
    {
      number: 1,
      title: 'Én fadder, ett barn',
      description:
        'De fleste går på privatskole som koster penger. Når du blir fadder, knyttes du til ett barn som er avhengig av at bidraget kommer — måned for måned.',
    },
    {
      number: 2,
      title: 'Oppfølging fra Kongo',
      description: 'Koordinator skriver det som har skjedd. Teksten godkjennes før den vises til fadderen.',
    },
    {
      number: 3,
      title: 'Hele løpet — til jobb',
      description:
        'Det hjelper lite med mange år på skolen uten å komme videre. Vi følger til fagbrev eller utdanning er fullført og barnet kan få jobb og bli den stabile forsørgeren familien trenger.',
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
      title: 'Hele løpet teller',
      description:
        'Familien trenger ikke bare skoleplass — de trenger et barn som fullfører og kan forsørge andre. Vi avslutter ikke før utdanningen gir en reell vei til arbeid.',
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
    title: 'Vil du bety en forskjell for ett barn?',
    subtitle:
      '250 eller 350 kr i måneden holder ofte skoleplassen oppe på privatskole — for ett barn som er avhengig av deg, helt til fagbrev, utdanning og jobb.',
    buttonText: 'Les hvordan avtalen gjøres',
    backgroundImageUrl: '',
    backgroundPreset: 'pattern',
    scrimOpacity: 75,
  },
};
