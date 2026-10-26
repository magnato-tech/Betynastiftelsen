import type {
  UserRole,
  AppLanguage,
  Child,
  Report,
  Sponsor,
  Inquiry,
  PaymentRecord,
  PaymentAllocation,
  RecurringCharge,
  SponsorAssignment,
  VippsChargeJobStatus,
  Campaign,
  AdultGraduateStory,
  AuditLogItem,
  AppNotification,
  CmsContent,
  ChildMilestone,
  Coordinator,
  FieldFact,
  CatalogPhoto,
  MediaLibraryItem,
  EmailOutboxItem,
  PersonLogSubject,
} from '../types';
import type { EmailAutoSendEvent, EmailAutoSendPrefs } from '../email/autoSendPrefs';
import type { FirestoreUser, FirestoreUserDirectoryEntry } from '../db/firestoreProfile';

export interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;

  childrenList: Child[];
  sponsors: Sponsor[];
  reports: Report[];
  milestones: ChildMilestone[];
  inquiries: Inquiry[];
  payments: PaymentRecord[];
  sponsorAssignments: SponsorAssignment[];
  recurringCharges: RecurringCharge[];
  paymentAllocations: PaymentAllocation[];
  vippsChargeJob?: VippsChargeJobStatus;
  campaigns: Campaign[];
  stories: AdultGraduateStory[];
  auditLogs: AuditLogItem[];
  notifications: AppNotification[];
  currentRoleNotifications: AppNotification[];
  unreadNotificationCount: number;

  cmsContent: CmsContent;
  updateCmsSection: <K extends keyof CmsContent>(section: K, data: CmsContent[K]) => void;
  resetCmsSection: (section: keyof CmsContent) => void;
  resetAllCms: () => void;
  addStory: (story: Omit<AdultGraduateStory, 'id'>) => void;
  updateStory: (id: string, updates: Partial<AdultGraduateStory>) => void;
  deleteStory: (id: string) => void;

  currentSponsor: Sponsor | undefined;
  setCurrentSponsorId: (id: string) => void;

  coordinators: Coordinator[];
  currentCoordinator: Coordinator | undefined;
  currentCoordinatorId: string;
  setCurrentCoordinatorId: (id: string) => void;
  coordinatorChildren: Child[];
  fieldFacts: FieldFact[];
  submitFieldFact: (barnId: string, trivsel: string) => void;
  publishChildStory: (
    factId: string,
    draft: {
      fornavn: string;
      skoleNavn: string;
      klassetrinn: string;
      trivsel: string;
      historie: string;
    }
  ) => void;

  /** Kaster Error hvis koordinatorId mangler eller ikke er en aktiv koordinator. */
  addChild: (childData: Partial<Child>) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  /** Flytter eleven og alle poster som følger eleven (rapporter, fakta, bilder, spørsmål, tildelinger, betalinger). Kaster Error ved ugyldig mål. */
  reassignChildCoordinator: (childId: string, toCoordinatorId: string) => void;
  /** Flytter alle aktive elever fra én koordinator til en annen. Returnerer antall flyttet. */
  reassignAllChildren: (fromCoordinatorId: string, toCoordinatorId: string) => number;
  /** Flytter alle aktive elever først, og arkiverer deretter koordinatoren. */
  archiveCoordinatorAndMoveChildren: (coordinatorId: string, toCoordinatorId: string) => Promise<void>;
  assignSponsorToChild: (childId: string, sponsorId: string) => void;
  endSponsorship: (childId: string) => void;
  /** Gjenåpner en avsluttet oppfølging: barnet blir aktivt igjen (uten gammel fadder). */
  reopenChild: (childId: string) => void;

  submitReport: (reportData: Partial<Report>) => void;
  approveReport: (id: string, editedNorskTitle?: string, editedNorskContent?: string) => void;
  rejectReport: (id: string, reason: string) => void;

  submitChildPhoto: (childId: string, dataUrl: string, beskrivelseFr: string) => void;
  approveChildPhoto: (childId: string) => void;
  rejectChildPhoto: (childId: string, reason: string) => void;
  catalogPhotos: CatalogPhoto[];
  addCatalogPhoto: (photo: Omit<CatalogPhoto, 'id'>) => string;
  updateCatalogPhoto: (id: string, updates: Partial<CatalogPhoto>) => void;
  mediaLibrary: MediaLibraryItem[];
  uploadMediaLibraryItem: (file: File, label?: string) => Promise<{ id: string; url: string }>;
  deleteMediaLibraryItem: (id: string) => Promise<void>;

  addMilestone: (milestoneData: Omit<ChildMilestone, 'id' | 'opprettetDato'>) => string;
  updateMilestone: (id: string, updates: Partial<ChildMilestone>) => void;
  deleteMilestone: (id: string) => void;

  submitInquiry: (sponsorId: string, childId: string, question: string) => void;
  answerInquiry: (id: string, answerText: string) => void;
  forwardInquiryToCoordinator: (id: string, note?: string) => void;
  coordinatorReplyToInquiry: (id: string, noteFr: string) => void;

  registerNewSponsorInterest: (
    data: {
      navn: string;
      epost: string;
      telefon: string;
      poststed: string;
      maanedsbelop: number;
      betalingsmetode: 'vipps' | 'avtalegiro' | 'bank';
    },
    options?: {
      sponsorId?: string;
      vippsPatch?: Pick<Sponsor, 'vippsAgreementId' | 'vippsConfirmationUrl' | 'vippsAgreementStatus'>;
    }
  ) => string;
  /** Onboarding av nye fadder fra nettsiden: godkjenn → tildel barn → send velkomst (gir innlogging). */
  approveSponsorOnboarding: (sponsorId: string) => void;
  /** Avviser påmeldingen: steg «avvist» og fadderen arkiveres. */
  rejectSponsorOnboarding: (sponsorId: string) => Promise<void>;
  assignChildInOnboarding: (sponsorId: string, childId: string) => void;
  /** Sender velkomst-e-posten og gir innlogging. sent:false ved 503 (e-post ikke satt opp), da ligger den i køen. */
  sendSponsorWelcome: (sponsorId: string, mail: { subject: string; body: string }) => Promise<{ sent: boolean; message: string }>;
  /** Kalles når fadderen har logget inn første gang. */
  markSponsorOnboardingDone: (sponsorId: string) => void;
  addSponsor: (data: {
    navn: string;
    epost: string;
    telefon: string;
    poststed: string;
    maanedsbelop: 250 | 350;
    betalingsmetode: 'vipps' | 'bank';
  }) => string;

  donateToCampaign: (campaignId: string, amount: number, donorName: string, method: 'vipps' | 'bank') => void;
  addCampaign: (data: Omit<Campaign, 'id' | 'innsamletBelop' | 'antallGivere'>) => string;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  reconcilePayment: (paymentId: string) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  addAuditLog: (
    handling: string,
    detaljer: string,
    actor?: { rolle: string; navn: string },
    subject?: PersonLogSubject,
    opts?: { type?: 'hendelse' | 'kommentar' }
  ) => void;

  /** Personkort (admin). Endringer logges med subject, så de vises under personens logg. */
  updateCoordinator: (id: string, patch: Partial<Coordinator>) => void;
  updateSponsor: (id: string, patch: Partial<Sponsor>) => void;
  addPersonComment: (subject: PersonLogSubject, tekst: string) => void;
  /** Avslutter person og sperrer innlogging. Ikke for administratorer. */
  deactivatePerson: (subject: PersonLogSubject) => Promise<void>;
  /** Gjenåpner person og åpner innlogging igjen (bare rader som var sperret). */
  reactivatePerson: (subject: PersonLogSubject) => Promise<void>;
  /** Sletter person. Kaster Error hvis navnet ikke stemmer eller personen har koblinger. */
  deletePerson: (subject: PersonLogSubject, confirmName: string) => Promise<void>;

  emailOutbox: EmailOutboxItem[];
  addEmailOutboxItem: (item: Omit<EmailOutboxItem, 'id' | 'createdAt'>) => EmailOutboxItem;
  updateEmailOutboxItem: (id: string, updates: Partial<EmailOutboxItem>) => void;
  emailAutoSend: EmailAutoSendPrefs;
  setEmailAutoSendEvent: (id: EmailAutoSendEvent, enabled: boolean) => void;

  /** Admin ser siden som fadder eller koordinator (skrivebeskyttet). */
  isViewingAs: boolean;
  firestoreReadOnly: boolean;
  firestoreEnabled: boolean;
  firestoreBackendActive: boolean;
  firestoreUserEmail: string | null;
  firestoreUserProfile: FirestoreUser | null;
  firestoreProfileLoading: boolean;
  firestoreAccessMessage: string | null;
  firestoreImportMessage: string | null;
  firestoreAuthError: string | null;
  signInFirestoreGoogle: () => Promise<void>;
  sendFirestoreEmailSignInLink: (email: string) => Promise<void>;
  signInFirestoreGoogleRedirect: () => Promise<void>;
  signOutFirestore: () => Promise<void>;
  enterPortalFromProfile: () => boolean;
  importBrowserToFirestore: () => Promise<void>;
  inviteUserToDirectory: (entry: FirestoreUserDirectoryEntry) => Promise<void>;
  updateUserDirectoryStatus: (email: string, status: FirestoreUserDirectoryEntry['status']) => Promise<void>;
  firestoreLoading: boolean;
  firestoreSave: { state: 'idle' | 'saving' | 'saved' | 'error'; lastSavedAt: number | null; error: string | null };
  firestoreSaveNow: () => Promise<void>;
}
