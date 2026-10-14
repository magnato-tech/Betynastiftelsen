import React from 'react';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const Footer: React.FC = () => {
  const { t } = useApp();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <h3 className="text-lg font-serif font-bold text-stone-100">{t('footer.aboutTitle', 'Betyna Stiftelsen')}</h3>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              {t('footer.aboutDesc', 'En ideell stiftelse som bygger varige muligheter gjennom utdanningsløp for barn i Den demokratiske republikken Kongo. Hver krone dokumenteres og følges tett.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('footer.gdpr', 'Full personvernoverholdelse (GDPR)')}</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">{t('footer.col2Title', 'Kjernevirksomhet')}</h4>
            <ul className="space-y-1.5 text-xs text-stone-400 font-sans">
              <li>{t('footer.col2Item1', 'Langsiktig fadderoppfølging')}</li>
              <li>{t('footer.col2Item2', 'Barneskoler og yrkesutdanning')}</li>
              <li>{t('footer.col2Item3', 'Dokumenterte skoleframskritt')}</li>
              <li>{t('footer.col2Item4', 'Ekstraordinære aksjoner')}</li>
              <li>{t('footer.col2Item5', 'Strenge etiske retningslinjer')}</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">{t('footer.col3Title', 'Etikk & Åpenhet')}</h4>
            <p className="text-xs text-stone-400 leading-relaxed font-sans">
              {t('footer.col3Desc', 'Vi eksponerer aldri sårbare barns fulle identitet eller private historier offentlig. Kun tildelt fadder mottar godkjente rapporter. Alle vitnesbyrd på nettsiden er fra voksne mottakere med skriftlig samtykke.')}
            </p>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">{t('footer.col4Title', 'Kontakt oss')}</h4>
            <div className="space-y-1.5 text-xs text-stone-400 font-sans">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#A3B18A]" />
                <span>kontakt@betyna-stiftelsen.no</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#A3B18A]" />
                <span>+47 22 00 00 00</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#A3B18A]" />
                <span>{t('footer.location', 'Oslo, Norge · Kinshasa, DR Kongo')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-sans">
          <p>© {new Date().getFullYear()} {t('footer.copyright', 'Betyna Stiftelsen. Organisasjonsnummer under registrering i Enhetsregisteret.')}</p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="footer" />
            <span aria-hidden="true" className="text-stone-700">|</span>
            <span>{t('footer.privacy', 'Personvernerklæring')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('footer.terms', 'Vilkår for fadderskap')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('footer.access', 'Innsynsrett')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
