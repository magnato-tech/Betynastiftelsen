/**
 * Innholdet som ligger på nettsiden nå, frosset som ekte lanseringsdata.
 * Admin bytter ut felt i CMS/database. Denne filen skal ikke oppdateres
 * for å «fikse mock» — det ville endre det besøkende ser.
 */
import {
  INITIAL_AUDIT_LOG,
  INITIAL_CAMPAIGNS,
  INITIAL_CATALOG_PHOTOS,
  INITIAL_CHILDREN,
  INITIAL_CMS_CONTENT,
  INITIAL_COORDINATORS,
  INITIAL_FACTS,
  INITIAL_INQUIRIES,
  INITIAL_MILESTONES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENTS,
  INITIAL_REPORTS,
  INITIAL_SPONSORS,
  INITIAL_STORIES,
} from '../data/initialData';
import { DEFAULT_EMAIL_AUTO_SEND } from '../email/autoSendPrefs';

export const LIVE_LAUNCH_VERSION = '2026-10-15-live';

export const liveLaunchContent = {
  coordinators: INITIAL_COORDINATORS,
  sponsors: INITIAL_SPONSORS,
  children: INITIAL_CHILDREN,
  catalogPhotos: INITIAL_CATALOG_PHOTOS,
  facts: INITIAL_FACTS,
  reports: INITIAL_REPORTS,
  milestones: INITIAL_MILESTONES,
  inquiries: INITIAL_INQUIRIES,
  payments: INITIAL_PAYMENTS,
  campaigns: INITIAL_CAMPAIGNS,
  testimonials: INITIAL_STORIES,
  notifications: INITIAL_NOTIFICATIONS,
  auditLogs: INITIAL_AUDIT_LOG,
  cms: INITIAL_CMS_CONTENT,
  emailAutoSend: DEFAULT_EMAIL_AUTO_SEND,
};

export type LiveLaunchContent = typeof liveLaunchContent;
