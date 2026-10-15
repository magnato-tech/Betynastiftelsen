import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { buildNewsletterRecipients, type NewsletterAudience } from '../../newsletter/recipients';
import { SYSTEM_EMAIL_TEMPLATES, fillTemplate, type SystemTemplateId } from '../../email/templates';
import { buildSponsorPortalLink } from '../../email/sponsorPortalLink';
import type { EmailKind, EmailOutboxItem } from '../../types';
import { fetchResendStatus, postBetynaEmail } from '../../email/client';

type Tab = EmailKind;
type SendStatus = 'idle' | 'sending' | 'ok' | 'wait-config' | 'error';

export const AdminEmailPanel: React.FC = () => {
  const {
    sponsors,
    coordinators,
    inquiries,
    emailOutbox,
    addEmailOutboxItem,
    updateEmailOutboxItem,
    addAuditLog,
  } = useApp();
  const [resendReady, setResendReady] = useState<boolean | null>(null);
  const [resendFrom, setResendFrom] = useState('');
  const [tab, setTab] = useState<Tab>('inquiry');
  const [status, setStatus] = useState<SendStatus>('idle');
  const [message, setMessage] = useState('');

  const [audience, setAudience] = useState<NewsletterAudience>('sponsors');
  const [nlSubject, setNlSubject] = useState('');
  const [nlBody, setNlBody] = useState('');

  const [inquiryId, setInquiryId] = useState('');
  const [inqSubject, setInqSubject] = useState('Svar fra Betyna');
  const [inqBody, setInqBody] = useState('');

  const [templateId, setTemplateId] = useState<SystemTemplateId>('report_approved');
  const [systemSponsorId, setSystemSponsorId] = useState(sponsors[0]?.id || '');

  const newsletterRecipients = useMemo(
    () => buildNewsletterRecipients(sponsors, coordinators, audience),
    [sponsors, coordinators, audience]
  );

  const inquiryOptions = useMemo(() => {
    return inquiries.map((inq) => {
      const sponsor = sponsors.find((s) => s.id === inq.fadderId);
      return { inq, email: sponsor?.epost || '', name: inq.fadderNavn };
    });
  }, [inquiries, sponsors]);

  const selectedInquiry = inquiryOptions.find((o) => o.inq.id === inquiryId);
  const template = SYSTEM_EMAIL_TEMPLATES.find((t) => t.id === templateId)!;
  const systemSponsor = sponsors.find((s) => s.id === systemSponsorId);
  const systemLink = buildSponsorPortalLink(
    typeof window !== 'undefined' ? window.location.origin : 'https://betyna.no',
    systemSponsor?.id || 'sponsor-01',
    'sporsmaal'
  );
  const systemSubject = fillTemplate(template.subject, { navn: systemSponsor?.navn, lenke: systemLink });
  const systemBody = fillTemplate(template.body, { navn: systemSponsor?.navn, lenke: systemLink });

  useEffect(() => {
    void fetchResendStatus()
      .then((s) => {
        setResendReady(s.configured);
        setResendFrom(s.from);
      })
      .catch(() => setResendReady(false));
  }, []);

  const recordOutbox = (
    kind: EmailKind,
    payload: Record<string, unknown>,
    emails: string[],
    status: EmailOutboxItem['status'],
    note?: string
  ) =>
    addEmailOutboxItem({
      kind,
      subject: String(payload.subject),
      body: String(payload.html),
      toEmails: emails,
      audience: payload.audience as NewsletterAudience | undefined,
      relatedId: typeof payload.relatedId === 'string' ? payload.relatedId : undefined,
      templateId: typeof payload.templateId === 'string' ? payload.templateId : undefined,
      status,
      note,
    });

  const postEmail = async (payload: Record<string, unknown>, kind: EmailKind, emails: string[]) => {
    setStatus('sending');
    setMessage('');
    try {
      const { status: http, json } = await postBetynaEmail(payload);
      const subject = String(payload.subject);
      if (http === 503 || json.code === 'NOT_CONFIGURED') {
        setStatus('wait-config');
        setMessage(json.message || 'Resend er ikke koplet ennå. Utkastet er lagt i køen.');
        recordOutbox(kind, payload, emails, 'venter_nøkkel', 'Klar når RESEND_API_KEY er satt.');
        addAuditLog('E-post klar, venter på Resend', `${kind}: «${subject}» til ${emails.length}.`);
        return;
      }
      if (http >= 400 || !json.ok) {
        setStatus('error');
        setMessage(json.message || 'Sending feilet.');
        recordOutbox(kind, payload, emails, 'feilet', json.message);
        return;
      }
      setStatus('ok');
      setMessage(`Sendt via Resend til ${json.sent ?? emails.length} mottaker(e).`);
      recordOutbox(kind, payload, emails, 'sendt', json.id);
      addAuditLog('Sendte e-post via Resend', `${kind}: «${subject}» (${json.sent}).`);
      setResendReady(true);
    } catch {
      setStatus('error');
      setMessage('Kunne ikke nå /api/email. Kjør npm run dev.');
    }
  };

  const retryOutbox = async (row: EmailOutboxItem) => {
    const payload: Record<string, unknown> = {
      kind: row.kind,
      subject: row.subject,
      html: row.body,
      emails: row.toEmails,
      audience: row.audience,
      relatedId: row.relatedId,
      templateId: row.templateId,
    };
    try {
      const { status: http, json } = await postBetynaEmail(payload);
      if (http === 200 && json.ok) {
        updateEmailOutboxItem(row.id, { status: 'sendt', note: json.id });
        setResendReady(true);
      } else if (http === 503) {
        updateEmailOutboxItem(row.id, { status: 'venter_nøkkel', note: json.message });
      } else {
        updateEmailOutboxItem(row.id, { status: 'feilet', note: json.message });
      }
    } catch {
      updateEmailOutboxItem(row.id, { status: 'feilet', note: 'API ikke tilgjengelig' });
    }
  };

  const kindLabel = (k: EmailKind) =>
    k === 'newsletter' ? 'Nyhetsbrev' : k === 'inquiry' ? 'Henvendelse' : 'System';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#4D6B3E] font-semibold">E-post</span>
        <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Henvendelser, systemmeldinger og nyhetsbrev</h2>
        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
          Sending går via Resend på serveren (`/api/email`). Nøkkelen ligger bare i `.env` / Vercel, aldri i git.
        </p>
        <p
          className={`mt-2 text-xs rounded-lg px-3 py-2 border ${
            resendReady
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          {resendReady === null
            ? 'Sjekker Resend…'
            : resendReady
              ? `Resend er koplet. Avsender: ${resendFrom}`
              : 'Resend er ikke koplet. Legg RESEND_API_KEY og EMAIL_FROM i .env og restart npm run dev. Se docs/RESEND.md.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(['inquiry', 'system', 'newsletter'] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setStatus('idle');
              setMessage('');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
              tab === id ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-700'
            }`}
          >
            {kindLabel(id)}
          </button>
        ))}
      </div>

      {tab === 'inquiry' && (
        <form
          className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedInquiry?.email || !inqSubject.trim() || !inqBody.trim()) return;
            void postEmail(
              {
                kind: 'inquiry',
                subject: inqSubject.trim(),
                html: inqBody.trim(),
                emails: [selectedInquiry.email],
                relatedId: selectedInquiry.inq.id,
              },
              'inquiry',
              [selectedInquiry.email]
            );
          }}
        >
          <p className="text-xs text-stone-600">
            Svar på fadderspørsmål eller henvendelse. Teksten går til fadderens e-post. Ingen intern kode eller
            etternavn på barn.
          </p>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Henvendelse</label>
            <select
              value={inquiryId}
              onChange={(e) => {
                const next = inquiryOptions.find((o) => o.inq.id === e.target.value);
                setInquiryId(e.target.value);
                if (next) {
                  setInqBody(
                    `Hei ${next.name},\n\nTakk for spørsmålet om ${next.inq.barnNavn}.\n\n${next.inq.svarTekst || 'Skriv svaret her.'}\n\nVennlig hilsen\nBetyna`
                  );
                }
              }}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
              required
            >
              <option value="">Velg henvendelse</option>
              {inquiryOptions.map((o) => (
                <option key={o.inq.id} value={o.inq.id} disabled={!o.email}>
                  {o.name} — {o.inq.barnNavn} ({o.email || 'mangler e-post'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Emne</label>
            <input
              value={inqSubject}
              onChange={(e) => setInqSubject(e.target.value)}
              required
              minLength={3}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Melding</label>
            <textarea
              value={inqBody}
              onChange={(e) => setInqBody(e.target.value)}
              required
              minLength={10}
              rows={8}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            />
          </div>
          <SubmitRow status={status} message={message} label="Legg i kø / send svar" disabled={!selectedInquiry?.email} />
        </form>
      )}

      {tab === 'system' && (
        <form
          className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!systemSponsor?.epost) return;
            void postEmail(
              {
                kind: 'system',
                subject: systemSubject,
                html: systemBody,
                emails: [systemSponsor.epost],
                relatedId: systemSponsor.id,
                templateId,
              },
              'system',
              [systemSponsor.epost]
            );
          }}
        >
          <p className="text-xs text-stone-600">
            Maler for varsler. Her sender du manuelt. Hva som går ut av seg selv, styres under Innstillinger.
          </p>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Mal</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as SystemTemplateId)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            >
              {SYSTEM_EMAIL_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500 mt-1">{template.note}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Mottaker (fadder)</label>
            <select
              value={systemSponsorId}
              onChange={(e) => setSystemSponsorId(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            >
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.navn} ({s.epost})
                </option>
              ))}
            </select>
          </div>
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-stone-800">{systemSubject}</p>
            <p className="text-stone-600 whitespace-pre-wrap">{systemBody}</p>
          </div>
          <SubmitRow
            status={status}
            message={message}
            label="Legg systemmelding i kø"
            disabled={!systemSponsor?.epost}
          />
        </form>
      )}

      {tab === 'newsletter' && (
        <form
          className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-xs space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nlSubject.trim() || !nlBody.trim() || newsletterRecipients.length === 0) return;
            const emails = newsletterRecipients.map((r) => r.email);
            void postEmail(
              { kind: 'newsletter', subject: nlSubject.trim(), html: nlBody.trim(), audience, emails },
              'newsletter',
              emails
            );
          }}
        >
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Mottakere</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as NewsletterAudience)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            >
              <option value="sponsors">
                Faddere ({buildNewsletterRecipients(sponsors, coordinators, 'sponsors').length})
              </option>
              <option value="coordinators">Koordinatorer ({coordinators.length})</option>
              <option value="all">Alle med e-post</option>
            </select>
            <p className="text-[11px] text-stone-500 mt-1">{newsletterRecipients.length} adresser i denne gruppen.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Emne</label>
            <input
              value={nlSubject}
              onChange={(e) => setNlSubject(e.target.value)}
              required
              minLength={3}
              placeholder="F.eks. Oppdatering fra Brazzaville"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Melding</label>
            <textarea
              value={nlBody}
              onChange={(e) => setNlBody(e.target.value)}
              required
              minLength={10}
              rows={8}
              placeholder="Kort, verdig tekst. Ingen barneprofiler eller intern kode."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm"
            />
          </div>
          <SubmitRow
            status={status}
            message={message}
            label="Legg nyhetsbrev i kø"
            disabled={newsletterRecipients.length === 0}
          />
        </form>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-serif font-bold text-stone-900">Kø (prototype)</h3>
        {emailOutbox.length === 0 ? (
          <p className="text-xs text-stone-500">Ingen utkast ennå.</p>
        ) : (
          <ul className="divide-y divide-stone-100 bg-white rounded-xl border border-stone-200 text-xs">
            {emailOutbox.slice(0, 12).map((row) => (
              <li key={row.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span>
                  <span className="font-semibold">{kindLabel(row.kind)}</span>
                  {' · '}
                  {row.subject}
                  <span className="text-stone-500"> · {row.toEmails.length} mottaker(e)</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-stone-500 font-mono">{row.status}</span>
                  {row.status !== 'sendt' && (
                    <button
                      type="button"
                      onClick={() => void retryOutbox(row)}
                      className="text-[#4D6B3E] font-medium cursor-pointer hover:underline"
                    >
                      Send via Resend
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-xs text-stone-500 flex items-start gap-2">
        <Mail className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Verifiser betyna.no i Resend. Sett RESEND_API_KEY og EMAIL_FROM i Vercel og i lokal .env. Restart dev-server.
          Ingen nøkkel i git.
        </span>
      </div>
    </div>
  );
};

const SubmitRow: React.FC<{
  status: SendStatus;
  message: string;
  label: string;
  disabled?: boolean;
}> = ({ status, message, label, disabled }) => (
  <>
    {status === 'wait-config' && (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {message}
      </div>
    )}
    {status === 'ok' && (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex gap-2">
        <CheckCircle className="w-4 h-4 shrink-0" />
        {message}
      </div>
    )}
    {status === 'error' && (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {message}
      </div>
    )}
    <button
      type="submit"
      disabled={status === 'sending' || disabled}
      className="px-4 py-2.5 bg-[#4D6B3E] hover:bg-[#3B522F] disabled:opacity-50 text-white rounded-lg text-sm font-medium cursor-pointer inline-flex items-center gap-2"
    >
      <Send className="w-4 h-4" />
      {status === 'sending' ? 'Køer…' : label}
    </button>
  </>
);
