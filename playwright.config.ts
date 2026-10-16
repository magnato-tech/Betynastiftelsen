import { defineConfig } from '@playwright/test';

/**
 * E2E mot en ekte nettleser (Microsoft Edge, ellers Chrome). Serveren startes med databasen AVSKRUDD
 * (VITE_FIRESTORE_ENABLED=false), slik at testene aldri kan berore produksjonsdata.
 */
const port = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    channel: process.env.E2E_BROWSER ?? 'msedge',
    headless: true,
    locale: 'nb-NO',
    trace: 'off',
  },
  webServer: {
    command: `npx vite --port=${port} --strictPort`,
    port,
    reuseExistingServer: true,
    timeout: 60_000,
    env: { VITE_FIRESTORE_ENABLED: 'false', VITE_PROTOTYPE_ROLE_SWITCHER: 'true' },
  },
});
