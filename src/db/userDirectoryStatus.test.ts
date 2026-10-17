import { describe, expect, it } from 'vitest';
import { canLoginWithDirectoryStatus, normalizeUserDirectoryStatus } from './userDirectoryStatus';

describe('userDirectoryStatus', () => {
  it('mangler status behandles som aktiv', () => {
    expect(normalizeUserDirectoryStatus(undefined)).toBe('aktiv');
  });

  it('invitert og aktiv kan logge inn', () => {
    expect(canLoginWithDirectoryStatus('invitert')).toBe(true);
    expect(canLoginWithDirectoryStatus('aktiv')).toBe(true);
  });

  it('sperret kan ikke logge inn', () => {
    expect(canLoginWithDirectoryStatus('sperret')).toBe(false);
  });
});
