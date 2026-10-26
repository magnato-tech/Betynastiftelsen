// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));
vi.mock('../../src/components/common/NotificationCenter', () => ({
  NotificationCenter: () => null,
}));
vi.mock('../../src/components/common/LanguageSwitcher', () => ({
  LanguageSwitcher: () => null,
}));
vi.mock('../../src/components/auth/PortalLoginModal', () => ({
  PortalLoginModal: () => null,
}));
vi.mock('../../src/utils/cmsHomeLayout', () => ({
  publicNavVisibility: () => ({
    fadderordningen: false,
    historier: false,
    aksjoner: false,
    omOss: false,
    apenhet: true,
    bliFadderCta: false,
  }),
}));

import { Navbar } from '../../src/components/layout/Navbar';

const baseState = (profile: unknown, loading = false) => ({
  role: 'admin',
  setRole: vi.fn(),
  t: (_key: string, fallback: string) => fallback,
  campaigns: [],
  cmsContent: undefined,
  stories: [],
  language: 'no',
  firestoreUserProfile: profile,
  firestoreProfileLoading: loading,
  firestoreAccessMessage: '',
  firestoreAuthError: '',
  enterPortalFromProfile: vi.fn(() => true),
  signOutFirestore: vi.fn(async () => {}),
});

const adminProfile = {
  id: 'u1',
  role: 'admin',
  email: 'magnar@example.no',
  displayName: 'Magnar Totland',
};

const renderNavbar = (setActiveSection = vi.fn()) =>
  render(
    <Navbar
      onOpenSponsorModal={() => {}}
      activeSection="home"
      setActiveSection={setActiveSection}
    />,
  );

afterEach(() => cleanup());

describe('Navbar innloggingsbadge', () => {
  it('viser navn og rolle for admin', () => {
    appState.value = baseState(adminProfile);
    renderNavbar();

    const badge = screen.getByLabelText('Innlogget som Magnar Totland, Admin');
    expect(badge.getAttribute('title')).toBe('magnar@example.no');
    expect(badge.textContent).toContain('Magnar Totland');
    expect(badge.textContent).toContain('Admin');
  });

  it('bruker e-post når displayName er tomt', () => {
    appState.value = baseState({
      id: 'u2',
      role: 'coordinator',
      email: 'kari@example.no',
      displayName: '   ',
    });
    renderNavbar();

    expect(screen.getByLabelText('Innlogget som kari@example.no, Koordinator')).toBeTruthy();
  });

  it('skjules når ingen profil er innlogget', () => {
    appState.value = baseState(null);
    renderNavbar();

    expect(screen.queryByLabelText(/^Innlogget som/)).toBeNull();
  });

  it('er ikke en knapp for ikke-admin', () => {
    appState.value = baseState({
      id: 'u3',
      role: 'sponsor',
      email: 'ola@example.no',
      displayName: 'Ola',
    });
    renderNavbar();

    expect(screen.queryByRole('button', { name: /Innlogget som Ola/ })).toBeNull();
    expect(screen.getByLabelText('Innlogget som Ola, Fadder')).toBeTruthy();
  });
});

describe('Navbar «Vis som»-meny for admin', () => {
  it('åpner menyen og bytter til Fadderportal', () => {
    const state = baseState(adminProfile);
    appState.value = state;
    const setActiveSection = vi.fn();
    renderNavbar(setActiveSection);

    const trigger = screen.getByRole('button', { name: 'Innlogget som Magnar Totland, Admin' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getByText('Vis som')).toBeTruthy();

    fireEvent.click(screen.getByRole('menuitem', { name: /Fadderportal/ }));
    expect(state.setRole).toHaveBeenCalledWith('sponsor');
    expect(setActiveSection).toHaveBeenCalledWith('barn');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('lukkes med Escape', () => {
    appState.value = baseState(adminProfile);
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: 'Innlogget som Magnar Totland, Admin' }));
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('Navbar «Min side»', () => {
  it('vises for fadder i offentlig visning', () => {
    appState.value = {
      ...baseState({ id: 'u4', role: 'sponsor', email: 'ola@example.no', displayName: 'Ola' }),
      role: 'public',
    };
    renderNavbar();

    expect(screen.getByRole('button', { name: 'Min side' })).toBeTruthy();
  });
});
