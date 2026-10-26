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

  it('Økonomi og åpenhet er en modul: synlig som standard, og skjules sammen med menylenken', () => {
    expect(visibleHomeModules(baseCms())).toContain('apenhet');
    const ctx = { hasFrontPageStories: true, hasActiveCampaigns: true };
    expect(publicNavVisibility(baseCms(), ctx).apenhet).toBe(true);
    const cms = {
      ...baseCms(),
      homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(baseCms()), 'apenhet', false),
    };
    expect(visibleHomeModules(cms)).not.toContain('apenhet');
    expect(publicNavVisibility(cms, ctx).apenhet).toBe(false);
  });

  it('eldre lagret layout uten apenhet får modulen lagt til som synlig', () => {
    const cms = { ...baseCms(), homeLayout: [{ moduleId: 'hero' as const, visible: true }] };
    expect(normalizeCmsHomeLayout(cms).find((r) => r.moduleId === 'apenhet')?.visible).toBe(true);
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

  it('Om oss er skjult som standard, også i eldre layouter', () => {
    expect(visibleHomeModules(baseCms())).not.toContain('omOss');
    const legacy = { ...baseCms(), homeLayout: [{ moduleId: 'hero' as const, visible: true }] };
    expect(normalizeCmsHomeLayout(legacy).find((r) => r.moduleId === 'omOss')?.visible).toBe(false);
    expect(visibleHomeModules(legacy)).not.toContain('omOss');
  });

  it('«Om oss»-lenken vises når historien er på og har tekst; «Profil & verdier» er uendret', () => {
    const ctx = { hasFrontPageStories: true, hasActiveCampaigns: true };
    const cms = {
      ...baseCms(),
      aboutUs: { kicker: 'K', title: 'T', bodyHtml: '<p>Historien</p>' },
      homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(baseCms()), 'omOss', true),
    };
    const vis = publicNavVisibility(cms, ctx);
    expect(vis.historie).toBe(true);
    expect(vis.omOss).toBe(true);
  });

  it('«Om oss»-lenken skjules når historien er på men tom', () => {
    const ctx = { hasFrontPageStories: true, hasActiveCampaigns: true };
    const cms = {
      ...baseCms(),
      aboutUs: { kicker: 'K', title: 'T', bodyHtml: '' },
      homeLayout: setHomeModuleVisible(normalizeCmsHomeLayout(baseCms()), 'omOss', true),
    };
    const vis = publicNavVisibility(cms, ctx);
    expect(vis.historie).toBe(false);
    expect(vis.omOss).toBe(true);
  });

  it('«Om oss»-lenken skjules når modulen er av; «Profil & verdier» er som før', () => {
    const vis = publicNavVisibility(baseCms(), { hasFrontPageStories: true, hasActiveCampaigns: true });
    expect(vis.historie).toBe(false);
    expect(vis.omOss).toBe(true);
  });

  it('standard rekkefølge har «Hva støtten gjør» rett etter Fadderordningen', () => {
    const ids = visibleHomeModules(baseCms());
    const stepsIdx = ids.indexOf('steps');
    expect(stepsIdx).toBeGreaterThanOrEqual(0);
    expect(ids[stepsIdx + 1]).toBe('stotte');
    expect(ids).toContain('stotte');
  });

  it('eldre lagret layout uten stotte får modulen rett etter steps, synlig', () => {
    const legacy = {
      ...baseCms(),
      homeLayout: [
        { moduleId: 'hero' as const, visible: true },
        { moduleId: 'steps' as const, visible: true },
        { moduleId: 'behov' as const, visible: true },
        { moduleId: 'apenhet' as const, visible: true },
      ],
    };
    const layout = normalizeCmsHomeLayout(legacy);
    const ids = layout.map((r) => r.moduleId);
    expect(ids.indexOf('stotte')).toBe(ids.indexOf('steps') + 1);
    expect(layout.find((r) => r.moduleId === 'stotte')?.visible).toBe(true);
    expect(visibleHomeModules(legacy)).toContain('stotte');
  });

  it('reorderHomeModule flytter modul til ny posisjon', () => {
    const layout = normalizeCmsHomeLayout(baseCms());
    const next = reorderHomeModule(layout, 'behov', 'hero');
    expect(next.map((r) => r.moduleId)[0]).toBe('behov');
    const back = reorderHomeModule(next, 'behov', 'behov');
    expect(back).toEqual(next);
  });
});
