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

export interface AppDataSnapshot {
  coordinators: Coordinator[];
  children: Child[];
  sponsors: Sponsor[];
  catalogPhotos: CatalogPhoto[];
  mediaLibrary: MediaLibraryItem[];
  facts: FieldFact[];
  reports: Report[];
  milestones: ChildMilestone[];
  inquiries: Inquiry[];
  payments: PaymentRecord[];
  campaigns: Campaign[];
  testimonials: AdultGraduateStory[];
  notifications: AppNotification[];
  auditLogs: AuditLogItem[];
  cms: CmsContent;
  emailOutbox: EmailOutboxItem[];
  emailAutoSend: EmailAutoSendPrefs;
  language: string;
}
