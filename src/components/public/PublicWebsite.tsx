import React, { useEffect, useState } from 'react';
import { pollVippsAgreementStatus } from '../../utils/vippsRecurring';
import { useApp } from '../../context/AppContext';
import { Campaign } from '../../types';
import { BecomeSponsorModal } from '../modals/BecomeSponsorModal';
import { SafeHtml } from '../common/SafeHtml';
import {
  clampHeroHeadlineSceneYPercent,
  getHeroCtaBottomCss,
  getHeroCtaCardConfig,
  getHeroHeadlineBelowMarginTopPx,
  getHeroHeadlineTone,
  getHeroHeadlineWidthPercent,
  getHeroOnImageHeadlineFlowReservePx,
  getHeroHeightVh,
  getHeroObjectPosition,
  getHeroSceneBottomPaddingPx,
  heroHasHeadlineCopy,
  isHeroHeadlineOnImageDesktop,
  withHeroLayoutDefaults,
} from '../../utils/heroLayout';
import { heroImageSrcFromUrl } from '../../utils/cmsHeroImage';
import { visibleHomeModules } from '../../utils/cmsHomeLayout';
import { cmsPageWidthFromContent } from '../../utils/cmsPageWidth';
import type { CmsContent, CmsHomeModuleId } from '../../types';
import {
  CMS_PREVIEW_ACTIVE_CLASS,
  CMS_PREVIEW_HERO_MIN_HEIGHT_CSS,
  postCmsPreviewSelectSection,
  type CmsPreviewDraftPayload,
} from '../../utils/cmsPreviewBridge';
import type { CmsPreviewSection } from '../../utils/cmsPreview';
import { isFrontPageTestimonial, resolvePublicImageUrl, withTestimonialsSectionDefaults } from '../../utils/testimonials';
import { withTransparencyDefaults } from '../../utils/transparency';
import { withSupportCardsDefaults } from '../../utils/supportCards';
import { aboutUsHasText, withAboutUsDefaults } from '../../utils/aboutUs';
import { aboutCardsColumns, aboutCardsGridClass, publishedAboutCards } from '../../utils/aboutCards';
import { TestimonialStoryCard } from './TestimonialStoryCard';
import { HeroAnniversaryBadge } from './HeroAnniversaryBadge';
import { WaitingSponsorsSection } from './WaitingSponsorsSection';
import {
  getPublishedWaitingSponsorCards,
  withWaitingSponsorsSectionDefaults,
} from '../../utils/waitingSponsors';
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
  const heroPreviewFillsViewport =
    cmsPreviewEmbedded && highlightedSection === 'hero';

  // Embedded CMS Preview: Klikk på en seksjon åpner redigering i editoren til venstre
  useEffect(() => {
    if (!cmsPreviewEmbedded) return;
    document.body.classList.add('cms-embedded-preview');

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const sectionEl = target?.closest('[data-cms-section]');
      if (!sectionEl) return;
      const section = sectionEl.getAttribute('data-cms-section') as CmsPreviewSection | null;
      if (section) {
        e.preventDefault();
        e.stopPropagation();
        postCmsPreviewSelectSection(window.parent, section);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.body.classList.remove('cms-embedded-preview');
      document.removeEventListener('click', handleClick, true);
    };
  }, [cmsPreviewEmbedded]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('vipps') !== 'return') return;
    const agreementId = params.get('agreementId');
    if (agreementId) void pollVippsAgreementStatus(agreementId);
    params.delete('vipps');
    params.delete('agreementId');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', next);
  }, []);

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
  const transparency = withTransparencyDefaults(cmsContent.transparency);
  const supportCards = withSupportCardsDefaults(cmsContent.supportCards);
  const aboutUs = withAboutUsDefaults(cmsContent.aboutUs);
  const aboutUsImageSrc = resolvePublicImageUrl(aboutUs.imageUrl);
  const frontPageStories = stories.filter(isFrontPageTestimonial);
  const waitingSection = withWaitingSponsorsSectionDefaults(cmsContent.waitingSponsorsSection);
  const waitingCards = getPublishedWaitingSponsorCards(cmsContent);
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

  const heroScrim = Math.min(90, Math.max(20, cmsContent.hero.scrimOpacity ?? 70));
  const heroHeadlineTone = getHeroHeadlineTone(cmsContent.hero);

  const renderHeroHeadline = (tone: 'light' | 'dark') => {
    const kickerClass =
      tone === 'light'
        ? 'text-xs font-semibold tracking-widest uppercase text-[#C5D4BC] drop-shadow-sm'
        : 'text-xs font-semibold tracking-widest uppercase text-[#4D6B3E]';
    const titleClass =
      tone === 'light'
        ? 'mt-3 text-3xl sm:text-4xl lg:text-[2.35rem] font-serif font-bold text-white leading-[1.12] text-balance drop-shadow-md'
        : 'mt-3 text-3xl sm:text-4xl font-serif font-bold text-[#3C3C3C] leading-[1.15] text-balance';
    const subtitleClass =
      tone === 'light'
        ? 'mt-3 text-sm sm:text-base text-white/95 leading-relaxed drop-shadow-sm'
        : 'mt-3 text-base text-stone-700 leading-relaxed';
    return (
      <>
        <p className={kickerClass}>{heroKicker}</p>
        <h1 className={titleClass}>{heroTitle}</h1>
        <SafeHtml
          html={heroSubtitle}
          className={`${subtitleClass} rich-html ${tone === 'light' ? 'rich-html-contrast' : ''}`}
        />
      </>
    );
  };

  const headlineOnImageDesktop = isHeroHeadlineOnImageDesktop(cmsContent.hero);
  const heroHeadlineFlowReservePx = getHeroOnImageHeadlineFlowReservePx(cmsContent.hero);
  const ctaPosX = heroConfig.ctaPosXPercent ?? 0;
  const ctaBottomCss = getHeroCtaBottomCss(heroConfig);
  const heroSceneBottomPadding = getHeroSceneBottomPaddingPx(heroConfig);
  const headlinePosX = heroConfig.headlinePosXPercent ?? 42;
  const headlinePosY = clampHeroHeadlineSceneYPercent(heroConfig.headlinePosYPercent ?? 55);
  const heroCtaConfig = getHeroCtaCardConfig(cmsContent.hero);
  const heroImageCssHeight = `min(${heroHeightVh}vh, 92vh)`;
  const headlineMaxW = heroConfig.headlineMaxWidthPercent ?? 52;
  const headlineBoxWidth = getHeroHeadlineWidthPercent(headlinePosX, headlineMaxW);

  const heroMotionReplayAt = heroConfig.heroMotionReplayAt ?? 0;
  const heroZoomActive = heroConfig.imageMotion === 'slowZoom';
  const heroCtaEnterActive = heroConfig.ctaEnter === 'fromLeft';

  const heroZoomStyle = React.useMemo(
    () => ({
      objectPosition: heroObjectPosition,
      transformOrigin: heroObjectPosition,
    }),
    [heroObjectPosition, heroMotionReplayAt]
  );

  const heroCtaEnterDelayStyle = React.useMemo((): React.CSSProperties => {
    const delaySec = Math.min(6, Math.max(0, heroConfig.ctaEnterDelaySec ?? 0));
    return { '--hero-cta-enter-delay': `${delaySec}s` } as React.CSSProperties;
  }, [heroMotionReplayAt]);

  const heroCtaCard = (
    <div
      key={heroCtaEnterActive ? `hero-cta-motion-${heroMotionReplayAt}` : 'hero-cta-static'}
      id="bli-fadder"
      className={`hero-cta-card w-full max-w-[22rem] scroll-mt-24 rounded-xl bg-white shadow-xl ring-1 ring-black/5 pointer-events-auto lg:z-20 lg:w-[min(22rem,calc(100%-1.5rem))] ${heroCtaEnterActive ? 'hero-cta-enter-lg' : ''}`}
      style={
        {
          '--hero-cta-left': `${ctaPosX}%`,
          '--hero-cta-bottom': ctaBottomCss,
          ...heroCtaEnterDelayStyle,
        } as React.CSSProperties
      }
    >
      <BecomeSponsorModal
        isOpen
        onClose={() => undefined}
        embedded
        heroCtaConfig={heroCtaConfig}
      />
    </div>
  );

  const homeBlockStyle = (id: CmsHomeModuleId): React.CSSProperties => ({
    order: onHome(id) ? homeModuleOrder.indexOf(id) : 99,
    display: onHome(id) ? undefined : 'none',
  });

  return (
    <div className="flex flex-col gap-10 pb-16 isolate">
      {/* 1. HERO SECTION */}
      <section
        id="home"
        data-cms-section="hero"
        data-cms-label="Hovedbanner"
        style={{
          ...homeBlockStyle('hero'),
          ...(heroPreviewFillsViewport ? { minHeight: CMS_PREVIEW_HERO_MIN_HEIGHT_CSS } : {}),
        }}
        className={`relative z-0 scroll-mt-24 rounded-lg transition-shadow overflow-visible ${previewMark('hero')}`}
      >
        <HomeColumn cms={cmsContent}>
          <div className="w-full overflow-visible">
            <div
              className="relative w-full overflow-visible"
              style={{
                minHeight: heroImageCssHeight,
                paddingBottom: heroSceneBottomPadding,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 overflow-hidden bg-[#F6F4ED]"
                style={{ height: heroImageCssHeight }}
              >
                <img
                  key={heroZoomActive ? `hero-zoom-${heroMotionReplayAt}` : 'hero-zoom-static'}
                  src={heroImageSrc}
                  alt="Betyna sammen med barn i Kongo"
                  className={`absolute inset-0 h-full w-full object-cover ${heroZoomActive ? 'hero-image-slow-zoom' : ''}`}
                  style={heroZoomStyle}
                />
                {heroConfig.showAnniversaryBadge && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
                    <HeroAnniversaryBadge />
                  </div>
                )}
              </div>

              {headlineOnImageDesktop && (
                <div
                  className="absolute z-20 pointer-events-none px-2 text-left hidden lg:block"
                  style={{
                    left: `${headlinePosX}%`,
                    top: `${headlinePosY}%`,
                    width: `${headlineBoxWidth}%`,
                    maxWidth: `calc(100% - ${headlinePosX}%)`,
                  }}
                >
                  {heroHeadlineTone === 'light' && (
                    <div
                      className="rounded-lg px-1 py-2 -mx-1"
                      style={{
                        background: `linear-gradient(105deg, rgba(0,0,0,${(heroScrim / 100) * 0.55}) 0%, rgba(0,0,0,${(heroScrim / 100) * 0.25}) 55%, transparent 100%)`,
                      }}
                    >
                      {renderHeroHeadline(heroHeadlineTone)}
                    </div>
                  )}
                  {heroHeadlineTone === 'dark' && (
                    <div className="rounded-lg px-1 py-2 -mx-1">{renderHeroHeadline(heroHeadlineTone)}</div>
                  )}
                </div>
              )}

              {heroConfig.showCtaCard && (
                <div className="mt-5 lg:mt-0 lg:contents">{heroCtaCard}</div>
              )}
            </div>

            {heroHeadlineFlowReservePx > 0 && (
              <div
                className="hidden lg:block w-full shrink-0"
                style={{ height: heroHeadlineFlowReservePx }}
                aria-hidden
              />
            )}

            <div className="mt-5 text-left lg:hidden">
              {heroHasHeadlineCopy(cmsContent.hero) && renderHeroHeadline('dark')}
            </div>
            {!headlineOnImageDesktop && heroHasHeadlineCopy(cmsContent.hero) && (
              <div
                className="relative z-30 text-left hidden lg:block"
                style={{
                  marginTop: getHeroHeadlineBelowMarginTopPx(cmsContent.hero),
                  marginLeft: `${headlinePosX}%`,
                  width: `${headlineBoxWidth}%`,
                  maxWidth: `calc(100% - ${headlinePosX}%)`,
                }}
              >
                {renderHeroHeadline(heroHeadlineTone)}
              </div>
            )}
          </div>
        </HomeColumn>
      </section>

      {/* Om oss: Betynas historie (CMS-modul). Skjult som standard, og vises kun når den er på og har tekst. */}
      {/* I CMS-forhåndsvisningen vises den også uten tekst (med plassholder), så den kan klikkes for redigering. */}
      {onHome('omOss') && (aboutUsHasText(aboutUs) || cmsPreviewEmbedded) && (
        <section
          id="om-betyna"
          data-cms-section="omOss"
          data-cms-label="Om oss"
          style={homeBlockStyle('omOss')}
          className={`relative z-10 scroll-mt-24 rounded-2xl transition-shadow ${previewMark('omOss')}`}
        >
          <HomeColumn cms={cmsContent}>
            <div className="bg-white rounded-2xl border border-[#DFD9CB] p-8 md:p-12 shadow-xs">
              <div className={`grid grid-cols-1 gap-8 ${aboutUsImageSrc ? 'md:grid-cols-2 md:items-center' : ''}`}>
                {aboutUsImageSrc && (
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img
                      src={aboutUsImageSrc}
                      alt={aboutUs.imageAlt ?? ''}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="w-full space-y-4">
                  <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
                    {aboutUs.kicker}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{aboutUs.title}</h2>
                  {aboutUsHasText(aboutUs) ? (
                    <SafeHtml
                      html={aboutUs.bodyHtml}
                      className="text-sm text-stone-700 leading-relaxed font-sans rich-html"
                    />
                  ) : (
                    <p className="text-sm text-stone-400 italic">
                      Historien er ikke skrevet ennå. Klikk her for å skrive den. (Vises ikke på nettsiden før det finnes tekst.)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </HomeColumn>
        </section>
      )}

      {/* Vitnesbyrd: CMS-tekst + kort i rutenett (runde 3) */}
      <section
        id="historier"
        data-cms-section="stories"
        data-cms-label="Vitnesbyrd"
        style={{
          ...homeBlockStyle('stories'),
          display: onHome('stories') && frontPageStories.length > 0 ? undefined : 'none',
        }}
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow bg-[#F6F4ED] ${previewMark('stories')}`}
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

      <section
        id="venter-fadder"
        data-cms-section="waiting"
        data-cms-label="Disse venter på fadder"
        style={{
          ...homeBlockStyle('waiting'),
          display: onHome('waiting') && waitingCards.length > 0 ? undefined : 'none',
        }}
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow ${previewMark('waiting')}`}
      >
        <HomeColumn cms={cmsContent}>
          <WaitingSponsorsSection
            section={waitingSection}
            cards={waitingCards.slice(0, 4)}
            onBliFadder={scrollToBliFadder}
            onSeeAll={scrollToBliFadder}
          />
        </HomeColumn>
      </section>

      {/* 3. FADDERORDNINGEN (Slik fungerer det) */}
      <section
        id="fadderordningen"
        data-cms-section="steps"
        data-cms-label="Fadderordningen"
        style={homeBlockStyle('steps')}
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow bg-[#F6F4ED] ${previewMark('steps')}`}
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
                  <SafeHtml
                    html={stepDesc}
                    className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans rich-html"
                  />
                </div>
              </div>
            );
          })}
        </div>

        </HomeColumn>
      </section>

      {/* 3b. HVA STØTTEN GJØR (egen modul rett etter Fadderordningen) */}
      <section
        id="hva-stotten-gjor"
        data-cms-section="stotte"
        data-cms-label="Hva støtten gjør"
        style={homeBlockStyle('stotte')}
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow bg-[#F6F4ED] ${previewMark('stotte')}`}
      >
        <HomeColumn cms={cmsContent}>
        <div className="mb-10 w-full">
          <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
            {language === 'fr' ? t('support.kicker', supportCards.kicker) : supportCards.kicker}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            {language === 'fr' ? t('support.title', supportCards.title) : supportCards.title}
          </h2>
          {supportCards.intro?.trim() && (
            <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
              {language === 'fr' ? t('support.intro', supportCards.intro) : supportCards.intro}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {supportCards.cards.map((card, idx) => {
            const Icon = [Heart, Users, GraduationCap][idx % 3];
            const cardTitle =
              language === 'fr' ? t(`sponsorship.card${(idx % 3) + 1}Title`, card.title) : card.title;
            const cardDesc =
              language === 'fr' ? t(`sponsorship.card${(idx % 3) + 1}Desc`, card.description) : card.description;
            return (
              <div
                key={card.id}
                className="bg-white p-5 rounded-xl border border-[#DFD9CB] shadow-xs space-y-2"
              >
                <Icon className="w-5 h-5 text-[#4D6B3E]" />
                <h3 className="text-base font-serif font-bold text-stone-900">{cardTitle}</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{cardDesc}</p>
              </div>
            );
          })}
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
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow bg-[#F6F4ED] ${previewMark('kpis')}`}
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
        className={`relative z-10 scroll-mt-24 transition-shadow bg-[#F6F4ED] ${previewMark('about')}`}
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

            {publishedAboutCards(cmsContent.aboutCards).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
                {t('profile.valuesHeading', 'Verdier vi bygger på')}
              </h3>
              <div className={`grid ${aboutCardsGridClass(aboutCardsColumns(cmsContent))} gap-6`}>
            {publishedAboutCards(cmsContent.aboutCards).map((card) => {
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
                    <SafeHtml
                      html={cardDesc}
                      className="text-xs text-stone-600 leading-relaxed font-sans mt-1 rich-html"
                    />
                  </div>
                </div>
              );
            })}
              </div>
            </div>
            )}
          </HomeColumn>
        </div>
      </section>

      {/* 7. ÅPENHET OG ØKONOMI */}
      <section id="apenhet" data-cms-section="apenhet" style={homeBlockStyle('apenhet')} className="scroll-mt-24">
        <HomeColumn cms={cmsContent}>
        <div className="bg-white rounded-2xl border border-[#DFD9CB] p-8 md:p-12 shadow-xs">
          <div className="mb-8 w-full">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
              {language === 'fr' ? t('transparency.kicker', transparency.kicker) : transparency.kicker}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
              {language === 'fr' ? t('transparency.title', transparency.title) : transparency.title}
            </h2>
            <p className="text-sm text-stone-700 mt-2 leading-relaxed">
              {language === 'fr' ? t('transparency.intro', transparency.intro) : transparency.intro}
            </p>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              {language === 'fr' ? (
                <>
                  Ti faddere à 3 500 kroner i året gir 35 000 kroner til ett barns løp. Ingen lønn tas ut i Betyna.{' '}
                  {t(
                    'transparency.legalFormShort',
                    'Vi er foreløpig ikke stiftelse — med vilje — så mer av det som kommer inn kan gå til barna.'
                  )}
                </>
              ) : (
                transparency.secondary
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
            {transparency.cards.map((card) => (
              <div key={card.id} className="space-y-2">
                <h3 className="text-sm font-semibold text-stone-900">
                  {language === 'fr' ? t(`transparency.${card.id}Title`, card.title) : card.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  {language === 'fr' ? t(`transparency.${card.id}Desc`, card.description) : card.description}
                </p>
              </div>
            ))}
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
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow bg-[#F6F4ED] ${previewMark('behov')}`}
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
        className={`relative z-10 scroll-mt-24 rounded-lg transition-shadow bg-[#F6F4ED] ${previewMark('cta')}`}
      >
        {ctaBanner && (
          <HomeColumn cms={cmsContent}>
            <div className="w-full rounded-2xl border border-[#DFD9CB] bg-white p-8 md:p-10 text-center shadow-xs">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">{ctaBanner.title}</h2>
              <SafeHtml
                html={ctaBanner.subtitle}
                className="mt-3 text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed rich-html"
              />
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
