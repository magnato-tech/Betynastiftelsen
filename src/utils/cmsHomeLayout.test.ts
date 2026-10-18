import { describe, expect, it } from 'vitest';
import type { CmsContent } from '../types';
import { EMPTY_CMS_CONTENT } from '../db/seedPolicy';
import {
  moveHomeModule,
  normalizeCmsHomeLayout,
  publicNavVisibility,
  reorderHomeModule,
  setHomeModuleVisible,
  visibleHomeModules,
} from './cmsHomeLayout';

const baseCms = (): CmsContent => ({
  ...EMPTY_CMS_CONTENT,
  hero: { ...EMPTY_CMS_CONTENT.hero, kicker: 'K', title: 'T', subtitle: 'S' },
  kpiStats: [{ id: '1', value: '10', label: 'Barn', sublabel: '' }],
  ctaBanner: { title: 'CTA', subtitle: 'x', buttonText: 'y' },
});

describe('cmsHomeLayout', () => {
  it('standard rekkefølge når homeLayout mangler', () => {
    const ids = visibleHomeModules(baseCms());
    expect(ids[0]).toBe('hero');
    expect(ids).toContain('stories');
  });

  it('skjult modul er ikke på forsiden men finnes i normalisert layout', () => {
    const cms = {
      ...baseCms(),
      homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(baseCms()), 'stories', false),
    };
    expect(visibleHomeModules(cms)).not.toContain('stories');
    expect(normalizeCmsHomeLayout(cms).find((r) => r.moduleId === 'stories')?.visible).toBe(false);
  });

  it('flytt opp endrer rekkefølge', () => {
    let layout = normalizeCmsHomeLayout(baseCms());
    const stepsIdx = layout.findIndex((r) => r.moduleId === 'steps');
    layout = moveHomeModule(layout, 'steps', 'up');
    expect(layout.findIndex((r) => r.moduleId === 'steps')).toBe(stepsIdx - 1);
  });

  it('publicNavVisibility skjuler historier uten forsideshistorier', () => {
    const vis = publicNavVisibility(baseCms(), {
      hasFrontPageStories: false,
      hasActiveCampaigns: true,
    });
    expect(vis.historier).toBe(false);
    expect(vis.fadderordningen).toBe(true);
  });

  it('publicNavVisibility skjuler meny når modul er av i homeLayout', () => {
    const cms = {
      ...baseCms(),
      homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(baseCms()), 'steps', false),
    };
    const vis = publicNavVisibility(cms, {
      hasFrontPageStories: true,
      hasActiveCampaigns: true,
    });
    expect(vis.fadderordningen).toBe(false);
  });

  it('publicNavVisibility skjuler Bli fadder når hero-CTA er av', () => {
    const cms = {
      ...baseCms(),
      hero: { ...baseCms().hero, showCtaCard: false },
    };
    expect(
      publicNavVisibility(cms, { hasFrontPageStories: true, hasActiveCampaigns: true }).bliFadderCta
    ).toBe(false);
  });

  it('reorderHomeModule flytter modul til ny posisjon', () => {
    const layout = normalizeCmsHomeLayout(baseCms());
    const next = reorderHomeModule(layout, 'behov', 'hero');
    expect(next.map((r) => r.moduleId)[0]).toBe('behov');
    const back = reorderHomeModule(next, 'behov', 'behov');
    expect(back).toEqual(next);
  });
});
