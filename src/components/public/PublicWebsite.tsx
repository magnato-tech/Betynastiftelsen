import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign } from '../../types';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Heart,
  Users,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Scale,
  Sparkles,
} from 'lucide-react';

interface PublicWebsiteProps {
  onOpenSponsorModal: () => void;
  onOpenDonateModal: (campaign: Campaign) => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onOpenSponsorModal,
  onOpenDonateModal,
  activeSection,
  setActiveSection,
}) => {
  const { campaigns, stories, childrenList, sponsors, cmsContent, language, t } = useApp();

  const activeCampaigns = campaigns.filter((c) => c.status === 'aktiv');
  const completedCampaigns = campaigns.filter((c) => c.status === 'fullfort');

  const heroKicker = language === 'fr' ? t('hero.kicker', cmsContent.hero.kicker) : cmsContent.hero.kicker;
  const heroTitle = language === 'fr' ? t('hero.title', cmsContent.hero.title) : cmsContent.hero.title;
  const heroSubtitle = language === 'fr' ? t('hero.subtitle', cmsContent.hero.subtitle) : cmsContent.hero.subtitle;
  const heroPrimaryBtn = language === 'fr' ? t('hero.primaryButton', cmsContent.hero.primaryButtonText) : cmsContent.hero.primaryButtonText;
  const heroSecondaryBtn = language === 'fr' ? t('hero.secondaryButton', cmsContent.hero.secondaryButtonText) : cmsContent.hero.secondaryButtonText;
  const heroImageUrl = cmsContent.hero.backgroundImageUrl?.trim() || 'IMG_1194.jpg';
  const heroImageSrc =
    heroImageUrl.startsWith('http://') || heroImageUrl.startsWith('https://') || heroImageUrl.startsWith('data:') || heroImageUrl.startsWith('/')
      ? heroImageUrl
      : `/${heroImageUrl}`;

  React.useEffect(() => {
    if (activeSection === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(activeSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSection]);

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section id="home" className="max-w-7xl mx-auto px-6 pt-6 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#4D6B3E]">
              <span>{heroKicker}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#3C3C3C] leading-[1.15] text-balance">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-stone-700 font-sans leading-relaxed">
              {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onOpenSponsorModal}
                className="px-6 py-3.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{heroPrimaryBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveSection('fadderordningen')}
                className="px-5 py-3.5 bg-white hover:bg-[#EBE7DC] text-[#3C3C3C] font-medium rounded-lg text-sm transition-all border border-[#DFD9CB] flex items-center justify-center cursor-pointer"
              >
                {heroSecondaryBtn}
              </button>
            </div>

            {/* Clean unboxed proof metadata */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-stone-600 border-t border-[#DFD9CB]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{t('hero.proof1', 'Pengene går uavkortet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{t('hero.proof2', 'Null kommersielle mellomledd')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#4D6B3E]" />
                <span>{t('hero.proof3', 'Verdighet foran klikkagn')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <figure className="overflow-hidden rounded-2xl border border-[#DFD9CB] bg-stone-200 shadow-sm">
              <img
                src={heroImageSrc}
                alt="Betyna sammen med barn i Kongo"
                className="w-full aspect-[3/4] object-cover object-[center_30%]"
              />
            </figure>
          </div>
        </div>
      </section>

      {/* 2. OPERATIONAL EVIDENCE / KEY METRICS STRIP */}
      <section className="bg-[#EBE7DC]/50 border-y border-[#DFD9CB] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {cmsContent.kpiStats.map((kpi, idx) => {
              const label = language === 'fr' ? t(`kpi.kpi${idx + 1}_label`, kpi.label) : kpi.label;
              const sublabel = language === 'fr' ? t(`kpi.kpi${idx + 1}_sublabel`, kpi.sublabel) : kpi.sublabel;
              const value = language === 'fr' ? t(`kpi.kpi${idx + 1}_value`, kpi.value) : kpi.value;
              return (
                <div key={kpi.id} className="space-y-1">
                  <div className="text-3xl font-serif font-bold text-stone-900 font-mono tabular-nums">
                    {value}
                  </div>
                  <p className="text-xs text-stone-600 uppercase tracking-wider font-medium">{label}</p>
                  <p className="text-xs text-stone-500">{sublabel}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FADDERORDNINGEN (Slik fungerer det) */}
      <section id="fadderordningen" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="max-w-2xl mb-12">
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

        <div className="mt-10 bg-[#F6F4ED] border border-[#DFD9CB] rounded-xl p-6 md:p-8 space-y-4">
          <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
            {t('sponsorship.realityTitle', 'Privatskole — og du betyr en forskjell')}
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.realityParagraph1',
              'De fleste barn i Kongo går på privatskole som koster penger. Er du med som fadder, er ett barn helt avhengig av deg — ikke av en stor, anonym giverpool.'
            )}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.realityParagraph2',
              'Vi er en liten organisasjon. Skoleplassen for barnet du følger, henger på at støtten er stabil over tid. Derfor er vi tydelige på én fadder og ett barn: du er ikke én i mengden, og det du bidrar med, merkes i hverdagen på skolen.'
            )}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.realityParagraph3',
              'For det ene barnet kan det bety alt. For den som utdanner seg til jordmor, sykepleier eller lege, kan det bety et langt liv i tjeneste for andre.'
            )}
          </p>
        </div>

        <div className="mt-6 bg-white border border-[#DFD9CB] rounded-xl p-6 md:p-8 space-y-4 shadow-xs">
          <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900">
            {t('sponsorship.moneyFlowTitle', 'Pengene frem — via familien som bærer ansvaret')}
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.moneyFlowParagraph1',
              'Vi sørger for at pengene kommer frem til barnet som trenger det. Barnet får ikke pengene selv — de går til omsorgspersoner i familien som bruker dem til skole, mat, uniform og det som trengs.'
            )}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.moneyFlowParagraph2',
              'I Kongo tar ikke det offentlige hånd om barn som mister mor eller far, eller som ikke har råd til skole. Storfamilien overtar ansvaret. Som fadder støtter du det systemet som faktisk fungerer.'
            )}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.moneyFlowParagraph3',
              'Vi har ikke tro på barnehjem — det er et fremmedelement i denne kulturen. Vi tror på å støtte storfamilien når de trår til, med vår hjelp. Ofte trengs det ikke så mye før barna får skolegang, uniform, sekk og medisiner.'
            )}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.moneyFlowParagraph4',
              'En liten andel av det som kommer inn settes av til det ekstra: når noen blir syke eller må på sykehus. Malaria dreper mange barn i Kongo — med litt å gå på kan vi sende ekstra med kort varsel når et barn trenger det.'
            )}
          </p>
          <p className="text-sm text-stone-700 leading-relaxed font-sans">
            {t(
              'sponsorship.moneyFlowParagraph5',
              'Én gang i året er det skolestart. Sekker og utstyr varer omtrent et år, så vi setter av til det. Ønsker fadderen å gi et ekstraordinært beløp — ved sykdom, skolestart, bursdag eller jul — er det alltid velkomment, men helt frivillig.'
            )}
          </p>
        </div>

        {/* CMS-Configurable CTA Banner */}
        {(() => {
          const defaultCta = {
            title: language === 'fr' ? t('cta.title') : 'Ønsker du å vite mer om fadderansvaret?',
            subtitle: language === 'fr' ? t('cta.subtitle') : 'Fadderbeløpet er 250 eller 350 kr/mnd og går uavkortet til det barnet trenger for å fullføre fagbrev eller utdanning — helt til det kan forsørge sin familie.',
            buttonText: language === 'fr' ? t('cta.primaryButton') : 'Meld interesse som fadder',
            backgroundImageUrl: '',
            scrimOpacity: 75,
          };
          const rawCta = cmsContent.ctaBanner;
          const cta = rawCta
            ? {
                ...rawCta,
                title: language === 'fr' ? t('cta.title', rawCta.title) : rawCta.title,
                subtitle: language === 'fr' ? t('cta.subtitle', rawCta.subtitle) : rawCta.subtitle,
                buttonText: language === 'fr' ? t('cta.primaryButton', rawCta.buttonText) : rawCta.buttonText,
              }
            : defaultCta;

          return (
            <div id="cta" className="relative overflow-hidden mt-8 p-6 sm:p-8 rounded-xl border border-[#DFD9CB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#EBE7DC]/60 scroll-mt-24">
              {cta.backgroundImageUrl && (
                <>
                  <img
                    src={cta.backgroundImageUrl}
                    alt="CTA banner"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-stone-950/75"
                    style={{ opacity: (cta.scrimOpacity || 75) / 100 }}
                  />
                </>
              )}
              <div className={`relative space-y-1 ${cta.backgroundImageUrl ? 'text-white' : 'text-stone-900'}`}>
                <h4 className="text-base sm:text-lg font-serif font-bold">
                  {cta.title}
                </h4>
                <p className={`text-xs sm:text-sm max-w-2xl ${cta.backgroundImageUrl ? 'text-stone-200' : 'text-stone-600'}`}>
                  {cta.subtitle}
                </p>
              </div>
              <button
                onClick={onOpenSponsorModal}
                className="relative px-5 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0 shadow-xs"
              >
                {cta.buttonText}
              </button>
            </div>
          );
        })()}
      </section>

      {/* 4. HISTORIER OG DOKUMENTERTE RESULTATER (Faddere, elever og mottakere) */}
      <section id="historier" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
            {t('testimonials.kicker', 'Dokumenterte resultater')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            {t('testimonials.title', 'Ekte vitnesbyrd fra faddere, elever og voksne mottakere')}
          </h2>
          <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
            15 barn har fulgt hele løpet i 10–15 år — til fagbrev, utdanning og jobb. Enkeltnavn og historier legges ut først når samtykke er dokumentert.
          </p>
        </div>

        {import.meta.env.DEV && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories
            .filter((s) => s.godkjentAvAdmin !== false && s.fremhevetPaaForside !== false)
            .map((story) => {
              const category = story.category || 'graduate';
              const resolvedPhoto = story.bildeUrl
                ? story.bildeUrl.startsWith('http') || story.bildeUrl.startsWith('data:') || story.bildeUrl.startsWith('/')
                  ? story.bildeUrl
                  : `/${story.bildeUrl}`
                : undefined;

              return (
                <article
                  key={story.id}
                  className="bg-white p-6 rounded-xl border border-[#DFD9CB] shadow-xs flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1 font-medium">
                        {category === 'donor' && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            {t('testimonials.badgeDonor', 'Fadder i Norge')}
                          </span>
                        )}
                        {category === 'child' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            {t('testimonials.badgeChild', 'Elev / Yrkesopplæring')}
                          </span>
                        )}
                        {category === 'graduate' && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                            {t('testimonials.badgeGraduate', 'Fullført')} {story.aarFullfort ? `(${story.aarFullfort})` : ''}
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('testimonials.verifiedConsent', 'Verifisert samtykke')}</span>
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      {resolvedPhoto ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-stone-800 shrink-0 border border-[#4D6B3E]/40 shadow-xs">
                          <img
                            src={resolvedPhoto}
                            alt={story.navn}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#A3B18A]/25 text-[#4D6B3E] font-serif font-bold flex items-center justify-center shrink-0 text-base shadow-xs">
                          {story.navn.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-serif font-bold text-stone-900 leading-snug">{story.navn}</h3>
                        <p className="text-xs text-[#4D6B3E] font-medium mt-0.5">{story.rolle || story.naavaerendeYrke}</p>
                        {story.sted && <p className="text-[11px] text-stone-500">{story.sted}</p>}
                      </div>
                    </div>

                    <blockquote className="text-xs sm:text-sm text-stone-700 italic border-l-2 border-[#4D6B3E] pl-3.5 py-1 leading-relaxed font-serif">
                      «{story.historie}»
                    </blockquote>

                    {story.utdanningslop && (
                      <div className="text-xs text-stone-600 space-y-0.5 pt-2 border-t border-stone-100">
                        <p className="font-semibold text-stone-800 text-[11px] uppercase tracking-wider">
                          {category === 'donor' ? t('testimonials.purpose', 'Bidragsformål:') : t('testimonials.education', 'Opplæringsløp:')}
                        </p>
                        <p className="line-clamp-2">{story.utdanningslop}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5 border-t border-stone-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{t('testimonials.archived', 'Arkivert og godkjent i stiftelsens register')}</span>
                  </div>
                </article>
              );
            })}
        </div>
        )}
      </section>

      {/* 5. EKSTRAORDINÆRE AKSJONER */}
      {campaigns.length > 0 && (
      <section id="aksjoner" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">{t('campaigns.kicker', 'Konkrete behov')}</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            {t('campaigns.title', 'Ekstraordinære innsamlingsaksjoner')}
          </h2>
          <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
            {t(
              'campaigns.subtitle',
              'Ekstra innsamling er alltid knyttet til barn i fadderordningen — ikke til skoleklasser eller felles bøker. Nå samler vi inn til symaskiner, én maskin per jente.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {campaigns.map((camp) => {
            const pct = Math.min(100, Math.round((camp.innsamletBelop / camp.maalbelop) * 100));
            const isCompleted = camp.status === 'fullfort';

            return (
              <div
                key={camp.id}
                className={`bg-white p-7 rounded-xl border ${
                  isCompleted ? 'border-emerald-200' : 'border-stone-200'
                } shadow-xs flex flex-col justify-between space-y-6`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 uppercase tracking-wider font-medium">{camp.enhetBeskrivelse}</span>
                    <span
                      className={`font-semibold ${
                        isCompleted ? 'text-emerald-700' : 'text-[#4D6B3E]'
                      }`}
                    >
                      {isCompleted ? 'Mål oppnådd (Fullført)' : 'Aktiv aksjon'}
                    </span>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-stone-900">{camp.tittel}</h3>
                  {camp.barnIds?.length > 0 && (
                    <p className="text-xs text-[#4D6B3E] font-medium">
                      Knyttet til{' '}
                      {camp.barnIds
                        .map((id) => childrenList.find((c) => c.id === id)?.fornavn)
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}

                  {camp.bildeUrl && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={
                          camp.bildeUrl.startsWith('http') ||
                          camp.bildeUrl.startsWith('data:') ||
                          camp.bildeUrl.startsWith('/')
                            ? camp.bildeUrl
                            : `/${camp.bildeUrl}`
                        }
                        alt={camp.tittel}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-[center_20%]"
                      />
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">{camp.beskrivelse}</p>

                  {/* Progress bar */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="font-semibold text-stone-900">
                        {camp.innsamletBelop.toLocaleString('no-NO')} kr innsamlet
                      </span>
                      <span className="text-stone-500">Mål: {camp.maalbelop.toLocaleString('no-NO')} kr ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-[#4D6B3E]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>{camp.antallGivere} givere har bidratt</span>
                      {!isCompleted && <span>Gjenstår: {(camp.maalbelop - camp.innsamletBelop).toLocaleString('no-NO')} kr</span>}
                    </div>
                  </div>

                  {camp.sluttrapport && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Offisiell sluttrapport:</span>
                      </p>
                      <p className="leading-relaxed">{camp.sluttrapport}</p>
                    </div>
                  )}
                </div>

                {!isCompleted ? (
                  <button
                    onClick={() => onOpenDonateModal(camp)}
                    className="w-full py-3 bg-[#4D6B3E] hover:bg-[#3B522F] text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Støtt denne aksjonen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-stone-500 font-medium">
                    Takk til alle som bidro til å realisere dette behovet!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* 6. PROFIL & VERDIER (bistandsorganisasjon) — nav: Om Betyna */}
      <section id="om-oss" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">
              {t('profile.kicker', 'Profil & verdier')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {t('profile.title', 'En liten bistandsorganisasjon med tydelig retning')}
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              {t(
                'profile.intro1',
                'Betyna er frivillig arbeid i Brazzaville — ikke en stiftelse, ikke masseinnsamling. Vi er en bistandsorganisasjon som følger enkeltbarn over lang tid, med koordinator på bakken og faddere i Norge som kjenner sitt barn.'
              )}
            </p>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              {t(
                'profile.intro2',
                'Vi tror på det som fungerer lokalt: storfamilien som tar ansvar når foreldre mangler eller ikke har råd. Vi bygger ikke barnehjem. Vi støtter skolegang, verdighet og hele løpet til fagbrev, utdanning og jobb.'
              )}
            </p>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              {t(
                'profile.intro3',
                'Verdigrunnlaget er ærlighet, personlig ansvar og at hver krone skal nå barnet — via familien som omsorgsperson, med åpenhet om hva som skjer når noen må slutte som fadder.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-2 text-xs font-medium">
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

          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
              {t('profile.valuesHeading', 'Verdier vi bygger på')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
        </div>
      </section>

      {/* 7. ÅPENHET OG ØKONOMI */}
      <section id="apenhet" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="bg-white rounded-2xl border border-[#DFD9CB] p-8 md:p-12 shadow-xs">
          <div className="max-w-2xl mb-8">
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
              Ti faddere à 3 500 kroner i året gir 35 000 kroner til ett barns løp. Ingen lønn tas ut i Betyna.
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

          <div className="mt-8 pt-8 border-t border-stone-100 max-w-3xl space-y-3">
            <h3 className="text-base font-serif font-bold text-stone-900">
              {t('transparency.legalFormTitle', 'Foreløpig ikke stiftelse — med vilje')}
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              {t(
                'transparency.legalFormParagraph1',
                'Vi er en veldig liten organisasjon. For at pengene skal gå uavkortet til barna, har vi foreløpig ikke råd til å etablere oss som stiftelse. Det ville krevd revisor og annen formell ramme som i praksis kunne kostet en stor del av hele årsbudsjettet.'
              )}
            </p>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              {t(
                'transparency.legalFormParagraph2',
                'Dersom vi vokser gradvis og tiden er inne, vil vi etablere stiftelse — og da må også revisor, regnskap og det formelle være på plass. Inntil da prioriterer vi barna foran byråkrati.'
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
