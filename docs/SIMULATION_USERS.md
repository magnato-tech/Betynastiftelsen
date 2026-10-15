# Simuleringsbrukere (prototype)

Seed bygges i `src/data/simulationSponsors.ts` med **relative startdatoer** (`isoDaysAgo`), slik at admin-metrikker for «siste uke» alltid er testbare.

## Faddere (Visningsmodus → Fadderportal)

| ID | Navn | Barn | Merknad |
|----|------|------|---------|
| sponsor-01 | Kari & Lars Johansen | Ephraim (child-01) | Etablert historikk, rapporter |
| sponsor-02 | Ingrid Berg | Dorcas (child-02) | |
| sponsor-03 | Morten Dahl | Samuel (child-03) | |
| sponsor-04 | Anne-Grethe Solheim | Miriam (child-04) | |
| sponsor-05 | Sim: Erik Nyreg (uke) | *(ingen)* | Registrert i går, `nettside` |
| sponsor-06 | Sim: Hanna Uke (uke) | *(ingen)* | Registrert 5 dager siden |
| sponsor-07 | Sim: Admin manuell | *(ingen)* | 18 dager siden, `admin` |

## Barn uten fadder (for ADM-03)

| ID | Navn | Kode |
|----|------|------|
| child-05 | Priscille | BET-CD-05 |

## Koordinatorer (3 stk — prototype «innlogging»)

| ID | Navn | Elever (ca.) |
|----|------|----------------|
| coord-01 | Jean-Baptiste Mukeba | child-01 … child-04 |
| coord-02 | Dieudonné Nkouka | child-05 … child-07 |
| coord-03 | Brigitte Mabiala | child-08 … child-10 |

Velg i Visningsmodus når rolle er **Koordinator (Kongo)**. Varsler og spørsmål filtreres på `recipientId` / barnets `koordinatorId`.

Se også `docs/COORDINATOR_WORKFLOW.md`.

## Admin

- Ingen egen innlogging; rolle **Administrasjon (Oslo)** i Visningsmodus.

## Produktregel (avklart)

Interesse via **Bli fadder** oppretter fadder **uten** automatisk barnetildeling. Admin kobler i **Barn & Faddere → Tildelingsverktøy**.
