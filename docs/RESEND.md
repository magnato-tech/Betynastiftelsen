# Resend – e-post (besluttet)

Betyna bruker **Resend** til nyhetsbrev, svar på henvendelser og systemmeldinger. Ikke Mailchimp. Nøkkel skal **ikke** ligge i git. Koplig av nøkkel kommer senere; admin kan likevel skrive og køe.

Admin: **E-post** (`/api/email` og `/api/newsletter`). Når admin trykker **Publiser svar til fadder**, køes automatisk malen `inquiry_answered` med lenke til faddersiden.

## Status

`GET /api/email` svarer `{ configured: true|false, from }` uten å lekke nøkkelen. Admin **E-post** viser om Resend er koplet. Køen har **Send via Resend** når nøkkelen er på plass.

Uten `RESEND_API_KEY` svarer POST **503 NOT_CONFIGURED**. Utkastet lagres i e-postkøen.

Serverless på Vercel kaller Resend over **HTTP** (`POST https://api.resend.com/emails`). Funksjonene under `api/` importerer ikke SDK eller `src/`, slik at `GET /api/email` ikke krasjer ved lasting.

## DNS hos Uniweb (betyna.no)

Domenet ligger hos Uniweb. Kopier **hele** verdiene fra Resend (ikke forkortede `[…]`). Region er EU (`rsend-eu`).

I Uniweb: domenet → DNS / sonefil. Legg inn:

| Type | Navn (vert) | Innhold | Påkrevd |
|------|-------------|---------|---------|
| TXT | `resend._domainkey` | DKIM-nøkkelen fra Resend (`p=MII…`) | Ja (verifisering) |
| CNAME | `rsend` | målet Resend viser (`rsend-eu.…mta.net`) | Ja (utsending) |
| CNAME | `send` | målet Resend viser (`send.…mta.net`) | Ja (utsending) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | Anbefalt |

Navnet er **uten** `.betyna.no` (Uniweb legger på domenet selv). Ikke lag en ny SPF-TXT på `@` som overskriver annen post; Resend bruker CNAME `rsend` / `send`.

Deretter i Resend: **Verify DNS Records**. Grønt merke kan ta noen minutter, av og til opptil 48 timer. Så: API-nøkkel + `EMAIL_FROM=Betyna <varsel@betyna.no>` (adressen må være på det verifiserte domenet).

**Status 15. oktober 2026:** `betyna.no` er verifisert i Resend (EU, Ireland). DKIM og SPF (CNAME `rsend` / `send`) er grønne. Utsending er på. Innkommende e-post (`Enable Receiving`) står av — det trengs ikke.

## Konfigurasjon (nøkkel)

1. Konto på [resend.com](https://resend.com) og DNS som over
2. API-nøkkel (kun server)
4. Vercel prosjektvariabler (ikke `VITE_`):

```
RESEND_API_KEY=re_...
EMAIL_FROM=Betyna <varsel@betyna.no>
NEWSLETTER_FROM=Betyna <nyhetsbrev@betyna.no>
```

`EMAIL_FROM` brukes hvis satt; ellers `NEWSLETTER_FROM`.

5. Lokalt: samme linjer i `.env`. Restart `npm run dev`.

## Lenke i systemmelding

Inntil engangslenke (sprint 5) peker lenken til `?portal=sponsor&sponsor=…&seksjon=sporsmaal`. Ekte innlogging bytter ut denne URL-en. Send aldri intern kode, etternavn eller upubliserte barneopplysninger i e-post.
