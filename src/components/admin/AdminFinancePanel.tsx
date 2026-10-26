import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isoDaysAgo, isoMonthStart, isoToday, isoYearStart } from '../../utils/dateFormat';
import {
  paymentTotals,
  paymentsInRange,
  sortPayments,
  type PaymentSortDir,
  type PaymentSortKey,
} from '../../utils/paymentRegister';
import { paymentAmountKr } from '../../utils/paymentLedger';
import { AdminVippsReconciliation } from './AdminVippsReconciliation';

interface AdminFinancePanelProps {
  setActiveSection: (sec: string) => void;
}

const SORT_COLS: [PaymentSortKey, string, string][] = [
  ['dato', 'Dato', ''],
  ['giver', 'Giver', ''],
  ['type', 'Type', ''],
  ['metode', 'Metode', ''],
  ['referanse', 'Referanse', ''],
  ['belop', 'Beløp', 'text-right'],
  ['status', 'Status', 'text-center'],
];

export const AdminFinancePanel: React.FC<AdminFinancePanelProps> = ({ setActiveSection }) => {
  const {
    childrenList,
    sponsors,
    reports,
    inquiries,
    payments,
    recurringCharges,
    paymentAllocations,
    vippsChargeJob,
    reconcilePayment,
  } = useApp();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortKey, setSortKey] = useState<PaymentSortKey>('dato');
  const [sortDir, setSortDir] = useState<PaymentSortDir>('desc');

  const pendingReports = reports.filter((r) => r.status === 'innsendt').length;
  const pendingPhotos = childrenList.filter((c) => c.ventendeFotoStatus === 'innsendt' && c.ventendeFotoUrl).length;
  const pendingInquiries = inquiries.filter((inq) => inq.status !== 'besvart' && inq.status !== 'lukket').length;
  const monthlyPledged = sponsors
    .filter((s) => s.betalingsstatus === 'aktiv')
    .reduce((sum, s) => sum + s.maanedsbelop, 0);

  const ranged = useMemo(() => paymentsInRange(payments, fromDate, toDate), [payments, fromDate, toDate]);
  const sorted = useMemo(() => sortPayments(ranged, sortKey, sortDir), [ranged, sortKey, sortDir]);
  const totals = useMemo(() => paymentTotals(ranged), [ranged]);

  const toggleSort = (key: PaymentSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'giver' || key === 'type' ? 'asc' : 'desc');
  };

  const setPreset = (preset: 'month' | '30' | 'year' | 'all') => {
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      return;
    }
    const today = isoToday();
    setToDate(today);
    if (preset === 'month') setFromDate(isoMonthStart());
    if (preset === '30') setFromDate(isoDaysAgo(30));
    if (preset === 'year') setFromDate(isoYearStart());
  };

  const periodLabel = fromDate || toDate ? `${fromDate || '…'} – ${toDate || '…'}` : 'Alle registrerte transaksjoner';

  const box = (
    label: string,
    value: React.ReactNode,
    hint: string,
    onClick?: () => void
  ) => {
    const className =
      'p-4 rounded-xl border border-stone-200 bg-white shadow-xs space-y-1 text-left w-full';
    const inner = (
      <>
        <span className="text-[11px] text-stone-500 uppercase tracking-wider font-medium">{label}</span>
        <div className="text-xl font-serif font-bold text-stone-900 font-mono tabular-nums">{value}</div>
        <p className="text-[11px] text-stone-500">{hint}</p>
      </>
    );
    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={`${className} hover:border-stone-300 cursor-pointer`}>
          {inner}
        </button>
      );
    }
    return <div className={className}>{inner}</div>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {box('Rapporter til godkjenning', pendingReports, 'Fra innsendte rapporter', () =>
          setActiveSection('godkjenning')
        )}
        {box('Bilder til godkjenning', pendingPhotos, 'Fra innsendte skolebilder', () =>
          setActiveSection('godkjenning')
        )}
        {box('Åpne spørsmål', pendingInquiries, 'Fra spørsmålskøen', () => setActiveSection('sporsmaal'))}
        {box(
          'Månedlige fadderbidrag',
          `${monthlyPledged.toLocaleString('no-NO')} kr`,
          'Sum av aktive fadderavtaler'
        )}
        {box(
          'Innsamlet til aksjoner',
          `${totals.aksjon.toLocaleString('no-NO')} kr`,
          'Sum av aksjonsinnbetalinger i perioden'
        )}
        {box(
          'Avstemmingsgrad',
          totals.avstemmingsgrad === null ? '—' : `${totals.avstemmingsgrad} %`,
          totals.avstemmingsgrad === null
            ? 'Ingen transaksjoner i perioden'
            : `${totals.avstemt.toLocaleString('no-NO')} kr avstemt av ${totals.total.toLocaleString('no-NO')} kr`
        )}
      </div>

      <AdminVippsReconciliation
        sponsors={sponsors}
        childrenList={childrenList}
        recurringCharges={recurringCharges}
        paymentAllocations={paymentAllocations}
        payments={payments}
        vippsChargeJob={vippsChargeJob}
        onReconcile={reconcilePayment}
      />

      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-stone-900">Transaksjonslogg og avstemming</h3>
            <p className="text-xs text-stone-500 mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <label className="text-stone-500">
              Fra
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="ml-1.5 px-2 py-1 border border-stone-300 rounded-md bg-stone-50 text-stone-800"
              />
            </label>
            <label className="text-stone-500">
              Til
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="ml-1.5 px-2 py-1 border border-stone-300 rounded-md bg-stone-50 text-stone-800"
              />
            </label>
            {(
              [
                ['month', 'Denne måneden'],
                ['30', '30 dager'],
                ['year', 'I år'],
                ['all', 'Alle'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPreset(id)}
                className="px-2 py-1 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                {SORT_COLS.map(([key, label, align]) => {
                  const active = sortKey === key;
                  return (
                    <th
                      key={key}
                      scope="col"
                      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={`w-full py-3 px-4 font-semibold uppercase tracking-wider hover:text-stone-900 cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                          align === 'text-right' ? 'justify-end' : align === 'text-center' ? 'justify-center' : ''
                        }`}
                      >
                        <span>{label}</span>
                        {active ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#4D6B3E]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#4D6B3E]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        )}
                      </button>
                    </th>
                  );
                })}
                <th className="py-3 px-4 text-right font-semibold uppercase tracking-wider">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-stone-500">
                    Ingen transaksjoner i valgt periode.
                  </td>
                </tr>
              )}
              {sorted.map((pay) => (
                <tr key={pay.id} className="hover:bg-stone-50/60">
                  <td className="py-3 px-4 text-stone-800 font-mono">{pay.dato}</td>
                  <td className="py-3 px-4 font-medium text-stone-900">{pay.fadderNavn}</td>
                  <td className="py-3 px-4 text-stone-600">
                    {pay.type === 'fadderbidrag' ? 'Fadderbidrag' : `Aksjon: ${pay.aksjonTittel || 'Spesifikk'}`}
                  </td>
                  <td className="py-3 px-4 text-stone-600 uppercase font-mono">{pay.metode}</td>
                  <td className="py-3 px-4 text-stone-500 font-mono">{pay.referanse}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-stone-900 tabular-nums">
                    {paymentAmountKr(pay).toLocaleString('no-NO')} kr
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-medium ${
                        pay.status === 'avstemt' ? 'text-emerald-700' : 'text-[#4D6B3E]'
                      }`}
                    >
                      {pay.status === 'avstemt' ? 'Avstemt' : 'Mottatt'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {pay.status !== 'avstemt' && (
                      <button
                        type="button"
                        onClick={() => reconcilePayment(pay.id)}
                        className="text-[#4D6B3E] hover:text-[#3B522F] font-medium cursor-pointer"
                      >
                        Marker avstemt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
