/**
 * Uendret regel fra før visningslinjen ble slått av i produksjon:
 * seed følger VITE_PROTOTYPE_ROLE_SWITCHER som tidligere, uavhengig av linjen.
 */
const legacyPrototypeMode =
  import.meta.env.DEV || import.meta.env.VITE_PROTOTYPE_ROLE_SWITCHER !== 'false';

/**
 * Mock/seed lastes kun i visningsmodus (lokal utvikling og demo).
 *
 * I produksjon er databasen eneste kilde. Innhold som allerede ligger der,
 * blir stående. Seed skal ikke kjøres på boot, ikke hver dag, og ikke
 * etter deploy.
 *
 * Vercel produksjon: VITE_PROTOTYPE_ROLE_SWITCHER=false (og ikke VITE_USE_SEED=true).
 * Demo som fortsatt trenger mock: VITE_USE_SEED=true.
 */
export const seedContentEnabled =
  import.meta.env.VITE_USE_SEED === 'true' ||
  (import.meta.env.VITE_USE_SEED !== 'false' && legacyPrototypeMode);
