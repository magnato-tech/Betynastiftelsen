import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EMAIL_AUTO_SEND,
  isEmailAutoSendOn,
  migrateEmailAutoSend,
} from './autoSendPrefs';

describe('E-post: hva som sendes automatisk', () => {
  it('har svar på spørsmål på, resten av', () => {
    expect(DEFAULT_EMAIL_AUTO_SEND.inquiry_answered).toBe(true);
    expect(DEFAULT_EMAIL_AUTO_SEND.report_approved).toBe(false);
    expect(DEFAULT_EMAIL_AUTO_SEND.sponsor_welcome).toBe(false);
    expect(DEFAULT_EMAIL_AUTO_SEND.payment_registered).toBe(false);
  });

  it('tom lagring gir standard', () => {
    expect(migrateEmailAutoSend(null).inquiry_answered).toBe(true);
    expect(migrateEmailAutoSend({}).report_approved).toBe(false);
  });

  it('respekterer lagrede av/på-valg', () => {
    const prefs = migrateEmailAutoSend({
      inquiry_answered: false,
      report_approved: true,
    });
    expect(isEmailAutoSendOn(prefs, 'inquiry_answered')).toBe(false);
    expect(isEmailAutoSendOn(prefs, 'report_approved')).toBe(true);
    expect(isEmailAutoSendOn(prefs, 'magic_link')).toBe(false);
  });
});
