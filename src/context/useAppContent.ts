import { useCallback, useEffect, useState } from 'react';
import type {
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
  AppLanguage,
} from '../types';
import { migrateEmailAutoSend, type EmailAutoSendPrefs } from '../email/autoSendPrefs';
import { migrateCampaignPayments, migrateCampaigns } from '../utils/campaignMigrate';
import { migrateSponsorsChildIds } from '../utils/sponsorChildren';
import { EMPTY_APP_CONTENT } from '../db/emptyContent';
import { migrateCmsHeroStock } from '../utils/cmsHeroImage';
import { LIVE_LAUNCH_VERSION, bootStoredOrLive, createSeedLock, type SeedLock } from '../db/seedPolicy';
import type { AppDataSnapshot } from '../db/firestoreData';
import type { useFirestoreAppSync } from '../db/useFirestoreAppSync';
import { loadLocalState, STORAGE_KEY_PREFIX, writeLocal } from './appContentStorage';

type FirestoreSync = ReturnType<typeof useFirestoreAppSync>;

export function useAppContent(params: {
  firestore: FirestoreSync;
  language: AppLanguage;
  onLanguageFromStorage: (lang: AppLanguage) => void;
  normalizeLanguage: (raw: unknown) => AppLanguage;
}) {
  const { firestore, language, onLanguageFromStorage, normalizeLanguage } = params;

  const [contentLock] = useState<SeedLock | null>(() => {
    const stored = loadLocalState<SeedLock>('contentLock');
    if (stored?.completed) return stored;
    const lock = createSeedLock(LIVE_LAUNCH_VERSION);
    try {
      writeLocal(STORAGE_KEY_PREFIX + 'contentLock', JSON.stringify(lock));
    } catch {
      /* privat modus */
    }
    return lock;
  });

  const [coordinators, setCoordinators] = useState<Coordinator[]>(EMPTY_APP_CONTENT.coordinators);
  const [childrenList, setChildrenList] = useState<Child[]>(() =>
    bootStoredOrLive(loadLocalState<Child[]>('children'), EMPTY_APP_CONTENT.children)
  );
  const [sponsors, setSponsors] = useState<Sponsor[]>(() =>
    migrateSponsorsChildIds(
      bootStoredOrLive(loadLocalState<Sponsor[]>('sponsors'), EMPTY_APP_CONTENT.sponsors)
    )
  );
  const [reports, setReports] = useState<Report[]>(() =>
    bootStoredOrLive(loadLocalState<Report[]>('reports'), EMPTY_APP_CONTENT.reports)
  );
  const [milestones, setMilestones] = useState<ChildMilestone[]>(() =>
    bootStoredOrLive(loadLocalState<ChildMilestone[]>('milestones'), EMPTY_APP_CONTENT.milestones)
  );
  const [inquiries, setInquiries] = useState<Inquiry[]>(() =>
    bootStoredOrLive(loadLocalState<Inquiry[]>('inquiries'), EMPTY_APP_CONTENT.inquiries)
  );
  const [sponsorAssignments, setSponsorAssignments] = useState<SponsorAssignment[]>(() =>
    bootStoredOrLive(loadLocalState<SponsorAssignment[]>('sponsorAssignments'), EMPTY_APP_CONTENT.sponsorAssignments)
  );
  const [recurringCharges, setRecurringCharges] = useState<RecurringCharge[]>(() =>
    bootStoredOrLive(loadLocalState<RecurringCharge[]>('recurringCharges'), EMPTY_APP_CONTENT.recurringCharges)
  );
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>(() =>
    bootStoredOrLive(loadLocalState<PaymentAllocation[]>('paymentAllocations'), EMPTY_APP_CONTENT.paymentAllocations)
  );
  const [vippsChargeJob, setVippsChargeJob] = useState<VippsChargeJobStatus | undefined>(undefined);
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const loadedCampaigns = migrateCampaigns(
      bootStoredOrLive(loadLocalState<Campaign[]>('campaigns'), EMPTY_APP_CONTENT.campaigns)
    );
    return migrateCampaignPayments(
      bootStoredOrLive(loadLocalState<PaymentRecord[]>('payments'), EMPTY_APP_CONTENT.payments),
      loadedCampaigns
    );
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    migrateCampaigns(bootStoredOrLive(loadLocalState<Campaign[]>('campaigns'), EMPTY_APP_CONTENT.campaigns))
  );
  const [fieldFacts, setFieldFacts] = useState<FieldFact[]>(() =>
    bootStoredOrLive(loadLocalState<FieldFact[]>('fieldFacts'), EMPTY_APP_CONTENT.facts)
  );
  const [stories, setStories] = useState<AdultGraduateStory[]>(() =>
    bootStoredOrLive(loadLocalState<AdultGraduateStory[]>('stories'), EMPTY_APP_CONTENT.testimonials)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() =>
    bootStoredOrLive(loadLocalState<AuditLogItem[]>('auditLogs'), EMPTY_APP_CONTENT.auditLogs)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    bootStoredOrLive(loadLocalState<AppNotification[]>('notifications'), EMPTY_APP_CONTENT.notifications)
  );
  const [cmsContent, setCmsContent] = useState<CmsContent>(() => {
    const stored = loadLocalState<CmsContent>('cms');
    return migrateCmsHeroStock(bootStoredOrLive(stored, EMPTY_APP_CONTENT.cms));
  });
  const [catalogPhotos, setCatalogPhotos] = useState<CatalogPhoto[]>(() =>
    bootStoredOrLive(loadLocalState<CatalogPhoto[]>('catalogPhotos'), EMPTY_APP_CONTENT.catalogPhotos)
  );
  const [mediaLibrary, setMediaLibrary] = useState<MediaLibraryItem[]>(() =>
    bootStoredOrLive(loadLocalState<MediaLibraryItem[]>('mediaLibrary'), EMPTY_APP_CONTENT.mediaLibrary)
  );
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxItem[]>(() =>
    bootStoredOrLive(loadLocalState<EmailOutboxItem[]>('emailOutbox'), [])
  );
  const [emailAutoSend, setEmailAutoSend] = useState<EmailAutoSendPrefs>(() =>
    migrateEmailAutoSend(
      bootStoredOrLive(loadLocalState<EmailAutoSendPrefs>('emailAutoSend'), EMPTY_APP_CONTENT.emailAutoSend)
    )
  );

  useEffect(() => {
    const hy = firestore.hydration;
    if (!hy) return;
    const h = hy.data;
    if (hy.full) {
      setCoordinators(h.coordinators ?? []);
      setChildrenList(h.children ?? []);
      setSponsors(h.sponsors ?? []);
      setReports(h.reports ?? []);
      setMilestones(h.milestones ?? []);
      setInquiries(h.inquiries ?? []);
      setPayments(h.payments ?? []);
      setSponsorAssignments(h.sponsorAssignments ?? []);
      setRecurringCharges(h.recurringCharges ?? []);
      setPaymentAllocations(h.paymentAllocations ?? []);
      setVippsChargeJob(h.vippsChargeJob);
      setCampaigns(migrateCampaigns(h.campaigns ?? []));
      setFieldFacts(h.facts ?? []);
      setStories(h.testimonials ?? []);
      setAuditLogs(h.auditLogs ?? []);
      setNotifications(h.notifications ?? []);
      setCatalogPhotos(h.catalogPhotos ?? []);
      setMediaLibrary(h.mediaLibrary ?? []);
      setEmailOutbox(h.emailOutbox ?? []);
      if (h.cms) setCmsContent(migrateCmsHeroStock(h.cms));
      if (h.emailAutoSend) setEmailAutoSend(migrateEmailAutoSend(h.emailAutoSend));
      const role = firestore.firestoreUserProfile?.role;
      firestore.confirmHydrated(h, {
        enableSave: role === 'admin' || role === 'coordinator' || role === 'sponsor',
      });
    } else {
      if (h.cms) setCmsContent(migrateCmsHeroStock(h.cms));
      if (h.campaigns) setCampaigns(migrateCampaigns(h.campaigns));
      if (h.testimonials) setStories(h.testimonials);
    }
  }, [firestore.hydration]);

  const buildDataSnapshot = useCallback((): AppDataSnapshot => ({
    coordinators,
    children: childrenList,
    sponsors,
    catalogPhotos,
    mediaLibrary,
    facts: fieldFacts,
    reports,
    milestones,
    inquiries,
    payments,
    sponsorAssignments,
    recurringCharges,
    paymentAllocations,
    vippsChargeJob,
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
    mediaLibrary,
    fieldFacts,
    reports,
    milestones,
    inquiries,
    payments,
    sponsorAssignments,
    recurringCharges,
    paymentAllocations,
    vippsChargeJob,
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
        if (key === 'language') onLanguageFromStorage(normalizeLanguage(value));
      } catch {
        /* ignorer ødelagt mellomlagring */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [normalizeLanguage, onLanguageFromStorage]);

  return {
    contentLock,
    coordinators,
    setCoordinators,
    childrenList,
    setChildrenList,
    sponsors,
    setSponsors,
    reports,
    setReports,
    milestones,
    setMilestones,
    inquiries,
    setInquiries,
    payments,
    setPayments,
    sponsorAssignments,
    setSponsorAssignments,
    recurringCharges,
    paymentAllocations,
    setPaymentAllocations,
    vippsChargeJob,
    campaigns,
    setCampaigns,
    fieldFacts,
    setFieldFacts,
    stories,
    setStories,
    auditLogs,
    setAuditLogs,
    notifications,
    setNotifications,
    cmsContent,
    setCmsContent,
    catalogPhotos,
    setCatalogPhotos,
    mediaLibrary,
    setMediaLibrary,
    emailOutbox,
    setEmailOutbox,
    emailAutoSend,
    setEmailAutoSend,
  };
}
