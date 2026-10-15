# Firestore-profil for Betyna

Appen bruker i dag `localStorage`. Typene i `src/types/index.ts` er kilden. Samlingsnavn og importrekkefølge: `src/db/firestoreProfile.ts`.

## Samlinger (dokument-ID = eksisterende id)

| Samling | Type | Tilgang |
|---------|------|---------|
| `users` | innlogging | egen + admin |
| `coordinators` | Coordinator | admin / egen |
| `children` | Child | admin; koordinator egne; fadder kun tildelt |
| `sponsors` | Sponsor | admin / egen |
| `facts` | FieldFact | admin; koordinator egne |
| `reports` | Report | fadder bare `godkjent` |
| `milestones` | ChildMilestone | som barn |
| `inquiries` | Inquiry | fadder egne; koordinator egne |
| `payments` | PaymentRecord | admin; fadder egne |
| `campaigns` | Campaign | offentlig les |
| `testimonials` | AdultGraduateStory | offentlig hvis godkjent |
| `notifications` | AppNotification | mottaker |
| `auditLogs` | AuditLogItem | admin |
| `cms/public` | CmsContent | offentlig les, admin skriv |
| `newsletterLogs` | utsending | admin |
| `emailOutbox` | EmailOutboxItem (henvendelse, system, nyhetsbrev) | admin |
| `catalogPhotos` | CatalogPhoto | admin; koordinator egne. Felt `barnIds[]` (child-id, internKode eller fornavn). Ett dokument vises på alle merket barneprofiler. |

Relasjoner: `children.koordinatorId`, `children.tildeltFadderId`, `sponsors.tildeltBarnId`, `campaigns.barnIds[]`, `catalogPhotos.barnIds[]`.

## Første gang

1. Firebase-prosjekt (samme som Vercel senere).
2. `firebase login` og `firebase use --add`.
3. `firebase deploy --only firestore,storage`
4. Importer prototypedata med samme feltnavn. Bilder til Storage, feltet `publisertFotoUrl` = sti, ikke data-URL.

Regler og indekser ligger i `firestore.rules` og `firestore.indexes.json`.
