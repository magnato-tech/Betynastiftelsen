# Firestore for Betyna

Firestore er en dokumentdatabase, ikke SQL. Vi bruker **én samling per tabell** og **id-felt som fremmednøkler**. Appen slår opp relasjoner; det finnes ikke JOIN.

Kilde for felt: `src/types/index.ts`. Samlingsnavn og relasjoner: `src/db/firestoreProfile.ts`.

**Produksjon:** databasen er eneste kilde. Mock/seed lastes ikke ved oppstart og ikke hver dag. Innhold som allerede ligger i samlingene blir stående. Se `system/seedLock`.

Appen bruker fortsatt `localStorage` til SDK og innlogging er på plass (sprint 5).

## Tabeller (samlinger)

Dokument-ID = samme id som i prototypen (`child-01`, `sponsor-01`, …). Feltnavn er 1:1 med TypeScript.

| Tabell | Type | Nøkkel | Tilgang |
|--------|------|--------|---------|
| `users` | innlogging | Auth UID | egen + admin |
| `userDirectory` | invitasjon før 1. innlogging | e-post (lowercase) | egen les; admin skriv |
| `coordinators` | Coordinator | `coord-*` | admin / egen |
| `children` | Child | `child-*` | admin; koordinator egne; fadder kun tildelt |
| `sponsors` | Sponsor | `sponsor-*` | admin / egen |
| `facts` | FieldFact | `fact-*` | admin; koordinator egne |
| `reports` | Report | `report-*` | fadder bare `godkjent` |
| `milestones` | ChildMilestone | `milestone-*` | som barn |
| `inquiries` | Inquiry | `inquiry-*` | fadder egne; koordinator egne |
| `payments` | PaymentRecord | `pay-*` | admin; fadder egne |
| `campaigns` | Campaign | `camp-*` | offentlig les |
| `testimonials` | AdultGraduateStory | `story-*` | offentlig hvis godkjent |
| `notifications` | AppNotification | | mottaker |
| `auditLogs` | AuditLogItem | | admin |
| `cms/public` | CmsContent | fast id `public` | offentlig les, admin skriv |
| `newsletterLogs` | utsending | | admin |
| `emailOutbox` | EmailOutboxItem | | admin |
| `catalogPhotos` | CatalogPhoto | | admin; koordinator egne |
| `settings/emailAutoSend` | e-post av/på | fast id | admin |
| `system/seedLock` | lock etter import | fast id | admin les; appen skriver aldri |

Bilder ligger i Storage (`children/{id}/…`, `public/…`). Felt som `publisertFotoUrl` lagrer sti, ikke data-URL.

## Relasjoner

Én fadder kan ha flere barn (`sponsors.tildeltBarnIds[]`). Hvert barn har bare én fadder (`children.tildeltFadderId`).

```
coordinators 1──n children
sponsors     1──n children     (via children.tildeltFadderId)
sponsors     1──n children     (via sponsors.tildeltBarnIds[])
children     1──n facts, reports, milestones, inquiries
sponsors     1──n inquiries, payments
campaigns    n──n children     (campaigns.barnIds[])
catalogPhotos n──n children    (catalogPhotos.barnIds[])
users        n──1 coordinators | sponsors
userDirectory → users ved første Google-innlogging (rolle: admin | coordinator | sponsor)
cms          1 dokument (public)
```

| Fra | Felt | Til | Kardinalitet |
|-----|------|-----|----------------|
| children | koordinatorId | coordinators | n:1 |
| children | tildeltFadderId | sponsors | n:1 |
| sponsors | tildeltBarnIds[] | children | 1:n |
| facts, reports, milestones | barnId | children | n:1 |
| facts, reports | koordinatorId | coordinators | n:1 |
| inquiries | fadderId | sponsors | n:1 |
| inquiries | barnId | children | n:1 |
| payments | fadderId | sponsors | n:1 |
| payments | aksjonId | campaigns | n:1 |
| campaigns | barnIds[] | children | n:n |
| catalogPhotos | barnIds[] | children | n:n |
| users | coordinatorId / sponsorId | coordinators / sponsors | n:1 |

## Lansering: dagens nettside er ekte data

Innholdet som vises nå (CMS, barn, faddere, aksjoner, vitnesbyrd) behandles som **live**, ikke som mock som kan lastes på nytt.

1. Første import (`npm run firestore:plan-import`) planlegger create-if-missing av `src/db/liveLaunchContent.ts`.
2. Eksisterende dokumenter overskrives **aldri**. Admin bytter ut tekst og bilder i CMS.
3. Etter import skrives `system/seedLock`. Da skal ingen jobb, deploy eller app-start fylle inn innhold på nytt — heller ikke om en samling skulle bli tom (da brukes backup).
4. CMS har ikke «tilbakestill til standard». Det hadde skrevet mock over ekte tekster.
5. Produksjonsbygg bruker ikke lenger `publicData.ts` (tomme lister / annen forsidetekst). Det ville endret nettsiden ved lansering.

## Google-prosjekt

Prosjekt-ID: `betyna-23040` (`.firebaserc`). Firestore `(default)` er opprettet. Storage er ikke slått på (krever betalt plan); bilder ligger i appen inntil videre.

Regler og indekser: `firestore.rules`, `firestore.indexes.json`. Deploy: `npm run firebase:deploy-rules` (kun Firestore, ikke Storage).
