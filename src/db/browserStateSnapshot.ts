import type {
  AdultGraduateStory,
  AuditLogItem,
  Campaign,
  CatalogPhoto,
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
import { liveLaunchContent } from './liveLaunchContent';

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
    coordinators: liveLaunchContent.coordinators,
    children: readJson<Child[]>('children') ?? liveLaunchContent.children,
    sponsors: readJson<Sponsor[]>('sponsors') ?? liveLaunchContent.sponsors,
    catalogPhotos: readJson<CatalogPhoto[]>('catalogPhotos') ?? liveLaunchContent.catalogPhotos,
    facts: readJson<FieldFact[]>('fieldFacts') ?? liveLaunchContent.facts,
    reports: readJson<Report[]>('reports') ?? liveLaunchContent.reports,
    milestones: readJson<ChildMilestone[]>('milestones') ?? liveLaunchContent.milestones,
    inquiries: readJson<Inquiry[]>('inquiries') ?? liveLaunchContent.inquiries,
    payments: readJson<PaymentRecord[]>('payments') ?? liveLaunchContent.payments,
    campaigns: readJson<Campaign[]>('campaigns') ?? liveLaunchContent.campaigns,
    testimonials: readJson<AdultGraduateStory[]>('stories') ?? liveLaunchContent.testimonials,
    notifications: readJson<AppNotification[]>('notifications') ?? liveLaunchContent.notifications,
    auditLogs: readJson<AuditLogItem[]>('auditLogs') ?? liveLaunchContent.auditLogs,
    cms: readJson<CmsContent>('cms') ?? liveLaunchContent.cms,
    emailOutbox: readJson<EmailOutboxItem[]>('emailOutbox') ?? [],
    emailAutoSend: readJson<EmailAutoSendPrefs>('emailAutoSend') ?? liveLaunchContent.emailAutoSend,
    language: readJson<string>('language') ?? 'no',
  };
}
