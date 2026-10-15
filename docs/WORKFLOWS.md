# Betyna – test-workflows (prototype)

Kjør med **Visningsmodus** aktivert (`VITE_PROTOTYPE_ROLE_SWITCHER` ikke satt til `false`). Data lagres i `localStorage`; bruk **Nullstill data** for å gå tilbake til simuleringsseed.

| ID | Rolle | Mål | Forventet resultat |
|----|-------|-----|-------------------|
| ADM-01 | Admin | Barn- og faddertabell | To tabeller, plusstegn for å legge til, liten koblingsboks; 7- og 30-dagersbokser er borte |
| ADM-02 | Admin | Full fadderliste | Tabell under Barn & Faddere med kilde `admin` / `nettside` |
| ADM-03 | Admin | Manuell kobling | Koble `sponsor-05` til `child-05` (Priscille) i koblingsboksen; begge oppdateres |
| ADM-04 | Admin | Godkjenn rapport | Rapport i kø blir `godkjent`; synlig for fadder |
| FAD-01 | Fadder | Etablert fadder | `sponsor-01` ser Ephraim og Grace, kan bytte mellom barna |
| FAD-02 | Fadder | Ny uten barn | `sponsor-05` ser tom/venter-state til admin kobler |
| KOORD-01 | Koordinator | Bytt 3 koordinatorer | Kun egne elever i listen |
| KOORD-02 | Koordinator | Rapport + foto | Admin godkjenner begge; fadder ser bilde |
| PUB-01 | Offentlig | Bli fadder-skjema | Ny fadder uten tildelte barn; vises i faddertabellen |
| ADM-10 | Admin | E-post | Henvendelse, systemmelding og nyhetsbrev; Resend når nøkkel er satt, ellers 503 og kø |
| ADM-11 | Admin | Publiser svar | Fadder får systemmelding med lenke til Spørsmål & svar |

## Kommandoer

```bash
npm run lint
npm test
npm run dev
```

UI-workflows finnes også under **Admin → Workflows & hjelp → Test-workflows**.
