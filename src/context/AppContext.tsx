import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFirestoreAppSync } from '../db/useFirestoreAppSync';
import type { AppLanguage } from '../types';
import type { AppContextType } from './appContextTypes';
import { loadLocalState } from './appContentStorage';
import { useAppContent } from './useAppContent';
import { normalizeAppLanguage, useAppSession } from './useAppSession';
import { createAppActions } from './appActions';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firestore = useFirestoreAppSync();
  const [language, setLanguageState] = useState<AppLanguage>(() =>
    normalizeAppLanguage(loadLocalState('language') ?? 'no')
  );

  const content = useAppContent({
    firestore,
    language,
    onLanguageFromStorage: setLanguageState,
    normalizeLanguage: normalizeAppLanguage,
  });

  const session = useAppSession({
    firestore,
    sponsors: content.sponsors,
    coordinators: content.coordinators,
    childrenList: content.childrenList,
    notifications: content.notifications,
    setNotifications: content.setNotifications,
    setAuditLogs: content.setAuditLogs,
    setEmailOutbox: content.setEmailOutbox,
    emailAutoSend: content.emailAutoSend,
    setEmailAutoSend: content.setEmailAutoSend,
    language,
    setLanguageState,
  });

  // Admin som ser som fadder/koordinator: skrivebeskyttet, og bytte av person loggføres
  const isViewingAs =
    firestore.firestoreUserProfile?.role === 'admin' &&
    (session.role === 'sponsor' || session.role === 'coordinator');
  const { enterReadOnly, exitReadOnly, readOnly: firestoreReadOnly } = firestore;
  const wasViewingAsRef = useRef(false);

  useEffect(() => {
    const wasViewingAs = wasViewingAsRef.current;
    wasViewingAsRef.current = isViewingAs;
    if (isViewingAs && !wasViewingAs) enterReadOnly();
    else if (!isViewingAs && wasViewingAs) void exitReadOnly();
  }, [isViewingAs, enterReadOnly, exitReadOnly]);

  // Hvem som vises akkurat nå (fadder eller koordinator), og en nøkkel som endrer seg ved rolle- eller personbytte
  const viewed =
    session.role === 'sponsor' && session.currentSponsor
      ? { id: session.currentSponsor.id, navn: session.currentSponsor.navn }
      : session.role === 'coordinator' && session.currentCoordinator
        ? {
            id: session.currentCoordinator.id,
            navn: `${session.currentCoordinator.fornavn} ${session.currentCoordinator.etternavn}`,
          }
        : null;
  const viewKey = viewed ? `${session.role}:${viewed.id}` : null;
  const lastViewKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isViewingAs || !viewed || !viewKey) {
      if (!isViewingAs) lastViewKeyRef.current = null;
      return;
    }
    if (viewKey === lastViewKeyRef.current) return;
    lastViewKeyRef.current = viewKey;
    const profile = firestore.firestoreUserProfile;
    session.addAuditLog(
      session.role === 'sponsor' ? 'Så siden som fadder' : 'Så siden som koordinator',
      `${viewed.navn} (${viewed.id})`,
      { rolle: 'Administrator (Norge)', navn: profile?.displayName || profile?.email || '' }
    );
  }, [isViewingAs, viewKey, viewed, session, firestore.firestoreUserProfile]);

  const actions = useMemo(
    () =>
      createAppActions({
        contentLock: content.contentLock,
        childrenList: content.childrenList,
        setChildrenList: content.setChildrenList,
        sponsors: content.sponsors,
        setSponsors: content.setSponsors,
        reports: content.reports,
        setReports: content.setReports,
        milestones: content.milestones,
        setMilestones: content.setMilestones,
        inquiries: content.inquiries,
        setInquiries: content.setInquiries,
        payments: content.payments,
        setPayments: content.setPayments,
        sponsorAssignments: content.sponsorAssignments,
        setSponsorAssignments: content.setSponsorAssignments,
        campaigns: content.campaigns,
        setCampaigns: content.setCampaigns,
        stories: content.stories,
        setStories: content.setStories,
        catalogPhotos: content.catalogPhotos,
        setCatalogPhotos: content.setCatalogPhotos,
        mediaLibrary: content.mediaLibrary,
        setMediaLibrary: content.setMediaLibrary,
        cmsContent: content.cmsContent,
        setCmsContent: content.setCmsContent,
        fieldFacts: content.fieldFacts,
        setFieldFacts: content.setFieldFacts,
        notifications: content.notifications,
        setNotifications: content.setNotifications,
        coordinators: content.coordinators,
        currentCoordinatorId: session.currentCoordinatorId,
        currentSponsor: session.currentSponsor,
        currentCoordinator: session.currentCoordinator,
        addAuditLog: session.addAuditLog,
        queueSponsorSystemEmail: session.queueSponsorSystemEmail,
        setCoordinators: content.setCoordinators,
        recurringCharges: content.recurringCharges,
        paymentAllocations: content.paymentAllocations,
        setPaymentAllocations: content.setPaymentAllocations,
        adminActor: session.adminActor,
        directoryRowsForPerson: session.directoryRowsForPerson,
        setDirectoryStatusForEmail: session.setDirectoryStatusForEmail,
        deleteDirectoryForEmail: session.deleteDirectoryForEmail,
        inviteUserToDirectory: session.inviteUserToDirectory,
        addEmailOutboxItem: session.addEmailOutboxItem,
        updateEmailOutboxItem: session.updateEmailOutboxItem,
      }),
    [content, session]
  );

  const value: AppContextType = {
    role: session.role,
    setRole: session.setRole,
    language: session.language,
    setLanguage: session.setLanguage,
    t: session.t,
    childrenList: content.childrenList,
    sponsors: content.sponsors,
    reports: content.reports,
    milestones: content.milestones,
    inquiries: content.inquiries,
    payments: content.payments,
    sponsorAssignments: content.sponsorAssignments,
    recurringCharges: content.recurringCharges,
    paymentAllocations: content.paymentAllocations,
    vippsChargeJob: content.vippsChargeJob,
    campaigns: content.campaigns,
    stories: content.stories,
    auditLogs: content.auditLogs,
    notifications: content.notifications,
    currentRoleNotifications: session.currentRoleNotifications,
    unreadNotificationCount: session.unreadNotificationCount,
    markNotificationAsRead: session.markNotificationAsRead,
    markAllNotificationsAsRead: session.markAllNotificationsAsRead,
    deleteNotification: session.deleteNotification,
    cmsContent: content.cmsContent,
    ...actions,
    currentSponsor: session.currentSponsor,
    setCurrentSponsorId: session.setCurrentSponsorId,
    coordinators: content.coordinators,
    currentCoordinator: session.currentCoordinator,
    currentCoordinatorId: session.currentCoordinatorId,
    setCurrentCoordinatorId: session.setCurrentCoordinatorId,
    coordinatorChildren: session.coordinatorChildren,
    fieldFacts: content.fieldFacts,
    catalogPhotos: content.catalogPhotos,
    mediaLibrary: content.mediaLibrary,
    addAuditLog: session.addAuditLog,
    emailOutbox: content.emailOutbox,
    addEmailOutboxItem: session.addEmailOutboxItem,
    updateEmailOutboxItem: session.updateEmailOutboxItem,
    emailAutoSend: content.emailAutoSend,
    setEmailAutoSendEvent: session.setEmailAutoSendEvent,
    isViewingAs,
    firestoreReadOnly,
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
    signOutFirestore: firestore.signOutFirebase,
    enterPortalFromProfile: session.enterPortalFromProfile,
    importBrowserToFirestore: async () => {
      await firestore.importBrowserToFirestore();
    },
    inviteUserToDirectory: session.inviteUserToDirectory,
    updateUserDirectoryStatus: session.updateUserDirectoryStatus,
    firestoreLoading: firestore.firestoreEnabled && firestore.loadState === 'loading',
    firestoreSave: firestore.saveStatus,
    firestoreSaveNow: firestore.saveNow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export type { AppContextType } from './appContextTypes';
