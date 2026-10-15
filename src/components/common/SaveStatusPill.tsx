import React from 'react';
import { useApp } from '../../context/AppContext';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

/** Viser admin om alt er lagret i databasen. Vises bare når databasen er koblet til. */
export const SaveStatusPill: React.FC = () => {
  const { firestoreBackendActive, firestoreSave } = useApp();
  if (!firestoreBackendActive) return null;

  let text = 'Alt er lagret i databasen';
  let tone = 'bg-white text-stone-700 border-stone-200';
  if (firestoreSave.state === 'saving') {
    text = 'Lagrer …';
    tone = 'bg-amber-50 text-amber-900 border-amber-200';
  } else if (firestoreSave.state === 'saved' && firestoreSave.lastSavedAt) {
    text = `Lagret kl. ${formatTime(firestoreSave.lastSavedAt)}`;
    tone = 'bg-emerald-50 text-emerald-900 border-emerald-200';
  } else if (firestoreSave.state === 'error') {
    text = firestoreSave.error || 'Kunne ikke lagre';
    tone = 'bg-red-50 text-red-900 border-red-200';
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 max-w-sm px-3 py-2 rounded-lg border text-xs shadow-sm ${tone}`}
    >
      {text}
    </div>
  );
};
