import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMPTY_CMS_CONTENT } from '../../db/seedPolicy';
import type { CmsContent } from '../../types';
import { normalizeCmsHomeLayout, setHomeModuleVisible } from '../../utils/cmsHomeLayout';

const currentCms: CmsContent = {
  ...EMPTY_CMS_CONTENT,
  homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(EMPTY_CMS_CONTENT), 'waiting', true),
};

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    cmsContent: currentCms,
    stories: [],
    campaigns: [],
    childrenList: [],
    language: 'no',
    t: (_key: string, fallback?: string) => fallback ?? _key,
    isLoggedIn: false,
  }),
}));

vi.mock('./WaitingSponsorsSection', () => ({ WaitingSponsorsSection: () => null }));
vi.mock('./TestimonialStoryCard', () => ({ TestimonialStoryCard: () => null }));
vi.mock('../modals/BecomeSponsorModal', () => ({ BecomeSponsorModal: () => null }));
vi.mock('../../utils/vippsRecurring', () => ({ pollVippsAgreementStatus: async () => undefined }));

const { PublicWebsite } = await import('./PublicWebsite');

const render = (cmsPreviewEmbedded: boolean) =>
  renderToStaticMarkup(
    React.createElement(PublicWebsite, {
      onOpenSponsorModal: () => undefined,
      onOpenDonateModal: () => undefined,
      activeSection: 'home',
      setActiveSection: () => undefined,
      cmsPreviewEmbedded,
    })
  );

const waitingSection = (html: string) => {
  const start = html.indexOf('id="venter-fadder"');
  return html.slice(html.lastIndexOf('<section', start), html.indexOf('</section>', start));
};

describe('Forsiden: Disse venter på fadder uten publiserte kort', () => {
  it('er skjult på nettsiden', () => {
    expect(waitingSection(render(false))).toContain('display:none');
  });

  it('vises med plassholder i CMS-forhåndsvisningen, så den kan klikkes', () => {
    const section = waitingSection(render(true));
    expect(section).not.toContain('display:none');
    expect(section).toContain('Ingen publiserte kort ennå');
  });
});
