# Resend – e-post (besluttet)

Betyna bruker **Resend** til nyhetsbrev, svar på henvendelser og systemmeldinger. Ikke Mailchimp. Nøkkel skal **ikke** ligge i git. Koplig av nøkkel kommer senere; admin kan likevel skrive og køe.

Admin: **E-post** (`/api/email` og `/api/newsletter`). Når admin trykker **Publiser svar til fadder**, køes automatisk malen `inquiry_answered` med lenke til faddersiden.

## Status

`GET /api/email` svarer `{ configured: true|false, from }` uten å lekke nøkkelen. Admin **E-post** viser om Resend er koplet. Køen har **Send via Resend** når nøkkelen er på plass.

Uten `RESEND_API_KEY` svarer POST **503 NOT_CONFIGURED**. Utkastet lagres i e-postkøen.

## Senere (konfigurasjon)

1. Konto på [resend.com](https://resend.com)
2. Verifiser domenet `betyna.no` (DNS hos Uniweb)
3. API-nøkkel (kun server)
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
