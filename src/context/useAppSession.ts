import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type {
  UserRole,
  AppLanguage,
  Sponsor,
  Coordinator,
  AppNotification,
  AuditLogItem,
  EmailOutboxItem,
  PersonLogSubject,
} from '../types';
import { isEmailAutoSendOn, type EmailAutoSendEvent, type EmailAutoSendPrefs } from '../email/autoSendPrefs';
import { composeSystemEmail } from '../email/composeSystemEmail';
import type { SystemTemplateId } from '../email/templates';
import translationsData from '../locales/translations.json';
import { childrenForCoordinator } from '../utils/coordinatorScope';
import { db } from '../config/firebase';
import {
  saveUserDirectoryEntry,
  updateUserDirectoryStatus as persistUserDirectoryStatus,
  listUserDirectoryEntries,
  deleteUserDirectoryEntry,
} from '../db/firestoreData';
import { normalizeUserDirectoryStatus } from '../db/userDirectoryStatus';
import { coordinatorSubject, sponsorSubject } from '../utils/personLog';
import type { FirestoreUser, FirestoreUserDirectoryEntry } from '../db/firestoreProfile';
import { consumePortalIntent } from '../utils/portalIntent';
import { canOpenPortalRole } from '../utils/portalRoles';
import { prototypeRoleSwitcherEnabled } from '../config/prototypeAccess';
import { postBetynaEmail } from '../email/client';
import type { useFirestoreAppSync } from '../db/useFirestoreAppSync';
import { loadLocalState, STORAGE_KEY_PREFIX, writeLocal } from './appContentStorage';
import type { Child } from '../types';

type FirestoreSync = ReturnType<typeof useFirestoreAppSync>;

export function normalizeAppLanguage(raw: unknown): AppLanguage {
  if (raw === 'fr' || raw === 'no') return raw;
  if (raw === 'en') return 'fr';
  return 'no';
}

export function useAppSession(params: {
  firestore: FirestoreSync;
  sponsors: Sponsor[];
  coordinators: Coordinator[];
  childrenList: Child[];
  notifications: AppNotification[];
  setNotifications: Dispatch<SetStateAction<AppNotification[]>>;
  setAuditLogs: Dispatch<SetStateAction<AuditLogItem[]>>;
  setEmailOutbox: Dispatch<SetStateAction<EmailOutboxItem[]>>;
  emailAutoSend: EmailAutoSendPrefs;
  setEmailAutoSend: Dispatch<SetStateAction<EmailAutoSendPrefs>>;
  language: AppLanguage;
  setLanguageState: Dispatch<SetStateAction<AppLanguage>>;
}) {
  const {
    firestore,
    sponsors,
    coordinators,
    childrenList,
    notifications,
    setNotifications,
    setAuditLogs,
    setEmailOutbox,
    emailAutoSend,
    setEmailAutoSend,
    language,
    setLanguageState,
  } = params;

  const [role, setRoleState] = useState<UserRole>('public');
  const [currentSponsorId, setCurrentSponsorId] = useState<string>('');
  const [currentCoordinatorId, setCurrentCoordinatorId] = useState<string>('');

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
    if (!profile) return false;
    applyFirestoreProfileToRole(profile);
    return true;
  }, [applyFirestoreProfileToRole, firestore.firestoreUserProfile]);

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
    } catch {
      /* privat modus */
    }
  };

  useEffect(() => {
    document.documentElement.lang = language === 'fr' ? 'fr' : 'nb';
  }, [language]);

  const t = useCallback((key: string, fallback?: string): string => {
    const langKey = language === 'fr' ? 'fr' : 'no';
    const parts = key.split('.');
    let current: unknown = (translationsData as Record<string, unknown>)[langKey];
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
        break;
      }
    }
    if (typeof current === 'string') {
      return current;
    }
    if (langKey !== 'no') {
      let fallbackVal: unknown = (translationsData as Record<string, unknown>)['no'];
      for (const part of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && part in fallbackVal) {
          fallbackVal = (fallbackVal as Record<string, unknown>)[part];
        } else {
          fallbackVal = undefined;
          break;
        }
      }
      if (typeof fallbackVal === 'string') return fallbackVal;
    }
    return fallback !== undefined ? fallback : key;
  }, [language]);

  const currentSponsor = sponsors.find((s) => s.id === currentSponsorId);
  const currentCoordinator = coordinators.find((c) => c.id === currentCoordinatorId);
  const coordinatorChildren = childrenForCoordinator(childrenList, currentCoordinatorId);

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

  /**
   * actor: valgfri, brukes når loggen skal føres på en annen person enn den som er innlogget i UI-rollen.
   * subject: personen oppføringen gjelder (personkortet). opts.type: 'kommentar' for kommentarer.
   */
  const addAuditLog = (
    handling: string,
    detaljer: string,
    actor?: { rolle: string; navn: string },
    subject?: PersonLogSubject,
    opts?: { type?: 'hendelse' | 'kommentar' }
  ) => {
    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrator (Norge)',
      coordinator: 'Koordinator (Kongo)',
      sponsor: 'Fadder (Norge)',
      public: 'Besøkende',
    };
    const newLog: AuditLogItem = {
      // Tilfeldig suffiks, så to oppføringer i samme millisekund fortsatt får unike id-er.
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      tidspunkt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      brukerRolle: actor ? actor.rolle : roleLabels[role],
      brukerNavn: actor
        ? actor.navn
        : role === 'sponsor'
          ? currentSponsor?.navn || 'Fadder'
          : role === 'coordinator'
          ? currentCoordinator?.fornavn || 'Koordinator'
          : 'Admin',
      handling,
      detaljer,
      ...(subject ? { gjelderType: subject.type, gjelderId: subject.id, gjelderNavn: subject.navn } : {}),
      ...(opts?.type ? { type: opts.type } : {}),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  /** Innlogget admin som skal stå som avsender på personkortet (undefined uten Firestore-profil). */
  const adminActor = (): { rolle: string; navn: string } | undefined => {
    const p = firestore.firestoreUserProfile;
    if (!p) return undefined;
    return { rolle: 'Administrator (Norge)', navn: p.displayName || p.email || '' };
  };

  /** Finner personen (koordinator eller fadder) en userDirectory-rad hører til: først på id, så på e-post. */
  const resolvePersonForEmail = (
    email: string,
    ids: { coordinatorId?: string; sponsorId?: string } = {}
  ): PersonLogSubject | undefined => {
    if (ids.coordinatorId) {
      const c = coordinators.find((x) => x.id === ids.coordinatorId);
      if (c) return coordinatorSubject(c);
    }
    if (ids.sponsorId) {
      const sp = sponsors.find((x) => x.id === ids.sponsorId);
      if (sp) return sponsorSubject(sp);
    }
    const e = email.trim().toLowerCase();
    const c = coordinators.find((x) => x.epost?.trim().toLowerCase() === e);
    if (c) return coordinatorSubject(c);
    const sp = sponsors.find((x) => x.epost?.trim().toLowerCase() === e);
    if (sp) return sponsorSubject(sp);
    return undefined;
  };

  const inviteUserToDirectory = async (entry: FirestoreUserDirectoryEntry) => {
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
    const email = entry.email.trim().toLowerCase();
    const subject = resolvePersonForEmail(email, entry);
    if (subject) {
      addAuditLog('Invitert til innlogging', `${email} (${entry.role}) er invitert.`, adminActor(), subject);
    }
  };

  const updateUserDirectoryStatus = async (email: string, status: FirestoreUserDirectoryEntry['status']) => {
    if (!db) throw new Error('Firestore er ikke konfigurert');
    if (firestore.firestoreUserProfile?.role !== 'admin') {
      throw new Error('Bare administrator kan endre brukerstatus');
    }
    const id = email.trim().toLowerCase();
    const rows = await listUserDirectoryEntries(db);
    const forrige = rows.find((r) => r.email === id);
    await persistUserDirectoryStatus(db, email, status);
    const subject = resolvePersonForEmail(id, forrige);
    if (subject) {
      const fra = forrige ? normalizeUserDirectoryStatus(forrige.status) : '(ingen)';
      addAuditLog(
        'Endret innloggingsstatus',
        `${fra} → ${normalizeUserDirectoryStatus(status)}.`,
        adminActor(),
        subject
      );
    }
  };

  /** userDirectory-rader som hører til en person (på id, eller på e-post hvis oppgitt). Tom uten Firestore. */
  const directoryRowsForPerson = async (
    subject: PersonLogSubject,
    personEmail?: string
  ): Promise<{ email: string; status: 'aktiv' | 'invitert' | 'sperret' }[]> => {
    if (!db) return [];
    const rows = await listUserDirectoryEntries(db);
    const epost = personEmail?.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (epost && r.email === epost) return true;
        if (subject.type === 'coordinator') return r.coordinatorId === subject.id;
        if (subject.type === 'sponsor') return r.sponsorId === subject.id;
        return r.email === subject.id;
      })
      .map((r) => ({ email: r.email, status: normalizeUserDirectoryStatus(r.status) }));
  };

  /** Setter status på en userDirectory-rad uten egen logg (personkortet logger selv). */
  const setDirectoryStatusForEmail = async (email: string, status: 'aktiv' | 'sperret') => {
    if (!db) return;
    if (firestore.firestoreUserProfile?.role !== 'admin') {
      throw new Error('Bare administrator kan endre brukerstatus');
    }
    await persistUserDirectoryStatus(db, email, status);
  };

  /** Sletter en userDirectory-rad uten egen logg (brukes ved sletting av person). */
  const deleteDirectoryForEmail = async (email: string) => {
    if (!db) return;
    if (firestore.firestoreUserProfile?.role !== 'admin') {
      throw new Error('Bare administrator kan slette brukere');
    }
    await deleteUserDirectoryEntry(db, email);
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

  return {
    role,
    setRole,
    language,
    setLanguage,
    setLanguageState,
    t,
    currentSponsorId,
    setCurrentSponsorId,
    currentCoordinatorId,
    setCurrentCoordinatorId,
    currentSponsor,
    currentCoordinator,
    coordinatorChildren,
    currentRoleNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    enterPortalFromProfile,
    inviteUserToDirectory,
    updateUserDirectoryStatus,
    addAuditLog,
    adminActor,
    directoryRowsForPerson,
    setDirectoryStatusForEmail,
    deleteDirectoryForEmail,
    addEmailOutboxItem,
    updateEmailOutboxItem,
    setEmailAutoSendEvent,
    queueSponsorSystemEmail,
  };
}
