import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { FirestoreUserDirectoryEntry } from '../../db/firestoreProfile';

export const UserDirectoryInviteForm: React.FC = () => {
  const { coordinators, sponsors, inviteUserToDirectory, firestoreUserEmail } = useApp();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'coordinator' | 'sponsor'>('coordinator');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes('@')) {
      setError('Skriv inn en gyldig e-postadresse.');
      return;
    }
    const entry: FirestoreUserDirectoryEntry = {
      email: trimmedEmail,
      role,
      displayName: displayName.trim() || undefined,
    };
    if (role === 'coordinator') entry.coordinatorId = coordinatorId;
    if (role === 'sponsor') entry.sponsorId = sponsorId;

    setBusy(true);
    try {
      await inviteUserToDirectory(entry);
      setMessage(
        `Lagret i userDirectory. ${trimmedEmail} kan logge inn med Google eller e-postlenke og kommer til ${role === 'coordinator' ? 'koordinatorportalen' : 'fadderportalen'}.`
      );
      setEmail('');
      setDisplayName('');
      setCoordinatorId('');
      setSponsorId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre invitasjonen.');
    } finally {
      setBusy(false);
    }
  };

  if (!firestoreUserEmail) return null;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4">
      <div className="flex items-start gap-2">
        <UserPlus className="w-4 h-4 text-[#4D6B3E] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-serif font-bold text-stone-900">Inviter koordinator eller fadder</h3>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
            Oppretter én rad i <code className="text-[10px]">userDirectory</code> (e-post som dokument-ID). Ved første
            innlogging kopieres rollen til <code className="text-[10px]">users/&#123;uid&#125;</code>. Bootstrap-admin
            trenger ikke rad her.
          </p>
        </div>
      </div>
      <form onSubmit={(ev) => void submit(ev)} className="space-y-4 max-w-xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-stone-700">
            E-post
            <input
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="navn@eksempel.no"
            />
          </label>
          <label className="block text-xs text-stone-700">
            Visningsnavn (valgfritt)
            <input
              type="text"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-xs text-stone-700">
          Rolle
          <select
            value={role}
            onChange={(ev) => setRole(ev.target.value as 'coordinator' | 'sponsor')}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
          >
            <option value="coordinator">Koordinator</option>
            <option value="sponsor">Fadder</option>
          </select>
        </label>
        {role === 'coordinator' && (
          <label className="block text-xs text-stone-700">
            Koordinator i databasen
            <select
              required
              value={coordinatorId}
              onChange={(ev) => setCoordinatorId(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Velg …</option>
              {coordinators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fornavn} {c.etternavn} ({c.id})
                </option>
              ))}
            </select>
          </label>
        )}
        {role === 'sponsor' && (
          <label className="block text-xs text-stone-700">
            Fadder i databasen
            <select
              required
              value={sponsorId}
              onChange={(ev) => setSponsorId(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Velg …</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.navn} ({s.id})
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 bg-[#4D6B3E] text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40"
        >
          {busy ? 'Lagrer …' : 'Lagre i userDirectory'}
        </button>
      </form>
      {message && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{message}</p>
      )}
      {error && (
        <p className="text-xs text-red-900 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
};
