import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Child, PaymentAllocation, PaymentRecord, RecurringCharge, Sponsor } from '../../types';
import {
  formatOreAsKr,
  paymentAmountKr,
  paymentAmountOre,
  reconciliationKpis,
} from '../../utils/paymentLedger';

interface AdminVippsReconciliationProps {
  sponsors: Sponsor[];
  childrenList: Child[];
  recurringCharges: RecurringCharge[];
  paymentAllocations: PaymentAllocation[];
  payments: PaymentRecord[];
  vippsChargeJob?: { sistKjort: string; opprettet: number; feilet: number; melding?: string };
  onReconcile: (paymentId: string) => void;
}

export const AdminVippsReconciliation: React.FC<AdminVippsReconciliationProps> = ({
  sponsors,
  childrenList,
  recurringCharges,
  paymentAllocations,
  payments,
  vippsChargeJob,
  onReconcile,
}) => {
  const [filterSponsorId, setFilterSponsorId] = useState('');
  const [filterChildId, setFilterChildId] = useState('');
  const [periode, setPeriode] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);

  const kpis = useMemo(
    () =>
      reconciliationKpis({
        charges: recurringCharges,
        allocations: paymentAllocations,
        payments,
        periode,
        sponsorId: filterSponsorId || undefined,
        childId: filterChildId || undefined,
      }),
    [recurringCharges, paymentAllocations, payments, periode, filterSponsorId, filterChildId]
  );

  const chargeRows = useMemo(() => {
    let rows = recurringCharges.filter((c) => c.periode === periode);
    if (filterSponsorId) rows = rows.filter((c) => c.sponsorId === filterSponsorId);
    if (filterChildId) {
      const payIds = new Set(
        paymentAllocations.filter((a) => a.childId === filterChildId && a.periode === periode).map((a) => a.paymentId)
      );
      rows = rows.filter((c) => payIds.has(`pay_${c.id}`));
    }
    return rows.sort((a, b) => b.due.localeCompare(a.due));
  }, [recurringCharges, periode, filterSponsorId, filterChildId, paymentAllocations]);

  const childName = (id?: string) => childrenList.find((c) => c.id === id)?.fornavn ?? id ?? '—';
  const sponsorName = (id: string) => sponsors.find((s) => s.id === id)?.navn ?? id;

  const paymentForCharge = (orderId: string) =>
    payments.find((p) => p.chargeOrderId === orderId || p.id === `pay_${orderId}`);

  const allocationsForPayment = (paymentId: string) =>
    paymentAllocations.filter((a) => a.paymentId === paymentId);

  const canReconcile = (pay: PaymentRecord, charge: RecurringCharge) => {
    if (pay.status === 'avstemt') return false;
    if (charge.status === 'FAILED' || charge.status === 'PENDING' || charge.status === 'DUE') return false;
    if (charge.status !== 'CHARGED' && charge.status !== 'PARTIALLY_REFUNDED' && charge.status !== 'REFUNDED') {
      return false;
    }
    const allocs = allocationsForPayment(pay.id);
    const sum = allocs.reduce((s, a) => s + a.amountOre, 0);
    if (charge.status === 'CHARGED' && sum !== paymentAmountOre(pay)) return false;
    return pay.status === 'fullfort' || pay.status === 'delvis_refundert' || pay.status === 'refundert';
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-serif font-bold text-stone-900">Vipps-trekk og fordeling</h3>
          <p className="text-xs text-stone-500 mt-0.5">Måned {periode}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <label className="text-stone-500">
            Periode
            <input
              type="month"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="ml-1.5 px-2 py-1 border border-stone-300 rounded-md bg-stone-50"
            />
          </label>
          <label className="text-stone-500">
            Fadder
            <select
              value={filterSponsorId}
              onChange={(e) => {
                setFilterSponsorId(e.target.value);
                if (e.target.value) setFilterChildId('');
              }}
              className="ml-1.5 px-2 py-1 border border-stone-300 rounded-md bg-stone-50 max-w-[10rem]"
            >
              <option value="">Alle</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>{s.navn}</option>
              ))}
            </select>
          </label>
          <label className="text-stone-500">
            Barn
            <select
              value={filterChildId}
              onChange={(e) => {
                setFilterChildId(e.target.value);
                if (e.target.value) setFilterSponsorId('');
              }}
              className="ml-1.5 px-2 py-1 border border-stone-300 rounded-md bg-stone-50 max-w-[10rem]"
            >
              <option value="">Alle</option>
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>{c.fornavn}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
          <div className="text-stone-500 uppercase tracking-wide">Forventet</div>
          <div className="font-mono font-semibold text-stone-900">{formatOreAsKr(kpis.forventetOre)} kr</div>
        </div>
        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
          <div className="text-stone-500 uppercase tracking-wide">Trukket</div>
          <div className="font-mono font-semibold text-stone-900">{formatOreAsKr(kpis.trukketOre)} kr</div>
        </div>
        <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
          <div className="text-stone-500 uppercase tracking-wide">Fordelt</div>
          <div className="font-mono font-semibold text-stone-900">{formatOreAsKr(kpis.fordeltOre)} kr</div>
        </div>
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
          <div className="text-amber-800 uppercase tracking-wide">Avvik fordeling</div>
          <div className="font-mono font-semibold text-amber-900">{formatOreAsKr(kpis.avvikFordelingOre)} kr</div>
        </div>
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
          <div className="text-emerald-800 uppercase tracking-wide">Avstemt</div>
          <div className="font-mono font-semibold text-emerald-900">{formatOreAsKr(kpis.avstemtOre)} kr</div>
        </div>
      </div>

      {vippsChargeJob && (
        <p className="text-[11px] text-stone-500">
          Månedsjobb: sist kjørt {vippsChargeJob.sistKjort.slice(0, 16).replace('T', ' ')} — opprettet{' '}
          {vippsChargeJob.opprettet}, feilet {vippsChargeJob.feilet}
          {vippsChargeJob.melding ? ` (${vippsChargeJob.melding})` : ''}
        </p>
      )}

      <div className="overflow-x-auto border border-stone-100 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="py-2 px-3"> </th>
              <th className="py-2 px-3">Periode</th>
              <th className="py-2 px-3">Fadder</th>
              <th className="py-2 px-3">Vipps-status</th>
              <th className="py-2 px-3 text-right">Beløp</th>
              <th className="py-2 px-3 text-right">Handling</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {chargeRows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-stone-500">Ingen belastninger i utvalget.</td>
              </tr>
            )}
            {chargeRows.map((charge) => {
              const pay = paymentForCharge(charge.id);
              const expanded = expandedChargeId === charge.id;
              const allocs = pay ? allocationsForPayment(pay.id) : [];
              return (
                <React.Fragment key={charge.id}>
                  <tr className="hover:bg-stone-50/60">
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => setExpandedChargeId(expanded ? null : charge.id)}
                        className="text-stone-500 cursor-pointer"
                        aria-expanded={expanded}
                      >
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-2 px-3 font-mono">{charge.periode}</td>
                    <td className="py-2 px-3">{sponsorName(charge.sponsorId)}</td>
                    <td className="py-2 px-3 font-mono">{charge.status}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">
                      {formatOreAsKr(charge.amountOre)} kr
                      {pay?.refundertOre ? (
                        <span className="block text-[10px] text-stone-500">
                          ref. {formatOreAsKr(pay.refundertOre)} kr
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {pay && canReconcile(pay, charge) && (
                        <button
                          type="button"
                          onClick={() => onReconcile(pay.id)}
                          className="text-[#4D6B3E] font-medium cursor-pointer"
                        >
                          Avstem
                        </button>
                      )}
                      {pay?.status === 'avstemt' && <span className="text-emerald-700">Avstemt</span>}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="bg-stone-50/80">
                      <td colSpan={6} className="py-3 px-6">
                        <ul className="space-y-1 text-stone-700">
                          {allocs.length === 0 && <li className="text-stone-500">Ingen fordeling registrert.</li>}
                          {allocs.map((a) => (
                            <li key={a.id} className="flex justify-between gap-4 max-w-md">
                              <span>
                                {a.maal === 'buffer'
                                  ? 'Felles buffer'
                                  : childName(a.childId)}
                                {filterChildId && a.maal === 'barn' ? ` (${sponsorName(a.sponsorId)})` : ''}
                              </span>
                              <span className="font-mono tabular-nums">{formatOreAsKr(a.amountOre)} kr</span>
                            </li>
                          ))}
                          {pay && (
                            <li className="text-[11px] text-stone-500 pt-1 border-t border-stone-200">
                              Innbetaling: {pay.status} — {paymentAmountKr(pay).toLocaleString('no-NO')} kr
                            </li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
