import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  AppLanguage,
  Child,
  Report,
  Sponsor,
  Inquiry,
  PaymentRecord,
  Campaign,
  AdultGraduateStory,
  AuditLogItem,
  AppNotification,
  CmsContent,
  ChildMilestone,
  Coordinator,
  FieldFact,
  CatalogPhoto,
  EmailOutboxItem,
} from '../types';
import {
  DEFAULT_EMAIL_AUTO_SEND,
  migrateEmailAutoSend,
  isEmailAutoSendOn,
  type EmailAutoSendEvent,
  type EmailAutoSendPrefs,
} from '../email/autoSendPrefs';
import { composeSystemEmail } from '../email/composeSystemEmail';
import type { SystemTemplateId } from '../email/templates';
import translationsData from '../locales/translations.json';
import { coordinatorDisplayName } from '../utils/coordinatorDisplay';
import { childrenForCoordinator } from '../utils/coordinatorScope';
import { addChildId, childIdsOfSponsor, migrateSponsorsChildIds, removeChildId } from '../utils/sponsorChildren';
import { migrateCampaignPayments, migrateCampaigns } from '../utils/campaignMigrate';
import { EMPTY_APP_CONTENT } from '../db/emptyContent';
import {
  LIVE_LAUNCH_VERSION,
  bootStoredOrLive,
  contentIsLocked,
  createSeedLock,
  type SeedLock,
} from '../db/seedPolicy';
import { db, firestoreEnabled as firestoreConfigured } from '../config/firebase';
import { useFirestoreAppSync } from '../db/useFirestoreAppSync';
import type { AppDataSnapshot } from '../db/firestoreData';
import { saveUserDirectoryEntry } from '../db/firestoreData';
import type { FirestoreUser, FirestoreUserDirectoryEntry } from '../db/firestoreProfile';
import { consumePortalIntent, markPortalIntent } from '../utils/portalIntent';
import { canOpenPortalRole } from '../utils/portalRoles';
import { prototypeRoleSwitcherEnabled } from '../config/prototypeAccess';
import { buildFieldFact } from '../utils/fieldFacts';
import { postBetynaEmail } from '../email/client';

interface AppContextType {
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
  campaigns: Campaign[];
  stories: AdultGraduateStory[];
  auditLogs: AuditLogItem[];
  notifications: AppNotification[];
  currentRoleNotifications: AppNotification[];
  unreadNotificationCount: number;

  // CMS Content
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

  // Actions
  addChild: (childData: Partial<Child>) => void;
  updateChild: (id: string, updates: Partial<Child>) => void;
  assignSponsorToChild: (childId: string, sponsorId: string) => void;
  endSponsorship: (childId: string) => void;

  submitReport: (reportData: Partial<Report>) => void;
  approveReport: (id: string, editedNorskTitle?: string, editedNorskContent?: string) => void;
  rejectReport: (id: string, reason: string) => void;

  submitChildPhoto: (childId: string, dataUrl: string, beskrivelseFr: string) => void;
  approveChildPhoto: (childId: string) => void;
  rejectChildPhoto: (childId: string, reason: string) => void;
  catalogPhotos: CatalogPhoto[];
  addCatalogPhoto: (photo: Omit<CatalogPhoto, 'id'>) => string;
  updateCatalogPhoto: (id: string, updates: Partial<CatalogPhoto>) => void;

  addMilestone: (milestoneData: Omit<ChildMilestone, 'id' | 'opprettetDato'>) => string;
  updateMilestone: (id: string, updates: Partial<ChildMilestone>) => void;
  deleteMilestone: (id: string) => void;

  submitInquiry: (sponsorId: string, childId: string, question: string) => void;
  answerInquiry: (id: string, answerText: string) => void;
  forwardInquiryToCoordinator: (id: string, note?: string) => void;
  coordinatorReplyToInquiry: (id: string, noteFr: string) => void;

  registerNewSponsorInterest: (data: {
    navn: string;
    epost: string;
    telefon: string;
    poststed: string;
    maanedsbelop: number;
    betalingsmetode: 'vipps' | 'avtalegiro' | 'bank';
  }) => string;
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

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  addAuditLog: (handling: string, detaljer: string) => void;

  emailOutbox: EmailOutboxItem[];
  addEmailOutboxItem: (item: Omit<EmailOutboxItem, 'id' | 'createdAt'>) => EmailOutboxItem;
  updateEmailOutboxItem: (id: string, updates: Partial<EmailOutboxItem>) => void;
  emailAutoSend: EmailAutoSendPrefs;
  setEmailAutoSendEvent: (id: EmailAutoSendEvent, enabled: boolean) => void;

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
  /** Bytt til innlogget rolle (admin/koordinator/fadder). Returnerer false hvis profil mangler. */
  enterPortalFromProfile: () => boolean;
  importBrowserToFirestore: () => Promise<void>;
  /** Legg inn e-post i userDirectory (kun admin, Firestore-regler). */
  inviteUserToDirectory: (entry: FirestoreUserDirectoryEntry) => Promise<void>;
  /** Offentlig innhold er ikke lest fra databasen ennå. */
  firestoreLoading: boolean;
  firestoreSave: { state: 'idle' | 'saving' | 'saved' | 'error'; lastSavedAt: number | null; error: string | null };
}

const STORAGE_KEY_PREFIX = 'betyna_v1_';

/**
 * Når databasen er konfigurert, er den eneste kilden til innhold.
 * Nettleseren husker bare språk. Eldre lagret innhold fjernes én gang.
 */
const LOCAL_CONTENT_KEYS = [
  'children', 'sponsors', 'reports', 'milestones', 'inquiries', 'payments', 'campaigns',
  'fieldFacts', 'stories', 'auditLogs', 'notifications', 'cms', 'catalogPhotos', 'emailOutbox',
  'emailAutoSend', 'contentLock',
];

function purgeLocalContent() {
  if (!firestoreConfigured) return;
  try {
    for (const key of LOCAL_CONTENT_KEYS) localStorage.removeItem(STORAGE_KEY_PREFIX + key);
  } catch {
    /* privat modus */
  }
}
purgeLocalContent();

function writeLocal(storageKey: string, json: string) {
  if (firestoreConfigured && !storageKey.endsWith('language')) return;
  localStorage.setItem(storageKey, json);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('public');
  const [currentSponsorId, setCurrentSponsorId] = useState<string>('');
  const [currentCoordinatorId, setCurrentCoordinatorId] = useState<string>('');
  const [coordinators, setCoordinators] = useState<Coordinator[]>(EMPTY_APP_CONTENT.coordinators);

  const loadState = <T,>(key: string): T | undefined => {
    if (firestoreConfigured && key !== 'language') return undefined;
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return item ? (JSON.parse(item) as T) : undefined;
    } catch {
      return undefined;
    }
  };

  const [contentLock] = useState<SeedLock | null>(() => {
    const stored = loadState<SeedLock>('contentLock');
    if (stored?.completed) return stored;
    const lock = createSeedLock(LIVE_LAUNCH_VERSION);
    try {
      writeLocal(STORAGE_KEY_PREFIX + 'contentLock', JSON.stringify(lock));
    } catch {
      /* privat modus */
    }
    return lock;
  });

  const normalizeLanguage = (raw: unknown): AppLanguage => {
    if (raw === 'fr' || raw === 'no') return raw;
    if (raw === 'en') return 'fr';
    return 'no';
  };

  const [language, setLanguageState] = useState<AppLanguage>(() =>
    normalizeLanguage(loadState('language') ?? 'no')
  );

  const [childrenList, setChildrenList] = useState<Child[]>(() =>
    bootStoredOrLive(loadState<Child[]>('children'), EMPTY_APP_CONTENT.children)
  );
  const [sponsors, setSponsors] = useState<Sponsor[]>(() =>
    migrateSponsorsChildIds(
      bootStoredOrLive(loadState<Sponsor[]>('sponsors'), EMPTY_APP_CONTENT.sponsors)
    )
  );
  const [reports, setReports] = useState<Report[]>(() =>
    bootStoredOrLive(loadState<Report[]>('reports'), EMPTY_APP_CONTENT.reports)
  );
  const [milestones, setMilestones] = useState<ChildMilestone[]>(() =>
    bootStoredOrLive(loadState<ChildMilestone[]>('milestones'), EMPTY_APP_CONTENT.milestones)
  );
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    bootStoredOrLive(loadState<Inquiry[]>('inquiries'), EMPTY_APP_CONTENT.inquiries)
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const loadedCampaigns = migrateCampaigns(
      bootStoredOrLive(loadState<Campaign[]>('campaigns'), EMPTY_APP_CONTENT.campaigns)
    );
    return migrateCampaignPayments(
      bootStoredOrLive(loadState<PaymentRecord[]>('payments'), EMPTY_APP_CONTENT.payments),
      loadedCampaigns
    );
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    migrateCampaigns(bootStoredOrLive(loadState<Campaign[]>('campaigns'), EMPTY_APP_CONTENT.campaigns))
  );
  const [fieldFacts, setFieldFacts] = useState<FieldFact[]>(() =>
    bootStoredOrLive(loadState<FieldFact[]>('fieldFacts'), EMPTY_APP_CONTENT.facts)
  );
  const [stories, setStories] = useState<AdultGraduateStory[]>(() =>
    bootStoredOrLive(loadState<AdultGraduateStory[]>('stories'), EMPTY_APP_CONTENT.testimonials)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() =>
    bootStoredOrLive(loadState<AuditLogItem[]>('auditLogs'), EMPTY_APP_CONTENT.auditLogs)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    bootStoredOrLive(loadState<AppNotification[]>('notifications'), EMPTY_APP_CONTENT.notifications)
  );
  const [cmsContent, setCmsContent] = useState<CmsContent>(() => {
    const stored = loadState<CmsContent>('cms');
    return bootStoredOrLive(stored, EMPTY_APP_CONTENT.cms);
  });
  const [catalogPhotos, setCatalogPhotos] = useState<CatalogPhoto[]>(() =>
    bootStoredOrLive(loadState<CatalogPhoto[]>('catalogPhotos'), EMPTY_APP_CONTENT.catalogPhotos)
  );
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxItem[]>(() =>
    bootStoredOrLive(loadState<EmailOutboxItem[]>('emailOutbox'), [])
  );
  const [emailAutoSend, setEmailAutoSend] = useState<EmailAutoSendPrefs>(() =>
    migrateEmailAutoSend(
      bootStoredOrLive(loadState<EmailAutoSendPrefs>('emailAutoSend'), EMPTY_APP_CONTENT.emailAutoSend)
    )
  );

  const firestore = useFirestoreAppSync();

  useEffect(() => {
    const hy = firestore.hydration;
    if (!hy) return;
    const h = hy.data;
    if (hy.full) {
      // Full lasting er fasit: tomme samlinger i databasen betyr tomme lister her.
      setCoordinators(h.coordinators ?? []);
      setChildrenList(h.children ?? []);
      setSponsors(h.sponsors ?? []);
      setReports(h.reports ?? []);
      setMilestones(h.milestones ?? []);
      setInquiries(h.inquiries ?? []);
      setPayments(h.payments ?? []);
      setCampaigns(migrateCampaigns(h.campaigns ?? []));
      setFieldFacts(h.facts ?? []);
      setStories(h.testimonials ?? []);
      setAuditLogs(h.auditLogs ?? []);
      setNotifications(h.notifications ?? []);
      setCatalogPhotos(h.catalogPhotos ?? []);
      setEmailOutbox(h.emailOutbox ?? []);
      if (h.cms) setCmsContent(h.cms);
      if (h.emailAutoSend) setEmailAutoSend(migrateEmailAutoSend(h.emailAutoSend));
      const role = firestore.firestoreUserProfile?.role;
      firestore.confirmHydrated(h, {
        enableSave: role === 'admin' || role === 'coordinator' || role === 'sponsor',
      });
    } else {
      if (h.cms) setCmsContent(h.cms);
      if (h.campaigns) setCampaigns(migrateCampaigns(h.campaigns));
      if (h.testimonials) setStories(h.testimonials);
    }
  }, [firestore.hydration]);

  const applyFirestoreProfileToRole = useCallback((profile: FirestoreUser) => {
    setRoleState(profile.role);
    if (profile.role === 'sponsor' && profile.sponsorId) {
      setCurrentSponsorId(profile.sponsorId);
    }
    if (profile.role === 'coordinator' && profile.coordinatorId) {
      setCurrentCoordinatorId(profile.coordinatorId);
    }
  }, []);

  const enterPortalFromProfile = useCallback((): boolean => {
    const profile = firestore.firestoreUserProfile;
    if (!profile) {
      markPortalIntent();
      return false;
    }
    applyFirestoreProfileToRole(profile);
    return true;
  }, [applyFirestoreProfileToRole, firestore.firestoreUserProfile]);

  const inviteUserToDirectory = useCallback(async (entry: FirestoreUserDirectoryEntry) => {
    if (!db) throw new Error('Firestore er ikke konfigurert');
    if (firestore.firestoreUserProfile?.role !== 'admin') {
      throw new Error('Bare administrator kan invitere brukere');
    }
    if (entry.role === 'coordinator' && !entry.coordinatorId) {
      throw new Error('Velg koordinator-id for koordinator-rollen');
    }
    if (entry.role === 'sponsor' && !entry.sponsorId) {
      throw new Error('Velg fadder-id for fadder-rollen');
    }
    await saveUserDirectoryEntry(db, entry);
  }, [firestore.firestoreUserProfile?.role]);

  useEffect(() => {
    const profile = firestore.firestoreUserProfile;
    if (!profile || !consumePortalIntent()) return;
    applyFirestoreProfileToRole(profile);
  }, [applyFirestoreProfileToRole, firestore.firestoreUserProfile]);

  useEffect(() => {
    const profile = firestore.firestoreUserProfile;
    if (!profile || profile.role === 'admin') return;
    if (profile.role === 'sponsor' && profile.sponsorId) {
      setCurrentSponsorId(profile.sponsorId);
    }
    if (profile.role === 'coordinator' && profile.coordinatorId) {
      setCurrentCoordinatorId(profile.coordinatorId);
    }
  }, [firestore.firestoreUserProfile]);

  const buildDataSnapshot = useCallback((): AppDataSnapshot => ({
    coordinators,
    children: childrenList,
    sponsors,
    catalogPhotos,
    facts: fieldFacts,
    reports,
    milestones,
    inquiries,
    payments,
    campaigns,
    testimonials: stories,
    notifications,
    auditLogs,
    cms: cmsContent,
    emailOutbox,
    emailAutoSend,
    language,
  }), [
    coordinators,
    childrenList,
    sponsors,
    catalogPhotos,
    fieldFacts,
    reports,
    milestones,
    inquiries,
    payments,
    campaigns,
    stories,
    notifications,
    auditLogs,
    cmsContent,
    emailOutbox,
    emailAutoSend,
    language,
  ]);

  useEffect(() => {
    firestore.registerSnapshotProvider(buildDataSnapshot);
  }, [firestore, buildDataSnapshot]);

  useEffect(() => {
    if (!firestore.backendActive) return;
    firestore.schedulePersist(buildDataSnapshot());
  }, [firestore.backendActive, buildDataSnapshot, firestore.schedulePersist]);

  // Sync to localStorage
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'children', JSON.stringify(childrenList));
  }, [childrenList]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'sponsors', JSON.stringify(sponsors));
  }, [sponsors]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'reports', JSON.stringify(reports));
  }, [reports]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'milestones', JSON.stringify(milestones));
  }, [milestones]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'inquiries', JSON.stringify(inquiries));
  }, [inquiries]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    setCampaigns((prev) => {
      const next = migrateCampaigns(prev);
      setPayments((pays) => migrateCampaignPayments(pays, next));
      return next.length === prev.length ? prev : next;
    });
  }, []);

  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'campaigns', JSON.stringify(campaigns));
  }, [campaigns]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'fieldFacts', JSON.stringify(fieldFacts));
  }, [fieldFacts]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'stories', JSON.stringify(stories));
  }, [stories]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'cms', JSON.stringify(cmsContent));
  }, [cmsContent]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'catalogPhotos', JSON.stringify(catalogPhotos));
  }, [catalogPhotos]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'emailOutbox', JSON.stringify(emailOutbox));
  }, [emailOutbox]);
  useEffect(() => {
    writeLocal(STORAGE_KEY_PREFIX + 'emailAutoSend', JSON.stringify(emailAutoSend));
  }, [emailAutoSend]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key?.startsWith(STORAGE_KEY_PREFIX) || event.newValue == null) return;
      const key = event.key.slice(STORAGE_KEY_PREFIX.length);
      try {
        const value = JSON.parse(event.newValue);
        if (key === 'cms') setCmsContent(value);
        if (key === 'campaigns') setCampaigns(migrateCampaigns(value));
        if (key === 'stories') setStories(value);
        if (key === 'language') setLanguageState(normalizeLanguage(value));
      } catch {
        /* ignorer ødelagt mellomlagring */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Notifications filtering for active persona / role
  const currentRoleNotifications = notifications.filter((n) => {
    if (role === 'admin') return n.targetRole === 'admin' || n.targetRole === 'all';
    if (role === 'coordinator') {
      return (
        (n.targetRole === 'coordinator' || n.targetRole === 'all') &&
        (!n.recipientId || n.recipientId === currentCoordinatorId)
      );
    }
    if (role === 'sponsor') {
      return (
        (n.targetRole === 'sponsor' || n.targetRole === 'all') &&
        (!n.recipientId || n.recipientId === currentSponsorId)
      );
    }
    return n.targetRole === 'all';
  });

  const unreadNotificationCount = currentRoleNotifications.filter((n) => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        const isForCurrent =
          (role === 'admin' && (n.targetRole === 'admin' || n.targetRole === 'all')) ||
          (role === 'coordinator' &&
            (n.targetRole === 'coordinator' || n.targetRole === 'all') &&
            (!n.recipientId || n.recipientId === currentCoordinatorId)) ||
          (role === 'sponsor' &&
            (n.targetRole === 'sponsor' || n.targetRole === 'all') &&
            (!n.recipientId || n.recipientId === currentSponsorId)) ||
          (role === 'public' && n.targetRole === 'all');
        return isForCurrent ? { ...n, read: true } : n;
      })
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const setRole = (newRole: UserRole) => {
    const profile = firestore.firestoreUserProfile;
    if (prototypeRoleSwitcherEnabled) {
      setRoleState(newRole);
      return;
    }
    if (profile) {
      if (!canOpenPortalRole(profile, newRole)) return;
    } else if (newRole !== 'public') {
      return;
    }
    setRoleState(newRole);
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      writeLocal(STORAGE_KEY_PREFIX + 'language', JSON.stringify(lang));
    } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language === 'fr' ? 'fr' : 'nb';
  }, [language]);

  const t = useCallback((key: string, fallback?: string): string => {
    const langKey = language === 'fr' ? 'fr' : 'no';
    const parts = key.split('.');
    let current: any = (translationsData as any)[langKey];
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === 'string') {
      return current;
    }
    // Fallback to Norwegian
    if (langKey !== 'no') {
      let fallbackVal: any = (translationsData as any)['no'];
      for (const part of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
          fallbackVal = fallbackVal[part];
        } else {
          fallbackVal = undefined;
          break;
        }
      }
      if (typeof fallbackVal === 'string') return fallbackVal;
    }
    return fallback !== undefined ? fallback : key;
  }, [language]);

  const addEmailOutboxItem = (item: Omit<EmailOutboxItem, 'id' | 'createdAt'>): EmailOutboxItem => {
    const row: EmailOutboxItem = {
      ...item,
      id: 'email-' + Date.now(),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setEmailOutbox((prev) => [row, ...prev]);
    return row;
  };

  const updateEmailOutboxItem = (id: string, updates: Partial<EmailOutboxItem>) => {
    setEmailOutbox((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const addAuditLog = (handling: string, detaljer: string) => {
    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrator (Norge)',
      coordinator: 'Koordinator (Kongo)',
      sponsor: 'Fadder (Norge)',
      public: 'Besøkende',
    };
    const newLog: AuditLogItem = {
      id: 'log-' + Date.now(),
      tidspunkt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      brukerRolle: roleLabels[role],
      brukerNavn:
        role === 'sponsor'
          ? currentSponsor?.navn || 'Fadder'
          : role === 'coordinator'
          ? currentCoordinator?.fornavn || 'Koordinator'
          : 'Admin',
      handling,
      detaljer,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const setEmailAutoSendEvent = (id: EmailAutoSendEvent, enabled: boolean) => {
    setEmailAutoSend((prev) => ({ ...prev, [id]: enabled }));
    addAuditLog('E-postvarsler', `Automatisk «${id}» er ${enabled ? 'på' : 'av'}.`);
  };

  const queueSponsorSystemEmail = (
    templateId: SystemTemplateId,
    sponsor: Sponsor | undefined,
    relatedId: string
  ) => {
    if (!sponsor || !isEmailAutoSendOn(emailAutoSend, templateId)) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://betyna.no';
    const mail = composeSystemEmail({
      templateId,
      relatedId,
      sponsorId: sponsor.id,
      sponsorName: sponsor.navn,
      sponsorEmail: sponsor.epost,
      origin,
    });
    if (!mail.ok) return;
    const row = addEmailOutboxItem({
      kind: mail.kind,
      subject: mail.subject,
      body: mail.html,
      toEmails: mail.emails,
      relatedId: mail.relatedId,
      templateId: mail.templateId,
      status: 'venter_nøkkel',
      note: 'Automatisk systemmelding (på i admin).',
    });
    addAuditLog('Systemmelding til fadder', `${templateId} til ${sponsor.epost}.`);
    void postBetynaEmail({
      kind: mail.kind,
      subject: mail.subject,
      html: mail.html,
      emails: mail.emails,
      relatedId: mail.relatedId,
      templateId: mail.templateId,
    })
      .then(({ status, json }) => {
        if (status === 200 && json.ok) {
          updateEmailOutboxItem(row.id, { status: 'sendt', note: json.id ? `Resend ${json.id}` : 'Sendt' });
        } else if (status !== 503) {
          updateEmailOutboxItem(row.id, { status: 'feilet', note: json.message });
        }
      })
      .catch(() => {
        /* Uten API: utkastet ligger i køen. */
      });
  };

  const currentSponsor = sponsors.find((s) => s.id === currentSponsorId);
  const currentCoordinator = coordinators.find((c) => c.id === currentCoordinatorId);
  const coordinatorChildren = childrenForCoordinator(childrenList, currentCoordinatorId);

  // Actions
  const addChild = (childData: Partial<Child>) => {
    const newId = 'child-' + (childrenList.length + 1).toString().padStart(2, '0');
    const newCode = `BET-CD-${(childrenList.length + 1).toString().padStart(2, '0')}`;
    const newChild: Child = {
      id: newId,
      internKode: newCode,
      fornavn: childData.fornavn || 'Elev',
      fodselsaar: childData.fodselsaar || 2017,
      kjonn: childData.kjonn || 'gutt',
      skoleNavn: childData.skoleNavn || 'École Primaire Sainte-Thérèse, Brazzaville',
      klassetrinn: childData.klassetrinn || '3. klasse (3ème primaire)',
      interesser: childData.interesser || ['Tegning', 'Matematikk'],
      bakgrunnskontekst: childData.bakgrunnskontekst || 'Elev registrert med samtykke fra foresatte for oppfølging i skolegang.',
      fotoTema: childData.fotoTema || 'skole',
      samtykkeFoto: childData.samtykkeFoto ?? true,
      samtykkeHistorie: childData.samtykkeHistorie ?? true,
      status: 'aktiv',
      behovSammendrag: childData.behovSammendrag || 'Skolegang, skolesaker og skolelunsj.',
      opprettetDato: new Date().toISOString().slice(0, 10),
      sistOppdatert: new Date().toISOString().slice(0, 10),
      koordinatorId: childData.koordinatorId || currentCoordinatorId || '',
    };
    setChildrenList((prev) => [...prev, newChild]);
    const fact = buildFieldFact({
      child: newChild,
      koordinatorId: newChild.koordinatorId,
      trivsel: 'Ny elev registrert. Skriv historien fadderen skal lese.',
    });
    setFieldFacts((prev) => [fact, ...prev]);
    addAuditLog('Registrerte nytt barn', `Ny elev ${newChild.fornavn} (${newChild.internKode}) i køen skriv historien.`);
  };

  const submitFieldFact = (barnId: string, trivsel: string) => {
    const child = childrenList.find((c) => c.id === barnId);
    if (!child || !trivsel.trim()) return;
    const fact = buildFieldFact({
      child,
      koordinatorId: child.koordinatorId || currentCoordinatorId,
      trivsel,
    });
    setFieldFacts((prev) => [fact, ...prev]);
    addAuditLog('Koordinator sendte fakta', `Fakta for ${child.fornavn} ligger i kø som skriv historien.`);
  };

  const publishChildStory = (
    factId: string,
    draft: {
      fornavn: string;
      skoleNavn: string;
      klassetrinn: string;
      trivsel: string;
      historie: string;
    }
  ) => {
    const fact = fieldFacts.find((f) => f.id === factId);
    if (!fact || !draft.historie.trim()) return;
    setFieldFacts((prev) =>
      prev.map((f) =>
        f.id === factId
          ? {
              ...f,
              status: 'publisert' as const,
              fornavn: draft.fornavn.trim(),
              skoleNavn: draft.skoleNavn.trim(),
              klassetrinn: draft.klassetrinn.trim(),
              trivsel: draft.trivsel.trim() || f.trivsel,
            }
          : f
      )
    );
    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === fact.barnId
          ? {
              ...c,
              fornavn: draft.fornavn.trim() || c.fornavn,
              skoleNavn: draft.skoleNavn.trim() || c.skoleNavn,
              klassetrinn: draft.klassetrinn.trim() || c.klassetrinn,
              bakgrunnskontekst: draft.historie.trim(),
              sistOppdatert: new Date().toISOString().slice(0, 10),
            }
          : c
      )
    );
    addAuditLog(
      'Publiserte historie til fadder',
      `Historien om ${draft.fornavn.trim() || fact.barnNavn} er synlig på faddersiden.`
    );
  };

  const updateChild = (id: string, updates: Partial<Child>) => {
    setChildrenList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, sistOppdatert: new Date().toISOString().slice(0, 10) } : c))
    );
    addAuditLog('Oppdaterte barneprofil', `Profil for barn ID ${id} oppdatert.`);
  };

  const assignSponsorToChild = (childId: string, sponsorId: string) => {
    setChildrenList((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, tildeltFadderId: sponsorId, sistOppdatert: new Date().toISOString().slice(0, 10) } : c))
    );
    setSponsors((prev) =>
      prev.map((s) => {
        const ids = childIdsOfSponsor(s);
        if (s.id === sponsorId) return { ...s, tildeltBarnIds: addChildId(ids, childId) };
        if (ids.includes(childId)) return { ...s, tildeltBarnIds: removeChildId(ids, childId) };
        return s;
      })
    );
    const child = childrenList.find((c) => c.id === childId);
    const sponsor = sponsors.find((s) => s.id === sponsorId);
    addAuditLog(
      'Tildelte fadder',
      `Fadder ${sponsor?.navn || sponsorId} ble tildelt ${child?.fornavn || childId} (${child?.internKode}).`
    );

    // Notify sponsor that child is assigned
    if (child) {
      const assignNotif: AppNotification = {
        id: 'notif-' + Date.now(),
        targetRole: 'sponsor',
        recipientId: sponsorId,
        title: `Du er tildelt fadderbarn: ${child.fornavn}`,
        message: `Du er nå koblet sammen med ${child.fornavn} (${child.internKode}) ved ${child.skoleNavn}. Se profilen i fadderportalen!`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'sponsor_assigned',
        read: false,
        actionSection: 'barn',
        relatedEntityId: child.id,
      };
      setNotifications((prev) => [assignNotif, ...prev]);
    }
  };

  const endSponsorship = (childId: string) => {
    const child = childrenList.find((c) => c.id === childId);
    if (!child) return;
    const sponsorId = child.tildeltFadderId;
    setChildrenList((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, status: 'avsluttet', tildeltFadderId: undefined } : c))
    );
    if (sponsorId) {
      setSponsors((prev) =>
        prev.map((s) =>
          s.id === sponsorId ? { ...s, tildeltBarnIds: removeChildId(childIdsOfSponsor(s), childId) } : s
        )
      );
    }
    addAuditLog('Avsluttet fadderforhold', `Fadderforhold for ${child.fornavn} (${child.internKode}) avsluttet etter endt skolegang.`);
  };

  const submitReport = (reportData: Partial<Report>) => {
    const child = childrenList.find((c) => c.id === reportData.barnId);
    const coord =
      coordinators.find((c) => c.id === (child?.koordinatorId || currentCoordinatorId)) || currentCoordinator;
    const coordNavn = coord ? coordinatorDisplayName(coord) : 'Koordinator (Brazzaville)';
    const coordId = coord?.id || currentCoordinatorId;
    const newReport: Report = {
      id: 'rep-' + Date.now(),
      barnId: reportData.barnId || '',
      barnNavn: child?.fornavn || 'Elev',
      koordinatorId: coordId,
      koordinatorNavn: coordNavn,
      dato: new Date().toISOString().slice(0, 10),
      tittelFransk: reportData.tittelFransk || 'Rapport de suivi scolaire',
      innholdFransk: reportData.innholdFransk || 'Rapport rédigé par le coordinateur local.',
      tittelNorsk: reportData.tittelNorsk || (reportData.tittelFransk ? `[Oversettelse] ${reportData.tittelFransk}` : 'Skolerapport'),
      innholdNorsk: reportData.innholdNorsk || (reportData.innholdFransk ? `[Automatisk utkast til revisjon: ${reportData.innholdFransk}]` : 'Rapportutkast.'),
      skoleprestasjon: reportData.skoleprestasjon || 'God fremgang',
      oppmoteProsent: reportData.oppmoteProsent || 95,
      status: 'innsendt',
      adminNotat: 'Innsendt fra feltkoordinator. Venter på kvalitetssikring i Norge.',
    };
    setReports((prev) => [newReport, ...prev]);
    addAuditLog('Sendte rapport til godkjenning', `Koordinator sendte rapport for ${newReport.barnNavn} til godkjenningskø.`);

    // Centralized Notification: Alert Administrator that report requires approval
    const adminNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      targetRole: 'admin',
      title: `Ny feltrapport krever godkjenning (${newReport.barnNavn})`,
      message: `${newReport.koordinatorNavn} har sendt inn ny rapport for ${newReport.barnNavn} (${child?.internKode || 'Elev'}) som venter på revisjon og oversettelse.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'report_needs_approval',
      read: false,
      actionSection: 'godkjenning',
      relatedEntityId: newReport.id,
    };

    // Centralized Notification: Notify Coordinator that report is in the queue
    const coordNotif: AppNotification = {
      id: 'notif-' + (Date.now() + 1),
      targetRole: 'coordinator',
      recipientId: coordId,
      title: `Rapport envoyée pour validation (${newReport.barnNavn})`,
      message: `Votre rapport pour ${newReport.barnNavn} est bien transmis et en cours d'examen auprès du bureau de Kristiansand.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'report_needs_approval',
      read: false,
      actionSection: 'rapports',
      relatedEntityId: newReport.id,
    };

    setNotifications((prev) => [adminNotif, coordNotif, ...prev]);
  };

  const approveReport = (id: string, editedNorskTitle?: string, editedNorskContent?: string) => {
    let targetChildId = '';
    let targetChildName = '';
    let reportCoordId = '';

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          targetChildId = r.barnId;
          targetChildName = r.barnNavn;
          reportCoordId = r.koordinatorId;
          return {
            ...r,
            status: 'godkjent',
            tittelNorsk: editedNorskTitle || r.tittelNorsk,
            innholdNorsk: editedNorskContent || r.innholdNorsk,
            godkjentDato: new Date().toISOString().slice(0, 10),
            adminNotat: 'Kvalitetssikret og godkjent av administrator. Norsk oversettelse verifisert.',
          };
        }
        return r;
      })
    );

    const child = childrenList.find((c) => c.id === targetChildId);
    addAuditLog('Godkjente rapport', `Rapport ID ${id} for ${targetChildName} godkjent og synliggjort for fadder.`);

    const newNotificationsToAdd: AppNotification[] = [];

    // Centralized Notification: Alert the Sponsor that a new report is available!
    if (child && child.tildeltFadderId) {
      newNotificationsToAdd.push({
        id: 'notif-' + Date.now(),
        targetRole: 'sponsor',
        recipientId: child.tildeltFadderId,
        title: `Ny rapport tilgjengelig for ${child.fornavn}`,
        message: `En ny kvalitetssikret oppdatering for ${child.fornavn} er nå godkjent og publisert i din fadderportal!`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'report_approved',
        read: false,
        actionSection: 'rapporter',
        relatedEntityId: id,
      });
    }

    // Centralized Notification: Alert Coordinator that their report was approved & published
    newNotificationsToAdd.push({
      id: 'notif-' + (Date.now() + 1),
      targetRole: 'coordinator',
      recipientId: reportCoordId,
      title: `Rapport validé et publié (${targetChildName})`,
      message: `Le rapport scolaire pour ${targetChildName} a été vérifié et publié pour le parrain en Norvège.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'report_approved',
      read: false,
      actionSection: 'rapports',
      relatedEntityId: id,
    });

    if (newNotificationsToAdd.length > 0) {
      setNotifications((prev) => [...newNotificationsToAdd, ...prev]);
    }

    if (child?.tildeltFadderId) {
      queueSponsorSystemEmail(
        'report_approved',
        sponsors.find((s) => s.id === child.tildeltFadderId),
        id
      );
    }
  };

  const rejectReport = (id: string, reason: string) => {
    let childName = '';
    let coordId = '';
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          childName = r.barnNavn;
          coordId = r.koordinatorId;
          return { ...r, status: 'avvist', adminNotat: `Retur til koordinator: ${reason}` };
        }
        return r;
      })
    );
    addAuditLog('Avviste rapport / ba om endring', `Rapport ID ${id} returnert med kommentar: "${reason}".`);

    // Centralized Notification: Notify Coordinator about requested changes
    const coordRejectNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      targetRole: 'coordinator',
      recipientId: coordId,
      title: `Modifications requises sur un rapport (${childName || 'Élève'})`,
      message: `Le bureau de Kristiansand sollicite des ajustements pour ${childName} : "${reason}".`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'report_rejected',
      read: false,
      actionSection: 'rapports',
      relatedEntityId: id,
    };
    setNotifications((prev) => [coordRejectNotif, ...prev]);
  };

  const submitChildPhoto = (childId: string, dataUrl: string, beskrivelseFr: string) => {
    const child = childrenList.find((c) => c.id === childId);
    if (!child || !child.samtykkeFoto) return;
    const today = new Date().toISOString().slice(0, 10);
    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === childId
          ? {
              ...c,
              ventendeFotoUrl: dataUrl,
              ventendeFotoBeskrivelseFr: beskrivelseFr,
              ventendeFotoStatus: 'innsendt',
              ventendeFotoInnsendtDato: today,
              sistOppdatert: today,
            }
          : c
      )
    );
    addAuditLog(
      'Koordinator sendte bilde til godkjenning',
      `Ny skolefoto for ${child.fornavn} (${child.internKode}) venter admin.`
    );
    const adminNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      targetRole: 'admin',
      title: `Nytt barnebilde til godkjenning (${child.fornavn})`,
      message: `${
        coordinators.find((x) => x.id === child.koordinatorId)
          ? coordinatorDisplayName(coordinators.find((x) => x.id === child.koordinatorId)!)
          : 'Koordinator'
      } har sendt inn foto for ${child.fornavn}.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'photo_needs_approval',
      read: false,
      actionSection: 'godkjenning',
      relatedEntityId: childId,
    };
    setNotifications((prev) => [adminNotif, ...prev]);
  };

  const addCatalogPhoto = (photo: Omit<CatalogPhoto, 'id'>): string => {
    const id = 'photo-cat-' + Date.now();
    const barnIds = photo.barnIds.map((t) => t.trim()).filter(Boolean);
    if (barnIds.length === 0) return '';
    const entry: CatalogPhoto = { ...photo, id, barnIds };
    setCatalogPhotos((prev) => [entry, ...prev]);
    addAuditLog(
      'La til katalogbilde',
      `Skolebilde merket med ${barnIds.join(', ')}.`
    );
    return id;
  };

  const updateCatalogPhoto = (id: string, updates: Partial<CatalogPhoto>) => {
    setCatalogPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const approveChildPhoto = (childId: string) => {
    const child = childrenList.find((c) => c.id === childId);
    if (!child?.ventendeFotoUrl) return;
    const today = new Date().toISOString().slice(0, 10);
    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === childId
          ? {
              ...c,
              publisertFotoUrl: c.ventendeFotoUrl,
              ventendeFotoUrl: undefined,
              ventendeFotoBeskrivelseFr: undefined,
              ventendeFotoStatus: undefined,
              ventendeFotoInnsendtDato: undefined,
              sistOppdatert: today,
            }
          : c
      )
    );
    addAuditLog('Godkjente barnebilde', `Foto for ${child.fornavn} er publisert til fadderportal.`);
    if (child.tildeltFadderId) {
      const sponsorNotif: AppNotification = {
        id: 'notif-' + Date.now(),
        targetRole: 'sponsor',
        recipientId: child.tildeltFadderId,
        title: `Nytt bilde av ${child.fornavn}`,
        message: `Et godkjent skolebilde er lagt til på profilen til ${child.fornavn}.`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'photo_approved',
        read: false,
        actionSection: 'barn',
        relatedEntityId: childId,
      };
      setNotifications((prev) => [sponsorNotif, ...prev]);
    }
    const coordNotif: AppNotification = {
      id: 'notif-' + (Date.now() + 1),
      targetRole: 'coordinator',
      recipientId: child.koordinatorId,
      title: `Photo publiée (${child.fornavn})`,
      message: `La photo soumise pour ${child.fornavn} a été validée par Kristiansand et est visible pour le parrain.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'photo_approved',
      read: false,
      actionSection: 'photos',
      relatedEntityId: childId,
    };
    setNotifications((prev) => [coordNotif, ...prev]);
  };

  const rejectChildPhoto = (childId: string, reason: string) => {
    const child = childrenList.find((c) => c.id === childId);
    if (!child) return;
    setChildrenList((prev) =>
      prev.map((c) =>
        c.id === childId
          ? {
              ...c,
              ventendeFotoUrl: undefined,
              ventendeFotoStatus: 'avvist',
              ventendeFotoInnsendtDato: undefined,
              sistOppdatert: new Date().toISOString().slice(0, 10),
            }
          : c
      )
    );
    addAuditLog('Avviste barnebilde', `Foto for ${child.fornavn} avvist: ${reason}`);
    const coordNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      targetRole: 'coordinator',
      recipientId: child.koordinatorId,
      title: `Photo refusée (${child.fornavn})`,
      message: `Kristiansand a demandé une nouvelle photo : ${reason}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'photo_rejected',
      read: false,
      actionSection: 'photos',
      relatedEntityId: childId,
    };
    setNotifications((prev) => [coordNotif, ...prev]);
  };

  const addMilestone = (milestoneData: Omit<ChildMilestone, 'id' | 'opprettetDato'>): string => {
    const child = childrenList.find((c) => c.id === milestoneData.barnId);
    const newId = 'milestone-' + Date.now();
    const newMilestone: ChildMilestone = {
      ...milestoneData,
      id: newId,
      barnNavn: milestoneData.barnNavn || child?.fornavn || 'Elev',
      opprettetDato: new Date().toISOString().slice(0, 10),
    };

    setMilestones((prev) => [newMilestone, ...prev]);
    addAuditLog('Registrerte milepæl', `Ny milepæl "${newMilestone.tittelNorsk}" loggført for ${newMilestone.barnNavn}.`);

    const newNotificationsToAdd: AppNotification[] = [];

    // Centralized Notification: Notify the child's sponsor if assigned!
    if (child && child.tildeltFadderId) {
      newNotificationsToAdd.push({
        id: 'notif-' + Date.now(),
        targetRole: 'sponsor',
        recipientId: child.tildeltFadderId,
        title: `Ny milepæl for ${child.fornavn}: ${newMilestone.tittelNorsk}`,
        message: `Koordinator har lagt til en ny milepæl i tidslinjen til ${child.fornavn}: "${newMilestone.tittelNorsk}". Åpne tidslinjen for å lese mer!`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'milestone_logged',
        read: false,
        actionSection: 'tidslinje',
        relatedEntityId: newMilestone.id,
      });
    }

    // Confirmation for coordinator
    newNotificationsToAdd.push({
      id: 'notif-' + (Date.now() + 1),
      targetRole: 'coordinator',
      recipientId: child?.koordinatorId,
      title: `Jalon enregistré avec succès (${newMilestone.barnNavn})`,
      message: `Le jalon "${newMilestone.tittelFransk}" a été ajouté à la chronologie de ${newMilestone.barnNavn}.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'milestone_logged',
      read: false,
      actionSection: 'jalons',
      relatedEntityId: newMilestone.id,
    });

    if (newNotificationsToAdd.length > 0) {
      setNotifications((prev) => [...newNotificationsToAdd, ...prev]);
    }

    return newId;
  };

  const updateMilestone = (id: string, updates: Partial<ChildMilestone>) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    addAuditLog('Oppdaterte milepæl', `Milepæl ID ${id} ble oppdatert.`);
  };

  const deleteMilestone = (id: string) => {
    const item = milestones.find((m) => m.id === id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    addAuditLog('Slettet milepæl', `Milepæl "${item?.tittelNorsk || id}" ble slettet.`);
  };

  const submitInquiry = (sponsorId: string, childId: string, question: string) => {
    const sp = sponsors.find((s) => s.id === sponsorId);
    const ch = childrenList.find((c) => c.id === childId);
    const newInquiry: Inquiry = {
      id: 'inq-' + Date.now(),
      fadderId: sponsorId,
      fadderNavn: sp?.navn || 'Fadder',
      barnId: childId,
      barnNavn: ch?.fornavn || 'Fadderbarn',
      sporsmaal: question,
      datoSendt: new Date().toISOString().slice(0, 10),
      status: 'mottatt',
    };
    setInquiries((prev) => [newInquiry, ...prev]);
    addAuditLog('Fadder sendte spørsmål', `Fadder ${newInquiry.fadderNavn} sendte spørsmål vedrørende ${newInquiry.barnNavn}.`);

    // Centralized Notification: Alert Admin about new inquiry
    const adminInqNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      targetRole: 'admin',
      title: `Nytt spørsmål fra fadder ${newInquiry.fadderNavn}`,
      message: `Spørsmål angående ${newInquiry.barnNavn}: «${question.slice(0, 80)}${question.length > 80 ? '...' : ''}»`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'inquiry_new',
      read: false,
      actionSection: 'sporsmaal',
      relatedEntityId: newInquiry.id,
    };
    setNotifications((prev) => [adminInqNotif, ...prev]);
  };

  const answerInquiry = (id: string, answerText: string) => {
    let fadderId = '';
    let barnNavn = '';
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id === id) {
          fadderId = inq.fadderId;
          barnNavn = inq.barnNavn;
          return {
            ...inq,
            status: 'besvart',
            svarTekst: answerText,
            svarDato: new Date().toISOString().slice(0, 10),
          };
        }
        return inq;
      })
    );
    addAuditLog('Besvarte spørsmål', `Spørsmål ID ${id} besvart av administrator og publisert til fadder.`);

    // Centralized Notification: Alert Sponsor that answer is available
    if (fadderId) {
      const sponsorAnswerNotif: AppNotification = {
        id: 'notif-' + Date.now(),
        targetRole: 'sponsor',
        recipientId: fadderId,
        title: `Ditt spørsmål om ${barnNavn} er besvart`,
        message: `Administrator har gjennomgått din henvendelse og publisert et svar i fadderportalen.`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: 'inquiry_answered',
        read: false,
        actionSection: 'sporsmaal',
        relatedEntityId: id,
      };
      setNotifications((prev) => [sponsorAnswerNotif, ...prev]);
      queueSponsorSystemEmail(
        'inquiry_answered',
        sponsors.find((s) => s.id === fadderId),
        id
      );
    }
  };

  const forwardInquiryToCoordinator = (id: string, note?: string) => {
    let barnNavn = '';
    let coordId = '';
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id === id) {
          barnNavn = inq.barnNavn;
          const ch = childrenList.find((c) => c.id === inq.barnId);
          coordId = ch?.koordinatorId || '';
          return {
            ...inq,
            status: 'venter_koordinator',
            koordinatorId: coordId,
            koordinatorNotatFr: note || 'Question transmise au coordinateur local pour éclaircissement.',
          };
        }
        return inq;
      })
    );
    addAuditLog('Videresendte spørsmål', `Spørsmål ID ${id} videresendt til koordinator i Kongo for avklaring.`);

    // Centralized Notification: Notify Coordinator that a question requires their input
    const coordInqNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      targetRole: 'coordinator',
      recipientId: coordId,
      title: `Demande de précision de Kristiansand (${barnNavn})`,
      message: note || `Le bureau de Kristiansand sollicite des précisions de terrain concernant ${barnNavn}.`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type: 'inquiry_forwarded',
      read: false,
      actionSection: 'questions',
      relatedEntityId: id,
    };
    setNotifications((prev) => [coordInqNotif, ...prev]);
  };

  const coordinatorReplyToInquiry = (id: string, noteFr: string) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === id
          ? {
              ...inq,
              status: 'under_behandling',
              koordinatorNotatFr: noteFr,
            }
          : inq
      )
    );
    addAuditLog('Koordinator svarte på forespørsel', `Koordinator i Kongo la inn feltnotat på spørsmål ID ${id}.`);
  };

  const registerNewSponsorInterest = (data: {
    navn: string;
    epost: string;
    telefon: string;
    poststed: string;
    maanedsbelop: number;
    betalingsmetode: 'vipps' | 'avtalegiro' | 'bank';
  }) => {
    const newSponsorId = 'sponsor-' + Date.now().toString(36);

    const newSponsor: Sponsor = {
      id: newSponsorId,
      navn: data.navn,
      epost: data.epost,
      telefon: data.telefon,
      poststed: data.poststed,
      maanedsbelop: data.maanedsbelop,
      betalingsmetode: data.betalingsmetode,
      betalingsstatus: 'aktiv',
      startDato: new Date().toISOString().slice(0, 10),
      tildeltBarnIds: [],
      registrertKilde: 'nettside',
    };

    setSponsors((prev) => [...prev, newSponsor]);

    // Register initial payment log
    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      fadderId: newSponsorId,
      fadderNavn: data.navn,
      belop: data.maanedsbelop,
      dato: new Date().toISOString().slice(0, 10),
      type: 'fadderbidrag',
      metode: data.betalingsmetode,
      status: 'fullfort',
      referanse: `${data.betalingsmetode.toUpperCase()}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditLog(
      'Ny fadderregistrering',
      `${data.navn} meldte interesse via nettsiden (${data.maanedsbelop} kr/mnd). Admin må koble barn manuelt.`
    );

    return newSponsorId;
  };

  const addSponsor = (data: {
    navn: string;
    epost: string;
    telefon: string;
    poststed: string;
    maanedsbelop: 250 | 350;
    betalingsmetode: 'vipps' | 'bank';
  }) => {
    const newSponsorId = 'sponsor-' + Date.now();
    const newSponsor: Sponsor = {
      id: newSponsorId,
      navn: data.navn,
      epost: data.epost,
      telefon: data.telefon,
      poststed: data.poststed,
      maanedsbelop: data.maanedsbelop,
      betalingsmetode: data.betalingsmetode,
      betalingsstatus: 'aktiv',
      startDato: new Date().toISOString().slice(0, 10),
      tildeltBarnIds: [],
      registrertKilde: 'admin',
    };
    setSponsors((prev) => [...prev, newSponsor]);
    addAuditLog(
      'La til fadder',
      `${data.navn} ble registrert av administrator (${data.maanedsbelop} kr/mnd via ${data.betalingsmetode}). Ingen barn er tildelt ennå.`
    );
    queueSponsorSystemEmail('sponsor_welcome', newSponsor, newSponsorId);
    return newSponsorId;
  };

  const donateToCampaign = (campaignId: string, amount: number, donorName: string, method: 'vipps' | 'bank') => {
    setCampaigns((prev) =>
      prev.map((camp) => {
        if (camp.id === campaignId) {
          const updatedAmount = camp.innsamletBelop + amount;
          return {
            ...camp,
            innsamletBelop: updatedAmount,
            antallGivere: camp.antallGivere + 1,
            status: updatedAmount >= camp.maalbelop ? 'fullfort' : 'aktiv',
          };
        }
        return camp;
      })
    );

    const camp = campaigns.find((c) => c.id === campaignId);
    const newPayment: PaymentRecord = {
      id: 'pay-' + Date.now(),
      fadderNavn: donorName || 'Anonym giver',
      aksjonId: campaignId,
      aksjonTittel: camp?.tittel || 'Aksjon',
      belop: amount,
      dato: new Date().toISOString().slice(0, 10),
      type: 'aksjon',
      metode: method,
      status: 'fullfort',
      referanse: `AKSJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditLog('Mottok aksjonsbidrag', `${donorName || 'Giver'} ga ${amount} kr til "${camp?.tittel}".`);
  };

  const addCampaign = (data: Omit<Campaign, 'id' | 'innsamletBelop' | 'antallGivere'>) => {
    const newCampaign: Campaign = {
      ...data,
      id: 'camp-' + Date.now(),
      innsamletBelop: 0,
      antallGivere: 0,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    addAuditLog('Opprettet aksjon', `Aksjonen «${newCampaign.tittel}» ble opprettet i CMS.`);
    return newCampaign.id;
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog('Oppdaterte aksjon', `Aksjonen «${id}» ble oppdatert fra CMS.`);
  };

  const deleteCampaign = (id: string) => {
    const camp = campaigns.find((c) => c.id === id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    addAuditLog('Slettet aksjon', `Aksjonen «${camp?.tittel || id}» ble slettet fra CMS.`);
  };

  const reconcilePayment = (paymentId: string) => {
    const pay = payments.find((p) => p.id === paymentId);
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'avstemt' } : p))
    );
    addAuditLog('Avstemte betaling', `Betaling ${paymentId} merket som avstemt mot bankregnskap.`);
    if (pay?.fadderId) {
      queueSponsorSystemEmail(
        'payment_registered',
        sponsors.find((s) => s.id === pay.fadderId),
        paymentId
      );
    }
  };

  // CMS Actions
  const updateCmsSection = <K extends keyof CmsContent>(section: K, data: CmsContent[K]) => {
    setCmsContent((prev) => ({
      ...prev,
      [section]: data,
    }));
    addAuditLog('Oppdaterte CMS-innhold', `Seksjonen "${String(section)}" ble oppdatert.`);
  };

  const resetCmsSection = (_section: keyof CmsContent) => {
    if (contentIsLocked(contentLock)) return;
  };

  const resetAllCms = () => {
    if (contentIsLocked(contentLock)) return;
  };

  const addStory = (storyData: Omit<AdultGraduateStory, 'id'>) => {
    const newStory: AdultGraduateStory = {
      ...storyData,
      id: 'story-' + Date.now(),
    };
    setStories((prev) => [newStory, ...prev]);
    addAuditLog('Opprettet vitnesbyrd', `Nytt vitnesbyrd for "${newStory.navn}" ble lagt til.`);
  };

  const updateStory = (id: string, updates: Partial<AdultGraduateStory>) => {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    addAuditLog('Oppdaterte vitnesbyrd', `Vitnesbyrd ID ${id} ble oppdatert.`);
  };

  const deleteStory = (id: string) => {
    const story = stories.find((s) => s.id === id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('Slettet vitnesbyrd', `Vitnesbyrd for "${story?.navn || id}" ble fjernet.`);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        t,
        childrenList,
        sponsors,
        reports,
        milestones,
        inquiries,
        payments,
        campaigns,
        stories,
        auditLogs,
        notifications,
        currentRoleNotifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        cmsContent,
        updateCmsSection,
        resetCmsSection,
        resetAllCms,
        addStory,
        updateStory,
        deleteStory,
        currentSponsor,
        setCurrentSponsorId,
        coordinators,
        currentCoordinator,
        currentCoordinatorId,
        setCurrentCoordinatorId,
        coordinatorChildren,
        fieldFacts,
        submitFieldFact,
        publishChildStory,
        addChild,
        updateChild,
        assignSponsorToChild,
        endSponsorship,
        submitReport,
        approveReport,
        rejectReport,
        submitChildPhoto,
        approveChildPhoto,
        rejectChildPhoto,
        catalogPhotos,
        addCatalogPhoto,
        updateCatalogPhoto,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        submitInquiry,
        answerInquiry,
        forwardInquiryToCoordinator,
        coordinatorReplyToInquiry,
        registerNewSponsorInterest,
        addSponsor,
        donateToCampaign,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        reconcilePayment,
        addAuditLog,
        emailOutbox,
        addEmailOutboxItem,
        updateEmailOutboxItem,
        emailAutoSend,
        setEmailAutoSendEvent,
        firestoreEnabled: firestore.firestoreEnabled,
        firestoreBackendActive: firestore.backendActive,
        firestoreUserEmail: firestore.firebaseUser?.email ?? null,
        firestoreUserProfile: firestore.firestoreUserProfile,
        firestoreProfileLoading: firestore.firestoreProfileLoading,
        firestoreAccessMessage: firestore.firestoreAccessMessage,
        firestoreImportMessage: firestore.importMessage,
        firestoreAuthError: firestore.authError,
        signInFirestoreGoogle: firestore.signInWithGoogle,
        sendFirestoreEmailSignInLink: firestore.sendEmailSignInLink,
        signInFirestoreGoogleRedirect: firestore.signInWithGoogleRedirect,
        enterPortalFromProfile,
        importBrowserToFirestore: async () => {
          await firestore.importBrowserToFirestore();
        },
        inviteUserToDirectory,
        firestoreLoading: firestore.firestoreEnabled && firestore.loadState === 'loading',
        firestoreSave: firestore.saveStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
