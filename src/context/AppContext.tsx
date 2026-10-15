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
import translationsData from '../locales/translations.json';
import {
  INITIAL_CHILDREN,
  INITIAL_SPONSORS,
  INITIAL_REPORTS,
  INITIAL_INQUIRIES,
  INITIAL_PAYMENTS,
  INITIAL_CAMPAIGNS,
  INITIAL_STORIES,
  INITIAL_AUDIT_LOG,
  INITIAL_NOTIFICATIONS,
  INITIAL_CMS_CONTENT,
  INITIAL_MILESTONES,
  INITIAL_COORDINATORS,
  INITIAL_FACTS,
  INITIAL_CATALOG_PHOTOS,
} from '@betyna/seed';
import { coordinatorDisplayName } from '../data/simulationCoordinators';
import { childrenForCoordinator, migrateChildrenCoordinatorIds } from '../utils/coordinatorScope';
import { migrateCmsKpiStats } from '../utils/cmsKpiMigrate';
import { buildFieldFact } from '../utils/fieldFacts';
import { composeInquiryAnsweredEmail } from '../email/composeInquiryAnswered';
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
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  reconcilePayment: (paymentId: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  addAuditLog: (handling: string, detaljer: string) => void;
  resetAllData: () => void;

  emailOutbox: EmailOutboxItem[];
  addEmailOutboxItem: (item: Omit<EmailOutboxItem, 'id' | 'createdAt'>) => EmailOutboxItem;
  updateEmailOutboxItem: (id: string, updates: Partial<EmailOutboxItem>) => void;
}

const STORAGE_KEY_PREFIX = 'betyna_v1_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('public');
  const [currentSponsorId, setCurrentSponsorId] = useState<string>('sponsor-01');
  const [currentCoordinatorId, setCurrentCoordinatorId] = useState<string>('coord-01');
  const [coordinators] = useState<Coordinator[]>(INITIAL_COORDINATORS);

  // Load from localStorage or initial
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const normalizeLanguage = (raw: unknown): AppLanguage => {
    if (raw === 'fr' || raw === 'no') return raw;
    if (raw === 'en') return 'fr';
    return 'no';
  };

  const [language, setLanguageState] = useState<AppLanguage>(() =>
    normalizeLanguage(loadState('language', 'no'))
  );

  const [childrenList, setChildrenList] = useState<Child[]>(() =>
    migrateChildrenCoordinatorIds(loadState('children', INITIAL_CHILDREN))
  );
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => loadState('sponsors', INITIAL_SPONSORS));
  const [reports, setReports] = useState<Report[]>(() => loadState('reports', INITIAL_REPORTS));
  const [milestones, setMilestones] = useState<ChildMilestone[]>(() => loadState('milestones', INITIAL_MILESTONES));
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => loadState('inquiries', INITIAL_INQUIRIES));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadState('payments', INITIAL_PAYMENTS));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadState('campaigns', INITIAL_CAMPAIGNS));
  const [fieldFacts, setFieldFacts] = useState<FieldFact[]>(() => loadState('fieldFacts', INITIAL_FACTS));
  const [stories, setStories] = useState<AdultGraduateStory[]>(() => loadState('stories', INITIAL_STORIES));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => loadState('auditLogs', INITIAL_AUDIT_LOG));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadState('notifications', INITIAL_NOTIFICATIONS));
  const [cmsContent, setCmsContent] = useState<CmsContent>(() =>
    migrateCmsKpiStats(loadState('cms', INITIAL_CMS_CONTENT), INITIAL_CMS_CONTENT.kpiStats)
  );
  const [catalogPhotos, setCatalogPhotos] = useState<CatalogPhoto[]>(() =>
    loadState('catalogPhotos', INITIAL_CATALOG_PHOTOS)
  );
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxItem[]>(() => loadState('emailOutbox', []));

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'children', JSON.stringify(childrenList));
  }, [childrenList]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'sponsors', JSON.stringify(sponsors));
  }, [sponsors]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'reports', JSON.stringify(reports));
  }, [reports]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'milestones', JSON.stringify(milestones));
  }, [milestones]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'inquiries', JSON.stringify(inquiries));
  }, [inquiries]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'campaigns', JSON.stringify(campaigns));
  }, [campaigns]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'fieldFacts', JSON.stringify(fieldFacts));
  }, [fieldFacts]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'stories', JSON.stringify(stories));
  }, [stories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'cms', JSON.stringify(cmsContent));
  }, [cmsContent]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'catalogPhotos', JSON.stringify(catalogPhotos));
  }, [catalogPhotos]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'emailOutbox', JSON.stringify(emailOutbox));
  }, [emailOutbox]);

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
    setRoleState(newRole);
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'language', JSON.stringify(lang));
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
      koordinatorId: childData.koordinatorId || currentCoordinatorId || 'coord-01',
    };
    setChildrenList((prev) => [...prev, newChild]);
    addAuditLog('Registrerte nytt barn', `Ny elev ${newChild.fornavn} (${newChild.internKode}) registrert.`);
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
      prev.map((s) => (s.id === sponsorId ? { ...s, tildeltBarnId: childId } : s))
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
    setChildrenList((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, status: 'avsluttet', tildeltFadderId: undefined } : c))
    );
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
      message: `Votre rapport pour ${newReport.barnNavn} est bien transmis et en cours d'examen auprès du bureau d'Oslo.`,
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
    let reportCoordId = 'coord-01';

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
  };

  const rejectReport = (id: string, reason: string) => {
    let childName = '';
    let coordId = 'coord-01';
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
      message: `Le bureau d'Oslo sollicite des ajustements pour ${childName} : "${reason}".`,
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
      message: `${coordinatorDisplayName(coordinators.find((x) => x.id === child.koordinatorId) || coordinators[0])} har sendt inn foto for ${child.fornavn}.`,
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
      message: `La photo soumise pour ${child.fornavn} a été validée par Oslo et est visible pour le parrain.`,
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
      message: `Oslo a demandé une nouvelle photo : ${reason}`,
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

      const sponsor = sponsors.find((s) => s.id === fadderId);
      if (sponsor) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://betyna.no';
        const mail = composeInquiryAnsweredEmail({
          inquiryId: id,
          sponsorId: sponsor.id,
          sponsorName: sponsor.navn,
          sponsorEmail: sponsor.epost,
          origin,
        });
        if (mail.ok) {
          const row = addEmailOutboxItem({
            kind: mail.kind,
            subject: mail.subject,
            body: mail.html,
            toEmails: mail.emails,
            relatedId: mail.relatedId,
            templateId: mail.templateId,
            status: 'venter_nøkkel',
            note: 'Systemmelding når svar publiseres.',
          });
          addAuditLog(
            'Systemmelding til fadder',
            `Svar på spørsmål til ${sponsor.epost}. Sendes via Resend når nøkkelen er satt.`
          );
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
        }
      }
    }
  };

  const forwardInquiryToCoordinator = (id: string, note?: string) => {
    let barnNavn = '';
    let coordId = 'coord-01';
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id === id) {
          barnNavn = inq.barnNavn;
          const ch = childrenList.find((c) => c.id === inq.barnId);
          coordId = ch?.koordinatorId || 'coord-01';
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
      title: `Demande de précision d'Oslo (${barnNavn})`,
      message: note || `Le bureau d'Oslo sollicite des précisions de terrain concernant ${barnNavn}.`,
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
      tildeltBarnId: '',
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
      tildeltBarnId: '',
      registrertKilde: 'admin',
    };
    setSponsors((prev) => [...prev, newSponsor]);
    addAuditLog(
      'La til fadder',
      `${data.navn} ble registrert av administrator (${data.maanedsbelop} kr/mnd via ${data.betalingsmetode}). Ingen barn er tildelt ennå.`
    );
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

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog('Oppdaterte aksjon', `Aksjonen "${id}" ble oppdatert fra CMS.`);
  };

  const reconcilePayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: 'avstemt' } : p))
    );
    addAuditLog('Avstemte betaling', `Betaling ${paymentId} merket som avstemt mot bankregnskap.`);
  };

  // CMS Actions
  const updateCmsSection = <K extends keyof CmsContent>(section: K, data: CmsContent[K]) => {
    setCmsContent((prev) => ({
      ...prev,
      [section]: data,
    }));
    addAuditLog('Oppdaterte CMS-innhold', `Seksjonen "${String(section)}" ble oppdatert.`);
  };

  const resetCmsSection = (section: keyof CmsContent) => {
    setCmsContent((prev) => ({
      ...prev,
      [section]: INITIAL_CMS_CONTENT[section],
    }));
    addAuditLog('Tilbakestilte CMS-seksjon', `Seksjonen "${String(section)}" ble tilbakestilt til standard.`);
  };

  const resetAllCms = () => {
    setCmsContent(INITIAL_CMS_CONTENT);
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'cms');
    addAuditLog('Tilbakestilte alt CMS-innhold', 'Hele nettstedets innhold ble tilbakestilt til standard.');
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

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'children');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'sponsors');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'reports');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'milestones');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'inquiries');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'payments');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'campaigns');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'stories');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'auditLogs');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'notifications');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'cms');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'fieldFacts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'catalogPhotos');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'emailOutbox');

    setChildrenList(INITIAL_CHILDREN);
    setSponsors(INITIAL_SPONSORS);
    setReports(INITIAL_REPORTS);
    setMilestones(INITIAL_MILESTONES);
    setInquiries(INITIAL_INQUIRIES);
    setPayments(INITIAL_PAYMENTS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setStories(INITIAL_STORIES);
    setAuditLogs(INITIAL_AUDIT_LOG);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCmsContent(INITIAL_CMS_CONTENT);
    setFieldFacts(INITIAL_FACTS);
    setCatalogPhotos(INITIAL_CATALOG_PHOTOS);
    setEmailOutbox([]);
    setCurrentSponsorId('sponsor-01');
    setCurrentCoordinatorId('coord-01');
    setRole('public');
    setLanguage('no');
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
        updateCampaign,
        reconcilePayment,
        addAuditLog,
        resetAllData,
        emailOutbox,
        addEmailOutboxItem,
        updateEmailOutboxItem,
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
