import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import translations from '../../locales/translations.json';
import { EMPTY_CMS_CONTENT } from '../../db/seedPolicy';
import type { CmsContent, CmsSupportCardsSection } from '../../types';
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

const sectionById = (html: string, id: string) => {
  const start = html.indexOf(`id="${id}"`);
  const end = html.indexOf('</section>', start);
  return decode(html.slice(start, end));
};

const stotteSection = (html: string) => sectionById(html, 'hva-stotten-gjor');
const stepsSection = (html: string) => sectionById(html, 'fadderordningen');

const EDITED: CmsSupportCardsSection = {
  kicker: 'Egen toppmerking',
  title: 'Redigert overskrift',
  intro: 'Redigert ingress for testen.',
  cards: [
    { id: 'a', title: 'Kort A', description: 'Beskrivelse A' },
    { id: 'b', title: 'Kort B', description: 'Beskrivelse B' },
  ],
};

describe('Forsiden: Hva støtten gjør', () => {
  it('har egen seksjon med data-cms-section="stotte" og modulens label', () => {
    currentLang = 'no';
    currentCms = EMPTY_CMS_CONTENT;
    const html = render();
    expect(html).toContain('id="hva-stotten-gjor"');
    expect(html).toContain('data-cms-section="stotte"');
    expect(html).toContain('data-cms-label="Hva støtten gjør"');
  });

  it('kortene ligger i sin egen seksjon, ikke i Fadderordningen', () => {
    currentLang = 'no';
    currentCms = EMPTY_CMS_CONTENT;
    const html = render();
    const steps = stepsSection(html);
    const stotte = stotteSection(html);
    expect(steps).not.toContain('Ett barn — din fadder');
    expect(steps).not.toContain('Les mer om hvordan fadderordningen virker');
    expect(stotte).toContain('Ett barn — din fadder');
    expect(stotte).toContain('Pengene til familien');
    expect(stotte).toContain('Hele veien til jobb');
    expect(stotte).toContain('Les mer om hvordan fadderordningen virker');
  });

  it('Fadderordningen beholder heading og de tre trinnene', () => {
    currentLang = 'no';
    currentCms = EMPTY_CMS_CONTENT;
    const steps = stepsSection(render());
    expect(steps).toContain('Én fadder — ett barn som er avhengig av deg');
    expect(steps).toContain('data-cms-section="steps"');
  });

  it('hva-stotten-gjor ligger rett etter fadderordningen i rekkefølgen', () => {
    currentLang = 'no';
    currentCms = EMPTY_CMS_CONTENT;
    const html = render();
    expect(html.indexOf('id="fadderordningen"')).toBeLessThan(html.indexOf('id="hva-stotten-gjor"'));
  });

  it('viser redigerte CMS-tekster på norsk', () => {
    currentLang = 'no';
    currentCms = { ...EMPTY_CMS_CONTENT, supportCards: EDITED };
    const section = stotteSection(render());
    expect(section).toContain('Egen toppmerking');
    expect(section).toContain('Redigert overskrift');
    expect(section).toContain('Redigert ingress for testen.');
    expect(section).toContain('Kort A');
    expect(section).toContain('Beskrivelse B');
    expect(section).not.toContain('Pengene til familien');
  });

  it('skjult modul gir display:none på seksjonen', () => {
    currentLang = 'no';
    currentCms = {
      ...EMPTY_CMS_CONTENT,
      homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(EMPTY_CMS_CONTENT), 'stotte', false),
    };
    const html = render();
    const start = html.indexOf('id="hva-stotten-gjor"');
    const openTag = html.slice(start, html.indexOf('>', start));
    expect(openTag).toContain('display:none');
  });

  it('på fransk brukes oversettelsene, ikke CMS-teksten', () => {
    currentLang = 'fr';
    currentCms = { ...EMPTY_CMS_CONTENT, supportCards: EDITED };
    const section = stotteSection(render());
    expect(section).toContain('Ce que soutient le parrainage');
    expect(section).toContain('Comment votre contribution fait la différence');
    expect(section).not.toContain('Redigert overskrift');
  });
});
