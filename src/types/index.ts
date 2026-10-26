export type UserRole = 'public' | 'sponsor' | 'coordinator' | 'admin';
export type AppLanguage = 'no' | 'fr';

export type ChildStatus = 'aktiv' | 'avsluttet' | 'arkivert' | 'utkast';

export interface Coordinator {
  id: string;
  fornavn: string;
  etternavn: string;
  epost: string;
  telefon: string;
  distrikt: string;
  aktiv: boolean;
}

/** Skoletype, som fadderen ser i stedet for skolens navn (jf. sponsorSchoolText i utils/childPrivacy). */
export type SkoleType =
  | 'offentlig_barneskole'
  | 'privat_barneskole'
  | 'offentlig_ungdomsskole'
  | 'privat_ungdomsskole'
  | 'videregaende'
  | 'yrkesskole';

export interface Child {
  id: string;
  internKode: string; // f.eks. BET-CD-01
  fornavn: string;
  fodselsaar: number;
  kjonn: 'gutt' | 'jente';
  skoleNavn: string;
  /** Skoletype for visning til fadder. Mangler = generisk «Skole i <by>». */
  skoleType?: SkoleType;
  /** By som vises til fadder (standard Brazzaville). */
  skoleBy?: string;
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
  /** Bilde sendt til Kristiansand, venter godkjenning. */
  ventendeFotoUrl?: string;
  ventendeFotoBeskrivelseFr?: string;
  ventendeFotoStatus?: 'innsendt' | 'avvist';
  ventendeFotoInnsendtDato?: string;
}

export type CatalogPhotoStatus = 'innsendt' | 'publisert' | 'avvist';

/** Admin mediabibliotek — bilder til nettside/CMS (Firebase Storage + metadata i Firestore). */
export interface MediaLibraryItem {
  id: string;
  label: string;
  /** Nedlastings-URL eller relativ sti (f.eks. IMG_1194.jpg). */
  url: string;
  storagePath?: string;
  uploadedAt: string;
  uploadedBy?: string;
  sizeBytes?: number;
}

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

export type VippsAgreementStatus = 'PENDING' | 'ACTIVE' | 'STOPPED' | 'EXPIRED';

export interface Sponsor {
  id: string;
  navn: string;
  epost: string;
  telefon: string;
  poststed: string;
  maanedsbelop: number; // 250, 350, eller annet
  betalingsmetode: 'vipps' | 'avtalegiro' | 'bank';
  betalingsstatus: 'aktiv' | 'pause';
  /**
   * ISO-dato når fadderavtalen ble avsluttet (deaktivert i personkortet).
   * Valgt fremfor betalingsstatus, fordi 'pause' betyr midlertidig stans, ikke avslutning.
   */
  avsluttet?: string;
  startDato: string;
  /** Ett eller flere barn. Hvert barn har likevel bare én fadder. */
  tildeltBarnIds: string[];
  /** Hvor registreringen kom fra (simulering / prototype). */
  registrertKilde?: 'admin' | 'nettside' | 'import';
  /** Vipps Recurring — én avtale per fadder. */
  vippsAgreementId?: string;
  vippsConfirmationUrl?: string;
  vippsAgreementStatus?: VippsAgreementStatus;
  /** Guidet onboarding av nye fadderne (fra nettside til innlogging). Mangler = ingen onboarding-data. */
  onboarding?: SponsorOnboarding;
}

export type SponsorOnboardingStep = 'ny' | 'godkjent' | 'barn_tildelt' | 'invitert' | 'ferdig' | 'avvist';

export interface SponsorOnboarding {
  steg: SponsorOnboardingStep;
  godkjentDato?: string;
  invitasjonSendt?: string;
  ferdigDato?: string;
}

/** Historisk kobling fadder–barn (andel i øre per måned). */
export interface SponsorAssignment {
  id: string;
  sponsorId: string;
  childId: string;
  koordinatorId: string;
  startDato: string;
  sluttDato?: string;
  andelOre: number;
}

export type RecurringChargeStatus =
  | 'PENDING'
  | 'DUE'
  | 'PROCESSING'
  | 'CHARGED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'RESERVED'
  | 'PARTIALLY_CAPTURED'
  | 'CANCELLED';

/** Månedlig Vipps-belastning — dokument-id = orderId. */
export interface RecurringCharge {
  id: string;
  agreementId: string;
  sponsorId: string;
  periode: string;
  amountOre: number;
  due: string;
  status: RecurringChargeStatus;
  idempotencyKey: string;
}

export type PaymentAllocationMaal = 'barn' | 'buffer';

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  sponsorId: string;
  maal: PaymentAllocationMaal;
  childId?: string;
  koordinatorId?: string;
  periode: string;
  amountOre: number;
}

export interface VippsChargeJobStatus {
  sistKjort: string;
  opprettet: number;
  feilet: number;
  melding?: string;
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
export type PaymentStatus =
  | 'fullfort'
  | 'forventet'
  | 'avstemt'
  | 'refundert'
  | 'delvis_refundert';

export type PaymentKilde = 'vipps' | 'manuell';

export interface PaymentRecord {
  id: string;
  fadderId?: string;
  fadderNavn: string;
  aksjonId?: string;
  aksjonTittel?: string;
  /** Beløp i kroner (bakoverkompatibilitet og aksjoner). */
  belop: number;
  /** Beløp i hele øre for Vipps/manuell fadderbidrag. */
  amountOre?: number;
  refundertOre?: number;
  chargeOrderId?: string;
  agreementId?: string;
  periode?: string;
  kilde?: PaymentKilde;
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
  /** Hovedbilde / fadderportrett / voksenbilde (bakoverkompatibilitet). */
  bildeUrl?: string;
  /** Barndomsbilde for «da og nå»-kort (fullførte mottakere). */
  barneBildeUrl?: string;
  /** Voksenbilde for «da og nå»-kort. */
  voksenBildeUrl?: string;
  fremhevetPaaForside?: boolean;
  /** Placeholder/demo-bilde — vises med «Illustrasjonsbilde» på forsiden. */
  illustrasjonsbilde?: boolean;
  opprettetDato?: string;
}

export type TestimonialStory = AdultGraduateStory;

/** Hvem en loggført handling eller kommentar gjelder (personkortet i admin). */
export interface PersonLogSubject {
  type: 'coordinator' | 'sponsor' | 'admin' | 'child';
  /** Koordinator-id, fadder-id, barn-id, eller for admin normalisert e-post. */
  id: string;
  navn: string;
}

export interface AuditLogItem {
  id: string;
  tidspunkt: string;
  brukerRolle: string;
  brukerNavn: string;
  handling: string;
  detaljer: string;
  /** Mangler felt = gammel oppføring, ingen person knyttet til. */
  gjelderType?: PersonLogSubject['type'];
  gjelderId?: string;
  gjelderNavn?: string;
  /** Mangler felt = 'hendelse'. */
  type?: 'hendelse' | 'kommentar';
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
  | 'photo_rejected'
  | 'child_updated';

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

export type CmsHeroHeight = 'compact' | 'medium' | 'tall' | 'custom';
export type CmsHeroImageMotion = 'none' | 'slowZoom';
export type CmsHeroHeadlinePlacement = 'onImage' | 'belowImage';
/** Lys/mørk tekst. auto = lys på bildet, mørk under bildet. */
export type CmsHeroHeadlineTone = 'auto' | 'light' | 'dark';
export type CmsHeroCtaEnter = 'none' | 'fromLeft';

export interface CmsHero {
  kicker: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  backgroundImageUrl?: string;
  backgroundPreset: 'pattern' | 'classroom' | 'workshop' | 'custom';
  scrimOpacity: number; // 20 - 90 %
  /** Synlig høyde på forsiden (vh). */
  heroHeight?: CmsHeroHeight;
  /** Brukes når heroHeight er custom (28–92 vh). */
  heroHeightCustomVh?: number;
  /** Fokuspunkt for object-cover (0–100 %). */
  focalPointX?: number;
  focalPointY?: number;
  /** Fadder-CTA over hero med overlapp nedover. */
  showCtaCard?: boolean;
  /** Jubileumsbadge (antall år siden 24.06.2011) øverst på hero-bildet. */
  showAnniversaryBadge?: boolean;
  /** @deprecated Bruk ctaHangBelowPx — beholdes for eldre data. */
  ctaOverlapPx?: number;
  /** Løftetekst på bildet (stor skjerm). Av = tekst under bildet. */
  headlineOnImage?: boolean;
  /** Plassering av løftetekst på stor skjerm. Mangler felt: bruk headlineOnImage. */
  headlinePlacement?: CmsHeroHeadlinePlacement;
  /** Horisontal posisjon for løftetekst på bildet (0–100 % venstre). */
  headlinePosXPercent?: number;
  /** Vertikal posisjon for løftetekst på bildet (0–100 % fra topp). */
  headlinePosYPercent?: number;
  /** Ekstra luft over løftetekst når headlinePlacement er belowImage (0–1200 px). */
  headlineBelowGapPx?: number;
  /** Ekstra nedover under hero når headlinePlacement er belowImage (0–150 % av hero-høyde). */
  headlineBelowYOffsetPercent?: number;
  /** Maks bredde for løftetekst (32–100 % av hero-kolonnen). */
  headlineMaxWidthPercent?: number;
  /** Tekstfarge. auto følger plassering (lys på bilde, mørk under). */
  headlineTone?: CmsHeroHeadlineTone;
  /** Valgfri sakte zoom på hero-bildet (inne i klippet lag). */
  imageMotion?: CmsHeroImageMotion;
  /** CTA horisontalt: 0 = venstre kant, 100 = høyre (innenfor hero). */
  ctaPosXPercent?: number;
  /** CTA vertikalt i hero: 0 = nederst, 100 = øverst (fra bunn av hero-rammen). */
  ctaPosYPercent?: number;
  /** Hvor langt CTA-kortet henger under hero-bunnen (px, 0–480). */
  ctaHangBelowPx?: number;
  /** Tittel på fadder-CTA-kortet på forsiden. */
  ctaCardTitle?: string;
  /** Ingress på fadder-CTA-kortet. */
  ctaCardLead?: string;
  /** Første forhåndsvalgt beløp (kr/mnd) på CTA-kortet. */
  ctaPresetAmount1?: number;
  /** Andre forhåndsvalgt beløp (kr/mnd). */
  ctaPresetAmount2?: number;
  /** Tekst på tredje knapp (valgfritt beløp). */
  ctaCustomOptionLabel?: string;
  /** Minste valgfrie beløp (kr). */
  ctaCustomAmountMin?: number;
  /** Vis knapp for valgfritt beløp. */
  ctaShowCustomOption?: boolean;
  /** Ingress-linje når beløp 1 er valgt (tom = standardtekst). */
  ctaImpactLineAmount1?: string;
  /** Ingress-linje når beløp 2 er valgt. */
  ctaImpactLineAmount2?: string;
  /** Ingress ved valgfritt beløp; {beløp} erstattes. */
  ctaImpactLineCustom?: string;
  /** Primærknapp viser valgt beløp (bruker template). */
  ctaPrimaryButtonReflectAmount?: boolean;
  /** Vipps-knapp med {beløp} når reflect er på. */
  ctaPrimaryButtonTemplate?: string;
  /** CTA glide inn fra venstre etter delay (kun stor skjerm). */
  ctaEnter?: CmsHeroCtaEnter;
  /** Forsinkelse før CTA-inngang (0–6 s). */
  ctaEnterDelaySec?: number;
  /** Økes ved «Spill av» for å restarte animasjoner uten å nullstille ved hvert utkast. */
  heroMotionReplayAt?: number;
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

export interface CmsTestimonialsSection {
  enabled?: boolean;
  kicker: string;
  title: string;
  subtitle: string;
  /** 2 eller 3 kolonner i rutenettet på forsiden. */
  gridColumns?: 2 | 3;
}

/** Av/på for hele seksjonen på forsiden (mangler = på). */
export interface CmsSectionToggle {
  enabled?: boolean;
}

/** Modultyper som kan ligge på forsiden (innholdet ligger i biblioteket). */
export type CmsHomeModuleId =
  | 'hero'
  | 'stories'
  | 'waiting'
  | 'steps'
  | 'about'
  | 'kpis'
  | 'cta'
  | 'behov'
  | 'apenhet';

/** Anonymt fadder-kort på forsiden — illustrasjon, ikke ekte barn. */
export interface CmsWaitingSponsorCard {
  id: string;
  /** Vist kode (f.eks. COG-2026-014), ikke intern barn-id. */
  publicCode: string;
  alder: number;
  sted: string;
  bildeUrl: string;
  /** false = kun i biblioteket */
  publisertPaaForside?: boolean;
}

export interface CmsWaitingSponsorsSection {
  enabled?: boolean;
  kicker: string;
  title: string;
  subtitle: string;
  topLinkText?: string;
  footerLinkText?: string;
}

export interface CmsHomeLayoutItem {
  moduleId: CmsHomeModuleId;
  /** false = kun i biblioteket, ikke på forsiden */
  visible?: boolean;
}

/** Innholdskolonne på forsiden (px). */
export type CmsPageWidth = 1040 | 1120 | 1280;

export interface CmsContent {
  /** Sentrert kolonnebredde for offentlig innhold. Standard 1120. */
  pageWidth?: CmsPageWidth;
  hero: CmsHero;
  steps: CmsStep[];
  aboutCards: CmsPrincipleCard[];
  kpiStats: CmsKpiStat[];
  ctaBanner?: CmsCtaBanner;
  testimonialsSection?: CmsTestimonialsSection;
  waitingSponsorsSection?: CmsWaitingSponsorsSection;
  waitingSponsorCards?: CmsWaitingSponsorCard[];
  /** Rekkefølge og synlighet på forsiden. Mangler = standard rekkefølge + eldre av/på-felt. */
  homeLayout?: CmsHomeLayoutItem[];
  heroSection?: CmsSectionToggle;
  stepsSection?: CmsSectionToggle;
  aboutSection?: CmsSectionToggle;
  kpiSection?: CmsSectionToggle;
  ctaSection?: CmsSectionToggle;
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
