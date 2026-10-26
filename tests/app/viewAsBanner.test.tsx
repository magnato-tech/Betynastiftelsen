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

import { ViewAsBanner } from '../../src/components/common/ViewAsBanner';

const baseState = (role: string) => ({
  role,
  setRole: vi.fn(),
  sponsors: [
    { id: 's1', navn: 'Kari Nordmann' },
    { id: 's2', navn: 'Per Hansen' },
  ],
  currentSponsor: { id: 's1', navn: 'Kari Nordmann' },
  setCurrentSponsorId: vi.fn(),
  coordinators: [{ id: 'c1', fornavn: 'Anna', etternavn: 'Berg', distrikt: 'Kinshasa' }],
  currentCoordinator: { id: 'c1', fornavn: 'Anna', etternavn: 'Berg', distrikt: 'Kinshasa' },
  setCurrentCoordinatorId: vi.fn(),
});

afterEach(() => cleanup());

describe('ViewAsBanner', () => {
  it('viser fadder-visning med velger og tilbake-knapp', () => {
    const state = baseState('sponsor');
    appState.value = state;
    const setActiveSection = vi.fn();
    render(<ViewAsBanner setActiveSection={setActiveSection} />);

    expect(screen.getByText('Du ser siden som fadder')).toBeTruthy();
    expect(screen.getByText(/Kun visning/)).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Velg fadder' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tilbake til admin' }));
    expect(state.setRole).toHaveBeenCalledWith('admin');
    expect(setActiveSection).toHaveBeenCalledWith('godkjenning');
  });

  it('viser offentlig visning uten fadder-velger', () => {
    appState.value = baseState('public');
    render(<ViewAsBanner setActiveSection={() => {}} />);

    expect(screen.getByText('Du ser den offentlige nettsiden')).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tilbake til admin' })).toBeTruthy();
  });
});
