# Betyna.no: arkitektur og avhengigheter

Status: 15. oktober 2026. Beskriver løsningen slik den er i dag (ingen endringer gjort i appkoden).

## 1. Oversikt

Betyna er en liten nettside og et saksbehandlingsverktøy for en fadderordning som støtter barns skolegang i Kongo-Brazzaville.
Én nettleserapp (React) leser og skriver direkte mot Firebase. To små serverfunksjoner på Vercel sender e-post via Resend.

```
 Nettleser (React 19, Vite)
   |-- Firebase Auth (Google-innlogging, popup)
   |-- Firestore (europe-west1)  <-- sikres av firestore.rules
   |-- Firebase Storage (ikke aktivert ennå; storage.rules finnes)
   |-- fonts.googleapis.com / fonts.gstatic.com (Google Fonts)
   '-- /api/email, /api/newsletter  --> Vercel-funksjon --> Resend (e-post)
```

Det finnes ingen egen backend som kontrollerer forretningsregler. All tilgangskontroll må derfor ligge i `firestore.rules`. Alt annet i appen er bare visning.

## 2. Teknologi og avhengigheter

| Område | Valg | Versjon (installert) |
|---|---|---|
| UI | React | 19.3.0 |
| Bygg | Vite | 8.3.4 |
| Språk | TypeScript | 7 |
| Stil | Tailwind CSS | 4 |
| Database/innlogging | Firebase (Auth, Firestore) | 13 |
| E-post | Resend via `fetch` i Vercel-funksjoner | n/a |
| Hosting | Vercel (deploy fra `main`) | n/a |
| Test | vitest 3.2.7, jsdom, Testing Library, Firebase emulator, Playwright | se package.json |

Avhengigheter som ikke brukes i koden (ingen import funnet): `express`, `dotenv`, `@google/genai`, `motion` (se F-30).
`npm audit`: 8 sårbarheter totalt, hvorav 4 høye i produksjonsavhengigheter (`@grpc/grpc-js` via Firebase) og 2 kritiske i utviklingsverktøy (`tinypool` via vitest) (se F-29).

## 3. Kodeomfang (kildekode uten tester)

| Mappe | Filer | Linjer | Innhold |
|---|---|---|---|
| `src/components` | 28 | 10 031 | Alle skjermbilder (offentlig, fadder, koordinator, admin, modaler) |
| `src/context` | 1 | 1 575 | `AppContext.tsx`: all tilstand og alle handlinger |
| `src/db` | 11 | 1 170 | Firebase-oppsett, synkronisering, regler for oppstart (seedPolicy) |
| `src/email`, `src/newsletter`, `src/server`, `src/plugins` | 13 | 583 | E-postmaler, utsending, dev-API |
| `src/utils` | 13 | 457 | Rene hjelpefunksjoner (omfang, betaling, bilder, datoer) |
| `src/types` | 1 | 310 | Datamodell (TypeScript) |
| `api/` | 2 | n/a | `email.js`, `newsletter.js` (Vercel-funksjoner) |
| Regler | 2 | n/a | `firestore.rules`, `storage.rules` |

Største enkeltfiler: `AppContext.tsx` (1 575), `CoordinatorPortal.tsx` (1 222), `CmsEditor.tsx` (1 195), `TestimonialEditor.tsx` (898).
`AppContext.tsx` er en «gudefil» som blander tilstand, forretningsregler, varsling, revisjonslogg og e-postkø. Det gjør den vanskelig å teste og endre (se anbefalt refaktorering R-01 i helsesjekken).

## 4. Roller og tilgang

| Rolle | Hvordan man blir det | Skal se / gjøre |
|---|---|---|
| Offentlig | Ingen innlogging | Åpen side, kampanjer, godkjente vitnesbyrd. Aldri barneprofiler. |
| Fadder | `users/{uid}.role = 'sponsor'` + `sponsorId` | Egne tildelte barn, godkjente rapporter, egne betalinger, stille spørsmål til administrasjon. Kan ikke skrive til barnet. |
| Koordinator (Kongo) | `users/{uid}.role = 'coordinator'` + `coordinatorId` | Egne barn: registrere, rapportere, bilder, milepæler |
| Admin (Norge) | `bootstrapAdmin()` (to faste e-poster i kode og regler) eller `users/{uid}.role = 'admin'` | Alt: godkjenning, tildeling, økonomi, innhold, e-post |

Rollevelgeren (`RoleSwitcherBanner`) er et prototypeverktøy som er PÅ med mindre `VITE_PROTOTYPE_ROLE_SWITCHER=false` (se F-10). Den endrer bare hva som vises. Data beskyttes bare av Firestore-reglene.

## 5. Datamodell (Firestore)

Samlinger (20): `users`, `userDirectory`, `coordinators`, `children`, `sponsors`, `facts`, `reports`, `milestones`, `inquiries`, `payments`, `campaigns`, `testimonials`, `notifications`, `auditLogs`, `cms`, `newsletterLogs`, `emailOutbox`, `catalogPhotos`, `settings`, `system`.

Viktigste relasjoner (ingen fremmednøkler i Firestore, kun id-oppslag i appen):

- `children.koordinatorId` -> `coordinators` (n:1)
- `children.tildeltFadderId` -> `sponsors` (n:1) og `sponsors.tildeltBarnIds[]` -> `children` (1:n). To kilder til samme fakta (F-15).
- `reports.barnId`, `milestones.barnId` -> `children`
- `payments.fadderId`, `inquiries.fadderId` -> `sponsors`
- `users.sponsorId`, `users.coordinatorId` -> `sponsors`, `coordinators`

Personsensitive data: barn (navn, fødselsår, skole, bakgrunn, bilder, samtykker), fadder (navn, e-post, telefon, poststed, beløp), betalinger.

## 6. Dataflyt

1. **Offentlig besøk**: appen leser bare `campaigns`, `cms` og godkjente `testimonials` (offentlig lag, uten innlogging).
2. **Innlogging**: Google-popup. `users/{uid}` gir rolle. Admin laster alle samlinger (`loadAllFromFirestore`).
3. **Lagring**: `useFirestoreAppSync` sammenligner tilstand mot sist kjente tilstand (`syncEngine`: `planCollectionSync`) og skriver bare endrede dokumenter. Lagring slås på først etter at full innlasting har lykkes (`confirmHydrated`). `isSuspiciousWipe` stopper massesletting.
4. **E-post**: appen kaller `/api/email` eller `/api/newsletter`. Funksjonen kaller Resend. Feil legges i `emailOutbox`.
5. **Uten database** (`VITE_FIRESTORE_ENABLED=false`, brukt i tester): tilstand ligger i `localStorage` med prefiks `betyna_v1_`.

## 7. Arbeidsflyter (som er testet)

| Arbeidsflyt | Aktør | Hovedsteg |
|---|---|---|
| Registrere barn | Koordinator | Skjema -> `registerChild` -> barn «venter» -> kø hos admin |
| Rapport fra Kongo | Koordinator -> Admin -> Fadder | Skriv rapport -> godkjenn/avvis -> synlig for fadder kun når godkjent |
| Bli fadder | Besøkende | Modal -> `registerSponsor` -> fadder + betaling opprettes |
| Koble barn og fadder | Admin | `assignSponsor` -> barn og fadder oppdateres |
| Spørsmål | Fadder -> Admin -> Koordinator | Henvendelse -> videresend -> svar -> godkjent svar til fadder |
| Betaling | Admin | Registrere, avstemme, kampanjegaver |
| Bilder | Koordinator -> Admin | Katalog -> godkjenn -> publisert for fadder |
| Nyhetsbrev/e-post | Admin | Mottakervalg -> utsending via Resend |

Fadder-kommunikasjon går alltid via administrasjon. Det finnes ingen funksjon der en fadder skriver direkte til et barn (testet i appen og i nettleser).

## 8. Eksterne tjenester

- Firebase `betyna-23040` (Blaze, europe-west1).
- Vercel (frontend + `api/`). Miljøvariabler: `RESEND_API_KEY`, `EMAIL_FROM`, `NEWSLETTER_FROM`, `VITE_*`.
- Resend (e-post).
- Google Fonts (tredjepart, se F-35).
