import type { Sponsor } from '../types';
import { isoDaysAgo } from '../utils/dateFormat';

/**
 * Faddere med relative startdatoer slik at admin-workflows (f.eks. «siste 7 dager»)
 * fungerer uansett når du kjører prototypen.
 */
export function buildSimulationSponsors(): Sponsor[] {
  return [
    {
      id: 'sponsor-01',
      navn: 'Kari & Lars Johansen',
      epost: 'kari.johansen@example.no',
      telefon: '+47 912 34 567',
      poststed: 'Bergen',
      maanedsbelop: 350,
      betalingsmetode: 'vipps',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(380),
      tildeltBarnIds: ['child-01', 'child-06'],
      registrertKilde: 'admin',
    },
    {
      id: 'sponsor-02',
      navn: 'Ingrid Berg',
      epost: 'ingrid.berg@example.no',
      telefon: '+47 987 65 432',
      poststed: 'Oslo',
      maanedsbelop: 250,
      betalingsmetode: 'avtalegiro',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(370),
      tildeltBarnIds: ['child-02'],
      registrertKilde: 'admin',
    },
    {
      id: 'sponsor-03',
      navn: 'Morten Dahl',
      epost: 'morten.dahl@example.no',
      telefon: '+47 456 78 901',
      poststed: 'Trondheim',
      maanedsbelop: 350,
      betalingsmetode: 'vipps',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(200),
      tildeltBarnIds: ['child-03'],
      registrertKilde: 'nettside',
    },
    {
      id: 'sponsor-04',
      navn: 'Anne-Grethe Solheim',
      epost: 'anne.solheim@example.no',
      telefon: '+47 923 45 678',
      poststed: 'Stavanger',
      maanedsbelop: 250,
      betalingsmetode: 'bank',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(420),
      tildeltBarnIds: ['child-04'],
      registrertKilde: 'admin',
    },
    {
      id: 'sponsor-05',
      navn: 'Sim: Erik Nyreg (uke)',
      epost: 'sim.erik.nyreg@betyna.test',
      telefon: '+47 400 00 501',
      poststed: 'Drammen',
      maanedsbelop: 250,
      betalingsmetode: 'vipps',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(1),
      tildeltBarnIds: [],
      registrertKilde: 'nettside',
    },
    {
      id: 'sponsor-06',
      navn: 'Sim: Hanna Uke (uke)',
      epost: 'sim.hanna.uke@betyna.test',
      telefon: '+47 400 00 502',
      poststed: 'Kristiansand',
      maanedsbelop: 350,
      betalingsmetode: 'bank',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(5),
      tildeltBarnIds: [],
      registrertKilde: 'nettside',
    },
    {
      id: 'sponsor-07',
      navn: 'Sim: Admin manuell (måned)',
      epost: 'sim.admin.manuell@betyna.test',
      telefon: '+47 400 00 503',
      poststed: 'Tromsø',
      maanedsbelop: 250,
      betalingsmetode: 'vipps',
      betalingsstatus: 'aktiv',
      startDato: isoDaysAgo(18),
      tildeltBarnIds: [],
      registrertKilde: 'admin',
    },
  ];
}

/** Korte personaer for visningsmodus / dokumentasjon */
export const SIMULATION_SPONSOR_PERSONAS = [
  { id: 'sponsor-01', label: 'Etablert fadder (Ephraim og Grace)', childId: 'child-01' },
  { id: 'sponsor-05', label: 'Ny i går — venter barn', childId: null },
  { id: 'sponsor-06', label: 'Ny denne uken — venter barn', childId: null },
] as const;
