import { describe, expect, it } from 'vitest';
import { composeSystemEmail } from './composeSystemEmail';
import { parseEmailPayload } from './payload';
import { portalSectionForTemplate } from './autoSendPrefs';
import { fillTemplate, SYSTEM_EMAIL_TEMPLATES, type SystemTemplateId } from './templates';

const IDS: SystemTemplateId[] = ['sponsor_welcome', 'report_approved', 'inquiry_answered', 'payment_registered', 'magic_link', 'sponsor_invitation'];

describe('e-postmaler', () => {
  it('har de seks forventede malene, uten duplikater', () => {
    expect(SYSTEM_EMAIL_TEMPLATES.map((t) => t.id).sort()).toEqual([...IDS].sort());
  });
  it.each(IDS)('%s har tittel, emne, tekst og forklaring', (id) => {
    const t = SYSTEM_EMAIL_TEMPLATES.find((x) => x.id === id)!;
    for (const field of [t.title, t.subject, t.body, t.note]) expect(field.trim().length).toBeGreaterThan(3);
  });
  it.each(IDS)('%s bruker bare kjente plassholdere ({navn}, {lenke})', (id) => {
    const t = SYSTEM_EMAIL_TEMPLATES.find((x) => x.id === id)!;
    const found = [...(t.subject + t.body).matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    for (const p of found) expect(['navn', 'lenke']).toContain(p);
  });
  it.each(IDS)('%s nevner aldri intern kode, etternavn eller barnenavn', (id) => {
    const t = SYSTEM_EMAIL_TEMPLATES.find((x) => x.id === id)!;
    expect(t.subject + t.body).not.toMatch(/intern kode|BET-|etternavn|\{barn/i);
  });
  it.each(IDS)('%s oppfyller API-ets minstekrav (emne >= 3, tekst >= 10 tegn)', (id) => {
    const t = SYSTEM_EMAIL_TEMPLATES.find((x) => x.id === id)!;
    const parsed = parseEmailPayload({ kind: 'system', subject: t.subject, html: t.body, emails: ['a@b.no'] });
    expect(parsed.ok).toBe(true);
  });
  it('kun svar-paa-sporsmaal-malen inneholder lenke', () => {
    const withLink = SYSTEM_EMAIL_TEMPLATES.filter((t) => t.body.includes('{lenke}')).map((t) => t.id);
    expect(withLink).toEqual(['inquiry_answered']);
  });
});

describe('fillTemplate', () => {
  it.each([
    ['Hei {navn}', 'Kari', 'Hei Kari'],
    ['Hei {navn}', '  Kari  ', 'Hei Kari'],
    ['Hei {navn}', '', 'Hei deg'],
    ['Hei {navn}', '   ', 'Hei deg'],
    ['{navn} og {navn}', 'Ola', 'Ola og Ola'],
    ['Ingen plassholder', 'Ola', 'Ingen plassholder'],
  ])('fillTemplate(%j, %j) = %j', (text, navn, expected) => {
    expect(fillTemplate(text, navn)).toBe(expected);
  });
  it('lenke settes inn naar den er oppgitt, ellers betyna.no', () => {
    expect(fillTemplate('Se {lenke}', { navn: 'A', lenke: 'https://x.no/y' })).toBe('Se https://x.no/y');
    expect(fillTemplate('Se {lenke}', { navn: 'A' })).toBe('Se https://betyna.no');
    expect(fillTemplate('Se {lenke}', 'A')).toBe('Se https://betyna.no');
    expect(fillTemplate('Se {lenke}', { lenke: '   ' })).toBe('Se https://betyna.no');
  });
  it('navn med spesialtegn settes inn uendret (escapes foerst ved utsending)', () => {
    expect(fillTemplate('Hei {navn}', '<b>Ola</b> & co')).toBe('Hei <b>Ola</b> & co');
  });
});

describe('composeSystemEmail', () => {
  const input = {
    templateId: 'inquiry_answered' as SystemTemplateId,
    relatedId: 'q1',
    sponsorId: 's1',
    sponsorName: 'Kari Nordmann',
    sponsorEmail: ' kari@example.com ',
    origin: 'https://betyna.no/',
  };
  it('lager system-e-post til fadderens trimmede adresse', () => {
    const r = composeSystemEmail(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.emails).toEqual(['kari@example.com']);
      expect(r.kind).toBe('system');
      expect(r.relatedId).toBe('q1');
      expect(r.templateId).toBe('inquiry_answered');
    }
  });
  it('tekst inneholder navn og portallenke med riktig fadder-id og seksjon', () => {
    const r = composeSystemEmail(input);
    if (!r.ok) throw new Error('forventet ok');
    expect(r.html).toContain('Kari Nordmann');
    expect(r.html).toContain('https://betyna.no/?portal=sponsor&sponsor=s1&seksjon=sporsmaal');
  });
  it.each(IDS)('%s gir ok og gyldig nyttelast for API-et', (templateId) => {
    const r = composeSystemEmail({ ...input, templateId });
    expect(r.ok).toBe(true);
    if (r.ok) expect(parseEmailPayload({ kind: r.kind, subject: r.subject, html: r.html, emails: r.emails }).ok).toBe(true);
  });
  it.each(['', 'ikke-epost', 'a@b', '@b.no', 'a b@c.no', '   '])('ugyldig adresse %j gir ok:false', (sponsorEmail) => {
    expect(composeSystemEmail({ ...input, sponsorEmail }).ok).toBe(false);
  });
  it('ukjent mal gir ok:false', () => {
    expect(composeSystemEmail({ ...input, templateId: 'finnes_ikke' as SystemTemplateId }).ok).toBe(false);
  });
  it.each([
    ['inquiry_answered', 'sporsmaal'],
    ['report_approved', 'rapporter'],
    ['payment_registered', 'okonomi'],
    ['sponsor_welcome', 'oversikt'],
    ['magic_link', 'oversikt'],
  ])('portalseksjon for %s er %s', (id, section) => {
    expect(portalSectionForTemplate(id as SystemTemplateId)).toBe(section);
  });
  it('e-posten har aldri med intern kode eller barnenavn', () => {
    for (const templateId of IDS) {
      const r = composeSystemEmail({ ...input, templateId });
      if (r.ok) expect(r.html + r.subject).not.toMatch(/BET-|intern kode/i);
    }
  });
});
