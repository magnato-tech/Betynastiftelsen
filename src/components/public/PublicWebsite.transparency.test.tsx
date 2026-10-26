import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import translations from '../../locales/translations.json';
import { EMPTY_CMS_CONTENT } from '../../db/seedPolicy';
import type { CmsContent, CmsTransparencySection } from '../../types';

type Lang = 'no' | 'fr';

const lookup = (lang: Lang, key: string, fallback?: string): string => {
  const dict = translations as unknown as Record<Lang, Record<string, unknown>>;
  const value = key.split('.').reduce<unknown>((obj, part) => (obj as Record<string, unknown> | undefined)?.[part], dict[lang]);
  return typeof value === 'string' ? value : fallback ?? key;
};

let currentLang: Lang = 'no';
let currentCms: CmsContent = EMPTY_CMS_CONTENT;

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    cmsContent: currentCms,
    stories: [],
    campaigns: [],
    childrenList: [],
    language: currentLang,
    t: (key: string, fallback?: string) => lookup(currentLang, key, fallback),
    isLoggedIn: false,
  }),
}));

// Tunge barn-komponenter er ikke relevante for denne testen.
vi.mock('./WaitingSponsorsSection', () => ({ WaitingSponsorsSection: () => null }));
vi.mock('./TestimonialStoryCard', () => ({ TestimonialStoryCard: () => null }));
vi.mock('../modals/BecomeSponsorModal', () => ({ BecomeSponsorModal: () => null }));
vi.mock('../../utils/vippsRecurring', () => ({ pollVippsAgreementStatus: async () => undefined }));

const { PublicWebsite } = await import('./PublicWebsite');

const render = () =>
  renderToStaticMarkup(
    React.createElement(PublicWebsite, {
      onOpenSponsorModal: () => undefined,
      onOpenDonateModal: () => undefined,
      activeSection: 'home',
      setActiveSection: () => undefined,
    })
  );

/** renderToStaticMarkup escaper apostrof; gjør om til vanlig tekst for sammenligning. */
const decode = (html: string) => html.replace(/&#x27;/g, "'").replace(/&amp;/g, '&');

const apenhetSection = (html: string) => {
  const start = html.indexOf('id="apenhet"');
  const end = html.indexOf('</section>', start);
  return decode(html.slice(start, end));
};

const EDITED: CmsTransparencySection = {
  kicker: 'Egen toppmerking',
  title: 'Redigert overskrift',
  intro: 'Redigert ingress for testen.',
  secondary: 'Redigert tilleggstekst.',
  cards: [
    { id: 'a', title: 'Kort A', description: 'Beskrivelse A' },
    { id: 'b', title: 'Kort B', description: 'Beskrivelse B' },
  ],
};

describe('Forsiden: Økonomi og åpenhet', () => {
  it('har data-cms-section="apenhet" så klikk i forhåndsvisning kan åpne editoren', () => {
    currentLang = 'no';
    currentCms = EMPTY_CMS_CONTENT;
    const html = render();
    expect(html).toContain('id="apenhet"');
    expect(html).toContain('data-cms-section="apenhet"');
  });

  it('viser redigerte CMS-tekster på norsk, inkludert antall kort', () => {
    currentLang = 'no';
    currentCms = { ...EMPTY_CMS_CONTENT, transparency: EDITED };
    const section = apenhetSection(render());
    expect(section).toContain('Egen toppmerking');
    expect(section).toContain('Redigert overskrift');
    expect(section).toContain('Redigert ingress for testen.');
    expect(section).toContain('Redigert tilleggstekst.');
    expect(section).toContain('Kort A');
    expect(section).toContain('Beskrivelse B');
    expect(section).not.toContain('Liten reserve');
  });

  it('uten lagret felt vises dagens norske tekster', () => {
    currentLang = 'no';
    currentCms = { ...EMPTY_CMS_CONTENT, transparency: undefined };
    const section = apenhetSection(render());
    expect(section).toContain('Slik pengene brukes');
    expect(section).toContain('Månedlig fadderbidrag');
    expect(section).toContain('Liten reserve');
    expect(section).toContain('Ingen barnehjem-modell');
  });

  it('på fransk brukes oversettelsene, ikke CMS-teksten', () => {
    currentLang = 'fr';
    currentCms = {
      ...EMPTY_CMS_CONTENT,
      transparency: {
        ...EDITED,
        cards: [{ id: 'col2', title: 'Redigert kort', description: 'Redigert beskrivelse' }],
      },
    };
    const section = apenhetSection(render());
    expect(section).toContain("Comment l'argent est utilisé");
    expect(section).toContain('Petite réserve');
    expect(section).not.toContain('Redigert overskrift');
    expect(section).not.toContain('Redigert kort');
  });
});
