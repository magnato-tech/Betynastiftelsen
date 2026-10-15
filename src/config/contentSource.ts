import { prototypeRoleSwitcherEnabled } from './prototypeAccess';

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
  (import.meta.env.VITE_USE_SEED !== 'false' && prototypeRoleSwitcherEnabled);
