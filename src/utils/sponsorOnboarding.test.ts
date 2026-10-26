import { describe, expect, it } from 'vitest';
import type { Child, Sponsor } from '../types';
import { makeChild, makeSponsor } from '../test/testData';
import {
  buildOnboardingTasks,
  buildWelcomeEmailDraft,
  escapeHtml,
  isOpenAdminTask,
  onboardingStepOf,
  onboardingTaskTitle,
  plainTextToHtml,
} from './sponsorOnboarding';

const nettside = (overrides: Partial<Sponsor> = {}) =>
  makeSponsor({ id: 's-ny', navn: 'Pia Hansen', registrertKilde: 'nettside', tildeltBarnIds: [], ...overrides });

describe('onboardingStepOf', () => {
  it('bruker lagret steg når onboarding finnes', () => {
    const s = nettside({ onboarding: { steg: 'godkjent' } });
    expect(onboardingStepOf(s, [])).toBe('godkjent');
  });

  it('gir "ferdig" når invitert fadder har innloggingsstatus aktiv', () => {
    const s = nettside({ onboarding: { steg: 'invitert' } });
    expect(onboardingStepOf(s, [], 'aktiv')).toBe('ferdig');
  });

  it('blir værende på "invitert" når innloggingen fortsatt er invitert', () => {
    const s = nettside({ onboarding: { steg: 'invitert' } });
    expect(onboardingStepOf(s, [], 'invitert')).toBe('invitert');
    expect(onboardingStepOf(s, [])).toBe('invitert');
  });

  it('eldre nettside-registrering uten onboarding-felt og uten barn er "ny"', () => {
    expect(onboardingStepOf(nettside(), [])).toBe('ny');
  });

  it('eldre nettside-registrering med barn i tildeltBarnIds er ikke i onboarding', () => {
    expect(onboardingStepOf(nettside({ tildeltBarnIds: ['c1'] }), [])).toBeNull();
  });

  it('eldre nettside-registrering med barn som peker tilbake (tildeltFadderId) er ikke i onboarding', () => {
    const barn = makeChild({ id: 'c1', tildeltFadderId: 's-ny' });
    expect(onboardingStepOf(nettside(), [barn])).toBeNull();
  });

  it('avsluttet nettside-registrering uten onboarding-felt er ikke i onboarding', () => {
    expect(onboardingStepOf(nettside({ avsluttet: '2026-10-01' }), [])).toBeNull();
  });

  it('admin-registrert fadder uten onboarding-felt er ikke i onboarding', () => {
    expect(onboardingStepOf(makeSponsor({ registrertKilde: 'admin' }), [])).toBeNull();
  });

  it('avvist påmelding beholder steget "avvist"', () => {
    const s = nettside({ onboarding: { steg: 'avvist' }, avsluttet: '2026-10-02' });
    expect(onboardingStepOf(s, [])).toBe('avvist');
  });
});

describe('isOpenAdminTask', () => {
  it.each([
    ['ny', true],
    ['godkjent', true],
    ['barn_tildelt', true],
    ['invitert', false],
    ['ferdig', false],
    ['avvist', false],
  ] as const)('%s er åpen oppgave: %s', (steg, forventet) => {
    expect(isOpenAdminTask(steg)).toBe(forventet);
  });

  it('null er ikke en oppgave', () => {
    expect(isOpenAdminTask(null)).toBe(false);
  });
});

describe('onboardingTaskTitle', () => {
  const s = nettside({ navn: 'Pia Hansen' });
  it('ny: venter på godkjenning', () => {
    expect(onboardingTaskTitle(s, 'ny')).toBe('Ny fadder: Pia Hansen – venter på godkjenning');
  });
  it('godkjent: tildel barn', () => {
    expect(onboardingTaskTitle(s, 'godkjent')).toBe('Pia Hansen – tildel barn');
  });
  it('barn_tildelt: send velkomst-e-post', () => {
    expect(onboardingTaskTitle(s, 'barn_tildelt')).toBe('Pia Hansen – send velkomst-e-post');
  });
});

describe('buildOnboardingTasks', () => {
  it('gir åpne oppgaver med id, fadder-id og tittel, og hopper over de som er ferdige', () => {
    const sponsors: Sponsor[] = [
      nettside({ id: 's1', navn: 'Ny Person' }),
      nettside({ id: 's2', navn: 'Godkjent', onboarding: { steg: 'godkjent' } }),
      nettside({ id: 's3', navn: 'Ferdig', onboarding: { steg: 'ferdig' } }),
      nettside({ id: 's4', navn: 'Avvist', onboarding: { steg: 'avvist' } }),
      makeSponsor({ id: 's5', navn: 'Admin-fadder', registrertKilde: 'admin' }),
    ];
    const oppgaver = buildOnboardingTasks(sponsors, []);
    expect(oppgaver).toEqual([
      {
        id: 'onboarding-s1',
        sponsorId: 's1',
        title: 'Ny fadder: Ny Person – venter på godkjenning',
        step: 'ny',
      },
      {
        id: 'onboarding-s2',
        sponsorId: 's2',
        title: 'Godkjent – tildel barn',
        step: 'godkjent',
      },
    ]);
  });

  it('en fadder som allerede har fått barn gir ingen oppgave', () => {
    const barn: Child[] = [makeChild({ id: 'c1', tildeltFadderId: 's1' })];
    expect(buildOnboardingTasks([nettside({ id: 's1' })], barn)).toEqual([]);
  });
});

describe('buildWelcomeEmailDraft', () => {
  const loginUrl = 'https://betyna.example/';

  it('har norsk emne og hilser med fornavn', () => {
    const { subject, body } = buildWelcomeEmailDraft({
      sponsorName: 'Pia Hansen',
      childFirstNames: ['Amara'],
      loginUrl,
    });
    expect(subject).toBe('Velkommen som fadder i Betyna');
    expect(body.startsWith('Hei Pia,')).toBe(true);
  });

  it('nevner barnets fornavn og innloggingslenken', () => {
    const { body } = buildWelcomeEmailDraft({ sponsorName: 'Pia', childFirstNames: ['Amara'], loginUrl });
    expect(body).toContain('Du følger nå Amara.');
    expect(body).toContain(loginUrl);
  });

  it('lister flere barn med «og» før siste', () => {
    const { body } = buildWelcomeEmailDraft({
      sponsorName: 'Pia',
      childFirstNames: ['Amara', 'Jean', 'Esther'],
      loginUrl,
    });
    expect(body).toContain('Du følger nå Amara, Jean og Esther.');
  });

  it('slutter med vennlig hilsen og er ren tekst med linjeskift', () => {
    const { body } = buildWelcomeEmailDraft({ sponsorName: 'Pia', childFirstNames: ['Amara'], loginUrl });
    expect(body.endsWith('Vennlig hilsen\nBetyna')).toBe(true);
    expect(body).not.toContain('<');
  });

  it('bruker "et barn i Brazzaville" når ingen barn er oppgitt', () => {
    const { body } = buildWelcomeEmailDraft({ sponsorName: 'Pia', childFirstNames: [], loginUrl });
    expect(body).toContain('Du følger nå et barn i Brazzaville.');
  });
});

describe('HTML for e-post', () => {
  it('escaper HTML-tegn', () => {
    expect(escapeHtml('<b>"Ola" & \'Kari\'</b>')).toBe('&lt;b&gt;&quot;Ola&quot; &amp; &#39;Kari&#39;&lt;/b&gt;');
  });

  it('gjør linjeskift om til <br> og escaper innholdet', () => {
    expect(plainTextToHtml('Hei <Pia>\n\nVennlig')).toBe('Hei &lt;Pia&gt;<br><br>Vennlig');
  });
});
