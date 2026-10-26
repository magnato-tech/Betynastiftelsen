// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Inquiry } from '../../src/types';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));

import { InquiryWorkPanel } from '../../src/components/admin/InquiryWorkPanel';

const spoersmaal: Inquiry = {
  id: 'q1',
  fadderId: 's1',
  fadderNavn: 'Fadder A',
  barnId: 'c1',
  barnNavn: 'Mia',
  sporsmaal: 'Hvordan går det med skolen?',
  datoSendt: '2026-10-01',
  status: 'mottatt',
  koordinatorNotatFr: 'Elle va bien',
};


afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('InquiryWorkPanel', () => {
  it('viser spørsmål og koordinatorens notat', () => {
    appState.value = { answerInquiry: vi.fn(), forwardInquiryToCoordinator: vi.fn() };
    render(<InquiryWorkPanel inquiry={spoersmaal} onDone={vi.fn()} />);
    expect(screen.getByText('Fra: Fadder A vedr. Mia')).toBeTruthy();
    expect(screen.getByText('Feltnotat fra Kongo:', { exact: false })).toBeTruthy();
  });

  it('publiserer svar, kaller answerInquiry med trimmet tekst og kaller onDone({ svart: true })', () => {
    const answerInquiry = vi.fn();
    const onDone = vi.fn();
    appState.value = { answerInquiry, forwardInquiryToCoordinator: vi.fn() };
    render(<InquiryWorkPanel inquiry={spoersmaal} onDone={onDone} />);

    fireEvent.change(screen.getByPlaceholderText('Skriv svar...'), { target: { value: '  Det går fint  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publiser svar til fadder' }));

    expect(answerInquiry).toHaveBeenCalledWith('q1', 'Det går fint');
    expect(onDone).toHaveBeenCalledWith({ svart: true });
  });

  it('tomt svar gjør ingenting', () => {
    const answerInquiry = vi.fn();
    const onDone = vi.fn();
    appState.value = { answerInquiry, forwardInquiryToCoordinator: vi.fn() };
    render(<InquiryWorkPanel inquiry={spoersmaal} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publiser svar til fadder' }));
    expect(answerInquiry).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('sender til koordinator med fransk notat, og kaller onDone({ svart: false })', () => {
    const forwardInquiryToCoordinator = vi.fn();
    const onDone = vi.fn();
    appState.value = { answerInquiry: vi.fn(), forwardInquiryToCoordinator };
    render(<InquiryWorkPanel inquiry={spoersmaal} onDone={onDone} />);

    fireEvent.change(screen.getByPlaceholderText('Valgfri fransk instruks til Kongo...'), {
      target: { value: 'Appeler la famille' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send til koordinator i Kongo' }));

    expect(forwardInquiryToCoordinator).toHaveBeenCalledWith('q1', 'Appeler la famille');
    expect(onDone).toHaveBeenCalledWith({ svart: false });
  });
});
