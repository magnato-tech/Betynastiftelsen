# Backlog

Saker som er avklart med produkteier, men som ikke bygges før lansering.

## KI-assistert behandling av spørsmål fra faddere

*Avklart 26.10.2026. Ikke med ved lansering.*

**Når det bygges:** først når spørsmål fra faddere blir for mye for admin å håndtere manuelt. Til da besvarer admin spørsmålene selv. Et enkelt mål å følge med på er antall spørsmål per uke og hvor lang tid det tar før de er besvart.

### Mål

Faddere får raske, gode svar. Admin slipper å behandle spørsmål der svaret allerede finnes, og koordinatoren får bare spørsmål som faktisk krever informasjon fra feltet.

### Arbeidsflyt (fire utfall)

KI-en sorterer hvert spørsmål fra en fadder:

1. **Svaret finnes** i det fadderen har tilgang til: KI-en svarer direkte, med henvisning til kilden.
2. **Svaret finnes ikke:** KI-en svarer «Dette har vi ikke informasjon om ennå. Spørsmålet er sendt til koordinatoren i Kongo, og du får svar her.» Spørsmålet oversettes til fransk og sendes til koordinatoren uten at admin må gjøre noe.
3. **Koordinatoren svarer:** svaret oversettes til norsk og går til admin for kvalitetssikring. Først når admin publiserer, ser fadderen det (ny informasjon fra feltet).
4. **Delvis svar:** det som kan besvares, besvares med en gang. Resten går til koordinatoren og publiseres i samme tråd etter godkjenning.

### Kilder KI-en får bruke (i denne rekkefølgen)

1. **Barnet:** bare det fadderen allerede ser i fadderportalen, og ingenting merket «Ikke for KI».
2. **Kunnskapsbasen:** godkjente standardsvar om programmet og om kultur og hverdag i Brazzaville.
3. **Den offentlige nettsiden.**

KI-en bruker **ikke** egen allmennkunnskap om Kongo. Grunnen er at Betyna arbeider i Republikken Kongo (Brazzaville), mens mye informasjon på nettet gjelder DR Kongo (Kinshasa, Goma, Bukavu). Alt faktagrunnlag skal komme fra kilder Betyna selv har godkjent.

### Sikringer

- **Temaer som alltid går til admin**, aldri automatisk: helse og sykdom, familie og hjemmeforhold, sikkerhet, penger og gaver, ønske om direkte kontakt med barnet, klager, og fadder som vil avslutte. KI-en svarer da bare «Takk, vi ser på spørsmålet og svarer snart.» Gjelder også når bare en del av spørsmålet berører et slikt tema (den delen går til admin).
- **KI-merking:** alle automatiske svar merkes «Svaret er laget med hjelp av KI, basert på Betynas informasjon.»
- **Rett til et menneske:** knappen «Ikke fornøyd med svaret? Send spørsmålet til Betyna» sender spørsmålet rett til admin, merket «Fadder ønsker svar fra et menneske», øverst i køen. Appen teller hvor ofte den brukes.
- **Logg:** spørsmål, svar, kildene svaret bygget på og KI-ens valg lagres. Admin kan se alle automatiske svar, rette dem eller trekke dem tilbake.

### Personvern (GDPR)

- **Alt som kan spore eller kontakte barnet, er alltid skjult** for fadder og KI: etternavn, adresse/bosted/nabolag, foresatte og familie med navn, mobilnummer, e-post, sosiale medier og nøyaktig skolenavn. Slike opplysninger lagres ikke som egne felt i appen.
- **Merket «Ikke for KI»:** admin kan merke enkeltfelt i barnets profil (interesser, behov, bakgrunn) og hele rapporter, milepæler, fakta, bildetekster og oppføringer i kunnskapsbasen. Koordinatoren kan krysse av «Contient des informations sensibles – pas pour l'IA» når en rapport skrives; admin bekrefter eller endrer. Internt innhold (utkast, koordinatorens notater, logg) er aldri tilgjengelig for KI.
- **Automatisk sladding** av telefonnumre, e-post og lenker til sosiale medier før noe sendes til KI-en.
- **Minst mulig data** sendes til leverandøren: fornavn, aldri etternavn, kontaktinfo eller bilder. KI-en ser aldri selve bildene.
- Betyna må ha **databehandleravtale** med KI-leverandøren og nevne bruken i personvernerklæringen.

### Kunnskapsbasen

- Egen fane under Innstillinger. Hver oppføring: spørsmål, godkjent svar (norsk), tema (skolegang, skolestart, økonomi, kontakt, rapporter, kultur, annet), når på året den gjelder, status (utkast/godkjent) og merket «Ikke for KI».
- Bare **godkjente** oppføringer brukes.
- Startinnhold: 15–20 vanlige spørsmål og artikler om kultur og hverdag i Brazzaville (skolesystemet, fransk og lingala, mat, høytider, regntid, familie). Lages som utkast og godkjennes av noen som kjenner Brazzaville. Skolestart (trolig oktober) bekreftes av koordinatoren før den brukes.
- **Vokser av seg selv:** når admin godkjenner et svar fra koordinatoren som gjelder flere barn, kan det lagres som standardsvar med knappen «Lagre som standardsvar».

### Innføring i faser

- **Fase A:** kunnskapsbasen og merket «Ikke for KI». Ingen KI ennå.
- **Fase B – KI som assistent:** «Foreslå svar» i spørsmålsbehandlingen (Oppfølging → Spørsmål og vinduet på barnesiden), med sortering i de fire utfallene, norsk svartekst og fransk tekst til koordinatoren. «Oversett til fransk/norsk» for videresending og koordinatorens notater. Admin publiserer med ett klikk. Appen teller hvor ofte forslag publiseres uendret.
- **Fase C – automatiske svar:** slås på med en bryter under Innstillinger når tallene fra fase B viser at kvaliteten holder. Svarene lages på serveren (Vercel), som krever KI-nøkkel og en egen servicenøkkel for databasen.

### Forutsetninger før bygging

- API-nøkkel for KI-leverandøren (foreslått Anthropic Claude) lagt inn i Vercel av Betyna.
- Databehandleravtale og oppdatert personvernerklæring.

## Huskeliste ved godkjenning av bilder

Ved godkjenning av bilder fra koordinatoren: vis en kort huskeliste, «Sjekk at bildet ikke viser skolenavn, skilt, husnummer, skolemerke eller annet som kan spore barnet.» Appen kan ikke fange dette automatisk.
