import { defineConfig } from 'vitest/config';

/**
 * Sikkerhetsregler testes mot Firestore-emulatoren (krever Java 21+).
 * Kjør: npm run test:rules
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
