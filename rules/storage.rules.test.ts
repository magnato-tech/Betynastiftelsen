import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes, deleteObject } from 'firebase/storage';

/**
 * Lagringsregler (bilder). Storage er ikke aktivert i produksjon ennaa, men reglene er klare.
 * Ønsket policy: kun innloggede med riktig rolle kan skrive; fadder kan bare se eget barns bilder.
 * Tester merket KJENT AVVIK dokumenterer at dagens regel er for aapen (F-11).
 */

let env: RulesTestEnvironment;
const bytes = new Uint8Array([1, 2, 3, 4]);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-betyna',
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const st = ctx.storage();
    await uploadBytes(ref(st, 'public/forside.jpg'), bytes);
    await uploadBytes(ref(st, 'children/C1/profil.jpg'), bytes);
    await uploadBytes(ref(st, 'children/C2/profil.jpg'), bytes);
  });
});
afterAll(async () => {
  await env.cleanup();
});

const anon = () => env.unauthenticatedContext().storage();
const user = (uid = 'u1') => env.authenticatedContext(uid, { email: `${uid}@example.com` }).storage();

describe('storage.rules: public/', () => {
  it('alle (ogsaa uinnloggede) kan lese offentlige bilder', async () => {
    await assertSucceeds(getBytes(ref(anon(), 'public/forside.jpg')));
  });
  it('uinnlogget kan IKKE laste opp offentlige bilder', async () => {
    await assertFails(uploadBytes(ref(anon(), 'public/ny.jpg'), bytes));
  });
  it('uinnlogget kan IKKE slette offentlige bilder', async () => {
    await assertFails(deleteObject(ref(anon(), 'public/forside.jpg')));
  });
  it('KJENT AVVIK F-11: enhver innlogget Google-konto kan laste opp offentlige bilder', async () => {
    await assertSucceeds(uploadBytes(ref(user('stranger'), 'public/overskriver.jpg'), bytes));
  });
  it('KJENT AVVIK F-11: enhver innlogget konto kan overskrive forsiden', async () => {
    await assertSucceeds(uploadBytes(ref(user('stranger'), 'public/forside.jpg'), bytes));
  });
});

describe('storage.rules: children/', () => {
  it('uinnlogget kan IKKE lese barnebilder', async () => {
    await assertFails(getBytes(ref(anon(), 'children/C1/profil.jpg')));
  });
  it('uinnlogget kan IKKE laste opp barnebilder', async () => {
    await assertFails(uploadBytes(ref(anon(), 'children/C1/ny.jpg'), bytes));
  });
  it('KJENT AVVIK F-11: enhver innlogget konto kan lese ALLE barns bilder', async () => {
    await assertSucceeds(getBytes(ref(user('stranger'), 'children/C1/profil.jpg')));
    await assertSucceeds(getBytes(ref(user('stranger'), 'children/C2/profil.jpg')));
  });
  it('KJENT AVVIK F-11: enhver innlogget konto kan laste opp og slette barnebilder', async () => {
    await assertSucceeds(uploadBytes(ref(user('stranger'), 'children/C1/skadelig.jpg'), bytes));
    await assertSucceeds(deleteObject(ref(user('stranger'), 'children/C1/skadelig.jpg')));
  });
});

describe('storage.rules: andre stier', () => {
  it('ukjente stier er stengt for alle', async () => {
    await assertFails(getBytes(ref(user(), 'privat/x.jpg')));
    await assertFails(uploadBytes(ref(user(), 'privat/x.jpg'), bytes));
    await assertFails(uploadBytes(ref(anon(), 'privat/x.jpg'), bytes));
  });
  it('hele bucketen kan ikke leses av uinnlogget', async () => {
    await assertFails(getBytes(ref(anon(), 'x.jpg')));
  });
});
