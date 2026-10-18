import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign } from '../../types';
import { BecomeSponsorModal } from '../modals/BecomeSponsorModal';
import { getHeroHeightVh, getHeroObjectPosition, withHeroLayoutDefaults } from '../../utils/heroLayout';
import { heroImageSrcFromUrl } from '../../utils/cmsHeroImage';
import { visibleHomeModules } from '../../utils/cmsHomeLayout';
import { cmsPageWidthFromContent } from '../../utils/cmsPageWidth';
import type { CmsContent, CmsHomeModuleId } from '../../types';
import { CMS_PREVIEW_ACTIVE_CLASS, type CmsPreviewDraftPayload } from '../../utils/cmsPreviewBridge';
import type { CmsPreviewSection } from '../../utils/cmsPreview';
import { isFrontPageTestimonial, resolvePublicImageUrl, withTestimonialsSectionDefaults } from '../../utils/testimonials';
import { TestimonialStoryCard } from './TestimonialStoryCard';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Heart,
  Users,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Scale,
  Sparkles,
} from 'lucide-react';

const HomeColumn: React.FC<{ cms: CmsContent; className?: string; children: React.ReactNode }> = ({
  cms,
  className = '',
  children,
}) => (
  <div
    className={`w-full mx-auto px-4 sm:px-6 ${className}`}
    style={{ maxWidth: cmsPageWidthFromContent(cms) }}
  >
    {children}
  </div>
);

const scrollToBliFadder = () => {
  document.getElementById('bli-fadder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

interface PublicWebsiteProps {
  onOpenSponsorModal: () => void;
  onOpenDonateModal: (campaign: Campaign) => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  cmsPreviewDraft?: CmsPreviewDraftPayload | null;
  cmsPreviewEmbedded?: boolean;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onOpenDonateModal,
  activeSection,
  setActiveSection,
  cmsPreviewDraft,
  cmsPreviewEmbedded = false,
}) => {
  const app = useApp();
  const cmsContent = cmsPreviewDraft?.cmsContent ?? app.cmsContent;
  const stories = cmsPreviewDraft?.stories ?? app.stories;
  const campaigns = cmsPreviewDraft?.campaigns ?? app.campaigns;
  const { childrenList, language, t } = app;
  const useRawCmsText = cmsPreviewEmbedded;
  const highlightedSection: CmsPreviewSection | null = cmsPreviewEmbedded
    ? (cmsPreviewDraft?.highlightSection ?? null)
    : null;
  const previewMark = (section: CmsPreviewSection) =>
    highlightedSection === section ? CMS_PREVIEW_ACTIVE_CLASS : '';

  const activeCampaigns = campaigns.filter((c) => c.status === 'aktiv');
  const completedCampaigns = campaigns.filter((c) => c.status === 'fullfort');

  const heroKicker =
    useRawCmsText || language !== 'fr' ? cmsContent.hero.kicker : t('hero.kicker', cmsContent.hero.kicker);
  const heroTitle =
    useRawCmsText || language !== 'fr' ? cmsContent.hero.title : t('hero.title', cmsContent.hero.title);
  const heroSubtitle =
    useRawCmsText || language !== 'fr'
      ? cmsContent.hero.subtitle
      : t('hero.subtitle', cmsContent.hero.subtitle);
  const heroConfig = withHeroLayoutDefaults(cmsContent.hero);
  const heroHeightVh = getHeroHeightVh(heroConfig);
  const heroObjectPosition = getHeroObjectPosition(heroConfig);
  const testimonialsSection = withTestimonialsSectionDefaults(cmsContent.testimonialsSection);
  const frontPageStories = stories.filter(isFrontPageTestimonial);
  const testimonialGridClass =
    frontPageStories.length === 1
      ? 'grid grid-cols-1 gap-6 max-w-2xl mx-auto'
      : frontPageStories.length === 2 || testimonialsSection.gridColumns === 2
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-6'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';

  const ctaBanner = cmsContent.ctaBanner;
  const homeModuleOrder = visibleHomeModules(cmsContent);
  const onHome = (id: CmsHomeModuleId) => homeModuleOrder.includes(id);

  const heroImageSrc = heroImageSrcFromUrl(
    cmsContent.hero.backgroundImageUrl,
    cmsContent.hero.backgroundPreset
  );

  const [sponsorshipDetailsOpen, setSponsorshipDetailsOpen] = useState(false);

  React.useEffect(() => {
    if (activeSection === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (activeSection === 'bli-fadder') {
      document.getElementById('bli-fadder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    document.getElementById(activeSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSection]);

  const heroHeadline = (
    <>
      <p className="text-xs font-semibold tracking-widest uppercase text-[#4D6B3E]">{heroKicker}</p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-serif font-bold text-[#3C3C3C] leading-[1.15] text-balance">
        {heroTitle}
      </h1>
      <p className="mt-3 text-base text-stone-700 leading-relaxed">{heroSubtitle}</p>
    </>
  );

  const heroImage = (
    <div
      className="relative w-full overflow-hidden bg-[#F6F4ED] rounded-none lg:rounded-none"
      style={{ height: `${heroHeightVh}vh`, maxHeight: '92vh' }}
    >
      <img
        src={heroImageSrc}
        alt="Betyna sammen med barn i Kongo"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: heroObjectPosition }}
      />
    </div>
  );

  const homeBlockStyle = (id: CmsHomeModuleId): React.CSSProperties => ({
    order: onHome(id) ? homeModuleOrder.indexOf(id) : 99,
    display: onHome(id) ? undefined : 'none',
  });

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* 1. HERO SECTION */}
      <section
        id="home"
        data-cms-section="hero"
        data-cms-label="Hovedbanner"
        style={homeBlockStyle('hero')}
        className={`scroll-mt-24 rounded-lg transition-shadow ${previewMark('hero')}`}
      >
        <HomeColumn cms={cmsContent} className="space-y-5 lg:space-y-6">
          {heroImage}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            <div className="text-left">{heroHeadline}</div>
            {heroConfig.showCtaCard && (
              <div id="bli-fadder" className="w-full max-w-[22rem] lg:max-w-[22rem] lg:ml-auto scroll-mt-24">
                <BecomeSponsorModal isOpen onClose={() => undefined} embedded />
              </div>
            )}
          </div>
        </HomeColumn>
      </section>

      {/* Vitnesbyrd: CMS-tekst + kort i rutenett (runde 3) */}
      <section
        id="historier"
        data-cms-section="stories"
        data-cms-label="Vitnesbyrd"
        style={{
          ...homeBlockStyle('stories'),
          display: onHome('stories') && frontPageStories.length > 0 ? undefined : 'none',
        }}
        className={`scroll-mt-24 rounded-lg transition-shadow ${previewMark('stories')}`}
      >
        <HomeColumn cms={cmsContent}>
          <div className="mb-8 w-full">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
              {useRawCmsText || language !== 'fr'
                ? testimonialsSection.kicker
                : t('testimonials.kicker', testimonialsSection.kicker)}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
              {useRawCmsText || language !== 'fr'
                ? testimonialsSection.title
                : t('testimonials.title', testimonialsSection.title)}
            </h2>
            <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
              {useRawCmsText || language !== 'fr'
                ? testimonialsSection.subtitle
                : t('testimonials.subtitle', testimonialsSection.subtitle)}
            </p>
          </div>

          <div className={testimonialGridClass}>
            {frontPageStories.map((story) => (
              <TestimonialStoryCard key={story.id} story={story} />
            ))}
          </div>
        </HomeColumn>
      </section>

      {/* 3. FADDERORDNINGEN (Slik fungerer det) */}
      <section
        id="fadderordningen"
        data-cms-section="steps"
        data-cms-label="Fadderordningen"
        style={homeBlockStyle('steps')}
        className={`scroll-mt-24 rounded-lg transition-shadow ${previewMark('steps')}`}
      >
        <HomeColumn cms={cmsContent}>
        <div className="mb-12 w-full">
          <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
            {t('steps.kicker', 'Fadderordningen')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            {t('steps.title', 'Én fadder — ett barn som er avhengig av deg')}
          </h2>
          <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
            {t(
              'steps.subtitle',
              'Betyna er lite og personlig. Du blir ikke «én i mengden» — du holder skoleplassen oppe for ett navn, ett liv og en familie.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cmsContent.steps.map((step) => {
            const stepTitle = language === 'fr' ? t(`steps.step${step.number}_title`, step.title) : step.title;
            const stepDesc = language === 'fr' ? t(`steps.step${step.number}_desc`, step.description) : step.description;
            return (
              <div key={step.number} className="bg-white p-7 rounded-xl border border-[#DFD9CB] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {step.imageUrl && (
                    <div className="w-full h-36 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={step.imageUrl}
                        alt={stepTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-[#A3B18A]/25 text-[#4D6B3E] flex items-center justify-center font-serif font-bold text-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">{stepTitle}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                    {stepDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Heart,
              title: t('sponsorship.card1Title', 'Ett barn — din fadder'),
              desc: t(
                'sponsorship.card1Desc',
                'Du støtter ett navn og ett liv. Ikke en anonym giverpool. Skoleplassen henger på at du er med over tid.'
              ),
            },
            {
              icon: Users,
              title: t('sponsorship.card2Title', 'Pengene til familien'),
              desc: t(
                'sponsorship.card2Desc',
                'Bidraget går til omsorgspersoner som betaler skole, uniform, mat og medisin — slik det fungerer lokalt i Kongo.'
              ),
            },
            {
              icon: GraduationCap,
              title: t('sponsorship.card3Title', 'Hele veien til jobb'),
              desc: t(
                'sponsorship.card3Desc',
                'Vi følger barnet til fagbrev, utdanning og en reell jobb — slik at det kan forsørge sin familie.'
              ),
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white p-5 rounded-xl border border-[#DFD9CB] shadow-xs space-y-2"
            >
              <card.icon className="w-5 h-5 text-[#4D6B3E]" />
              <h3 className="text-base font-serif font-bold text-stone-900">{card.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setSponsorshipDetailsOpen((open) => !open)}
            className="text-sm font-medium text-[#4D6B3E] hover:text-[#3B522F] underline underline-offset-2 cursor-pointer"
          >
            {sponsorshipDetailsOpen
              ? t('sponsorship.hideDetails', 'Skjul detaljer')
              : t('sponsorship.showDetails', 'Les mer om hvordan fadderordningen virker')}
          </button>
          {sponsorshipDetailsOpen && (
            <div className="mt-4 space-y-4 text-sm text-stone-700 leading-relaxed font-sans">
              <p>
                {t(
                  'sponsorship.realityParagraph1',
                  'De fleste barn i Kongo går på privatskole som koster penger. Er du med som fadder, er ett barn helt avhengig av deg — ikke av en stor, anonym giverpool.'
                )}
              </p>
              <p>
                {t(
                  'sponsorship.moneyFlowParagraph1',
                  'Vi sørger for at pengene kommer frem til barnet som trenger det. Barnet får ikke pengene selv — de går til omsorgspersoner i familien som bruker dem til skole, mat, uniform og det som trengs.'
                )}
              </p>
              <p>
                {t(
                  'sponsorship.moneyFlowParagraph3',
                  'Vi har ikke tro på barnehjem — det er et fremmedelement i denne kulturen. Vi tror på å støtte storfamilien når de trår til, med vår hjelp.'
                )}
              </p>
              <button
                type="button"
                onClick={() => setActiveSection('apenhet')}
                className="text-xs font-medium text-[#4D6B3E] hover:text-[#3B522F] underline underline-offset-2 cursor-pointer"
              >
                {t('sponsorship.linkApenhet', 'Slik pengene brukes')} →
              </button>
            </div>
          )}
        </div>
        </HomeColumn>
      </section>

      <section
        id="cms-kpi"
        data-cms-section="kpis"
        data-cms-label="Nøkkeltall"
        style={{
          ...homeBlockStyle('kpis'),
          display: onHome('kpis') && cmsContent.kpiStats.length > 0 ? undefined : 'none',
        }}
        className={`scroll-mt-24 rounded-lg transition-shadow ${previewMark('kpis')}`}
      >
        <HomeColumn cms={cmsContent}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cmsContent.kpiStats.map((kpi) => (
              <div
                key={kpi.id}
                className="bg-white p-6 rounded-xl border border-[#DFD9CB] shadow-xs text-center space-y-1"
              >
                <p className="text-2xl font-serif font-bold text-[#4D6B3E] tabular-nums">{kpi.value}</p>
                <p className="text-sm font-semibold text-stone-900">{kpi.label}</p>
                {kpi.sublabel && <p className="text-xs text-stone-500">{kpi.sublabel}</p>}
              </div>
            ))}
          </div>
        </HomeColumn>
      </section>

      {/* 6. PROFIL & VERDIER (bistandsorganisasjon) — nav: Om Betyna */}
      <section
        id="om-oss"
        data-cms-section="about"
        data-cms-label="Kjernerammer"
        style={homeBlockStyle('about')}
        className={`scroll-mt-24 transition-shadow ${previewMark('about')}`}
      >
        <div className="bg-[#4D6B3E]/10 border-y border-[#DFD9CB] py-10 sm:py-12">
          <HomeColumn cms={cmsContent} className="space-y-8">
            <div className="w-full space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
                {t('profile.kicker', 'Profil & verdier')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {t('profile.title', 'En liten bistandsorganisasjon med tydelig retning')}
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed font-sans max-w-3xl">
                {t(
                  'profile.intro1',
                  'Betyna er frivillig arbeid i Brazzaville — ikke en stiftelse, ikke masseinnsamling. Vi er en bistandsorganisasjon som følger enkeltbarn over lang tid, med koordinator på bakken og faddere i Norge som kjenner sitt barn.'
                )}
              </p>
              <p className="text-sm text-stone-700 leading-relaxed font-sans max-w-3xl">
                {t(
                  'profile.intro2',
                  'Vi tror på det som fungerer lokalt: storfamilien som tar ansvar når foreldre mangler eller ikke har råd. Vi bygger ikke barnehjem. Vi støtter skolegang, verdighet og hele løpet til fagbrev, utdanning og jobb.'
                )}
              </p>
              <div className="flex flex-wrap gap-3 pt-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveSection('fadderordningen')}
                  className="text-[#4D6B3E] hover:text-[#3B522F] underline underline-offset-2 cursor-pointer"
                >
                  {t('profile.linkFadder', 'Slik fungerer fadderordningen')} →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('apenhet')}
                  className="text-[#4D6B3E] hover:text-[#3B522F] underline underline-offset-2 cursor-pointer"
                >
                  {t('profile.linkApenhet', 'Slik pengene brukes')} →
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
                {t('profile.valuesHeading', 'Verdier vi bygger på')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsContent.aboutCards.map((card) => {
              const IconComp =
                card.iconName === 'Scale'
                  ? Scale
                  : card.iconName === 'FileCheck'
                  ? FileCheck
                  : card.iconName === 'ShieldCheck'
                  ? ShieldCheck
                  : Users;
              const cardTitle =
                language === 'fr'
                  ? t(`profile.card_${card.id}_title`, card.title)
                  : card.title;
              const cardDesc =
                language === 'fr'
                  ? t(`profile.card_${card.id}_desc`, card.description)
                  : card.description;
              return (
                <div key={card.id} className="bg-white p-6 rounded-xl border border-[#DFD9CB] shadow-xs space-y-2 flex flex-col justify-between">
                  <div>
                    {card.imageUrl && (
                      <div className="w-full h-28 rounded-lg overflow-hidden mb-3 border border-stone-200">
                        <img
                          src={card.imageUrl}
                          alt={cardTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <IconComp className="w-5 h-5 text-[#4D6B3E] mb-1" />
                    <h3 className="text-base font-serif font-bold text-stone-900">{cardTitle}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans mt-1">{cardDesc}</p>
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </HomeColumn>
        </div>
      </section>

      {/* 7. ÅPENHET OG ØKONOMI */}
      <section id="apenhet" style={{ order: 45 }} className="scroll-mt-24">
        <HomeColumn cms={cmsContent}>
        <div className="bg-white rounded-2xl border border-[#DFD9CB] p-8 md:p-12 shadow-xs">
          <div className="mb-8 w-full">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
              {t('transparency.kicker', 'Økonomi & åpenhet')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
              {t('transparency.title', 'Slik pengene brukes')}
            </h2>
            <p className="text-sm text-stone-700 mt-2 leading-relaxed">
              {t(
                'transparency.intro',
                'Fadderbidraget går uavkortet til barnet — via omsorgspersoner i storfamilien, ikke i lommen på barnet. Koordinatoren sørger for at skole, uniform, medisin og det nødvendige blir dekket.'
              )}
            </p>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Ti faddere à 3 500 kroner i året gir 35 000 kroner til ett barns løp. Ingen lønn tas ut i Betyna.{' '}
              {t(
                'transparency.legalFormShort',
                'Vi er foreløpig ikke stiftelse — med vilje — så mer av det som kommer inn kan gå til barna.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-900">
                {t('transparency.col1Title', 'Månedlig fadderbidrag')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {t(
                  'transparency.col1Desc',
                  'Skolepenger, uniform, sekk, mat og det familien trenger for at barnet kan gå på skole — ofte er beløpet lite i norske øyne, men avgjørende lokalt.'
                )}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-900">
                {t('transparency.col2Title', 'Liten reserve')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {t(
                  'transparency.col2Desc',
                  'En andel settes av til sykdom og sykehus (malaria er en reell risiko) og til skolestart én gang i året, når sekk og utstyr må kjøpes inn på nytt.'
                )}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-900">
                {t('transparency.col3Title', 'Ingen barnehjem-modell')}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {t(
                  'transparency.col3Desc',
                  'Vi støtter storfamilien som faktisk bærer ansvaret — ikke et fremmed barnehjem. Ekstra gaver fra fadder ved bursdag, jul eller akutte behov er populært, men frivillig.'
                )}
              </p>
            </div>
          </div>

        </div>
        </HomeColumn>
      </section>

      {/* EKSTRAORDINÆRE AKSJONER — kompakt, etter tillitsseksjonen (runde 2) */}
      <section
        id="aksjoner"
        data-cms-section="behov"
        data-cms-label="Aksjoner"
        style={{
          ...homeBlockStyle('behov'),
          display: onHome('behov') && activeCampaigns.length > 0 ? undefined : 'none',
        }}
        className={`scroll-mt-24 rounded-lg transition-shadow ${previewMark('behov')}`}
      >
        {activeCampaigns.length > 0 && (
          <HomeColumn cms={cmsContent}>
          <div className="mb-6 w-full">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
              {t('campaigns.kicker', 'Konkrete behov')}
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-2">
              {t('campaigns.titleShort', 'Vil du gi ekstra til ett konkret behov?')}
            </h2>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {t(
                'campaigns.subtitleShort',
                'Månedlig fadder er hovedveien. Aksjoner er for deg som vil bidra en gang til noe spesifikt — alltid knyttet til barn i ordningen.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeCampaigns.map((camp) => {
              const pct = Math.min(100, Math.round((camp.innsamletBelop / camp.maalbelop) * 100));
              const campImageSrc = resolvePublicImageUrl(camp.bildeUrl);
              return (
                <div
                  key={camp.id}
                  className="bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between gap-4 overflow-hidden"
                >
                  {campImageSrc && (
                    <div className="aspect-[16/10] w-full bg-stone-100 relative">
                      <img
                        src={campImageSrc}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col justify-between gap-4 flex-1">
                    <div className="space-y-3">
                      <h3 className="text-lg font-serif font-bold text-stone-900">{camp.tittel}</h3>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{camp.beskrivelse}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono tabular-nums text-stone-600">
                          <span>{camp.innsamletBelop.toLocaleString('no-NO')} kr</span>
                          <span>{pct}% av {camp.maalbelop.toLocaleString('no-NO')} kr</span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                          <div className="h-full bg-[#4D6B3E]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenDonateModal(camp)}
                      className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-[#3C3C3C] font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Støtt denne aksjonen</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {completedCampaigns.length > 0 && (
            <p className="text-xs text-stone-500 mt-4">
              {completedCampaigns.length} fullført aksjon{completedCampaigns.length > 1 ? 'er' : ''} er dokumentert i arkivet.
            </p>
          )}
          </HomeColumn>
        )}
      </section>

      <section
        id="cta"
        data-cms-section="cta"
        data-cms-label="Fadderoppfordring"
        style={{
          ...homeBlockStyle('cta'),
          display: onHome('cta') && ctaBanner?.title?.trim() ? undefined : 'none',
        }}
        className={`scroll-mt-24 rounded-lg transition-shadow ${previewMark('cta')}`}
      >
        {ctaBanner && (
          <HomeColumn cms={cmsContent}>
            <div className="w-full rounded-2xl border border-[#DFD9CB] bg-white p-8 md:p-10 text-center shadow-xs">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{ctaBanner.title}</h2>
              <p className="mt-3 text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">{ctaBanner.subtitle}</p>
              <button
                type="button"
                onClick={scrollToBliFadder}
                className="mt-6 px-6 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-semibold text-sm rounded-lg cursor-pointer"
              >
                {ctaBanner.buttonText}
              </button>
            </div>
          </HomeColumn>
        )}
      </section>
    </div>
  );
};
