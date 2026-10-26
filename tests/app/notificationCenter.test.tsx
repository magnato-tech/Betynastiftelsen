// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenter } from '../../src/components/common/NotificationCenter';
import type { AppNotification } from '../../src/types';

const appState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../src/context/AppContext', () => ({
  useApp: () => appState.value,
}));

const varsel: AppNotification = {
  id: 'n1',
  targetRole: 'admin',
  title: 'Ny feltrapport krever godkjenning (Ange)',
  message: 'Kari har sendt inn ny rapport.',
  timestamp: '2026-10-16 10:00',
  type: 'report_needs_approval',
  read: false,
  actionSection: 'godkjenning',
  relatedEntityId: 'rep-42',
};

function oppsett(notifications: AppNotification[]) {
  appState.value = {
    role: 'admin',
    language: 'no',
    currentRoleNotifications: notifications,
    unreadNotificationCount: notifications.filter((n) => !n.read).length,
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  };
}

afterEach(() => {
  cleanup();
});

describe('NotificationCenter', () => {
  it('sender relatedEntityId med naar varslet er klikket', () => {
    oppsett([varsel]);
    const onNavigate = vi.fn();
    render(<NotificationCenter onNavigateSection={onNavigate} />);
    fireEvent.click(screen.getByLabelText('Varslingssenter'));
    fireEvent.click(screen.getByText('Gå til godkjenningskø'));
    expect(onNavigate).toHaveBeenCalledWith('godkjenning', 'rep-42');
  });

  it('sender undefined som id naar varslet ikke har relatedEntityId', () => {
    oppsett([{ ...varsel, relatedEntityId: undefined }]);
    const onNavigate = vi.fn();
    render(<NotificationCenter onNavigateSection={onNavigate} />);
    fireEvent.click(screen.getByLabelText('Varslingssenter'));
    fireEvent.click(screen.getByText('Gå til godkjenningskø'));
    expect(onNavigate).toHaveBeenCalledWith('godkjenning', undefined);
  });
});
