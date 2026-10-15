# Koordinator-workflow (3 feltkoordinatorer, Brazzaville)

## Innlogging (prototype)

1. **Visningsmodus** → **Koordinator (Kongo)**
2. Velg koordinator i **Connecté comme** (tilsvarende innlogging):
   - **coord-01** Jean-Baptiste Mukeba — Masina & Poto-Poto (barn 01–04)
   - **coord-02** Dieudonné Nkouka — Bacongo & Moungali (barn 05–07)
   - **coord-03** Brigitte Mabiala — Talangaï & Mfilou (barn 08–10)

## Daglig arbeid

| Steg | Fane | Handling |
|------|------|----------|
| 1 | Liste des élèves / Elevliste | Sorterbar tabell over egne elever (klikk kolonneoverskrift). Status fadder, hopp til rapport/milepæl |
| 2 | + Rédiger un rapport | Franskspråklig rapport → status `innsendt` i Oslo |
| 3 | Photos scolaires | Last opp bilde (data-URL) → venter admin |
| 4 | Jalons | Øyeblikk/tidslinje (synlig for fadder etter registrering) |
| 5 | Questions d'Oslo | Spørsmål videresendt fra admin for egne barn |

## Admin-kobling

- **Godkjenningskø**: rapporter + **Barnebilde til godkjenning**
- Etter godkjent bilde: `publisertFotoUrl` på barnet → **Fadderportal** `VisualCard`

## Test-ID

| Workflow | Koordinator | Barn |
|----------|-------------|------|
| KOORD-01 | Bytt alle tre | Tell antall elever |
| KOORD-02 | coord-02 | Jonathan (child-05) — rapport + foto |
| Spørsmål | coord-01 | inq-02 / inq-03 (Ephraim/Dorcas) |

Nullstill data i Visningsmodus etter kodeendringer.
