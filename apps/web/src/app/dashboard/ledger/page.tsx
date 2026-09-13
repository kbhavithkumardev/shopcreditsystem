'use client';

import { useEffect, useState } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { apiFetch, formatINR, formatDate } from '@/lib/api';

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  // Adjustment Modal State
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [adjCustomerId, setAdjCustomerId] = useState('');
  const [adjAmount, setAdjAmount] = useState(100);
  const [adjDirection, setAdjDirection] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [adjType, setAdjType] = useState('DISCOUNT_ADJUSTMENT');
  const [adjReason, setAdjReason] = useState('');

  useEffect(() => {
    loadLedgerData();
  }, []);

  async function loadLedgerData() {
    try {
      setLoading(true);
      const [eList, rec, cList] = await Promise.all([
        apiFetch<any[]>('/ledger/entries'),
        apiFetch<any>('/ledger/reconciliation'),
        apiFetch<any[]>('/customers'),
      ]);
      setEntries(eList);
      setReconciliation(rec);
      setCustomers(cList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunReconciliation() {
    try {
      setReconciling(true);
      const rec = await apiFetch<any>('/ledger/reconciliation');
      setReconciliation(rec);
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  }

  async function handleCreateAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjCustomerId) {
      alert('Select customer');
      return;
    }
    try {
      await apiFetch('/ledger/adjustment', {
        method: 'POST',
        body: JSON.stringify({
          customerId: adjCustomerId,
          amount: adjAmount,
          direction: adjDirection,
          adjustmentType: adjType,
          reason: adjReason,
        }),
      });
      setShowAdjModal(false);
      setAdjReason('');
      loadLedgerData();
    } catch (err: any) {
      alert(err.message || 'Adjustment failed');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Authoritative Financial Ledger</h1>
          <p className="text-sm text-slate-500">
            Immutable, append-only financial records and zero-defect balance reconciliation.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAdjModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Adjustment
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={reconciling}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} /> Run Reconciliation
          </button>
        </div>
      </div>

      {/* Reconciliation Health Card */}
      {reconciliation && (
        <div className={`p-5 rounded-2xl border ${
          reconciliation.reconciliationStatus === 'ALL_RECONCILED'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm">
                  {reconciliation.reconciliationStatus === 'ALL_RECONCILED'
                    ? '100% Zero Silent Inconsistency Guarantee Active'
                    : 'Financial Discrepancy Detected!'}
                </div>
                <div className="text-xs text-emerald-800">
                  Audited <strong>{reconciliation.totalCustomersChecked} customer accounts</strong> across all ledger entries.
                  All balances are mathematically identical to the sum of debits and credits.
                </div>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-200/60 text-emerald-900">
              Audited Just Now
            </span>
          </div>
        </div>
      )}

      {/* Ledger Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-medium text-slate-500">
          <span>Global Append-Only Transaction History ({entries.length} records)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Entry #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Transaction Type</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5 text-right">Debit (Debt +)</th>
                <th className="px-6 py-3.5 text-right">Credit (Paid -)</th>
                <th className="px-6 py-3.5 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-3.5 font-mono text-slate-400">#{e.entryNumber}</td>
                  <td className="px-6 py-3.5 text-slate-600">{formatDate(e.createdAt)}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900">{e.customerName}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {e.type}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate">{e.description}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                    {e.debitAmount > 0 ? formatINR(e.debitAmount) : '-'}
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-emerald-700">
                    {e.creditAmount > 0 ? formatINR(e.creditAmount) : '-'}
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatINR(e.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Audited Ledger Adjustment</h2>
            <p className="text-xs text-slate-500 mb-4">
              All adjustments are appended to the ledger and preserve full historical audit logs.
            </p>

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
                <select
                  required
                  value={adjCustomerId}
                  onChange={(e) => setAdjCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.villageName}) - Debt: ₹{c.currentOutstanding}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direction</label>
                  <select
                    value={adjDirection}
                    onChange={(e) => setAdjDirection(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CREDIT">CREDIT (Decrease Debt)</option>
                    <option value="DEBIT">DEBIT (Increase Debt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Category</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="DISCOUNT_ADJUSTMENT">Discount / Goodwill Credit</option>
                  <option value="BAD_DEBT_WRITEOFF">Bad Debt Writeoff</option>
                  <option value="MANUAL_ADJUSTMENT">Correction / Manual Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason / Justification *</label>
                <textarea
                  required
                  rows={2}
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Goodwill festival discount on bulk rice purchase"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  Apply & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
