import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Firestore-regeltestene krever emulator og kjores med `npm run test:rules`.
    exclude: ['rules/**', 'node_modules/**'],
    setupFiles: ['tests/app/setup.ts'],
    // Tester skal ALDRI snakke med produksjonsdatabasen, selv om .env peker dit.
    env: {
      VITE_FIRESTORE_ENABLED: 'false',
      VITE_PROTOTYPE_ROLE_SWITCHER: 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
