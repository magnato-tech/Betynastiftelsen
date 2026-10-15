export type UserRole = 'public' | 'sponsor' | 'coordinator' | 'admin';
export type AppLanguage = 'no' | 'fr';

export type ChildStatus = 'aktiv' | 'avsluttet' | 'arkivert';

export interface Coordinator {
  id: string;
  fornavn: string;
  etternavn: string;
  epost: string;
  telefon: string;
  distrikt: string;
  aktiv: boolean;
}

export interface Child {
  id: string;
  internKode: string; // f.eks. BET-CD-01
  fornavn: string;
  fodselsaar: number;
  kjonn: 'gutt' | 'jente';
  skoleNavn: string;
  klassetrinn: string;
  interesser: string[];
  bakgrunnskontekst: string; // Verdig og nøktern beskrivelse
  fotoTema: 'skole' | 'tegning' | 'klasse' | 'portrett';
  samtykkeFoto: boolean;
  samtykkeHistorie: boolean;
  status: ChildStatus;
  tildeltFadderId?: string;
  behovSammendrag: string;
  opprettetDato: string;
  sistOppdatert: string;
  /** Feltkoordinator i Brazzaville som følger opp eleven. */
  koordinatorId: string;
  /** Godkjent bilde synlig for tildelt fadder. */
  publisertFotoUrl?: string;
  /** Bilde sendt til Oslo, venter godkjenning. */
  ventendeFotoUrl?: string;
  ventendeFotoBeskrivelseFr?: string;
  ventendeFotoStatus?: 'innsendt' | 'avvist';
  ventendeFotoInnsendtDato?: string;
}

export type CatalogPhotoStatus = 'innsendt' | 'publisert' | 'avvist';

/** Skolebilde i koordinatorens katalog. Ett bilde kan merkes med flere barn. */
export interface CatalogPhoto {
  id: string;
  /** child-id, internKode eller fornavn — vises på alle matcher. */
  barnIds: string[];
  url: string;
  beskrivelseFr: string;
  beskrivelseNo?: string;
  koordinatorId: string;
  dato: string;
  status: CatalogPhotoStatus;
}

export type ContentItemStatus = 'ikke_sendt' | 'sendt' | 'publisert';

/** Fakta fra koordinator — grunnlag for historien admin skriver (kap. 5). */
export interface FieldFact {
  id: string;
  barnId: string;
  barnNavn: string;
  koordinatorId: string;
  dato: string;
  fornavn: string;
  skoleNavn: string;
  klassetrinn: string;
  trivsel: string;
  status: ContentItemStatus;
}

export type ReportStatus = 'kladd' | 'innsendt' | 'godkjent' | 'avvist';

export interface Report {
  id: string;
  barnId: string;
  barnNavn: string;
  koordinatorId: string;
  koordinatorNavn: string;
  dato: string;
  tittelFransk: string;
  innholdFransk: string;
  tittelNorsk: string;
  innholdNorsk: string;
  skoleprestasjon: string;
  oppmoteProsent: number;
  status: ReportStatus;
  adminNotat?: string;
  godkjentDato?: string;
}

export interface Sponsor {
  id: string;
  navn: string;
  epost: string;
  telefon: string;
  poststed: string;
  maanedsbelop: number; // 250, 350, eller annet
  betalingsmetode: 'vipps' | 'avtalegiro' | 'bank';
  betalingsstatus: 'aktiv' | 'pause';
  startDato: string;
  tildeltBarnId: string;
  /** Hvor registreringen kom fra (simulering / prototype). */
  registrertKilde?: 'admin' | 'nettside' | 'import';
}

export type InquiryStatus = 'mottatt' | 'under_behandling' | 'venter_koordinator' | 'besvart' | 'lukket';

export interface Inquiry {
  id: string;
  fadderId: string;
  fadderNavn: string;
  barnId: string;
  barnNavn: string;
  sporsmaal: string;
  datoSendt: string;
  status: InquiryStatus;
  svarTekst?: string;
  svarDato?: string;
  koordinatorNotatFr?: string;
  koordinatorId?: string;
}

export type PaymentType = 'fadderbidrag' | 'aksjon';
export type PaymentStatus = 'fullfort' | 'forventet' | 'avstemt';

export interface PaymentRecord {
  id: string;
  fadderId?: string;
  fadderNavn: string;
  aksjonId?: string;
  aksjonTittel?: string;
  belop: number;
  dato: string;
  type: PaymentType;
  metode: 'vipps' | 'avtalegiro' | 'bank';
  status: PaymentStatus;
  referanse: string;
}

export interface Campaign {
  id: string;
  tittel: string;
  beskrivelse: string;
  maalbelop: number;
  innsamletBelop: number;
  enhetBeskrivelse: string;
  status: 'aktiv' | 'fullfort';
  sluttrapport?: string;
  antallGivere: number;
  bildeUrl?: string;
  /** Aksjoner er alltid knyttet til barn, aldri til en skoleklasse. */
  barnIds: string[];
}

export type TestimonialCategory = 'donor' | 'child' | 'graduate';

export interface AdultGraduateStory {
  id: string;
  category?: TestimonialCategory;
  navn: string;
  alder?: number;
  rolle?: string;
  sted?: string;
  naavaerendeYrke?: string;
  utdanningslop?: string;
  historie: string;
  samtykkeDokumentert: boolean;
  godkjentAvAdmin: boolean;
  aarFullfort?: number;
  bildeUrl?: string;
  fremhevetPaaForside?: boolean;
  opprettetDato?: string;
}

export type TestimonialStory = AdultGraduateStory;

export interface AuditLogItem {
  id: string;
  tidspunkt: string;
  brukerRolle: string;
  brukerNavn: string;
  handling: string;
  detaljer: string;
}

export type MilestoneCategory =
  | 'skole'          // Scolaire / Académique
  | 'helse'          // Santé & Bien-être
  | 'aktivitet'      // Activités & Loisirs
  | 'utstyr'         // Équipement & Matériel
  | 'personlig';     // Développement & Fierté

export interface ChildMilestone {
  id: string;
  barnId: string;
  barnNavn: string;
  dato: string; // YYYY-MM-DD
  kategori: MilestoneCategory;
  tittelFransk: string;
  beskrivelseFransk: string;
  tittelNorsk: string;
  beskrivelseNorsk: string;
  koordinatorNavn: string;
  merknad?: string; // f.eks. "TENAFEP", "Uniforme remise"
  bildeUrl?: string;
  opprettetDato: string;
}

export type NotificationTargetRole = 'sponsor' | 'coordinator' | 'admin' | 'all';

export type NotificationType =
  | 'report_approved'
  | 'report_needs_approval'
  | 'report_rejected'
  | 'inquiry_new'
  | 'inquiry_forwarded'
  | 'inquiry_answered'
  | 'sponsor_assigned'
  | 'payment_received'
  | 'milestone_logged'
  | 'photo_needs_approval'
  | 'photo_approved'
  | 'photo_rejected';

export interface AppNotification {
  id: string;
  targetRole: NotificationTargetRole;
  recipientId?: string; // f.eks. spesifikk sponsor ID
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  relatedEntityId?: string;
  actionSection?: string;
}

export interface CmsHero {
  kicker: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  backgroundImageUrl?: string;
  backgroundPreset: 'pattern' | 'classroom' | 'workshop' | 'custom';
  scrimOpacity: number; // 20 - 90 %
}

export interface CmsStep {
  number: number;
  title: string;
  description: string;
  imageUrl?: string;
  imagePreset?: 'pattern' | 'classroom' | 'workshop' | 'custom' | string;
}

export interface CmsPrincipleCard {
  id: string;
  title: string;
  description: string;
  iconName: 'Scale' | 'FileCheck' | 'ShieldCheck' | 'Users';
  imageUrl?: string;
}

export interface CmsKpiStat {
  id: string;
  value: string;
  label: string;
  sublabel: string;
}

export interface CmsCtaBanner {
  title: string;
  subtitle: string;
  buttonText: string;
  backgroundImageUrl?: string;
  backgroundPreset?: 'pattern' | 'classroom' | 'workshop' | 'custom';
  scrimOpacity?: number;
}

export interface CmsContent {
  hero: CmsHero;
  steps: CmsStep[];
  aboutCards: CmsPrincipleCard[];
  kpiStats: CmsKpiStat[];
  ctaBanner?: CmsCtaBanner;
}

export type EmailKind = 'newsletter' | 'inquiry' | 'system';
export type EmailOutboxStatus = 'venter_nøkkel' | 'sendt' | 'feilet';

export interface EmailOutboxItem {
  id: string;
  kind: EmailKind;
  subject: string;
  body: string;
  toEmails: string[];
  audience?: 'sponsors' | 'coordinators' | 'all';
  relatedId?: string;
  templateId?: string;
  status: EmailOutboxStatus;
  createdAt: string;
  note?: string;
}
