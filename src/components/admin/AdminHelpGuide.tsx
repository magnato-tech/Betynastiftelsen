import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Globe, Heart, MapPin, ShieldCheck, Monitor } from 'lucide-react';

const HelpScreenshot: React.FC<{ src: string; alt: string; caption?: string }> = ({ src, alt, caption }) => (
  <figure className="space-y-2">
    <div className="rounded-xl border border-[#DFD9CB] bg-white overflow-hidden shadow-xs">
      <img src={src} alt={alt} className="w-full h-auto object-cover" loading="lazy" />
    </div>
    {(caption || alt) && <figcaption className="text-xs text-stone-600 leading-relaxed">{caption || alt}</figcaption>}
  </figure>
);

type HelpSection = 'oversikt' | 'offentlig' | 'fadder' | 'koordinator' | 'admin' | 'workflows';

interface AdminHelpGuideProps {
  setActiveSection: (sec: string) => void;
}

export const AdminHelpGuide: React.FC<AdminHelpGuideProps> = ({ setActiveSection }) => {
  const { setRole } = useApp();
  const [section, setSection] = useState<HelpSection>('oversikt');

  const openAsRole = (
    role: 'public' | 'sponsor' | 'coordinator' | 'admin',
    section?: string
  ) => {
    setRole(role);
    if (role === 'admin' && section) {
      setActiveSection(section);
    } else if (role === 'coordinator' && section) {
      setActiveSection(section);
    } else if (role === 'public') {
      setActiveSection('home');
    } else if (role === 'sponsor') {
      setActiveSection('barn');
    } else if (role === 'coordinator') {
      setActiveSection('eleves');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs: { id: HelpSection; label: string; icon: React.ReactNode }[] = [
    { id: 'oversikt', label: 'Oversikt', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'offentlig', label: 'Offentlig side', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'fadder', label: 'Fadder', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'koordinator', label: 'Koordinator', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'admin', label: 'Administrator', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'workflows', label: 'Test-workflows', icon: <Monitor className="w-3.5 h-3.5" /> },
  ];

  const workflowSteps: {
    id: string;
    role: string;
    title: string;
    steps: string[];
    go: () => void;
  }[] = [
    {
      id: 'ADM-01',
      role: 'Admin',
      title: 'Koble fadder og barn',
      steps: [
        'Bytt til Administrasjon (Kristiansand) i Visningsmodus.',
        'Åpne Barn for barnelisten og Brukere for faddere, koordinatorer og administratorer.',
        'Bruk plusstegnet for å legge til barn eller fadder. Koble dem i den lille boksen «Koble barn og fadder».',
        'Koble en ventende fadder til et barn uten fadder.',
      ],
      go: () => openAsRole('admin', 'barn'),
    },
    {
      id: 'ADM-02',
      role: 'Admin',
      title: 'Godkjenn koordinatorrapport',
      steps: [
        'Gå til Godkjenningskø.',
        'Åpne eldste sak (historie eller rapport) med «Skriv og publiser».',
        'Skriv norsk tekst, se forhåndsvisningen og trykk Publiser til fadder.',
      ],
      go: () => openAsRole('admin', 'godkjenning'),
    },
    {
      id: 'FAD-01',
      role: 'Fadder',
      title: 'Se barn, rapporter og betaling',
      steps: [
        'Bytt til Fadderportal og velg en fadder i nedtrekkslisten.',
        'Gå gjennom Barn, Tidslinje, Rapporter og Betalinger.',
      ],
      go: () => openAsRole('sponsor'),
    },
    {
      id: 'KOORD-01',
      role: 'Koordinator',
      title: 'Logg inn som én av tre koordinatorer',
      steps: [
        'Bytt til Koordinator (Kongo) og velg en koordinator i nedtrekkslisten.',
        'Bekreft at «Liste des élèves» kun viser barn knyttet til den koordinatoren (ca. 3–4 barn hver).',
        'Bytt koordinator og se at listen endres.',
      ],
      go: () => openAsRole('coordinator'),
    },
    {
      id: 'KOORD-02',
      role: 'Koordinator',
      title: 'Rapport + bilde til Kristiansand',
      steps: [
        'Rédiger un rapport for et av dine barn (+ Rédiger un rapport).',
        'Gå til Photos scolaires, last opp bilde med samtykke, send inn.',
        'Bytt til Admin → Godkjenningskø: godkjenn bilde og rapport; sjekk Fadderportal.',
      ],
      go: () => openAsRole('coordinator', 'photos'),
    },
    {
      id: 'ADM-10',
      role: 'Admin',
      title: 'E-post: henvendelse, system og nyhetsbrev',
      steps: [
        'Åpne Innstillinger for e-post: henvendelser, systemmelding og nyhetsbrev.',
        'Automatiske varsler (av/på) ligger på denne siden, øverst under Innstillinger.',
        'Publiser svar i Spørsmålsflyt sender e-post bare hvis «Svar på spørsmål» er på.',
      ],
      go: () => openAsRole('admin', 'innstillinger'),
    },
    {
      id: 'PUB-01',
      role: 'Offentlig',
      title: 'Meld fadderinteresse uten auto-tildeling',
      steps: [
        'Bytt til Offentlig nettside, åpne «Bli fadder».',
        'Send skjema — admin skal se ny rad uten barn til kobling er gjort manuelt.',
      ],
      go: () => openAsRole('public'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-[#DFD9CB] p-6 md:p-8 space-y-3">
        <h2 className="text-xl font-serif font-bold text-stone-900">Brukerveiledning</h2>
        <p className="text-sm text-stone-700 leading-relaxed max-w-3xl">
          Løsningen har fire typer brukertilgang. I utviklingsfasen bytter du rolle med <strong>Visningsmodus</strong> øverst på siden.
          Senere erstattes dette med ekte innlogging. Denne veiledningen beskriver hva hver rolle ser og kan gjøre.
        </p>
        <div className="flex items-start gap-2 text-xs text-stone-600 bg-[#EBE7DC]/60 rounded-lg p-3 border border-[#DFD9CB]">
          <Monitor className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />
          <span>
            Data lagres foreløpig i nettleseren på denne maskinen (prototype). På betyna.no gjelder det samme for testing inntil server og innlogging er på plass.
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSection(tab.id)}
            className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              section === tab.id
                ? 'bg-[#4D6B3E] text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'oversikt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
            <h3 className="text-lg font-serif font-bold text-stone-900">Slik henger det sammen</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Koordinator i Kongo registrerer fakta, rapporter, bilde og øyeblikk (fransk grensesnitt).</li>
              <li>Administrator i Kristiansand godkjenner, oversetter og publiserer til fadder og offentlig side.</li>
              <li>Fadder i Norge ser kun sitt barn, godkjente rapporter og betalingsoversikt.</li>
              <li>Offentlig besøkende ser forsiden uten private barneprofiler.</li>
            </ol>
            <p>
              Ingen private barnehistorier eller sykdom legges ut på den åpne siden uten dokumentert samtykke. Fadderbeløpet beskrives som
              uavkortet til skolegang og det barnet trenger.
            </p>
          </div>
          <HelpScreenshot
            src="/help/visningsmodus.png"
            alt="Visningsmodus øverst på siden"
            caption="Visningsmodus: bytt mellom Offentlig nettside, Fadderportal, Koordinator og Administrasjon."
          />
        </div>
      )}

      {section === 'offentlig' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm text-stone-700">
            <h3 className="text-lg font-serif font-bold text-stone-900">Offentlig nettside (betyna.no)</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>Informasjon om Betyna, fadderordningen og åpenhet.</li>
              <li>Gruppebilde og nøkkeltall: skolegang, videregående, fagbrev (métier) og bachelor — ikke oppmøteprosent eller lederlønn. Tallene 8 / 4 / 2 er mock til de er bekreftet.</li>
              <li>Ingen oppdiktede historier eller eksempelaksjoner på den åpne siden.</li>
              <li>«Bli fadder» forklarer at avtalen gjøres direkte inntil ekte påmelding er klar.</li>
            </ul>
            <button
              type="button"
              onClick={() => openAsRole('public')}
              className="text-xs font-medium text-[#4D6B3E] hover:underline cursor-pointer"
            >
              Åpne offentlig side i Visningsmodus →
            </button>
          </div>
          <HelpScreenshot
            src="/help/offentlig-forside.png"
            alt="Offentlig forside"
            caption="Forsiden besøkende ser på betyna.no."
          />
        </div>
      )}

      {section === 'fadder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm text-stone-700">
            <h3 className="text-lg font-serif font-bold text-stone-900">Fadderportal (Norge)</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>En fadder kan støtte flere barn. Hvert barn har likevel bare én fadder.</li>
              <li>Viser fornavn, skole, klassetrinn og godkjent bakgrunnshistorie.</li>
              <li>Siste godkjente rapport synlig; eldre bak lenke.</li>
              <li>Betalingsoversikt: beløp og om siste innbetaling er registrert.</li>
              <li>Spørsmål til Betyna (kommer fullt ut senere).</li>
            </ul>
            <button
              type="button"
              onClick={() => openAsRole('sponsor')}
              className="text-xs font-medium text-[#4D6B3E] hover:underline cursor-pointer"
            >
              Åpne fadderportal i Visningsmodus →
            </button>
          </div>
          <HelpScreenshot
            src="/help/fadder-portal.png"
            alt="Fadderportal"
            caption="Fadderens side for barnet de støtter."
          />
        </div>
      )}

      {section === 'koordinator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 text-sm text-stone-700">
            <h3 className="text-lg font-serif font-bold text-stone-900">Koordinator (Kongo)</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>Hele grensesnittet er på fransk.</li>
              <li>Koordinator ser bare barna som er knyttet til seg.</li>
              <li>Kan sende fakta, rapport (fransk avsnitt), bilde og øyeblikk separat.</li>
              <li>Etter innsending: «sendt» — ikke den norske faddersiden.</li>
              <li>Admin og koordinator kan opprette nytt barn; det går i kø som «skriv historien».</li>
            </ul>
            <button
              type="button"
              onClick={() => openAsRole('coordinator')}
              className="text-xs font-medium text-[#4D6B3E] hover:underline cursor-pointer"
            >
              Åpne koordinator i Visningsmodus →
            </button>
          </div>
          <HelpScreenshot
            src="/help/koordinator-portal.png"
            alt="Koordinatorportal"
            caption="Koordinator ser liste over egne elever og skjema for innsending."
          />
        </div>
      )}

      {section === 'admin' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 text-sm text-stone-700">
              <h3 className="text-lg font-serif font-bold text-stone-900">Administrator (Kristiansand)</h3>
              <p>Innholdskø eldst først. Du kan rette tekst og fakta, forhåndsvise hele faddersiden, og publisere med ett klikk.</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong>Godkjenningskø:</strong> fransk og norsk side om side; godkjenn eller avvis rapporter.
                </li>
                <li>
                  <strong>Barn</strong> og <strong>Brukere:</strong> barn-tabell med klikkbare kort; brukertabell med status (aktiv, invitert, sperret) og invitasjonsskjema; koblingsboks for barn og fadder (ingen auto-tildeling fra nettside).
                </li>
                <li>
                  <strong>Spørsmålsflyt:</strong> svar eller send videre til koordinator (senere).
                </li>
                <li>
                  <strong>Økonomi:</strong> nøkkeltall fra fadderavtaler og transaksjonsloggen, sorterbar tabell og tidsintervall. Avstemmingsgrad telles fra innbetalinger, ikke et tall admin skriver inn.
                </li>
                <li>
                  <strong>CMS:</strong> én fane for forsidetekst, ekstraordinære aksjoner og vitnesbyrd (samtykke og godkjenning før de vises åpent).
                </li>
                <li>
                  <strong>Revisjonslogg:</strong> hva som er gjort i administrasjonen. Ikke et redigeringssted.
                </li>
              </ul>
              <button
                type="button"
                onClick={() => openAsRole('admin', 'godkjenning')}
                className="text-xs font-medium text-[#4D6B3E] hover:underline cursor-pointer"
              >
                Åpne administrasjon i Visningsmodus →
              </button>
            </div>
            <HelpScreenshot
              src="/help/admin-kontrollpanel.png"
              alt="Admin kontrollpanel"
              caption="Administratorens kontrollpanel med faner for godkjenning, faddere og CMS."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HelpScreenshot
              src="/help/admin-godkjenning.png"
              alt="Godkjenningskø"
              caption="Godkjenningskø: koordinators tekst til venstre, norsk til høyre."
            />
            <HelpScreenshot
              src="/help/admin-faddere.png"
              alt="Barn og faddere"
              caption="Legg til fadder og koble til barn. Ingen automatisk tildeling ved manuell registrering."
            />
          </div>
        </div>
      )}

      {section === 'workflows' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#DFD9CB] p-6 space-y-2">
            <h3 className="text-lg font-serif font-bold text-stone-900">Scenarioer for manuell test</h3>
            <p className="text-sm text-stone-700 leading-relaxed">
              Kjør én workflow om gangen. Appen har ingen innebygde eksempeldata: alt innhold ligger i databasen, og alt du gjør lagres der automatisk.
              Automatiserte enhetstester: <code className="text-xs bg-stone-100 px-1 rounded">npm test</code> (fadder-metrics).
            </p>
            <p className="text-xs text-stone-600">
              Detaljerte personaer og historikk: <code className="bg-stone-100 px-1 rounded">docs/SIMULATION_USERS.md</code> og{' '}
              <code className="bg-stone-100 px-1 rounded">docs/WORKFLOWS.md</code>.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowSteps.map((wf) => (
              <article key={wf.id} className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-stone-500">{wf.id} · {wf.role}</span>
                    <h4 className="font-serif font-bold text-stone-900">{wf.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={wf.go}
                    className="shrink-0 text-xs font-medium text-white bg-[#4D6B3E] hover:bg-[#3B522F] px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Start
                  </button>
                </div>
                <ol className="list-decimal list-inside text-stone-700 space-y-1 text-xs leading-relaxed">
                  {wf.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
