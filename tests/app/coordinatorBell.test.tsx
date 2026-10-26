// @vitest-environment jsdom
import React, { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AppNotification, Inquiry } from '../../src/types';
import { NotificationCenter } from '../../src/components/common/NotificationCenter';
import { CoordinatorPortal } from '../../src/components/coordinator/CoordinatorPortal';
import { makeChild, makeCoordinator, makeReport } from '../../src/test/testData';
import { mountApp, useAppTestLifecycle } from './harness';

useAppTestLifecycle();

const varsel = (id: string, extra: Partial<AppNotification>): AppNotification => ({
  id,
  targetRole: 'coordinator',
  title: `Varsel ${id}`,
  message: 'Test',
  timestamp: '2026-10-16 10:00',
  type: 'inquiry_forwarded',
  read: false,
  ...extra,
});

const inquiry = (id: string, status: Inquiry['status'] = 'venter_koordinator'): Inquiry => ({
  id,
  fadderId: 's1',
  fadderNavn: 'Fadder',
  barnId: 'child-a',
  barnNavn: 'Barn A',
  sporsmaal: 'Hvordan går det med skolen?',
  datoSendt: '2026-10-15',
  status,
  koordinatorId: 'coord-a',
});

const koordinatorer = () => [
  makeCoordinator({ id: 'coord-a', fornavn: 'Kari', etternavn: 'A' }),
  makeCoordinator({ id: 'coord-b', fornavn: 'Ola', etternavn: 'B' }),
];

describe('Koordinator ser bare egne varsler', () => {
  const notifs = [
    varsel('uadressert', {}),
    varsel('annen', { recipientId: 'coord-b' }),
    varsel('egen', { recipientId: 'coord-a' }),
    varsel('alle', { targetRole: 'all' }),
    varsel('fadder', { targetRole: 'sponsor', recipientId: 'coord-a' }),
  ];

  const somKoordinator = (ns: AppNotification[]) => {
    const m = mountApp({ coordinators: koordinatorer(), notifications: ns });
    m.run((a) => {
      a.setRole('coordinator');
      a.setCurrentCoordinatorId('coord-a');
    });
    return m;
  };

  it('skjuler uadresserte varsler og varsler til andre koordinatorer', () => {
    const ids = somKoordinator(notifs).app.currentRoleNotifications.map((n) => n.id).sort();
    expect(ids).toEqual(['alle', 'egen']);
  });

  it('teller bare synlige uleste varsler', () => {
    expect(somKoordinator(notifs).app.unreadNotificationCount).toBe(2);
  });

  it('«Merk alle som lest» endrer bare koordinatorens egne varsler', () => {
    const m = somKoordinator(notifs);
    m.run((a) => a.markAllNotificationsAsRead());
    const lest = (id: string) => m.app.notifications.find((n) => n.id === id)?.read;
    expect(lest('egen')).toBe(true);
    expect(lest('alle')).toBe(true);
    expect(lest('uadressert')).toBe(false);
    expect(lest('annen')).toBe(false);
    expect(lest('fadder')).toBe(false);
  });
});

describe('Flytting av elev sender åpne varsler til ny koordinator', () => {
  it('flytter uleste varsler om eleven, dens rapporter og spørsmål, men ikke andre', () => {
    const m = mountApp({
      coordinators: koordinatorer(),
      children: [
        makeChild({ id: 'child-a', internKode: 'T-01', koordinatorId: 'coord-a' }),
        makeChild({ id: 'child-b', internKode: 'T-02', fornavn: 'Barn B', koordinatorId: 'coord-a' }),
      ],
      reports: [makeReport({ id: 'rep-a', barnId: 'child-a', koordinatorId: 'coord-a' })],
      inquiries: [inquiry('inq-a')],
      notifications: [
        varsel('n-barn', { recipientId: 'coord-a', relatedEntityId: 'child-a' }),
        varsel('n-rapport', { recipientId: 'coord-a', relatedEntityId: 'rep-a' }),
        varsel('n-sporsmal', { recipientId: 'coord-a', relatedEntityId: 'inq-a', actionSection: 'questions' }),
        varsel('n-lest', { recipientId: 'coord-a', relatedEntityId: 'child-a', read: true }),
        varsel('n-annen-elev', { recipientId: 'coord-a', relatedEntityId: 'child-b' }),
      ],
    });

    m.run((a) => a.reassignChildCoordinator('child-a', 'coord-b'));

    const mottaker = (id: string) => m.app.notifications.find((n) => n.id === id)?.recipientId;
    expect(mottaker('n-barn')).toBe('coord-b');
    expect(mottaker('n-rapport')).toBe('coord-b');
    expect(mottaker('n-sporsmal')).toBe('coord-b');
    expect(mottaker('n-lest')).toBe('coord-a');
    expect(mottaker('n-annen-elev')).toBe('coord-a');
  });
});

describe('Varsel om spørsmål åpner spørsmålet i koordinatorportalen', () => {
  const spoersmalsVarsel = varsel('sp-1', {
    recipientId: 'coord-a',
    title: 'Demande de précision (Barn A)',
    actionSection: 'questions',
    relatedEntityId: 'inq-1',
  });

  /** Varslingssenter og portal sammen, slik de sitter i appen (navigasjon med fokus). */
  function Bjelle() {
    const [section, setSection] = useState('home');
    const [focus, setFocus] = useState<string | null>(null);
    return (
      <>
        <NotificationCenter
          onNavigateSection={(s, id) => {
            setSection(s);
            setFocus(id ?? null);
          }}
        />
        <CoordinatorPortal
          activeSection={section}
          setActiveSection={(s) => {
            setSection(s);
            setFocus(null);
          }}
          focusEntityId={focus}
          onClearFocus={() => setFocus(null)}
        />
      </>
    );
  }

  const oppsett = (inquiries: Inquiry[]) => {
    const m = mountApp(
      { coordinators: koordinatorer(), children: [makeChild({ id: 'child-a', koordinatorId: 'coord-a' })], inquiries, notifications: [spoersmalsVarsel] },
      () => <Bjelle />,
    );
    m.run((a) => {
      a.setRole('coordinator');
      a.setCurrentCoordinatorId('coord-a');
    });
    return m;
  };

  it('klikk på varselet fremhever spørsmålet og åpner svarskjemaet', () => {
    oppsett([inquiry('inq-1'), inquiry('inq-2')]);
    fireEvent.click(screen.getByLabelText('Varslingssenter'));
    fireEvent.click(screen.getByRole('button', { name: 'Se henvendelse' }));

    expect(screen.getByPlaceholderText('Skriv svaret eller presiseringen til Kristiansand...')).toBeTruthy();
    expect(document.getElementById('sporsmal-inq-1')?.className).toContain('ring-2 ring-[#4D6B3E]');
    expect(document.getElementById('sporsmal-inq-2')?.className).not.toContain('ring-2');
    expect(screen.queryByText('Dette spørsmålet venter ikke lenger på svar fra deg.')).toBeNull();
  });

  it('viser infolinje når det fokuserte spørsmålet ikke lenger venter på koordinatoren', () => {
    const m = mountApp(
      {
        coordinators: koordinatorer(),
        children: [makeChild({ id: 'child-a', koordinatorId: 'coord-a' })],
        // Besvart og ikke lenger knyttet til denne koordinatoren: skal ikke stå i listen.
        inquiries: [{ ...inquiry('inq-1', 'besvart'), koordinatorId: '' }],
      },
      () => <CoordinatorPortal activeSection="questions" setActiveSection={() => undefined} focusEntityId="inq-1" />,
    );
    m.run((a) => a.setCurrentCoordinatorId('coord-a'));
    expect(screen.getByText('Dette spørsmålet venter ikke lenger på svar fra deg.')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Skriv svaret eller presiseringen til Kristiansand...')).toBeNull();
  });

  it('lagring av svar fjerner fokus', () => {
    oppsett([inquiry('inq-1')]);
    fireEvent.click(screen.getByLabelText('Varslingssenter'));
    fireEvent.click(screen.getByRole('button', { name: 'Se henvendelse' }));
    fireEvent.change(screen.getByPlaceholderText('Skriv svaret eller presiseringen til Kristiansand...'), {
      target: { value: 'Barnet går godt på skolen.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lagre svaret' }));
    expect(document.getElementById('sporsmal-inq-1')?.className).not.toContain('ring-2');
  });
});
