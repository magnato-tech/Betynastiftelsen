# Betyna – sprinter (gjeldende plan)

Kilde: `Produktdokument_Betyna_stiftelsen.txt` kap. 5–6, 11–12, 15.  
Arbeidsdeling (vanlig, ikke fast): **Grok** planlegger og prioriterer. **Composer** koder.

Prototype med Visningsmodus er ikke ferdig produkt. Sprintene lukker gap mot akseptansekriteriene.

## Sprint 0 — Ferdig / delvis (ikke åpne på nytt)

- Offentlig side NO/FR, profil, fadderordning, åpenhet, bli fadder uten auto-tildeling
- Fadderportal med barn, rapporter, betaling, spørsmål, tidslinje
- Admin: godkjenningskø rapport, barn & faddere (7/30 dager), CMS, økonomi-prototype
- Tre koordinatorer med egne barn, rapport + foto til Oslo
- Sim-brukere og test-workflows (`docs/WORKFLOWS.md`)

## Sprint 1 — Første tegning: innholdskø (kap. 5 og 11)

**Mål:** Koordinator sender. Admin skriver. Fadder ser bare publisert innhold.

| Workflow | Rolle | Oppgave |
|----------|-------|---------|
| KOORD-03 | Koordinator | Sende **fakta** (fornavn, skole, klassetrinn, trivsel) separat |
| KOORD-04 | Koordinator | Sende **øyeblikk** (ett faktum + dato) separat fra jalons |
| ADM-05 | Admin | Kø eldst først: skriv historien, juster rapport, formuler øyeblikk, godkjenn bilde |
| ADM-06 | Admin | Forhåndsvis **hele faddersiden** før publisering |
| FAD-03 | Fadder | Side vises først når fornavn, skole, klassetrinn og historie er publisert |

**Ikke i denne sprinten:** avvis rapport tilbake til koordinator (produktdokument: admin retter selv).

## Sprint 2 — Faddersiden som i kapittel 6

| Workflow | Rolle | Oppgave |
|----------|-------|---------|
| FAD-04 | Fadder | Én rolig side: historie, få øyeblikk under, siste rapport, eldre bak lenke |
| FAD-05 | Fadder | Stille spørsmål; se bare godkjent norsk svar |
| FAD-06 | Fadder | Rolig avslutning når utdanning er ferdig; historikk blir liggende |
| ADM-07 | Admin | Skjul intern kode og etternavn for fadder (akseptanse kap. 15) |

## Sprint 3 — Spørsmålskø og tildeling (kap. 6 og 12 «etterpå»)

| Workflow | Rolle | Oppgave |
|----------|-------|---------|
| ADM-08 | Admin | Spørsmålskø: svar selv eller send til koordinator |
| KOORD-05 | Koordinator | Svar på fransk på egne barns spørsmål |
| ADM-09 | Admin | Godkjenn norsk utkast av svaret før fadder ser det |
| ADM-03 | Admin | Manuell kobling fadder–barn (finnes delvis — fullfør mot FAD-02) |

## Sprint 4 — Offentlig side ferdig (kap. 9)

Kontakt, innlogging-inngang for eksisterende faddere (tydelig atskilt), aksjoner uten oppdiktede behov, SEO/Open Graph. **PUB-02** kontakt. **PUB-03** «Jeg er allerede fadder».

## Firestore

Samlingsprofil, regler og indekser er klare (`src/db/firestoreProfile.ts`, `docs/FIRESTORE.md`). Appen leser ennå localStorage. Koble SDK i sprint 5.

## Sprint 5 — Produksjonssikkerhet (kap. 11 og 15)

Google-innlogging admin/koordinator, engangslenke fadder, server-side tilgang. **Ikke ekte barneopplysninger** før dette er testet. Prototype-rollebytte av.

## Testsett etter hver sprint

Se `docs/TESTSETT.md`. `npm test` må være grønt for ferdig sprint. Todo-tester blir ekte tester når sprinten kodes.

## E-post (ADM-10 / ADM-11) — Resend

Resend er besluttet for nyhetsbrev, henvendelser og systemmeldinger. Admin-skjerm **E-post** og kø er på plass. **Publiser svar til fadder** køer systemmelding med lenke. **RESEND_API_KEY** og **EMAIL_FROM** / **NEWSLETTER_FROM** settes senere (Vercel/.env). Uten nøkkel: 503, utkast i kø. Se `docs/RESEND.md`. Engangslenke (ekte innlogging) i sprint 5.

## Senere (ikke nå)

Ekte Vipps, bankavstemming, full automatikk for alle systemmaler, AI-oversettelse, flere barn per fadder, eksport.
