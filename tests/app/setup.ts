import { vi } from 'vitest';

// Apptester skal aldri bruke ekte Firebase. Synkroniseringskroken byttes ut med en lokal fake.
vi.mock('../../src/db/useFirestoreAppSync', async () => {
  const m = await import('./fakeSync');
  return { useFirestoreAppSync: m.useFakeSync };
});
