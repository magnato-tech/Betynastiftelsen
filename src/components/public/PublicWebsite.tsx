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

  const heroKicker = language === 'en' ? t('hero.kicker', cmsContent.hero.kicker) : cmsContent.hero.kicker;
  const heroTitle = language === 'en' ? t('hero.title', cmsContent.hero.title) : cmsContent.hero.title;
  const heroSubtitle = language === 'en' ? t('hero.subtitle', cmsContent.hero.subtitle) : cmsContent.hero.subtitle;
  const heroPrimaryBtn = language === 'en' ? t('hero.primaryButton', cmsContent.hero.primaryButtonText) : cmsContent.hero.primaryButtonText;
  const heroSecondaryBtn = language === 'en' ? t('hero.secondaryButton', cmsContent.hero.secondaryButtonText) : cmsContent.hero.secondaryButtonText;
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
      <section className="max-w-7xl mx-auto px-6 pt-6">
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
              const label = language === 'en' ? t(`kpi.kpi${idx + 1}_label`, kpi.label) : kpi.label;
              const sublabel = language === 'en' ? t(`kpi.kpi${idx + 1}_sublabel`, kpi.sublabel) : kpi.sublabel;
              const value = language === 'en' ? t(`kpi.kpi${idx + 1}_value`, kpi.value) : kpi.value;
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
            {t('steps.title', 'Et forpliktende partnerskap for barnets framtid')}
          </h2>
          <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
            {t('steps.subtitle', 'Hver fadder knyttes til et bestemt barn. Koordinator i Kongo følger opp, og oppdateringer legges ut når de er godkjent.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cmsContent.steps.map((step) => {
            const stepTitle = language === 'en' ? t(`steps.step${step.number}_title`, step.title) : step.title;
            const stepDesc = language === 'en' ? t(`steps.step${step.number}_desc`, step.description) : step.description;
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

        {/* CMS-Configurable CTA Banner */}
        {(() => {
          const defaultCta = {
            title: language === 'en' ? t('cta.title') : 'Ønsker du å vite mer om fadderansvaret?',
            subtitle: language === 'en' ? t('cta.subtitle') : 'Fadderbeløpet er 250 eller 350 kr/mnd og går uavkortet til det barnet trenger for å fullføre skolegangen.',
            buttonText: language === 'en' ? t('cta.primaryButton') : 'Meld interesse som fadder',
            backgroundImageUrl: '',
            scrimOpacity: 75,
          };
          const rawCta = cmsContent.ctaBanner;
          const cta = rawCta
            ? {
                ...rawCta,
                title: language === 'en' ? t('cta.title', rawCta.title) : rawCta.title,
                subtitle: language === 'en' ? t('cta.subtitle', rawCta.subtitle) : rawCta.subtitle,
                buttonText: language === 'en' ? t('cta.primaryButton', rawCta.buttonText) : rawCta.buttonText,
              }
            : defaultCta;

          return (
            <div className="relative overflow-hidden mt-8 p-6 sm:p-8 rounded-xl border border-[#DFD9CB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-[#EBE7DC]/60">
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
            15 barn har fått skolegang i 10–15 år, med utdanning i ulike fag. Enkeltnavn og historier legges ut først når samtykke er dokumentert.
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
      {import.meta.env.DEV && (
      <section id="aksjoner" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="max-w-2xl mb-12">
          <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Konkrete behov</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
            Ekstraordinære innsamlingsaksjoner
          </h2>
          <p className="text-sm sm:text-base text-stone-700 mt-3 leading-relaxed">
            Av og til oppstår det avgrensede og målbare behov for utstyr eller læremidler som faller utenfor ordinære månedlige fadderbidrag. Alle aksjoner avstemmes separat med åpen sluttrapport.
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

      {/* 6. OM BETYNA */}
      <section id="om-oss" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Om Betyna</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Grunnlagt på tillit, lokal forankring og verdighet
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              Betyna er frivillig arbeid for skolegang i Den demokratiske republikken Kongo. Bidraget går uavkortet til det barnet trenger for å fullføre.
            </p>
            <p className="text-sm text-stone-700 leading-relaxed font-sans">
              Vi anser skolegang som en grunnleggende menneskerett og den mest effektive veien ut av generasjonell fattigdom. Ved å ha faste koordinatorer på bakken som kjenner familiene og skolene, unngår vi byråkrati og sikrer at hver krone gir reell læring.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cmsContent.aboutCards.map((card) => {
              const IconComp =
                card.iconName === 'Scale'
                  ? Scale
                  : card.iconName === 'FileCheck'
                  ? FileCheck
                  : card.iconName === 'ShieldCheck'
                  ? ShieldCheck
                  : Users;
              return (
                <div key={card.id} className="bg-white p-6 rounded-xl border border-[#DFD9CB] shadow-xs space-y-2 flex flex-col justify-between">
                  <div>
                    {card.imageUrl && (
                      <div className="w-full h-28 rounded-lg overflow-hidden mb-3 border border-stone-200">
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <IconComp className="w-5 h-5 text-[#4D6B3E] mb-1" />
                    <h3 className="text-base font-serif font-bold text-stone-900">{card.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans mt-1">{card.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. ÅPENHET OG ØKONOMI */}
      <section id="apenhet" className="max-w-7xl mx-auto px-6 scroll-mt-24">
        <div className="bg-white rounded-2xl border border-[#DFD9CB] p-8 md:p-12 shadow-xs">
          <div className="max-w-2xl mb-8">
            <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">Økonomi & Transparens</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
              Full åpenhet om hver krone
            </h2>
            <p className="text-sm text-stone-700 mt-2 leading-relaxed">
              Ti faddere à 3 500 kroner i året gir 35 000 kroner. Hele beløpet går til skolegangen. Ingen lønn tas ut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-900">Fadderbidrag (250–350 kr/mnd)</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Går uavkortet til skolepenger, medisiner, skoleutstyr, mat, husleie og annet som trengs for å fullføre skolegangen.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-900">Det barnet trenger</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Skolepenger, medisiner, skoleutstyr, mat, husleie og annet som trengs for å fullføre skolegangen.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-stone-900">Ingen trekk til drift</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                Betyna er ikke en stiftelse. Bidraget brukes ikke til revisor, regnskap eller lønn, så hele beløpet kan gå til skolegangen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
