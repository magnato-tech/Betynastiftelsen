/**
 * Appen har ingen innebygde data. Før databasen har svart er alt tomt.
 * Innholdet (tekster, barn, faddere osv.) leses bare fra Firestore.
 */
import { DEFAULT_EMAIL_AUTO_SEND } from '../email/autoSendPrefs';
import { EMPTY_CMS_CONTENT } from './seedPolicy';
import type { AppDataSnapshot } from './appDataSnapshot';

export const EMPTY_APP_CONTENT: Omit<AppDataSnapshot, 'language'> = {
  coordinators: [],
  sponsors: [],
  children: [],
  catalogPhotos: [],
  mediaLibrary: [],
  facts: [],
  reports: [],
  milestones: [],
  inquiries: [],
  payments: [],
  campaigns: [],
  testimonials: [],
  notifications: [],
  auditLogs: [],
  cms: EMPTY_CMS_CONTENT,
  emailOutbox: [],
  emailAutoSend: DEFAULT_EMAIL_AUTO_SEND,
};
