# CMS- og Innholdsadministrasjon for Betyna Stiftelsen

En helhetlig, seksjonsbasert innholdsadministrasjon (CMS) integrert i administratorens kontrollpanel. Løsningen lar stiftelsens administrator redigere sentrale tekster, rammer, historier og bakgrunnsbilder på den offentlige nettsiden i sanntid, med umiddelbar lagring og mulighet for å tilbakestille enkelte seksjoner.

## Brukeravklaringer & Beslutninger

> [!IMPORTANT]
> Følgende kjernebeslutninger er bekreftet i samråd med produkteier:
>
> - **Seksjonsbasert CMS-fane i Admin**: Innholdsredigeringen samles i en dedikert fane («Nettstedsredigering (CMS)») i administrasjonsportalen, med strukturert redigering av hver innholdsseksjon og umiddelbar forhåndsvisning.
> - **Fleksibel Bilde- og Bakgrunnshåndtering**: Støtte for egendefinerte bilde-URL-er, lokal filopplasting via nettleseren (konverteres trygt til lokal data-URL) og kuraterte, etiske forhåndsdefinerte bakgrunnsmotiver tilpasset bistandskonteksten i Kongo.
> - **Umiddelbar Lagring med Granulær Tilbakestilling**: Endringer lagres og trer i kraft umiddelbart på den offentlige siden. Hver enkelt seksjon utstyres med en egen knapp for å tilbakestille tekst og bilder til standardtekst dersom man ønsker å rulle tilbake.

---

## 1. Oversikt og Kjernekonsept

### Hva løsningen gjør
CMS-modulen erstatter statiske mock-data med et dynamisk redigerbart innholdslag (`CmsContent`) som administreres fra adminpanelet:
1. **Hovedbanner / Hero**:
   - Redigering av overskrift, ingress, merkevaretekst og knappetekster.
   - Valgfritt bakgrunnsbilde med justerbar mørk/lys kontrastgradient (scrim) for å sikre WCAG AA tekstlesbarhet uansett bildevalg.
2. **De 3 trinnene i fadderordningen (Ramme 1, 2, 3)**:
   - Tittel, sammendrag og utdypende forklaring for:
     - Trinn 1: Personlig tildeling
     - Trinn 2: Kvalitetssikrede rapporter
     - Trinn 3: Utdanning til selvstendighet
   - Mulighet for å justere rekkefølge eller oppdatere budskapet.
3. **Vitnesbyrd og Historier (Voksne mottakere)**:
   - Full CRUD (opprette, redigere, slette, reaktivere) for historier fra voksne tidligere elever.
   - Navn, alder, nåværende yrke, utdanningsløp, sitat/historie, fullføringsår og avkryssing for dokumentert samtykke.
4. **Om Stiftelsen & Verdighetsrammer (De 4 kjerneblokkene)**:
   - Redigering av de 4 prinsippene: *Prinsippet om verdighet*, *Ingen oppdiktede historier*, *GDPR & dataminimering* og *Lokal forankring i Kongo*.
5. **Nøkkeltall & Faktabånd**:
   - Redigerbare tellere for antall elever, faddere i Norge, oppmøteprosent og administrasjonskostnader.

---

## 2. Brukeropplevelse og Visuell Profil

### Struktur i CMS-grensesnittet
- **Oversiktlig Seksjonsvelger**:
  - `Hero & Bakgrunn` · `Fadderordningen (1-2-3)` · `Vitnesbyrd & Historier` · `Om Stiftelsen (4 prinsipper)` · `Nøkkeltall`
- **Bildevelger med tre moduser**:
  1. *Filopplasting*: Dra og slipp eller bla gjennom lokale bildefiler.
  2. *Bilde-URL*: Lim inn direkte lenke til godkjente bildearkiver.
  3. *Kuraterte motiver*: Velg blant forhåndsdefinerte, verdige motiver (klasserom, verksted, lesestund, varmt institusjonelt mønster).
- **Sanntids Forhåndsvisningskort**:
  - Viser nøyaktig hvordan rammen eller banneret vil se ut på nettsiden mens administratoren skriver.
- **Tilbakestilling**:
  - Hver seksjon har en diskret knapp: «Tilbakestill seksjon til fabrikkinnstilling».

---

## 3. Nøkkelbeslutninger og Trade-Offs

### Beslutning 1: Seksjonsbasert skjema vs. visuell klikk-og-rediger
- **Valgt løsning**: Seksjonsbasert skjema i adminportalen med forhåndsvisningskort og snarvei til offentlig side.
- **Begrunnelse**: Gir bedre oversikt over feltbegrensninger, samtykkekrav og bildeinnstillinger enn inline-redigering, og forhindrer at administrator ved et uhell endrer layoutstrukturen.

### Beslutning 2: Bildehåndtering uten ekstern filserver
- **Valgt løsning**: Klientstøttet filopplasting via `FileReader` (Base64 data-URL) kombinert med URL-inndata og kuraterte bakgrunner.
- **Begrunnelse**: Gjør prototypen 100 % selvstendig og fungerende uten krav om oppsett av ekstern S3/GCS bøtte eller hemmelige nøkler.

---

## 4. Teknisk Arkitektur & Datamodell

### Arkitekturdiagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                     ADMINISTRASJON: CMS-MODUL                          │
│                                                                        │
│  [Seksjoner]                                                           │
│  ├─ 1. Hero & Bakgrunnsbilde (URL / Opplasting / Kuratert)             │
│  ├─ 2. Ramme 1, 2, 3: Fadderordningens trinn                          │
│  ├─ 3. Vitnesbyrd fra voksne mottakere (CRUD + samtykke)               │
│  ├─ 4. Kjernerammer: Verdighet, etikk og prinsipper                   │
│  └─ 5. Nøkkeltallsbånd                                                 │
│                                                                        │
│  [Handlinger] ───> [updateCmsSection] ───> [Lagre til betyna_v1_cms]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Sanntidssynkronisering
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        OFFENTLIG NETTSIDE                              │
│                                                                        │
│  - Hovedbanner med dynamisk bakgrunn og overskrift                     │
│  - Trinn 1, 2, 3 rendret fra cmsContent.steps                         │
│  - Vitnesbyrd rendret fra cmsContent.stories                          │
│  - Prinsipper & Nøkkeltall oppdatert i sanntid                         │
└────────────────────────────────────────────────────────────────────────┘
```

### TypeScript Datamodell (`/src/types/index.ts`)
```typescript
export interface CmsHero {
  badgeText: string;
  title: string;
  subtitle: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  backgroundImageUrl?: string;
  backgroundPreset: 'pattern' | 'classroom' | 'workshop' | 'custom';
  scrimOpacity: number; // 0 til 100
}

export interface CmsStep {
  number: number;
  title: string;
  description: string;
}

export interface CmsPrincipleCard {
  id: string;
  title: string;
  description: string;
  iconName: 'Scale' | 'FileCheck' | 'ShieldCheck' | 'Users';
}

export interface CmsKpiStat {
  id: string;
  value: string;
  label: string;
  sublabel: string;
}

export interface CmsContent {
  hero: CmsHero;
  steps: CmsStep[];
  aboutCards: CmsPrincipleCard[];
  kpiStats: CmsKpiStat[];
}
```

---

## 5. Implementasjonsrekkefølge

1. **Datamodell & Initialverdier**: Definere `CmsContent`-typen og standardverdiene `INITIAL_CMS_CONTENT` i `/src/data/initialData.ts`.
2. **Context & Persistens**: Utvide `AppContext.tsx` med `cmsContent`, `updateCmsSection`, `resetCmsSection` og localStorage-synkronisering.
3. **Bildebehandler-komponent**: Bygge `ImagePickerField.tsx` som støtter filopplasting (drag-and-drop/browse), bilde-URL og kuraterte motiver.
4. **Admin CMS-grensesnitt**: Bygge `CmsEditor.tsx` som en ny hovedfane i `AdminPortal.tsx` med oversiktlig redigering for hver seksjon og forhåndsvisning.
5. **Koble til Offentlig Side**: Oppdatere `PublicWebsite.tsx` til å konsumere `cmsContent` for Hero, trinn 1-2-3, vitnesbyrd og prinsipper.
6. **Kompilering & Verifikasjon**: Kjøre `lint_applet` og `compile_applet`.
