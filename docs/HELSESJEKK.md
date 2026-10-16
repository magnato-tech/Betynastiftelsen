# Betyna.no: teknisk helsesjekk og forslag til tiltaksplan

Dato: 15. oktober 2026. Status: **til godkjenning. Ingen appkode er endret.**
Alle funn har bevis i en kjørt test (se `docs/TESTPLAN.md`). Testene står i parentes.

Forklaring: alvorlighet kritisk / høy / middels / lav. Kompleksitet S (under en time), M (en halv dag), L (flere dager).

## 1. Samlet vurdering

- Løsningen virker og er solid på det som er testet: lagring, synkronisering, tomt innhold, rapportflyt og tilgang for fadder i selve skjermbildene. 1 761 tester er kjørt, ingen feilet.
- Den største risikoen er **tilgangskontroll i databasen og e-post-API-et**. Appen har ingen egen server som sjekker rettigheter, så det er Firestore-reglene som beskytter barns data. Reglene har hull som lar en innlogget fadder eller koordinator gjøre seg selv til administrator (F-01, F-02) og lar hvem som helst sende e-post fra betyna.no (F-12).
- For barnas personvern er de viktigste punktene F-01/F-02 (eskalering), F-07 og F-24 (fadder får interne felt), F-22 (samtykke settes til ja som standard) og F-11 (bildelagring uten rollesjekk).
- For fadderne og økonomien er de viktigste F-19 (fadder får aldri varsel eller e-post om godkjent rapport eller besvart spørsmål), F-18 (oppdiktede standardverdier i rapporter) og F-25 (betalinger uten validering).

**Praktisk betydning i dag:** databasen inneholder foreløpig ingen ekte barn og faddere (all testdata er fjernet). Hullene er derfor mest et problem **før** første ekte registrering. Det gir et godt tidspunkt å rette dem på.

## 2. Funnregister

### A. Nødvendige rettelser (før ekte data tas i bruk)

| ID | Alvor | Funn | Bevis (test) | Konsekvens | Anbefalt tiltak | Kompl. |
|---|---|---|---|---|---|---|
| F-01 | Kritisk | `users/{uid}` kan endres fritt av eieren. En fadder kan sette `role: 'admin'` eller bytte `sponsorId` | `rules/firestore.scenarios`: eskaleringskjede | Fadder blir admin og leser alle barn og betalinger | Begrens oppdatering til tillatte felt (`affectedKeys().hasOnly([...])`); `role`, `sponsorId`, `coordinatorId` bare endres av admin | S |
| F-02 | Kritisk | En invitert bruker kan opprette sitt eget `users`-dokument med valgfri rolle og id, uavhengig av invitasjonen | scenarios (F-02) | Selvvalgt administratorrolle | Krev at opprettelsen er lik innholdet i `userDirectory/{epost}` | S |
| F-12 | Kritisk | `api/email.js` og `api/newsletter.js` krever ingen innlogging | `tests/api/email.test.ts` | Hvem som helst kan sende e-post fra betyna.no (spam, svindel, ødelagt avsenderomdømme, kostnad) | Krev Firebase ID-token i `Authorization`-header og verifiser admin-rolle på serveren | M |
| F-13 | Høy | Ingen validering av adresseformat, antall mottakere, lengde, rate limit; header-injeksjon i emne filtreres ikke | email.test (F-13) | Misbruk og feil ved utsending | Valider format, maks mottakere (f.eks. 200), maks lengde, fjern linjeskift i emne, enkel rate limit | S |
| F-03 | Høy | Koordinator kan skrive barn fritt: tildele fadder, opprette med annen koordinators id, endre andres barn | scenarios (F-03) | Koordinator omgår admin og kan flytte barn | Begrens til eget barn; felt som `tildeltFadderId`, `koordinatorId` låses | M |
| F-04 | Høy | Koordinator kan opprette rapport som allerede er `godkjent` | scenarios (F-04) | Omgår godkjenning; usensurert tekst vises for fadder | Krev `status == 'innsendt'` ved opprettelse | S |
| F-05 | Høy | `notifications`: `allow write: if signedIn()` | scenarios (F-05) | Enhver innlogget kan lage, endre og slette andres varsler, også sende til koordinator direkte | Bare admin skriver; ev. egen regel for «lest»-flagg | S |
| F-06 | Høy | Fadder kan lage henvendelse om barn vedkommende ikke har. Appens handling validerer heller ikke | scenarios + `finance.test` (F-06) | Fadder kan komme i kontakt med/spørre om andres barn | Krev at `barnId` tilhører fadderens `tildeltBarnIds` både i regel og i handling | S |
| F-07 | Høy | Fadder får hele barnedokumentet, også interne felt (`internKode`, `koordinatorNotat`, adresse) | scenarios (F-07) | Interne og sensitive opplysninger kan leses av fadder via API-et, selv om skjermbildet skjuler dem | Del barnet i to dokumenter: `children` (internt) og `childProfiles` (det fadder får se). Firestore kan ikke filtrere felt | L |
| F-22 | Høy | Samtykke til foto og historie settes til **ja** når det ikke er oppgitt | `children.test` (F-22) | Bilder/historier kan brukes uten samtykke | Standard skal være nei; skjema må kreve eksplisitt valg | S |
| F-11 | Høy (latent) | Storage-regler: enhver innlogget konto kan skrive til `/public` og lese/skrive/slette alle barns bilder | `storage.rules.test` | Alle barnebilder tilgjengelig for enhver Google-konto. Ikke aktivt fordi Storage ikke er aktivert | Rollesjekk via `firestore.get(...)` i Storage-regler. Må gjøres før Storage aktiveres | M |
| F-10 | Høy | Rollevelgeren er PÅ med mindre `VITE_PROTOTYPE_ROLE_SWITCHER=false`; fadder-portallenken er usignert og fadder-id er gjettbar (`sponsor-<tidsstempel>`) | `sponsorPortalLink.test`, `persistence.test` | Admin-skjermbilder kan åpnes av alle (data er likevel beskyttet av regler). Lenken kan gjettes | Sett variabelen til `false` i Vercel og verifiser. Bytt lenke til signert engangstoken eller ekte innlogging | S + M |
| F-14 | Høy | Filtre i appen (f.eks. ord som «lærebøker», «katalogisering») skjuler elementer. Siden lagring sammenligner med det som vises, kan filteret utløse sletting i databasen | `finance.test`, `persistence.test` (F-14) | Stille tap av kampanjer | Fjern ordfilteret eller flytt det til visning slik at lagringen alltid ser alle data | M |
| F-19 | Høy | React 19-feil: verdier satt inni `setState(prev => ...)` leses før funksjonen har kjørt. Fadder får aldri varsel/e-post ved godkjent rapport eller besvart spørsmål. Koordinatorvarsler får tom mottaker og vises for alle koordinatorer. Ukjent rapport varsler likevel | `reports.test`, `finance.test` (F-19) | Hovedløftet om at fadder får beskjed fungerer ikke. Varsler til feil personer | Slå opp barn/rapport fra gjeldende tilstand før `setState`, ikke inni oppdateringsfunksjonen | M |
| F-18 | Høy | Manglende felt fylles med oppdiktet standard: oppmøte 0 % blir 95 % (`||` i stedet for `??`), «God fremgang», tomt navn blir «Elev», norsk tekst blir «[Oversettelse] ...» | `reports.test`, `children.test` (F-18) | Feil informasjon om barnet vises til fadder | Avvis tomme felt; bruk `??`; ingen automatisk «oversettelse» | S |
| F-25 | Høy | Betalinger: negative og desimale beløp godtas, 0 teller som giver, gaver markeres «fullført» uten bankbekreftelse, avstemming av ukjent betaling logges som utført, registrering validerer ikke e-post/navn/beløp | `finance.test`, `sponsors.test`, `businessRules.test` (F-25) | Feil regnskap og feil rapportert innsamlet beløp | Valider beløp > 0 (heltall øre/kroner), status «venter» til bank bekrefter, ikke logg ved ukjent betaling | M |

### B. Anbefalt refaktorering / rettelser (etter A)

| ID | Alvor | Funn | Bevis | Konsekvens | Tiltak | Kompl. |
|---|---|---|---|---|---|---|
| F-08 | Middels | `bootstrapAdmin()` krever ikke bekreftet e-post | scenarios (F-08) | Teoretisk kapring hvis e-postkonto uten verifisering | Legg til `request.auth.token.email_verified == true` | S |
| F-09 | Middels | Admin kan ikke lese andres `userDirectory`-dokumenter (regel krever at id = egen e-post) | matrix (gap F-09) | Admin kan ikke liste/vise invitasjoner (UI for dette mangler også) | `allow read: if canAdminWrite() \|\| (egen e-post)` | S |
| F-15 | Middels | Relasjonen barn-fadder lagres to steder (`tildeltFadderId` og `tildeltBarnIds[]`) som kan avvike | `sponsors.test` (F-15) | Fadder ser feil barn, regler og skjerm uenige | Én kilde til sannhet (barnets felt); utled fadderens liste | M |
| F-16 | Middels | Milepæl lagres uten `koordinatorId`, men regel for koordinator krever feltet | `children.test` (F-16) | Koordinator kan ikke lese egne milepæler fra databasen | Sett `koordinatorId` ved opprettelse | S |
| F-17 / F-21 | Middels | Id-er kan kollidere: barn-id fra rekke med hull; rapporter/varsler i samme millisekund får lik id | `children.test`, `reports.test` | Data overskrives eller dupliseres | Bruk `crypto.randomUUID()` | S |
| F-23 | Middels | Tildeling validerer ikke at fadder/barn finnes; avsluttet barn kan få ny fadder | `sponsors.test` (F-23) | Barn peker på ikke-eksisterende fadder | Valider i `assignSponsor` | S |
| F-24 | Middels | Intern kode vises for fadder (produktkrav: skal ikke) | `access.test` (F-24) | Intern identifikator lekker | Skjul i `SponsorPortal` (og se F-07) | S |
| F-26 | Middels | «Forventet» (ikke mottatt) betaling vises som «Betalt & avstemt» for fadder | `access.test` (F-26) | Fadder får feil bilde av egne betalinger | Vis status ut fra faktisk betalingsstatus | S |
| F-27 | Middels | Vern mot masse-sletting slår først inn ved ≥ 3 dokumenter og 100 % bort. 1–2 dokumenter eller 9 av 10 slettes uten stopp | `syncEngine.edge.test` (F-27) | Siste fadder/koordinator kan slettes ved en feil | Krev bekreftelse ved sletting over en andel, og ved sletting av siste dokument | M |
| F-28 | Middels | Bildeopplasting: ingen størrelsesgrense; SVG godtas; bilder lagres som tekst i dokumentet (grense 1 MB) | `readImageFile.test` (F-28) | Lagring feiler på store bilder; SVG kan inneholde skript | Maks størrelse/komprimering, avvis SVG; flytt til Storage etter F-11 | M |
| F-29 | Middels | `npm audit`: 4 høye i produksjon (`@grpc/grpc-js` via Firebase), totalt 8 (2 kritiske i vitest-verktøy) | `npm audit` (kjørt) | Kjente sårbarheter i en avhengighet. Praktisk risiko for en nettleserapp er ikke vurdert og bør sjekkes før tiltak | Oppdater Firebase til versjon uten sårbar gRPC når tilgjengelig; oppdater vitest | S |
| F-33 | Middels | Horisontal rulling på mobil (375 px) og nettbrett (768 px): språkvalg/«Bli fadder» i menyen og bunnlinjen er for brede | e2e (F-33) | Dårlig opplevelse for besøkende på mobil | Tillat brytning/skjul etiketter på små skjermer | S |
| F-35 | Middels | Google Fonts lastes fra Google for hver besøkende | e2e (F-35) | IP-adresse deles med tredjepart uten samtykke (personvern/GDPR) | Egenhost fonter | S |
| R-01 | Anbefalt | `AppContext.tsx` (1 575 linjer) blander tilstand, regler, varsling, logg og e-post | arkitektur | Vanskelig å teste/endre. Roten til F-19 | Del opp i moduler (barn, rapporter, betalinger, varsler) i små steg, med testene som sikkerhetsnett | L |
| R-02 | Anbefalt | Tilgangsregler finnes i tre lag: regler, handlinger, skjermbilder | arkitektur | Lett at de blir uenige (se F-06, F-24) | Samle forretningsregler i rene funksjoner som begge lag bruker | M |

### C. Valgfrie forbedringer

| ID | Alvor | Funn | Tiltak | Kompl. |
|---|---|---|---|---|
| F-20 | Lav | To administratoradresser er hardkodet i klientkoden og i reglene | Flytt til `userDirectory`/`users` og fjern fra kode når admin er opprettet | S |
| F-30 | Lav | Ubrukte avhengigheter: `express`, `dotenv`, `@google/genai`, `motion`; 15 gamle todo-tester; utdaterte dokumenter (`WORKFLOWS`, `TESTSETT`, `AdminHelpGuide` nevner seed-id og «Nullstill data») | Fjern pakker og oppdater/slett dokumenter | S |
| F-31 | Lav | E-postlogikken finnes i to kopier (`api/*.js` og `src/server/*.ts`) som driver fra hverandre (nyhetsbrev-bunntekst ulik ved `kind=system`) | Én felles modul; paritetstesten finnes allerede | M |
| F-32 | Lav | `favicon.ico` mangler (404 ved hvert besøk) | Legg til ikon | S |
| F-34 | Lav | Hovedoverskriften (H1) er tom når innholdsdatabasen er tom | Forsvinner når CMS er fylt ut; ev. reservetekst | S |

## 3. Anbefalt rekkefølge

1. **Runde 1: stenge hullene (ca. 1–2 dager, lav risiko):** F-01, F-02, F-04, F-05, F-06, F-08, F-09 (regelendringer) + F-13, F-22, F-24, F-26 + variabelen i F-10. Hver regelendring har allerede en test som snus.
2. **Runde 2: e-post-API og funksjonsfeil:** F-12 (token-sjekk), F-19 (varsler), F-18, F-25, F-14, F-16, F-17/F-21, F-23.
3. **Runde 3: personvern i dataene:** F-07 (egen fadderprofil) med F-15, deretter F-11 og F-28 før Storage aktiveres, F-35.
4. **Runde 4: opprydding:** F-03 (låse koordinatorfelt), F-27, F-29, F-33, F-30–F-34, R-01/R-02.

Etter hver runde kjøres `npm run test:all`. Forventet endring er at de tilhørende «KJENT AVVIK»-testene snus, og at alt annet fortsatt er grønt.

## 4. Det som ikke er funnet / begrensninger

- Ingen hemmeligheter i git (verifisert i `tests/policy`). `.env` er ignorert. Ingen `eval`, `innerHTML`, `dangerouslySetInnerHTML`.
- Appen skriver ikke personopplysninger til konsollen (statisk sjekk).
- Ikke vurdert: ekte levering via Resend, ekte innlogging, ytelse under last, automatisk tilgjengelighetstest og flere nettlesere (se «Manglende dekning» i `docs/TESTPLAN.md`).
- Funn-ID-ene F-20, F-29 og F-30 ble definert i denne rapporten ut fra verifiserte undersøkelser (kode, `npm audit`, import-søk). De har ikke egne «KJENT AVVIK»-tester.

## 5. Godkjenning

Ingen av tiltakene er gjennomført. Når du har valgt hvilke runder som skal gjøres, starter jeg med regelendringene i runde 1, én og én, med testene som kontroll.
