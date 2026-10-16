import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FIRESTORE_COLLECTIONS } from '../../src/db/firestoreProfile';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else out.push(rel.replace(/\\/g, '/'));
  }
  return out;
}

const isTest = (f: string) => /\.test\.tsx?$/.test(f) || f.startsWith('src/test/');
const appSources = walk('src').filter((f) => /\.(ts|tsx)$/.test(f) && !isTest(f));

describe('regler dekker alle samlinger', () => {
  const rules = read('firestore.rules');
  const matched = [...rules.matchAll(/match \/([A-Za-z]+)\/\{/g)].map((m) => m[1]).filter((m) => m !== 'databases');
  it.each(Object.values(FIRESTORE_COLLECTIONS))('samling %s har en egen regel', (name) => {
    expect(matched).toContain(name);
  });
  it('reglene har ingen samling som appen ikke kjenner', () => {
    expect(matched.filter((m) => !Object.values(FIRESTORE_COLLECTIONS).includes(m as never))).toEqual([]);
  });
  it('"if true" finnes bare for lesing av de to offentlige samlingene (campaigns, cms)', () => {
    const lines = rules.split('\n');
    const open: string[] = [];
    let current = '';
    for (const line of lines) {
      const m = line.match(/match \/([A-Za-z]+)\/\{/);
      if (m && m[1] !== 'databases') current = m[1];
      const a = line.match(/allow\s+([a-z, ]+):\s*if\s+true/);
      if (a) open.push(`${current}:${a[1].trim()}`);
    }
    expect(open.sort()).toEqual(['campaigns:read', 'cms:read']);
  });
  it('ingen jokertegn-regel som aapner alt (match /{document=**})', () => {
    expect(rules).not.toMatch(/\{document=\*\*\}/);
  });
  it('rules_version 2', () => {
    expect(rules).toMatch(/rules_version\s*=\s*'2'/);
  });
});

describe('storage-regler', () => {
  const rules = read('storage.rules');
  it('har bare to stier (alt annet er nektet som standard)', () => {
    expect([...rules.matchAll(/match \/([a-z]+)\//g)].map((m) => m[1]).filter((m) => m !== 'b')).toEqual(['public', 'children']);
  });
  it('ingen "if true" for skriving', () => {
    expect(rules).not.toMatch(/allow\s+(write|create|update)[^;]*:\s*if\s+true/);
  });
  it('KJENT AVVIK F-11: alle innloggede kan skrive til /public og lese/skrive barnemapper (ingen rollesjekk)', () => {
    expect(rules).toMatch(/match \/children\/\{childId\}[\s\S]*allow read: if request\.auth != null;[\s\S]*allow write: if request\.auth != null;/);
    expect(rules).toMatch(/match \/public[\s\S]*allow write: if request\.auth != null;/);
  });
});

describe('hemmeligheter og konfigurasjon', () => {
  it('.env-filer er ignorert av git, men .env.example er tillatt', () => {
    const ignore = read('.gitignore');
    expect(ignore).toMatch(/^\.env\*$/m);
    expect(ignore).toMatch(/^!\.env\.example$/m);
  });
  it('ingen .env-fil er sporet i git', () => {
    const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split(/\r?\n/);
    expect(tracked.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'))).toEqual([]);
  });
  it('ingen sporet fil inneholder Resend-noekkel, privat noekkel eller service-konto', () => {
    const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split(/\r?\n/).filter((f) => f && existsSync(join(ROOT, f)));
    const bad: string[] = [];
    for (const f of tracked) {
      if (/\.(png|jpe?g|webp|gif|ico|pdf|woff2?|lock)$|package-lock\.json$/i.test(f)) continue;
      if (f.startsWith('tests/policy/')) continue;
      const text = readFileSync(join(ROOT, f), 'utf8');
      if (/re_[A-Za-z0-9]{20,}/.test(text) || /-----BEGIN (RSA |EC )?PRIVATE KEY-----/.test(text) || /"type":\s*"service_account"/.test(text)) bad.push(f);
    }
    expect(bad).toEqual([]);
  });
  it('appkoden leser ingen hemmelige VITE_-variabler (de havner i nettleseren)', () => {
    const used = new Set<string>();
    for (const f of appSources) for (const m of read(f).matchAll(/VITE_[A-Z0-9_]+/g)) used.add(m[0]);
    const secretLike = [...used].filter((v) => /SECRET|PRIVATE|RESEND|PASSWORD|TOKEN/.test(v));
    expect(secretLike).toEqual([]);
  });
  it('RESEND_API_KEY leses aldri via import.meta.env i nettleserkoden', () => {
    expect(appSources.filter((f) => /import\.meta\.env\.[A-Z_]*RESEND/.test(read(f)))).toEqual([]);
  });
  it('Resend-noekkelen leses bare i server-kode (src/server, src/plugins); ellers bare i hjelpetekst', () => {
    const readers = appSources.filter((f) => /env\.RESEND_API_KEY/.test(read(f)));
    expect(readers.every((f) => f.startsWith('src/server/') || f.startsWith('src/plugins/'))).toBe(true);
  });
  it('api/ inneholder bare forventede filer', () => {
    expect(readdirSync(join(ROOT, 'api')).sort()).toEqual(['email.js', 'newsletter.js', 'package.json']);
  });
  it('.env.example finnes og har ingen verdier som ligner hemmeligheter', () => {
    const text = read('.env.example');
    expect(text).not.toMatch(/re_[A-Za-z0-9]{10,}/);
  });
  it('firebase-konfig har ingen service-konto-felt', () => {
    expect(read('src/config/firebase.ts')).not.toMatch(/private_key|client_secret/);
  });
});

describe('farlige API-er i appkoden', () => {
  const grep = (re: RegExp) => appSources.filter((f) => re.test(read(f)));
  it('ingen eval / new Function', () => {
    expect(grep(/\beval\s*\(|new Function\s*\(/)).toEqual([]);
  });
  it('ingen document.write', () => {
    expect(grep(/document\.write\s*\(/)).toEqual([]);
  });
  it('ingen dangerouslySetInnerHTML eller innerHTML-tilordning', () => {
    expect(grep(/dangerouslySetInnerHTML|\.innerHTML\s*=/)).toEqual([]);
  });
  it('ingen target=_blank uten rel=noopener', () => {
    const bad = appSources.filter((f) => {
      const t = read(f);
      return [...t.matchAll(/target="_blank"[^>]*>/g)].some((m) => !/noopener/.test(m[0]) && !/rel=/.test(t.slice(m.index!, m.index! + 300)));
    });
    expect(bad).toEqual([]);
  });
  it('ingen console.log med personopplysninger-feltnavn', () => {
    expect(grep(/console\.log\([^)]*(epost|email|telefon|fornavn|etternavn)/i)).toEqual([]);
  });
  it('localStorage brukes bare av kjente filer', () => {
    expect(grep(/localStorage\./).sort()).toEqual(['src/context/AppContext.tsx', 'src/db/browserStateSnapshot.ts'].sort());
  });
  it('sessionStorage brukes bare til navigasjon og innloggingsfeil', () => {
    expect(grep(/sessionStorage\./).sort()).toEqual(['src/App.tsx', 'src/db/firebaseAuthRedirect.ts', 'src/db/useFirestoreAppSync.ts']);
  });
  it('indexedDB brukes ikke', () => {
    expect(grep(/indexedDB/)).toEqual([]);
  });
  it('ingen fetch til eksterne domener unntatt Resend i server-koden', () => {
    const external = appSources.filter((f) => /fetch\(\s*['"`]https?:\/\//.test(read(f)));
    expect(external.every((f) => f.startsWith('src/server/'))).toBe(true);
  });
  it('api/ kaller bare api.resend.com', () => {
    for (const f of ['api/email.js', 'api/newsletter.js']) {
      const urls = [...read(f).matchAll(/https?:\/\/[^'"`\s)]+/g)].map((m) => new URL(m[0]).host);
      expect(urls.every((h) => h === 'api.resend.com' || h === 'betyna.no' || h === 'www.betyna.no')).toBe(true);
    }
  });
});

describe('testmiljoet er trygt', () => {
  it('vitest er tvunget til aa ha Firestore av', () => {
    expect(process.env.VITE_FIRESTORE_ENABLED).toBe('false');
  });
  it('testfilene peker aldri paa produksjonsprosjektet', () => {
    const tests = walk('tests').concat(walk('rules'), walk('src').filter(isTest)).filter((f) => /\.tsx?$/.test(f) && !f.startsWith('tests/policy/'));
    const bad = tests.filter((f) => read(f).includes('betyna-23040'));
    expect(bad).toEqual([]);
  });
  it('emulatortester bruker et demo-prosjekt', () => {
    expect(read('rules/harness.ts')).toMatch(/projectId:\s*['"`]demo-/);
  });
});

describe('gyldig konfigurasjon', () => {
  it.each(['package.json', 'tsconfig.json', 'firebase.json', 'vercel.json', 'api/package.json'].filter((f) => existsSync(join(ROOT, f))))('%s er gyldig JSON', (f) => {
    expect(() => JSON.parse(read(f).replace(/^\uFEFF/, ''))).not.toThrow();
  });
  it('firebase.json peker paa regelfilene', () => {
    const cfg = JSON.parse(read('firebase.json'));
    expect(cfg.firestore.rules).toBe('firestore.rules');
    expect(cfg.storage.rules).toBe('storage.rules');
  });
  it('alle app-filer er gyldig UTF-8 uten BOM-feil og uten erstatningstegn', () => {
    const bad = appSources.filter((f) => read(f).includes('\uFFFD'));
    expect(bad).toEqual([]);
  });
  it('ingen app-fil importerer fra tests/ eller rules/', () => {
    const bad = appSources.filter((f) => /from\s+['"](\.\.\/)+(tests|rules)\//.test(read(f)));
    expect(bad).toEqual([]);
  });
  it('src/ har ingen tilfeldige store filer (>1 MB)', () => {
    const big = walk('src').filter((f) => statSync(join(ROOT, f)).size > 1024 * 1024).map((f) => relative(ROOT, f));
    expect(big).toEqual([]);
  });
});
