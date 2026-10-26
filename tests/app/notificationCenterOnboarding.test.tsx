// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenter } from '../../src/components/common/NotificationCenter';
import { makeSponsor } from '../../src/test/testData';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));

function oppsett(role: 'admin' | 'coordinator', sponsors = [makeSponsor({ id: 's-ny', navn: 'Pia Hansen', registrertKilde: 'nettside', tildeltBarnIds: [] })]) {
  appState.value = {
    role,
    language: 'no',
    currentRoleNotifications: [],
    unreadNotificationCount: 0,
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    sponsors,
    childrenList: [],
  };
}

afterEach(() => {
  cleanup();
});

describe('NotificationCenter: onboarding-oppgaver', () => {
  it('viser oppgave for ny fadder og åpner brukere-seksjonen for fadderen', () => {
    oppsett('admin');
    const onNavigate = vi.fn();
    render(<NotificationCenter onNavigateSection={onNavigate} />);
    fireEvent.click(screen.getByLabelText('Varslingssenter'));

    expect(screen.getByText('Oppgaver')).toBeTruthy();
    expect(screen.getByText('Ny fadder: Pia Hansen – venter på godkjenning')).toBeTruthy();
    fireEvent.click(screen.getByText('Åpne'));
    expect(onNavigate).toHaveBeenCalledWith('brukere', 'sponsor:s-ny');
  });

  it('teller oppgaver i klokkemerket', () => {
    oppsett('admin');
    render(<NotificationCenter />);
    expect(screen.getByLabelText('Varslingssenter').textContent).toBe('1');
  });

  it('viser ikke oppgaver for koordinator', () => {
    oppsett('coordinator');
    render(<NotificationCenter />);
    fireEvent.click(screen.getByLabelText('Varslingssenter'));
    expect(screen.queryByText('Oppgaver')).toBeNull();
    expect(screen.getByLabelText('Varslingssenter').textContent).toBe('');
  });
});
