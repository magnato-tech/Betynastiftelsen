import { Child, Report, Sponsor, Inquiry, PaymentRecord, Campaign, AdultGraduateStory, AuditLogItem, AppNotification, CmsContent, ChildMilestone, Coordinator, FieldFact, CatalogPhoto } from '../types';

export const INITIAL_COORDINATORS: Coordinator[] = [];
export const INITIAL_FACTS: FieldFact[] = [];
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
export const INITIAL_CATALOG_PHOTOS: CatalogPhoto[] = [];

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
      title: 'Pengene frem via familien',
      description:
        'Koordinator sørger for at bidraget når barnet gjennom omsorgspersoner i storfamilien — til skole, uniform og medisin. Barnet får ikke pengene i egen hånd.',
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
      description:
        'Vi bruker ikke sykdom, tap eller nød som innsamlingstekst. Barn omtales med respekt — som elever og mennesker, ikke som «saker».',
      iconName: 'Scale',
    },
    {
      id: 'principle-2',
      title: 'Storfamilien først',
      description:
        'Pengene går via omsorgspersoner i familien, ikke til barnehjem. Vi styrker det nettverket som allerede bærer ansvaret i Kongo.',
      iconName: 'Users',
    },
    {
      id: 'principle-3',
      title: 'Hele løpet',
      description:
        'Vi stopper ikke ved skoleår. Målet er fagbrev eller utdanning som gir jobb — og et liv der barnet kan forsørge sin egen familie.',
      iconName: 'FileCheck',
    },
    {
      id: 'principle-4',
      title: 'Lite og personlig',
      description:
        'Én fadder, ett barn. Du er ikke «én i mengden». Vi er små nok til å merke når noe skjer — og ærlige om hva det betyr for skoleplassen.',
      iconName: 'ShieldCheck',
    },
  ],
  kpiStats: [
    {
      id: 'kpi-1',
      value: '15',
      label: 'Barn har fått skolegang',
      sublabel: 'Brazzaville, over 10–15 år',
    },
    {
      id: 'kpi-2',
      value: '8',
      label: 'Fullført videregående',
      sublabel: 'Foreløpige tall (prototype)',
    },
    {
      id: 'kpi-3',
      value: '4',
      label: 'Fagbrev (métier)',
      sublabel: 'Foreløpige tall (prototype)',
    },
    {
      id: 'kpi-4',
      value: '2',
      label: 'Bachelor',
      sublabel: 'Foreløpige tall (prototype)',
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
