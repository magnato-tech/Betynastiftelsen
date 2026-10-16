import { expect, test } from '@playwright/test';
import { adminTab, asAdmin, asCoordinator, asPublic, asSponsor, becomeSponsor, list, realErrors, registerChild, stored, watch } from './helpers';

const ADMIN_TABS = ['Godkjenningskø', 'Barn & Faddere', 'Spørsmålsflyt', 'Økonomi & avstemming', 'CMS', 'Revisjonslogg', 'E-post', 'Innstillinger'];

test.describe('offentlig side', () => {
  test('laster uten innlogging og uten konsollfeil', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Én fadder — ett barn/ })).toBeVisible();
    expect(realErrors(w)).toEqual([]);
  });

  test('KJENT AVVIK F-32: favicon.ico mangler (404)', async ({ page }) => {
    const res = await page.request.get('/favicon.ico');
    expect(res.status()).toBe(404);
  });

  test('ingen nettverkskall til Firebase/Firestore naar databasen er avskrudd', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Historier' }).click();
    await page.waitForTimeout(500);
    expect(w.external.filter((h) => /firebase|firestore|identitytoolkit|securetoken/.test(h))).toEqual([]);
  });

  test('KJENT AVVIK F-35: hver besokende laster skrifter fra Google (IP-adresse deles med tredjepart)', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await page.waitForTimeout(800);
    expect([...new Set(w.external)].sort()).toEqual(['fonts.googleapis.com', 'fonts.gstatic.com']);
  });

  test('hovednavigasjon bytter innhold uten feil', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    for (const name of ['Fadderordningen', 'Historier', 'Profil & verdier', 'Åpenhet']) {
      await page.getByRole('button', { name, exact: true }).first().click();
      await expect(page.locator('h1, h2').filter({ hasText: /\S/ }).first()).toBeVisible();
    }
    expect(realErrors(w)).toEqual([]);
  });

  test('fransk sprak byttes og huskes etter ny innlasting', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('body').innerText();
    await page.getByRole('button', { name: /Français/ }).first().click();
    await expect(page.locator('body')).not.toHaveText(before);
    await page.reload();
    expect(await stored(page, 'language')).toBe('fr');
    await page.getByRole('button', { name: /Bokmål/ }).first().click();
    expect(await stored(page, 'language')).toBe('no');
  });

  test('KJENT AVVIK F-33: horisontal rulling paa mobil (375 px) og nettbrett (768 px) - meny og bunnlinje er for brede', async ({ page }) => {
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      await page.addStyleTag({ content: 'aside[aria-label^="Rollevelger"]{display:none}' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `bredde ${width}`).toBeGreaterThan(1);
    }
  });

  test('ingen horisontal rulling paa smal skjerm (1024 px) og skjerm (1280 px)', async ({ page }) => {
    for (const width of [1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.addStyleTag({ content: 'aside[aria-label^="Rollevelger"]{display:none}' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `bredde ${width}`).toBeLessThanOrEqual(1);
    }
  });

  test('KJENT AVVIK F-34: hovedoverskriften (H1) er tom naar innholdsdatabasen er tom', async ({ page }) => {
    await page.goto('/');
    const h1 = await page.locator('h1').allInnerTexts();
    expect(h1.length).toBeGreaterThan(0);
    expect(h1.every((t) => t.trim() === '')).toBe(true);
  });

  test('siden har tittel og sprakattributt', async ({ page }) => {
    await page.goto('/');
    expect((await page.title()).length).toBeGreaterThan(2);
    expect(await page.getAttribute('html', 'lang')).toBeTruthy();
  });
});

test.describe('koordinator registrerer barn', () => {
  test('skjema krever fornavn og bakgrunn', async ({ page }) => {
    await page.goto('/');
    await asCoordinator(page);
    await page.getByRole('button', { name: 'Registrer elev' }).first().click();
    await page.getByRole('button', { name: 'Lagre eleven' }).click();
    await expect(page.getByRole('heading', { name: /Registrer en ny elev/ })).toBeVisible();
    expect(await list(page, 'children')).toHaveLength(0);
  });

  test('barnet lagres, vises i registeret og overlever ny innlasting', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await registerChild(page, 'Testbarn');
    const children = await list<{ fornavn: string }>(page, 'children');
    expect(children.map((c) => c.fornavn)).toEqual(['Testbarn']);
    await page.reload();
    await asCoordinator(page);
    await expect(page.getByText('Testbarn').first()).toBeVisible();
    expect(realErrors(w)).toEqual([]);
  });

  test('to barn faar ulike interne koder', async ({ page }) => {
    await page.goto('/');
    await registerChild(page, 'Anna');
    await registerChild(page, 'Beni');
    const kids = await list<{ internKode: string }>(page, 'children');
    expect(new Set(kids.map((k) => k.internKode)).size).toBe(2);
  });

  test('nytt barn dukker opp i godkjenningskoen til admin', async ({ page }) => {
    await page.goto('/');
    await registerChild(page, 'Testbarn');
    await adminTab(page, /Godkjenningskø/);
    await expect(page.getByText(/1 venter/)).toBeVisible();
    await expect(page.getByText('Ny elev registrert. Skriv historien fadderen skal lese.')).toBeVisible();
  });

  test('offentlig side viser aldri barnets navn', async ({ page }) => {
    await page.goto('/');
    await registerChild(page, 'Hemmelignavn');
    await asPublic(page);
    for (const tab of ['Fadderordningen', 'Historier', 'Profil & verdier', 'Åpenhet']) {
      await page.getByRole('button', { name: tab, exact: true }).first().click();
      expect(await page.locator('body').innerText()).not.toContain('Hemmelignavn');
    }
  });
});

test.describe('bli fadder', () => {
  test('skjema sendes og fadderen vises hos admin', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await becomeSponsor(page, 'Kari Fadder', 'kari@example.no');
    const sponsors = await list<{ navn: string; epost: string }>(page, 'sponsors');
    expect(sponsors).toHaveLength(1);
    expect(sponsors[0]).toMatchObject({ navn: 'Kari Fadder', epost: 'kari@example.no' });
    await adminTab(page, /Barn & Faddere/);
    await expect(page.getByRole('heading', { name: 'Faddere (1)' })).toBeVisible();
    await expect(page.locator('text=Kari Fadder >> visible=true').first()).toBeVisible();
    expect(realErrors(w)).toEqual([]);
  });

  test('tomt skjema sender ingenting', async ({ page }) => {
    await page.goto('/');
    await asPublic(page);
    await page.getByRole('button', { name: 'Bli fadder' }).first().click();
    await page.getByRole('button', { name: 'Fullfør fadderavtale' }).click();
    expect(await list(page, 'sponsors')).toHaveLength(0);
  });

  test('ugyldig e-post sender ingenting', async ({ page }) => {
    await page.goto('/');
    await asPublic(page);
    await page.getByRole('button', { name: 'Bli fadder' }).first().click();
    await page.getByPlaceholder('Ola Nordmann').fill('Kari');
    await page.getByPlaceholder('ola@eksempel.no').fill('ikke-en-epost');
    await page.getByRole('button', { name: 'Fullfør fadderavtale' }).click();
    expect(await list(page, 'sponsors')).toHaveLength(0);
  });

  test('valgt belop og betalingsmetode lagres paa fadderen', async ({ page }) => {
    await page.goto('/');
    await asPublic(page);
    await page.getByRole('button', { name: 'Bli fadder' }).first().click();
    await page.getByRole('button', { name: '350 kr/mnd' }).click();
    await page.getByRole('button', { name: 'AvtaleGiro' }).click();
    await page.getByPlaceholder('Ola Nordmann').fill('Per Betaler');
    await page.getByPlaceholder('ola@eksempel.no').fill('per@example.no');
    await page.getByRole('button', { name: 'Fullfør fadderavtale' }).click();
    const s = (await list<{ maanedsbelop: number; betalingsmetode: string }>(page, 'sponsors'))[0];
    expect(s.maanedsbelop).toBe(350);
    expect(s.betalingsmetode).toBe('avtalegiro');
  });

  test('fadderen faar ingen barn foer admin har koblet', async ({ page }) => {
    await page.goto('/');
    await registerChild(page, 'Annabarn');
    await becomeSponsor(page, 'Kari Fadder', 'kari@example.no');
    const s = (await list<{ tildeltBarnIds: string[] }>(page, 'sponsors'))[0];
    expect(s.tildeltBarnIds ?? []).toEqual([]);
  });
});

test.describe('admin kobler barn og fadder, fadder ser kun sitt barn', () => {
  test('koble: kun det valgte barnet faar fadder', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await registerChild(page, 'Annabarn');
    await registerChild(page, 'Benibarn');
    await becomeSponsor(page, 'Kari Fadder', 'kari@example.no');

    await adminTab(page, /Barn & Faddere/);
    const childSelect = page.locator('select').nth(0);
    const options = await childSelect.locator('option').allInnerTexts();
    await childSelect.selectOption({ index: options.findIndex((t) => t.includes('Annabarn')) });
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Koble' }).click();

    const kids = await list<{ fornavn: string; tildeltFadderId?: string }>(page, 'children');
    expect(kids.find((k) => k.fornavn === 'Annabarn')?.tildeltFadderId).toBeTruthy();
    expect(kids.find((k) => k.fornavn === 'Benibarn')?.tildeltFadderId).toBeFalsy();
    const sponsor = (await list<{ tildeltBarnIds: string[] }>(page, 'sponsors'))[0];
    expect(sponsor.tildeltBarnIds).toHaveLength(1);
    expect(realErrors(w)).toEqual([]);
  });

  test('etter kobling overlever relasjonen ny innlasting', async ({ page }) => {
    await page.goto('/');
    await registerChild(page, 'Annabarn');
    await becomeSponsor(page, 'Kari Fadder', 'kari@example.no');
    await adminTab(page, /Barn & Faddere/);
    await page.locator('select').nth(0).selectOption({ index: 1 });
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Koble' }).click();
    await page.reload();
    const kids = await list<{ tildeltFadderId?: string }>(page, 'children');
    expect(kids[0].tildeltFadderId).toBeTruthy();
  });
});

test.describe('roller og tilgang i nettleseren', () => {
  test('fadderportalen viser ikke koordinator-skjema eller admin-faner', async ({ page }) => {
    await page.goto('/');
    await becomeSponsor(page, 'Kari Fadder', 'kari@example.no');
    await asSponsor(page);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Registrer en ny elev');
    expect(body).not.toContain('Godkjenningskø');
  });

  test('fadderportalen har ingen mulighet til aa skrive direkte til barnet', async ({ page }) => {
    await page.goto('/');
    await registerChild(page, 'Annabarn');
    await becomeSponsor(page, 'Kari Fadder', 'kari@example.no');
    await asSponsor(page);
    const body = (await page.locator('body').innerText()).toLowerCase();
    expect(body).not.toMatch(/skriv til (barnet|annabarn)|send melding til (barnet|annabarn)|chat med barnet/);
  });

  test('admin-panelet viser alle faner', async ({ page }) => {
    await page.goto('/');
    await asAdmin(page);
    for (const tab of ADMIN_TABS) {
      await page.getByRole('button', { name: tab }).first().click();
      await expect(page.locator('main, body').first()).toBeVisible();
    }
  });

  test('ingen konsollfeil ved gjennomgang av alle admin-faner', async ({ page }) => {
    const w = watch(page);
    await page.goto('/');
    await asAdmin(page);
    for (const tab of ADMIN_TABS) {
      await page.getByRole('button', { name: tab }).first().click();
      await page.waitForTimeout(150);
    }
    expect(realErrors(w)).toEqual([]);
  });
});
