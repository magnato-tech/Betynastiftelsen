import { describe, expect, it } from 'vitest';
import { makeCampaign, makePayment } from '../test/testData';
import { isClassBookCampaign, migrateCampaignPayments, migrateCampaigns } from '../utils/campaignMigrate';

const classBooks = makeCampaign({
  id: 'camp-books',
  tittel: 'Felles lærebøker og regneregler for barnetrinnet',
  beskrivelse: 'Innkjøp av 40 offisielt godkjente lærebøker.',
  enhetBeskrivelse: '40 bøker + frakt',
  status: 'fullfort',
  barnIds: [],
});

describe('Aksjoner knyttet til barn', () => {
  it('kjenner igjen innsamling til bøker for skoleklasser', () => {
    expect(isClassBookCampaign(classBooks)).toBe(true);
    expect(isClassBookCampaign(makeCampaign({ tittel: 'Symaskiner til jenter' }))).toBe(false);
  });

  it('fjerner klassebok-aksjon, men beholder andre aksjoner', () => {
    const real = makeCampaign({ id: 'camp-real', tittel: 'Symaskiner til jenter' });
    expect(migrateCampaigns([real, classBooks])).toEqual([real]);
  });

  it('fjerner betalinger til fjernede klassebok-aksjoner', () => {
    const real = makeCampaign({ id: 'camp-real', tittel: 'Symaskiner til jenter' });
    const keep = makePayment({ id: 'p1', type: 'aksjon', aksjonId: 'camp-real', aksjonTittel: real.tittel });
    const drop = makePayment({
      id: 'p2',
      type: 'aksjon',
      aksjonId: 'camp-books',
      aksjonTittel: 'Felles lærebøker',
    });
    const sponsorPay = makePayment({ id: 'p3', type: 'fadderbidrag' });
    expect(migrateCampaignPayments([keep, drop, sponsorPay], [real]).map((p) => p.id)).toEqual(['p1', 'p3']);
  });
});
