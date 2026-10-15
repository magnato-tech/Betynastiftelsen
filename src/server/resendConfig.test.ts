import { describe, expect, it } from 'vitest';
import { resendConfigStatus } from './resendConfig';

describe('Resend-konfigurasjon', () => {
  it('er ikke koplet uten nøkkel', () => {
    expect(resendConfigStatus({}).configured).toBe(false);
  });

  it('er koplet når RESEND_API_KEY finnes', () => {
    const s = resendConfigStatus({
      RESEND_API_KEY: 're_test',
      EMAIL_FROM: 'Betyna <varsel@betyna.no>',
    });
    expect(s.configured).toBe(true);
    expect(s.from).toContain('varsel@betyna.no');
  });
});
