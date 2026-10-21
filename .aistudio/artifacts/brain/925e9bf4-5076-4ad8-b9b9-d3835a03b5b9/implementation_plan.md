# Vurdering av Betyna CMS & Implementeringsplan for Rik Teksteditor

En helhetlig gjennomgang og benchmark av Betyna CMS mot moderne bransjeløsninger (Sanity.io og Strapi v5), karaktersetting (0–10), samt en konkret plan for innføring av en skreddersydd rik teksteditor (Rich Text Editor) tilpasset stiftelsens redaksjonelle behov.

---

## Benchmark & Vurdering: Betyna CMS vs. Sanity & Strapi

### Samlet karakter for Betyna CMS i dag: **7.5 / 10**

Betyna CMS har et eksepsjonelt sterkt fundament fordi det er bygget spesifikt for bistands- og fadderformål. Løsningen overgår generiske CMS-er på domenetilpasning og redaksjonell trygghet, men har klare forbedringsområder innen tekstformatering og blokkstruktur.

| Kriterium | Betyna CMS (i dag) | Sanity Studio v3 | Strapi v5 | Vurdering & Kommentar |
| :--- | :---: | :---: | :---: | :--- |
| **Arbeidsflate & Live Preview** | **9 / 10** | 8.5 / 10 | 6 / 10 | 3-flate layouten (Seksjonsliste, Redigering, Live forhåndsvisning med klikk-for-å-redigere og enhetsvelger) er i toppklasse. Sanity krever oppsett av *Visual Editing* via Vercel/Next, mens Strapi mangler integrert forhåndsvisning ut av boksen. |
| **Domenesikkerhet & Etikk** | **10 / 10** | 7 / 10 | 6 / 10 | Innebygde sperrer mot GDPR-lekkasjer (aldri ekte barneprofiler åpent på nett, kun anonymiserte illustrasjonskort), obligatoriske samtykkeflagg for vitnesbyrd og tospråklig godkjenningskø. |
| **Tekstredigering & Formatering** | **4 / 10** | **9.5 / 10** | **8.5 / 10** | **Største svakhet i dag**: Betyna benytter rene `<textarea>`-felter. Redaktøren kan ikke lage fete ord, kursiv, understreking, punktlister, sitater eller klikkbare lenker i brødtekst/ingress uten å skrive rå HTML. |
| **Bilde- og Mediahåndtering** | **7 / 10** | 9 / 10 | 8 / 10 | Støtter lokale opplastinger og preservering av ekte bilder (`IMG_1194.jpg`, `FullSizeR.jpg`), men mangler avansert beskjæring (hotspot/crop focal point) som Sanity har. |
| **Brukervennlighet for frivillige** | **8.5 / 10** | 6.5 / 10 | 6 / 10 | Svært lav terskel. Ingen overflødige utvikler-innstillinger; alt er tilpasset stiftelsens faktiske seksjoner og tekster. |

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Brukeren har spesifisert:
> - **Benchmark-referanse**: Strukturerte headless CMS som Sanity og Strapi.
> - **Prioritert forbedring**: Innføring av en moderne **rik teksteditor** i stedet for flate tekstfelter.

### Evaluering av Rich Text-motorer for Betyna:
1. **TipTap (ProseMirror-basert) — (Anbefalt)**:
   - *Hvorfor*: Det mest moderne rammeverket for React/TypeScript i dag. Gir full kontroll over Tailwind-styling, null bloat, og produserer ren semantisk HTML eller strukturert JSON.
   - *Funksjoner*: Flytende eller fast formateringslinje: **Fet**, *Kursiv*, Lenke (`<a>`), Punktliste (`<ul>`), Nummerert liste (`<ol>`), Sitatblokk (`<blockquote>`) og Myk linjeskift.
2. **Slate.js**:
   - Kraftig, men vesentlig mer uferdig boilerplate og høyere vedlikeholdsbyrde enn TipTap.
3. **Lexical (Meta)**:
   - Rask og moderne, men overdimensjonert for ingress- og modulredigering og mer rigid på styling.

---

## 1. Overview & Core Concept

- **Mål**: Erstatte flate tekstområder (`<textarea>`) i Betyna CMS med en profesjonell, brukervennlig **rik teksteditor** (Rich Text Toolbar) for overskrifter, ingresser, vitnesbyrd og historier.
- **Opplevelse for redaktøren**:
  - En elegant, diskret verktøylinje over tekstfeltet med ikoner for formatering.
  - Mulighet til å markere tekst og trykke `B` (Fet), `I` (Kursiv), legge inn trygge eksterne lenker, punktlister for nøkkelopplysninger, og sitatstreker for vitnesbyrd.
  - Endringene reflekteres umiddelbart i sanntid i den levende forhåndsvisningen (Flate 3).

---

## 2. User Experience & Visual Design

### Design av rik teksteditor i Flate 2
- **Verktøylinje (Toolbar)**:
  - Plassert rett over inndatafeltet: `[Fet] [Kursiv] [Understreking] | [Lenke] | [Punktliste] [Nummerert liste] | [Sitatblokk] | [Fjern formatering]`.
  - Tastatursnittveier: `Ctrl+B` / `Cmd+B` for fet, `Ctrl+I` / `Cmd+I` for kursiv, `Ctrl+K` for å sette inn lenke.
- **Lenkemodal / Popover**:
  - Enkel boks som ber om nettadresse og sjekker at lenken er gyldig (beskytter mot brutte adresser).
- **Typografisk integrasjon**:
  - Samme skrifttype i editoren som på forsiden, slik at redaktøren ser nøyaktig hvordan linjeskift og orddeling blir.

---

## 3. Key Product Decisions & Trade-Offs

- **Beslutning 1: TipTap som kjerne**:
  - *Valgt løsning*: `@tiptap/react` og `@tiptap/starter-kit` sammen med `@tiptap/extension-link`.
  - *Hvorfor*: Industrileder i moderne CMS-er. Brukes blant annet i moderne Sanity- og Notion-lignende løsninger.
- **Beslutning 2: Lagringsformat (Sanity vs. HTML)**:
  - *Valgt løsning*: Semantisk, sanitert HTML-streng i tilstand/lagring.
  - *Hvorfor*: Sikrer at eksisterende data i `INITIAL_CMS_CONTENT` og Firestore fungerer sømløst uten behov for migrasjon av eksisterende strenger, samtidig som forhåndsvisningen kan rendre innholdet direkte.

---

## 4. Technical Architecture & Data Strategy

### Arkitekturdiagram for Rik Tekst

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Betyna Rich Text Editor                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  [B]  [I]  [U]  │  [🔗 Lenke]  │  [• Liste]  [1. Liste]  │  [" Sitat]      │ Formateringslinje
├─────────────────────────────────────────────────────────────────────────────┤
│  Betyna er unik fordi vi ikke stopper ved skolegang alene. For **250–350   │ TipTap Editor
│  kroner i måneden** følger vi barnet helt til det har fullført et fagbrev...│ Innholdsfelt
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ onChange(htmlContent)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AppContext Draft State & Bridge                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ postMessage(CMS_PREVIEW_MESSAGE)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            Flate 3: Live Preview (Renderer formateringen direkte)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Konkrete oppgaver ved godkjenning:
1. Installere `@tiptap/react`, `@tiptap/starter-kit` og `@tiptap/extension-link`.
2. Bygge en gjenbrukbar komponent `RichTextEditor.tsx` med verktøylinje, tastatursnarveier og styling som matcher Betynas designmanual.
3. Erstatte flate tekstfelter for:
   - Hovedbanner: Ingress / forklarende tekst.
   - Vitnesbyrd: Historiefelt og sitat.
   - Fadderordningen: Rammebeskrivelser.
   - Kjernerammer: Utdypende etikk- og verdighetstekster.
4. Oppdatere `PublicWebsite.tsx` til å gjengi formateringen trygt med sanitert HTML.
5. Verifisere med typesjekk og bygg.
