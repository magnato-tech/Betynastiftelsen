import type {
  AdultGraduateStory,
  AuditLogItem,
  Campaign,
  CatalogPhoto,
  MediaLibraryItem,
  Child,
  ChildMilestone,
  CmsContent,
  Coordinator,
  EmailOutboxItem,
  FieldFact,
  Inquiry,
  PaymentRecord,
  Report,
  Sponsor,
  AppNotification,
} from '../types';
import type { EmailAutoSendPrefs } from '../email/autoSendPrefs';
import { EMPTY_APP_CONTENT } from './emptyContent';

export const BROWSER_STORAGE_PREFIX = 'betyna_v1_';

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(BROWSER_STORAGE_PREFIX + key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** Alt som ligger i nettleseren nå (localStorage + koordinatorliste). */
import type { AppDataSnapshot } from './appDataSnapshot';

export function readBrowserStateSnapshot(): AppDataSnapshot {
  return {
    coordinators: EMPTY_APP_CONTENT.coordinators,
    children: readJson<Child[]>('children') ?? EMPTY_APP_CONTENT.children,
    sponsors: readJson<Sponsor[]>('sponsors') ?? EMPTY_APP_CONTENT.sponsors,
    catalogPhotos: readJson<CatalogPhoto[]>('catalogPhotos') ?? EMPTY_APP_CONTENT.catalogPhotos,
    mediaLibrary: readJson<MediaLibraryItem[]>('mediaLibrary') ?? EMPTY_APP_CONTENT.mediaLibrary,
    facts: readJson<FieldFact[]>('fieldFacts') ?? EMPTY_APP_CONTENT.facts,
    reports: readJson<Report[]>('reports') ?? EMPTY_APP_CONTENT.reports,
    milestones: readJson<ChildMilestone[]>('milestones') ?? EMPTY_APP_CONTENT.milestones,
    inquiries: readJson<Inquiry[]>('inquiries') ?? EMPTY_APP_CONTENT.inquiries,
    payments: readJson<PaymentRecord[]>('payments') ?? EMPTY_APP_CONTENT.payments,
    sponsorAssignments: readJson('sponsorAssignments') ?? EMPTY_APP_CONTENT.sponsorAssignments,
    recurringCharges: readJson('recurringCharges') ?? EMPTY_APP_CONTENT.recurringCharges,
    paymentAllocations: readJson('paymentAllocations') ?? EMPTY_APP_CONTENT.paymentAllocations,
    campaigns: readJson<Campaign[]>('campaigns') ?? EMPTY_APP_CONTENT.campaigns,
    testimonials: readJson<AdultGraduateStory[]>('stories') ?? EMPTY_APP_CONTENT.testimonials,
    notifications: readJson<AppNotification[]>('notifications') ?? EMPTY_APP_CONTENT.notifications,
    auditLogs: readJson<AuditLogItem[]>('auditLogs') ?? EMPTY_APP_CONTENT.auditLogs,
    cms: readJson<CmsContent>('cms') ?? EMPTY_APP_CONTENT.cms,
    emailOutbox: readJson<EmailOutboxItem[]>('emailOutbox') ?? [],
    emailAutoSend: readJson<EmailAutoSendPrefs>('emailAutoSend') ?? EMPTY_APP_CONTENT.emailAutoSend,
    language: readJson<string>('language') ?? 'no',
  };
}
