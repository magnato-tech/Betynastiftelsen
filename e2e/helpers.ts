import { expect, type Page } from '@playwright/test';

/** Samler konsollfeil og blokkerer alle kall til Google/Firebase (databasen skal vaere avskrudd). */
export function watch(page: Page) {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()} @ ${m.location().url}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
  });
  page.on('request', (r) => {
    const host = new URL(r.url()).host;
    if (!/^localhost(:\d+)?$/.test(host)) external.push(host);
  });
  return { errors, external };
}

export const role = (page: Page, name: RegExp) => page.getByRole('button', { name }).first().click();

export const asPublic = (page: Page) => role(page, /Offentlig nettside/);
export const asSponsor = (page: Page) => role(page, /Fadderportal/);
export const asCoordinator = (page: Page) => role(page, /Koordinator \(Kongo\)/);
export const asAdmin = (page: Page) => role(page, /Administrasjon \(Kristiansand\)/);

export async function registerChild(page: Page, fornavn: string, kontekst = 'Bor hos bestemor og trenger skolepenger.') {
  await asCoordinator(page);
  await page.getByRole('button', { name: 'Registrer elev' }).first().click();
  await page.getByPlaceholder('Ex. Dieudonné').fill(fornavn);
  await page.locator('textarea').first().fill(kontekst);
  await page.getByRole('button', { name: 'Lagre eleven' }).click();
  await expect(page.getByText(fornavn).first()).toBeVisible();
}

export async function becomeSponsor(page: Page, navn: string, epost: string) {
  await asPublic(page);
  await page.getByRole('button', { name: 'Bli fadder' }).first().click();
  await page.getByPlaceholder('Ola Nordmann').fill(navn);
  await page.getByPlaceholder('ola@eksempel.no').fill(epost);
  await page.getByRole('button', { name: 'Fullfør fadderavtale' }).click();
  await page.getByRole('button', { name: 'Lukk', exact: true }).click();
}

/** Liste fra nettleserlageret (tom liste hvis ingenting er lagret). */
export const list = async <T = Record<string, unknown>>(page: Page, key: string): Promise<T[]> =>
  ((await stored(page, key)) as T[] | null) ?? [];

/** Konsollfeil unntatt kjent avvik F-32 (favicon mangler). */
export const realErrors = (w: { errors: string[] }) => w.errors.filter((e) => !e.includes('/favicon.ico'));

export async function adminTab(page: Page, name: RegExp) {
  await asAdmin(page);
  await page.getByRole('button', { name }).first().click();
}

/** Alt som ligger i nettleserens lager under appens prefiks. */
export const storedKeys = (page: Page) =>
  page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('betyna_v1_')));
export const stored = (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem('betyna_v1_' + k) ?? 'null'), key);
