'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Receipt,
  FileText,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, formatINR, formatDate } from '@/lib/api';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [statement, setStatement] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'statement' | 'orders' | 'payments'>('statement');
  const [loading, setLoading] = useState(true);

  // Online Pay Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<any>(null);

  useEffect(() => {
    loadPortalData();
  }, []);

  async function loadPortalData() {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      router.push('/portal');
      return;
    }

    try {
      setLoading(true);
      const [prof, stmt, ords, pymts] = await Promise.all([
        apiFetch<any>('/portal/profile', {}, token),
        apiFetch<any>('/portal/statement', {}, token),
        apiFetch<any[]>('/portal/orders', {}, token),
        apiFetch<any[]>('/portal/payments', {}, token),
      ]);
      setProfile(prof);
      setStatement(stmt);
      setOrders(ords);
      setPayments(pymts);
      if (prof?.currentOutstanding) {
        setPayAmount(prof.currentOutstanding);
      }
    } catch (err) {
      console.error(err);
      router.push('/portal');
    } finally {
      setLoading(false);
    }
  }

  async function handleOnlinePayment(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    try {
      setPaying(true);
      const res = await apiFetch<any>(
        '/portal/pay/confirm',
        {
          method: 'POST',
          body: JSON.stringify({
            gatewayTransactionId: `UPI_ONLINE_${Date.now()}`,
            amount: payAmount,
            notes: 'Online self-service payment via Portal',
          }),
        },
        token,
      );

      setPaySuccess(res);
      setShowPayModal(false);
      loadPortalData();
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_info');
    router.push('/portal');
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        Loading your account details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-12">
      {/* Top Mobile-First Navbar */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 px-4 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div>
          <div className="text-xs text-blue-400 font-semibold">{profile.villageName}</div>
          <h1 className="text-base font-bold text-white">{profile.fullName}</h1>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Outstanding Debt Highlight Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Total Outstanding Dues</div>
              <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                {formatINR(profile.currentOutstanding)}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur">
              {profile.customerCode}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-blue-100 pt-2 border-t border-white/20">
            <span>Credit Limit: {formatINR(profile.creditLimit)}</span>
            <span className="font-semibold text-emerald-300">
              Available Credit: {formatINR(Math.max(0, profile.creditLimit - profile.currentOutstanding))}
            </span>
          </div>

          {profile.currentOutstanding > 0 ? (
            <button
              onClick={() => {
                setPaySuccess(null);
                setShowPayModal(true);
              }}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-blue-700 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Banknote className="w-4 h-4" /> Pay Outstanding Online Now
            </button>
          ) : (
            <div className="py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> All dues fully settled!
            </div>
          )}
        </div>

        {/* Success Alert */}
        {paySuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="w-4 h-4" /> {paySuccess.message}
            </div>
            <div>Receipt Number: <strong className="font-mono">{paySuccess.receiptNumber}</strong></div>
            <div>New Outstanding Balance: <strong>{formatINR(paySuccess.newOutstanding)}</strong></div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-700 space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('statement')}
            className={`pb-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'statement' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Statement
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" /> Purchases ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Banknote className="w-4 h-4" /> Receipts ({payments.length})
          </button>
        </div>

        {/* Statement Content */}
        {activeTab === 'statement' && (
          <div className="space-y-3">
            {statement?.statement?.map((e: any) => (
              <div key={e.id} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-white text-sm">{e.description}</div>
                    <div className="text-xs text-slate-400">{formatDate(e.date)}</div>
                  </div>
                  <div className="text-right">
                    {e.debitAmount > 0 ? (
                      <div className="text-sm font-bold text-amber-400">+{formatINR(e.debitAmount)}</div>
                    ) : (
                      <div className="text-sm font-bold text-emerald-400">-{formatINR(e.creditAmount)}</div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                  <span>Running Balance:</span>
                  <span className="font-mono font-bold text-white">{formatINR(e.runningBalance)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders Content */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.map((ord: any) => (
              <div key={ord.id} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white text-sm">{ord.orderNumber}</div>
                    <div className="text-xs text-slate-400">{formatDate(ord.orderDate)}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    ord.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {ord.paymentStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  {ord.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{formatINR(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700">
                  <span>Grand Total: <strong className="text-white">{formatINR(ord.grandTotal)}</strong></span>
                  <span>Unpaid: <strong className="text-amber-400">{formatINR(ord.outstandingBalance)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments Content */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            {payments.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-sm">Receipt #{p.receiptNumber}</div>
                  <div className="text-xs text-slate-400">{formatDate(p.paymentDate)} • {p.mode}</div>
                </div>
                <div className="text-base font-black text-emerald-400">
                  {formatINR(p.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Online Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Online Payment</h2>
            <p className="text-xs text-slate-400">
              Pay via UPI Intent, NetBanking, or QR Code. Payments update your ledger immediately.
            </p>

            <form onSubmit={handleOnlinePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={profile.currentOutstanding}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-lg font-bold text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                <div className="text-slate-400">Payment Gateway: <strong>Simulated Instant UPI Gateway</strong></div>
                <div className="text-slate-400">Merchant: <strong>CreditShop Retailers</strong></div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {paying ? 'Processing...' : 'Confirm UPI Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
