# Koordinatorens personlige barneprofil

Plan for prototypen (15. oktober 2026). Gjelder Betyna i Brazzaville. Ingen klasse- eller bokinnsamling.

## Navigasjon

- Koordinator klikker en elev (kort eller tabellrad på **Élèves / Elever**).
- Seksjon: `profil:{barnId}` (samme `activeSection` som øvrige faner).
- Tilbake til listen: fane «Elever» eller knappen «Tilbake til listen».
- Navbar «Elevliste» er aktiv mens profilen er åpen.

## Hva som ligger på profilen

1. **Identitet** — fornavn, intern kode, skole, klasse, fadderstatus (etternavn vises ikke til fadder; koordinator ser intern kode).
2. **Katalogbilder** — bilder der barnet er merket (`barnIds[]`). Ett bilde kan vises på flere profiler.
3. **Rapporter** — alle rapporter for dette barnet (status, dato, tittel). Tom tilstand hvis ingen.
4. **Milepæler og tidslinje** — `ChildHistoryTimeline` flyttet hit fra den globale jalons-fanen.

## Hva som blir igjen på koordinatorhjemmet

- Elevliste (kort/tabell), nye rapporter, fakta, ny elev, spørsmål, effekt, innsending av bilder til Kristiansand.
- Fanen **Milepæler** er en **velger**: åpner barnets profil, ikke en andre tidslinje.
- Fanen **Rapporter** er fortsatt alle rapporter for koordinatorens barn; per-barn-listen er på profilen.
- Fanen **Bilder** er katalog + merking + innsending av fadderportrett (ett bilde per barn til Kristiansand).

## Datamodell for bildemerking

```
CatalogPhoto {
  id: string
  barnIds: string[]   // child-id, internKode eller fornavn
  url: string         // Storage-sti i produksjon; URL i prototype
  beskrivelseFr: string
  beskrivelseNo?: string
  koordinatorId: string
  dato: string
  status: 'innsendt' | 'publisert' | 'avvist'
}
```

Visningsregel: bildet vises på profilen hvis et tag matcher `id`, `internKode` eller `fornavn` (ikke skill på store/små bokstaver). Samme fornavn på flere barn ⇒ bildet vises på alle disse profilene. Flere `barnIds` ⇒ bildet vises på hvert merket barn.

Fadderportrett (`publisertFotoUrl` / `ventendeFoto`) er fortsatt ett bilde per barn til faddersiden. Katalogen er koordinatorens arkiv og kan deles.

Firestore: samling `catalogPhotos`, felt `barnIds` (array). Ingen Firebase SDK i denne runden.
