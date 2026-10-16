# Betyna.no: testplan, testsuite og regresjonsbaseline

Dato for kjøring: 15. oktober 2026. Alle tall nedenfor er fra faktiske kjøringer på denne maskinen.

## 1. Resultat (baseline)

| Kjøring | Kommando | Tester | Bestått | Feilet | Todo (ikke skrevet) |
|---|---|---|---|---|---|
| Enhet, app, API, policy | `npm test` | 844 | 829 | 0 | 15 |
| Databaseregler (emulator) | `npm run test:rules` | 906 | 906 | 0 | 0 |
| Nettleser (Edge, ekte) | `npm run test:e2e` | 26 | 26 | 0 | 0 |
| Typesjekk | `npm run lint` | n/a | OK (0 feil) | 0 | n/a |
| **Sum** | | **1 776** | **1 761** | **0** | **15** |

De 15 «todo» er gamle plassholdere i `src/workflows/sprint1..5.workflows.test.ts`. De er ikke kjørt og telles ikke som bestått. De er listet under «Manglende dekning».

«Bestått» betyr her at testen er kjørt og dagens oppførsel stemmer med forventningen. Minst 88 tester er merket «KJENT AVVIK F-xx» (61 i `npm test`, 23 i emulatortestene og 4 i nettleser), i tillegg til 15 «gap»-celler i regelmatrisen. De bekrefter at en feil finnes i dag. Slike tester blir RØDE når feilen rettes. Da skal testen snus til den ønskede oppførselen (se punkt 5).

## 2. Hvordan kjøre

```
npm test             # enhet, app, API, policy (3 sek)
npm run lint         # typesjekk av alt, inkl. tester
npm run test:e2e     # ekte nettleser (Edge, ev. E2E_BROWSER=chrome); starter egen server uten database
npm run test:rules   # krever Java; starter Firestore- og Storage-emulator
npm run test:all     # alt over
```

For `test:rules` på Windows i denne mappen: sett `JAVA_HOME` til `C:\Users\magna\tools\jre21\jdk-21.0.12.1+1-jre` og legg `%JAVA_HOME%\bin` først i `PATH`.

Sikkerhet i testene: `vitest.config.ts` tvinger `VITE_FIRESTORE_ENABLED=false`, og emulatortestene bruker prosjektet `demo-betyna`. En policy-test sjekker at ingen testfil nevner produksjonsprosjektet `betyna-23040`. Testene kan derfor ikke endre produksjonsdata.

## 3. Hva som er dekket

| Lag | Filer | Tester | Innhold |
|---|---|---|---|
| Databaseregler, matrise | `rules/firestore.matrix.test.ts` | 847 | 20 samlinger x 9 aktører (ikke innlogget, fremmed konto, invitert, fadder A/B, koordinator A/B, admin, bootstrap-admin) x operasjoner (les, list, opprett, endre, slett). Hver celle har forventet tillatt/nektet. |
| Databaseregler, scenarier | `rules/firestore.scenarios.test.ts` | 48 | Angrepsscenarier: rolleeskalering, kryss-fadder, kryss-koordinator, invitasjoner |
| Storage-regler | `rules/storage.rules.test.ts` | 11 | Bilder offentlig/barn |
| API (e-post) | `tests/api/email.test.ts` | 74 | Metode, validering, grupper, Resend-feil, hemmelighetsvern |
| API-paritet | `tests/api/parity.test.ts` | 54 | `api/*.js` og `src/server/*.ts` gir lik oppførsel |
| App: barn | `tests/app/children.test.tsx` | 46 | Registrering, status, samtykke, id |
| App: rapporter | `tests/app/reports.test.tsx` | 31 | Rapport, godkjenning, avvisning, varsler |
| App: faddere | `tests/app/sponsors.test.tsx` | 35 | Registrering, tildeling, avslutning |
| App: økonomi | `tests/app/finance.test.tsx` | 40 | Betalinger, avstemming, kampanjer, henvendelser |
| App: tilgang | `tests/app/access.test.tsx` | 48 | Hva hver rolle ser; ekte `SponsorPortal`-rendering |
| App: lagring | `tests/app/persistence.test.tsx` | 52 | Automatisk lagring, innlasting, vern mot sletting, filter |
| Policy/arkitektur | `tests/policy/repo.policy.test.ts` | 58 | Regler dekker alle samlinger, ingen hemmeligheter i git, ingen farlige API-er, testmiljø trygt |
| Enhet (utils, e-post, db, arbeidsflyt) | 35 filer under `src/` | 391 (+ 15 todo) | Dato, validering, forretningsregler, maler, synkmotor, tomt innhold, bildelesing |
| Nettleser (E2E) | `e2e/journeys.spec.ts` | 26 | Offentlig side, koordinator registrerer barn, bli fadder, admin kobler, tilgang, mobil, nettverk |

### Eksplisitt krav: fadder-tilgang

> «En fadder skal bare få tilgang til informasjon vedkommende har rett til å se, og skal ikke kunne kommunisere direkte med barnet.»

Dekket slik:
- Regler (emulator): fadder A kan lese eget barn og godkjente rapporter, men ikke fadder B sitt barn, ubehandlede rapporter, andre betalinger eller andre henvendelser. Testet for alle samlinger.
- App (`access.test.tsx`): `SponsorPortal` rendret med to faddere. Fadder ser bare egne barn, bare godkjente rapporter og egne betalinger.
- Nettleser: fadderportalen har ingen skjema/knapp for melding til barnet og ingen koordinator- eller admin-funksjoner.
- Svakheter som testene avslører og som bryter kravet: F-05 (fadder kan skrive varsler direkte til koordinator), F-06 (fadder kan stille spørsmål om barn vedkommende ikke har), F-07 og F-24 (fadder får interne felt), F-10 (rollevelger og gjettbar portal-lenke). Se helsesjekken.

## 4. Manglende dekning (ærlig oversikt)

Ikke testet i dag:
1. **Ekte Google-innlogging** og full flyt fra innlogging til rolle (popup kan ikke automatiseres uten testkonto).
2. **`useFirestoreAppSync` mot emulator**: synkmotoren er enhetstestet, men selve Firebase-lesing/skriving fra appen er ikke integrasjonstestet.
3. **Koordinator- og fadderinnlogging i nettleser**: koordinatorer kan ikke opprettes uten database. Rollene testes via rollevelger og via appens tilstand.
4. **F-19 i ekte nettleser**: bekreftet i jsdom med ekte React 19, ikke i Edge (krever koordinator).
5. **Firebase Storage** er ikke aktivert. Reglene er testet, opplasting ikke.
6. **E-post leveres faktisk**: Resend er mocket. Domeneverifisering og levering er ikke testet.
7. **Automatisk tilgjengelighetstest** (axe/Lighthouse): ikke satt opp. Bare manuell/strukturell sjekk (tom H1, tittel, `lang`).
8. **Ytelse og last**: bare en liten måling (1000 dokumenter i synkplanen). Ingen lasttest mot Firestore.
9. **Flere nettlesere**: bare Edge. Ikke Safari/Firefox/mobil.
10. **Fransk grensesnitt**: språkbytte er testet. Innholdet er ikke korrekturlest automatisk.
11. **Produksjonsmiljø**: at Vercel har `VITE_PROTOTYPE_ROLE_SWITCHER=false` og riktige variabler er ikke verifisert automatisk.
12. **15 todo-tester** i `src/workflows/sprint1..5` (FAD-04..06, ADM-07 m.fl.) er ikke implementert.

## 5. Regresjonskontroll

- Baseline: alle 1 761 tester grønne før noen kodeendring.
- Når en feil rettes: kjør `npm run test:all`. Forvent at den/de tilhørende «KJENT AVVIK F-xx»-testene blir røde. Snu dem da til ønsket oppførsel i samme endring. Alle andre tester skal fortsatt være grønne.
- Rettelser av regler: `rules/firestore.matrix.test.ts` har en celle per samling/aktør/operasjon, og avslører umiddelbart utilsiktet åpning eller stenging.
- Mutasjonskontroll: reglene ble kontrollert med bevisst ødelagte regelfiler (mutanter). Testene feilet som forventet, og er derfor ikke «tomme».

## 6. Kjente begrensninger i testene

- Matrisen og scenariene tester mot dagens regler. Der dagens regler er for åpne, forventer testen dagens (uønskede) oppførsel og er merket F-xx.
- E2E bruker rollevelgeren fordi ekte innlogging ikke kan automatiseres. Dette er ikke bevis på at ekte brukere får riktig tilgang. Det beviser reglene (emulator).
