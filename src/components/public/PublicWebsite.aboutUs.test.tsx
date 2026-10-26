import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import translations from '../../locales/translations.json';
import { EMPTY_CMS_CONTENT } from '../../db/seedPolicy';
import type { CmsAboutUsSection, CmsContent } from '../../types';
import { normalizeCmsHomeLayout, setHomeModuleVisible } from '../../utils/cmsHomeLayout';

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

const omOssSection = (html: string) => {
  const start = html.indexOf('id="om-betyna"');
  const end = html.indexOf('</section>', start);
  return decode(html.slice(start, end));
};

const visibleWith = (aboutUs: CmsAboutUsSection): CmsContent => ({
  ...EMPTY_CMS_CONTENT,
  aboutUs,
  homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(EMPTY_CMS_CONTENT), 'omOss', true),
});

const EDITED: CmsAboutUsSection = {
  kicker: 'Egen toppmerking',
  title: 'Redigert historie',
  bodyHtml: '<p>Betyna startet for omtrent 15 år siden.</p>',
};

describe('Forsiden: Om oss', () => {
  it('er ikke på forsiden når modulen er skjult (standard)', () => {
    currentLang = 'no';
    currentCms = { ...EMPTY_CMS_CONTENT, aboutUs: EDITED };
    const html = render();
    expect(html).not.toContain('id="om-betyna"');
    expect(html).not.toContain('data-cms-section="omOss"');
  });

  it('vises ikke når modulen er på men teksten er tom', () => {
    currentLang = 'no';
    currentCms = visibleWith({ ...EMPTY_CMS_CONTENT.aboutUs!, bodyHtml: '<p></p>' });
    expect(render()).not.toContain('id="om-betyna"');
  });

  it('har data-cms-section="omOss" når modulen er på og har tekst', () => {
    currentLang = 'no';
    currentCms = visibleWith(EDITED);
    const html = render();
    expect(html).toContain('id="om-betyna"');
    expect(html).toContain('data-cms-section="omOss"');
  });

  it('viser redigert tittel og historie på norsk', () => {
    currentLang = 'no';
    currentCms = visibleWith(EDITED);
    const section = omOssSection(render());
    expect(section).toContain('Egen toppmerking');
    expect(section).toContain('Redigert historie');
    expect(section).toContain('Betyna startet for omtrent 15 år siden.');
  });

  it('på fransk vises også CMS-teksten (ingen oversettelse finnes)', () => {
    currentLang = 'fr';
    currentCms = visibleWith(EDITED);
    const section = omOssSection(render());
    expect(section).toContain('Redigert historie');
    expect(section).toContain('Betyna startet for omtrent 15 år siden.');
  });

  it('viser bilde med alt-tekst når bilde er satt', () => {
    currentLang = 'no';
    currentCms = visibleWith({ ...EDITED, imageUrl: 'https://example.com/betyna.jpg', imageAlt: 'Gruppebilde' });
    const section = omOssSection(render());
    expect(section).toContain('src="https://example.com/betyna.jpg"');
    expect(section).toContain('alt="Gruppebilde"');
  });
});
