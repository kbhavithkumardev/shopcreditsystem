'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  Receipt,
  Calendar,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Banknote,
  FileText,
  Clock,
} from 'lucide-react';
import { apiFetch, formatINR, formatDate } from '@/lib/api';

export default function Customer360Page() {
  const params = useParams();
  const customerId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [statement, setStatement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'statement' | 'orders' | 'payments'>('statement');
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  async function loadCustomerData() {
    try {
      setLoading(true);
      const [c360, stmt] = await Promise.all([
        apiFetch<any>(`/customers/${customerId}/360`),
        apiFetch<any>(`/ledger/statement/${customerId}`),
      ]);
      setData(c360);
      setStatement(stmt);
      if (c360?.profile?.currentOutstanding) {
        setPaymentAmount(c360.profile.currentOutstanding);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          amount: paymentAmount,
          mode: paymentMode,
          referenceNumber: paymentRef || undefined,
          notes: paymentNotes || undefined,
        }),
      });
      setShowPaymentModal(false);
      setPaymentNotes('');
      setPaymentRef('');
      loadCustomerData();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading Customer 360° Profile...
      </div>
    );
  }

  const { profile, summary, recentOrders, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/customers"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {profile.customerCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {profile.villageName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile.phone}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <Banknote className="w-4 h-4" /> Record Repayment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Current Outstanding</div>
          <div className="text-2xl font-extrabold text-amber-700">{formatINR(profile.currentOutstanding)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Authoritative ledger balance</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Credit Limit</div>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(profile.creditLimit)}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Available: {formatINR(profile.availableCredit)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Purchases</div>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(summary.totalPurchases)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{summary.totalOrdersCount} lifetime orders</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Repaid</div>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(summary.totalPaid)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Cash, UPI & Online payments</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('statement')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'statement'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Live Financial Ledger Statement
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" /> Purchase Orders ({recentOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Banknote className="w-4 h-4" /> Payment Receipts ({recentPayments.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'statement' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-medium text-slate-600">
            <span>Authoritative Append-Only Ledger History</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled Balance: {formatINR(statement?.derivedBalance)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5 text-right">Debit (Debt +)</th>
                  <th className="px-6 py-3.5 text-right">Credit (Paid -)</th>
                  <th className="px-6 py-3.5 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {statement?.statement?.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 text-slate-600 font-sans">{formatDate(e.date)}</td>
                    <td className="px-6 py-3.5 text-slate-900 font-sans font-medium">{e.description}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-sans text-[11px] font-semibold">
                        {e.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                      {e.debitAmount > 0 ? formatINR(e.debitAmount) : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-emerald-700">
                      {e.creditAmount > 0 ? formatINR(e.creditAmount) : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 font-mono text-sm">
                      {formatINR(e.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {recentOrders.map((ord: any) => (
            <div key={ord.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
                <div>
                  <div className="font-bold text-slate-900 text-base">{ord.orderNumber}</div>
                  <div className="text-xs text-slate-500">{formatDate(ord.orderDate)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    ord.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ord.paymentStatus}
                  </span>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Grand Total</div>
                    <div className="font-extrabold text-slate-900 text-base">{formatINR(ord.grandTotal)}</div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 mb-4">
                {ord.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <span>{item.quantity}x {item.productName}</span>
                    <span className="font-semibold text-slate-900">{formatINR(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Immediate Paid: <strong>{formatINR(ord.immediatePaid)}</strong></span>
                <span>Remaining Order Balance: <strong className="text-amber-700">{formatINR(ord.outstandingBalance)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3.5">Receipt #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Mode</th>
                <th className="px-6 py-3.5">Reference</th>
                <th className="px-6 py-3.5 text-right">Amount Repaid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">{p.receiptNumber}</td>
                  <td className="px-6 py-3.5 text-slate-600 text-xs">{formatDate(p.paymentDate)}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                      {p.mode}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-500">{p.referenceNumber || '-'}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-emerald-700">{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Repayment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Record Repayment</h2>
            <p className="text-xs text-slate-500 mb-4">
              Repayments are automatically allocated across oldest unpaid orders (FIFO) and recorded in the immutable ledger.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UPI / Cheque / Bank Ref #</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-TXN-887722"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Month-end harvest cash settlement"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  Confirm & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
