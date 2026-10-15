# Betyna – test-workflows (prototype)

Kjør med **Visningsmodus** aktivert (`VITE_PROTOTYPE_ROLE_SWITCHER` ikke satt til `false`). Data lagres i `localStorage`; bruk **Nullstill data** for å gå tilbake til simuleringsseed.

| ID | Rolle | Mål | Forventet resultat |
|----|-------|-----|-------------------|
| ADM-01 | Admin | Nye faddere siste 7 dager | Teller på kontrollpanel ≥ 2; liste viser `Sim: Erik Nyreg`, `Sim: Hanna Uke` |
| ADM-02 | Admin | Full fadderliste | Tabell under Barn & Faddere med kilde `admin` / `nettside` |
| ADM-03 | Admin | Manuell kobling | Koble `sponsor-05` til `child-05` (Priscille); begge oppdateres |
| ADM-04 | Admin | Godkjenn rapport | Rapport i kø blir `godkjent`; synlig for fadder |
| FAD-01 | Fadder | Etablert fadder | `sponsor-01` ser Ephraim, godkjente rapporter |
| FAD-02 | Fadder | Ny uten barn | `sponsor-05` ser tom/venter-state til admin kobler |
| KOORD-01 | Koordinator | Bytt 3 koordinatorer | Kun egne elever i listen |
| KOORD-02 | Koordinator | Rapport + foto | Admin godkjenner begge; fadder ser bilde |
| PUB-01 | Offentlig | Bli fadder-skjema | Ny fadder uten `tildeltBarnId`; teller 7 dager +1 |
| ADM-10 | Admin | E-post | Henvendelse, systemmelding og nyhetsbrev; Resend når nøkkel er satt, ellers 503 og kø |
| ADM-11 | Admin | Publiser svar | Fadder får systemmelding med lenke til Spørsmål & svar |

## Kommandoer

```bash
npm run lint
npm test
npm run dev
```

UI-workflows finnes også under **Admin → Workflows & hjelp → Test-workflows**.
