import type { Campaign, PaymentRecord } from '../types';

const CLASS_BOOK_CAMPAIGN =
  /lærebøker|regneregler|40 bøker|felles lærebok|katalogisering/i;

export function isClassBookCampaign(camp: Campaign): boolean {
  return CLASS_BOOK_CAMPAIGN.test(
    `${camp.tittel} ${camp.beskrivelse} ${camp.enhetBeskrivelse ?? ''} ${camp.sluttrapport ?? ''}`
  );
}

export function migrateCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter((c) => !isClassBookCampaign(c));
}

export function migrateCampaignPayments(payments: PaymentRecord[], campaigns: Campaign[]): PaymentRecord[] {
  const ids = new Set(campaigns.map((c) => c.id));
  return payments.filter((p) => {
    if (p.type !== 'aksjon') return true;
    if (p.aksjonId && !ids.has(p.aksjonId) && CLASS_BOOK_CAMPAIGN.test(p.aksjonTittel ?? '')) return false;
    if (!p.aksjonId && CLASS_BOOK_CAMPAIGN.test(p.aksjonTittel ?? '')) return false;
    return true;
  });
}
