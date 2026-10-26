import type React from 'react';
import type {
  Child,
  Report,
  Sponsor,
  Inquiry,
  PaymentRecord,
  Campaign,
  AdultGraduateStory,
  CmsContent,
  ChildMilestone,
  Coordinator,
  FieldFact,
  CatalogPhoto,
  MediaLibraryItem,
  AppNotification,
  EmailOutboxItem,
} from '../types';
import type { SeedLock } from '../db/seedPolicy';
import { contentIsLocked } from '../db/seedPolicy';
import { coordinatorDisplayName } from '../utils/coordinatorDisplay';
import { addChildId, childIdsOfSponsor, removeChildId } from '../utils/sponsorChildren';
import { buildFieldFact } from '../utils/fieldFacts';
import { deletePublicMediaFile, publicMediaObjectPath, uploadPublicMediaFile } from '../db/publicMediaStorage';
import { readImageFileAsDataUrl } from '../utils/readImageFile';
import { storage as firebaseStorage } from '../config/firebase';
import type { SystemTemplateId } from '../email/templates';
import type { PaymentAllocation, PersonLogSubject, RecurringCharge } from '../types';
import { coordinatorSubject, sponsorSubject } from '../utils/personLog';
import { assertNotAdmin, describeChanges, validateDeletePerson } from '../utils/personActions';
import { linksToCoordinator, linksToSponsor } from '../utils/dataIntegrity';
import { plainTextToHtml } from '../utils/sponsorOnboarding';
import { postBetynaEmail } from '../email/client';
import type { FirestoreUserDirectoryEntry } from '../db/firestoreProfile';

export type AppActionsDeps = {
  contentLock: SeedLock | null;
  childrenList: Child[];
  setChildrenList: React.Dispatch<React.SetStateAction<Child[]>>;
  sponsors: Sponsor[];
  setSponsors: React.Dispatch<React.SetStateAction<Sponsor[]>>;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  milestones: ChildMilestone[];
  setMilestones: React.Dispatch<React.SetStateAction<ChildMilestone[]>>;
  inquiries: Inquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  payments: PaymentRecord[];
  setPayments: React.Dispatch<React.SetStateAction<PaymentRecord[]>>;
  sponsorAssignments: import('../types').SponsorAssignment[];
  setSponsorAssignments: React.Dispatch<React.SetStateAction<import('../types').SponsorAssignment[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  stories: AdultGraduateStory[];
  setStories: React.Dispatch<React.SetStateAction<AdultGraduateStory[]>>;
  catalogPhotos: CatalogPhoto[];
  setCatalogPhotos: React.Dispatch<React.SetStateAction<CatalogPhoto[]>>;
  mediaLibrary: MediaLibraryItem[];
  setMediaLibrary: React.Dispatch<React.SetStateAction<MediaLibraryItem[]>>;
  cmsContent: CmsContent;
  setCmsContent: React.Dispatch<React.SetStateAction<CmsContent>>;
  fieldFacts: FieldFact[];
  setFieldFacts: React.Dispatch<React.SetStateAction<FieldFact[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  coordinators: Coordinator[];
  setCoordinators: React.Dispatch<React.SetStateAction<Coordinator[]>>;
  recurringCharges: RecurringCharge[];
  paymentAllocations: PaymentAllocation[];
  currentCoordinatorId: string;
  currentSponsor: Sponsor | undefined;
  currentCoordinator: Coordinator | undefined;
  addAuditLog: (
    handling: string,
    detaljer: string,
    actor?: { rolle: string; navn: string },
    subject?: PersonLogSubject,
    opts?: { type?: 'hendelse' | 'kommentar' }
  ) => void;
  /** Innlogget admin som avsender i personkortet (undefined uten Firestore-profil). */
  adminActor: () => { rolle: string; navn: string } | undefined;
  /** userDirectory-rader som hører til en person (tom liste uten Firestore). */
  directoryRowsForPerson: (
    subject: PersonLogSubject,
    personEmail?: string
  ) => Promise<{ email: string; status: 'aktiv' | 'invitert' | 'sperret' }[]>;
  setDirectoryStatusForEmail: (email: string, status: 'aktiv' | 'sperret') => Promise<void>;
  deleteDirectoryForEmail: (email: string) => Promise<void>;
  queueSponsorSystemEmail: (templateId: SystemTemplateId, sponsor: Sponsor | undefined, relatedId: string) => void;
  inviteUserToDirectory: (entry: FirestoreUserDirectoryEntry) => Promise<void>;
  addEmailOutboxItem: (item: Omit<EmailOutboxItem, 'id' | 'createdAt'>) => EmailOutboxItem;
  updateEmailOutboxItem: (id: string, updates: Partial<EmailOutboxItem>) => void;
};

export function createAppActions(deps: AppActionsDeps) {
  const {
    contentLock,
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
    campaigns,
    setCampaigns,
    stories,
    setStories,
    catalogPhotos,
    setCatalogPhotos,
    mediaLibrary,
    setMediaLibrary,
    cmsContent,
    setCmsContent,
    fieldFacts,
    setFieldFacts,
    notifications,
    setNotifications,
    coordinators,
    setCoordinators,
    recurringCharges,
    paymentAllocations,
    currentCoordinatorId,
    currentSponsor,
    currentCoordinator,
    addAuditLog,
    adminActor,
    directoryRowsForPerson,
    setDirectoryStatusForEmail,
    deleteDirectoryForEmail,
    queueSponsorSystemEmail,
    inviteUserToDirectory,
    addEmailOutboxItem,
    updateEmailOutboxItem,
  } = deps;

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

  /** Markerer admin-varsler om en sak som lest når saken er behandlet (varslene slettes ikke). */
  const markAdminNotificationsForEntityRead = (entityId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.relatedEntityId === entityId && n.targetRole === 'admin' ? { ...n, read: true } : n))
    );
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
    markAdminNotificationsForEntityRead(factId);
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
        if (s.id === sponsorId) {
          // Godkjent fadder som får barn går videre til «barn tildelt».
          const avansert =
            s.onboarding?.steg === 'godkjent' ? { onboarding: { ...s.onboarding, steg: 'barn_tildelt' as const } } : {};
          return { ...s, tildeltBarnIds: addChildId(ids, childId), ...avansert };
        }
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
    markAdminNotificationsForEntityRead(id);

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
    markAdminNotificationsForEntityRead(id);
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

  const uploadMediaLibraryItem = async (file: File, label?: string): Promise<{ id: string; url: string }> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Kun bildefiler kan lastes opp');
    }
    const id = `media-${Date.now()}`;
    const displayLabel = label?.trim() || file.name.replace(/\.[^.]+$/, '') || 'Bilde';
    let url: string;
    let storagePath: string | undefined;
    if (firebaseStorage) {
      storagePath = publicMediaObjectPath(id, file.name);
      url = await uploadPublicMediaFile(file, storagePath);
    } else {
      url = await readImageFileAsDataUrl(file);
      if (url.length > 900_000) {
        throw new Error('Bildet er for stort uten Firebase Storage. Konfigurer Storage eller bruk mindre fil.');
      }
    }
    const entry: MediaLibraryItem = {
      id,
      label: displayLabel,
      url,
      storagePath,
      uploadedAt: new Date().toISOString(),
      sizeBytes: file.size,
    };
    setMediaLibrary((prev) => [entry, ...prev]);
    addAuditLog('La til mediabilde', `${displayLabel} (${id})`);
    return { id, url };
  };

  const deleteMediaLibraryItem = async (id: string): Promise<void> => {
    const item = mediaLibrary.find((m) => m.id === id);
    if (!item) return;
    if (item.storagePath) {
      await deletePublicMediaFile(item.storagePath);
    }
    setMediaLibrary((prev) => prev.filter((m) => m.id !== id));
    addAuditLog('Slettet mediabilde', `${item.label} (${id})`);
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
      onboarding: { steg: 'ny' },
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
      // Venter: beløpet er ikke betalt før det er registrert/trukket.
      status: 'forventet',
      referanse: `${data.betalingsmetode.toUpperCase()}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPayments((prev) => [newPayment, ...prev]);

    addAuditLog(
      'Ny fadderregistrering',
      `${data.navn} meldte interesse via nettsiden (${data.maanedsbelop} kr/mnd). Admin må koble barn manuelt.`
    );

    return newSponsorId;
  };

  const nåDato = () => new Date().toISOString().slice(0, 10);

  /** Admin godkjenner ny fadder fra nettsiden. Neste steg er å tildele barn. */
  const approveSponsorOnboarding = (sponsorId: string) => {
    const s = sponsors.find((x) => x.id === sponsorId);
    if (!s) return;
    setSponsors((prev) =>
      prev.map((x) =>
        x.id === sponsorId ? { ...x, onboarding: { ...x.onboarding, steg: 'godkjent', godkjentDato: nåDato() } } : x
      )
    );
    addAuditLog('Fadder godkjent', `${s.navn} er godkjent. Neste steg: tildel barn.`, adminActor(), sponsorSubject(s));
  };

  /** Admin avviser en påmelding: steget settes til avvist, og fadderen arkiveres (samme som avslutt). */
  const rejectSponsorOnboarding = async (sponsorId: string) => {
    const s = sponsors.find((x) => x.id === sponsorId);
    if (!s) return;
    setSponsors((prev) =>
      prev.map((x) => (x.id === sponsorId ? { ...x, onboarding: { ...x.onboarding, steg: 'avvist' } } : x))
    );
    addAuditLog('Fadderpåmelding avvist', `${s.navn} ble avvist og arkivert.`, adminActor(), sponsorSubject(s));
    await deactivatePerson(sponsorSubject(s));
  };

  /** Tildeler barn i onboarding. Går til «barn tildelt», med mindre fadderen allerede er invitert, ferdig eller avvist. */
  const assignChildInOnboarding = (sponsorId: string, childId: string) => {
    assignSponsorToChild(childId, sponsorId);
    setSponsors((prev) =>
      prev.map((x) => {
        if (x.id !== sponsorId) return x;
        const steg = x.onboarding?.steg;
        if (steg === 'invitert' || steg === 'ferdig' || steg === 'avvist') return x;
        return { ...x, onboarding: { ...x.onboarding, steg: 'barn_tildelt' } };
      })
    );
  };

  /**
   * Sender velkomst-e-posten (redigert utkast) og gir innlogging. Ved 503 (e-post ikke satt opp)
   * ligger e-posten i køen og steget blir værende på «barn tildelt».
   */
  const sendSponsorWelcome = async (
    sponsorId: string,
    mail: { subject: string; body: string }
  ): Promise<{ sent: boolean; message: string }> => {
    const s = sponsors.find((x) => x.id === sponsorId);
    if (!s) return { sent: false, message: 'Fant ikke fadderen.' };
    const epost = s.epost.trim().toLowerCase();
    const row = addEmailOutboxItem({
      kind: 'system',
      subject: mail.subject,
      body: plainTextToHtml(mail.body),
      toEmails: [epost],
      relatedId: s.id,
      templateId: 'sponsor_invitation',
      status: 'venter_nøkkel',
      note: 'Velkomst-e-post fra onboarding.',
    });
    try {
      // Innlogging gis bare hvis personen ikke allerede har en rad i userDirectory.
      const eksisterende = await directoryRowsForPerson(sponsorSubject(s), epost);
      if (eksisterende.length === 0) {
        await inviteUserToDirectory({ email: epost, role: 'sponsor', sponsorId: s.id, displayName: s.navn });
      }
      const { status, json } = await postBetynaEmail({
        kind: 'system',
        subject: mail.subject,
        html: row.body,
        emails: [epost],
        relatedId: s.id,
        templateId: 'sponsor_invitation',
      });
      if (status === 200 && json.ok) {
        updateEmailOutboxItem(row.id, { status: 'sendt', note: json.id ? `Resend ${json.id}` : 'Sendt' });
        const nå = new Date().toISOString();
        setSponsors((prev) =>
          prev.map((x) =>
            x.id === sponsorId ? { ...x, onboarding: { ...x.onboarding, steg: 'invitert', invitasjonSendt: nå } } : x
          )
        );
        addAuditLog('Velkomst-e-post sendt', `Til ${epost}. Innlogging er gitt.`, adminActor(), sponsorSubject(s));
        return { sent: true, message: `Velkomst-e-post sendt til ${epost}` };
      }
      if (status === 503) {
        // E-post ikke satt opp: e-posten venter i køen, og innlogging er gitt.
        return {
          sent: false,
          message:
            'E-posttjenesten er ikke satt opp. E-posten ligger i e-postkøen (Innstillinger → E-post). Innlogging er gitt.',
        };
      }
      updateEmailOutboxItem(row.id, { status: 'feilet', note: json.message });
      return { sent: false, message: json.message || 'Kunne ikke sende e-posten.' };
    } catch (e) {
      const melding = e instanceof Error ? e.message : 'Kunne ikke sende e-posten.';
      updateEmailOutboxItem(row.id, { status: 'feilet', note: melding });
      return { sent: false, message: melding };
    }
  };

  /** Fadderen har logget inn første gang (userDirectory er 'aktiv'). Onboarding er ferdig. */
  const markSponsorOnboardingDone = (sponsorId: string) => {
    const s = sponsors.find((x) => x.id === sponsorId);
    if (!s) return;
    setSponsors((prev) =>
      prev.map((x) => (x.id === sponsorId ? { ...x, onboarding: { ...x.onboarding, steg: 'ferdig', ferdigDato: nåDato() } } : x))
    );
    addAuditLog('Onboarding fullført', `${s.navn} har logget inn for første gang.`, adminActor(), sponsorSubject(s));
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

  // Personkort (admin): redigering, avslutning/gjenåpning, sletting og logg per person.

  const updateCoordinator = (id: string, patch: Partial<Coordinator>) => {
    const before = coordinators.find((c) => c.id === id);
    if (!before) return;
    const { id: _ignoredId, ...endringer } = patch;
    const linjer = describeChanges(before, endringer);
    setCoordinators((prev) => prev.map((c) => (c.id === id ? { ...c, ...endringer } : c)));
    if (linjer.length > 0) {
      addAuditLog(
        'Endret opplysninger',
        linjer.join('; '),
        adminActor(),
        coordinatorSubject({ ...before, ...endringer })
      );
    }
  };

  const updateSponsor = (id: string, patch: Partial<Sponsor>) => {
    const before = sponsors.find((s) => s.id === id);
    if (!before) return;
    const { id: _ignoredId, ...endringer } = patch;
    const linjer = describeChanges(before, endringer);
    setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, ...endringer } : s)));
    if (linjer.length > 0) {
      addAuditLog('Endret opplysninger', linjer.join('; '), adminActor(), sponsorSubject({ ...before, ...endringer }));
    }
  };

  const addPersonComment = (subject: PersonLogSubject, tekst: string) => {
    const t = tekst.trim();
    if (!t) return;
    addAuditLog('Kommentar', t, adminActor(), subject, { type: 'kommentar' });
  };

  /** Finner e-posten til personen, som brukes til å matche userDirectory. Kaster hvis personen ikke finnes. */
  const epostTilPerson = (subject: PersonLogSubject): string | undefined => {
    if (subject.type === 'coordinator') {
      const c = coordinators.find((x) => x.id === subject.id);
      if (!c) throw new Error('Fant ikke koordinatoren.');
      return c.epost;
    }
    const s = sponsors.find((x) => x.id === subject.id);
    if (!s) throw new Error('Fant ikke fadderen.');
    return s.epost;
  };

  /**
   * Avslutter (aktiv=false) eller gjenåpner (aktiv=true) en koordinator eller fadder.
   * Innlogging sperres ved avslutning. Ved gjenåpning settes bare rader som er sperret tilbake til aktiv.
   * Fadderens avslutning lagres som `avsluttet` (dato). Betalingsstatus 'pause' brukes ikke til dette.
   */
  const setPersonAktiv = async (subject: PersonLogSubject, aktiv: boolean) => {
    assertNotAdmin(subject);
    const epost = epostTilPerson(subject);
    const rows = await directoryRowsForPerson(subject, epost);
    const berørte = aktiv ? rows.filter((r) => r.status === 'sperret') : rows.filter((r) => r.status !== 'sperret');
    // Innloggingsradene først: feiler de (f.eks. ikke admin), endres ingenting annet.
    for (const r of berørte) {
      await setDirectoryStatusForEmail(r.email, aktiv ? 'aktiv' : 'sperret');
    }
    if (subject.type === 'coordinator') {
      setCoordinators((prev) => prev.map((c) => (c.id === subject.id ? { ...c, aktiv } : c)));
    } else {
      const idag = new Date().toISOString().slice(0, 10);
      setSponsors((prev) =>
        prev.map((s) => {
          if (s.id !== subject.id) return s;
          if (aktiv) {
            const { avsluttet: _fjernet, ...gjenstår } = s;
            return gjenstår;
          }
          return { ...s, avsluttet: idag };
        })
      );
    }
    const innlogging =
      berørte.length > 0 ? ` Innlogging ${aktiv ? 'åpnet' : 'sperret'} for ${berørte.length} bruker(e).` : '';
    addAuditLog(
      aktiv ? 'Gjenåpnet' : 'Avsluttet',
      `${subject.navn} er ${aktiv ? 'gjenåpnet' : 'avsluttet'}.${innlogging}`,
      adminActor(),
      subject
    );
  };

  const deactivatePerson = (subject: PersonLogSubject) => setPersonAktiv(subject, false);
  const reactivatePerson = (subject: PersonLogSubject) => setPersonAktiv(subject, true);

  /**
   * Sletter en koordinator eller fadder. Krever at confirmName er fullt navn, og at personen
   * ikke har koblinger (barn, rapporter, betalinger osv.). Kaster Error ved brudd, før noe endres.
   */
  const deletePerson = async (subject: PersonLogSubject, confirmName: string) => {
    assertNotAdmin(subject);
    const snapshot = {
      coordinators,
      children: childrenList,
      sponsors,
      reports,
      facts: fieldFacts,
      milestones,
      inquiries,
      payments,
      sponsorAssignments,
      campaigns,
      recurringCharges,
      paymentAllocations,
    };
    let navn: string;
    let epost: string | undefined;
    let links;
    if (subject.type === 'coordinator') {
      const c = coordinators.find((x) => x.id === subject.id);
      if (!c) throw new Error('Fant ikke koordinatoren.');
      navn = coordinatorSubject(c).navn;
      epost = c.epost;
      links = linksToCoordinator(snapshot, c.id);
    } else {
      const s = sponsors.find((x) => x.id === subject.id);
      if (!s) throw new Error('Fant ikke fadderen.');
      navn = s.navn;
      epost = s.epost;
      links = linksToSponsor(snapshot, s.id);
    }
    validateDeletePerson({ navn, confirmName, links });

    const rows = await directoryRowsForPerson(subject, epost);
    for (const r of rows) {
      await deleteDirectoryForEmail(r.email);
    }
    if (subject.type === 'coordinator') {
      setCoordinators((prev) => prev.filter((c) => c.id !== subject.id));
    } else {
      setSponsors((prev) => prev.filter((s) => s.id !== subject.id));
    }
    addAuditLog(
      'Slettet',
      `${navn} ble slettet.${rows.length > 0 ? ` ${rows.length} innloggingsrad(er) fjernet.` : ''}`,
      adminActor(),
      { type: subject.type, id: subject.id, navn }
    );
  };

  return {
    updateCoordinator,
    updateSponsor,
    addPersonComment,
    deactivatePerson,
    reactivatePerson,
    deletePerson,
    addChild,
    updateChild,
    assignSponsorToChild,
    endSponsorship,
    submitFieldFact,
    publishChildStory,
    submitReport,
    approveReport,
    rejectReport,
    submitChildPhoto,
    approveChildPhoto,
    rejectChildPhoto,
    addCatalogPhoto,
    updateCatalogPhoto,
    uploadMediaLibraryItem,
    deleteMediaLibraryItem,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    submitInquiry,
    answerInquiry,
    forwardInquiryToCoordinator,
    coordinatorReplyToInquiry,
    registerNewSponsorInterest,
    approveSponsorOnboarding,
    rejectSponsorOnboarding,
    assignChildInOnboarding,
    sendSponsorWelcome,
    markSponsorOnboardingDone,
    addSponsor,
    donateToCampaign,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    reconcilePayment,
    updateCmsSection,
    resetCmsSection,
    resetAllCms,
    addStory,
    updateStory,
    deleteStory,
  };
}
