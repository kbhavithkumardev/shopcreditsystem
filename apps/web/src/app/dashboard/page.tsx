'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  ShoppingCart,
  CalendarCheck,
  Receipt,
  BookOpen,
  Plus,
} from 'lucide-react';
import { apiFetch, formatINR } from '@/lib/api';

export default function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await apiFetch<any>('/dashboard/metrics', {}, token || undefined);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }

  const kpis = data?.kpis || {
    totalOutstanding: 0,
    todaySales: 0,
    todayCreditGenerated: 0,
    todayCollections: 0,
    totalCustomers: 0,
    totalVillages: 0,
    todayOrdersCount: 0,
  };

  const villages = data?.villageBreakdown || [];
  const topDebtors = data?.topDebtors || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs sm:text-sm mb-1">
            <ShieldCheck className="w-4 h-4" /> Real-time Authoritative Ledger Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Owner Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Live village-wise credit position, collections, and financial health.
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" /> New Credit Sale
          </Link>
          <Link
            href="/dashboard/collections"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <CalendarCheck className="w-4 h-4" /> Village Collections
          </Link>
          <Link
            href="/dashboard/migration"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4" /> Import Paper Book
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Outstanding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outstanding</span>
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {formatINR(kpis.totalOutstanding)}
          </div>
          <p className="text-xs text-slate-500">
            Across <span className="font-semibold text-slate-700">{kpis.totalCustomers} customers</span> in {kpis.totalVillages} villages
          </p>
        </div>

        {/* Today's Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Sales</span>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {formatINR(kpis.todaySales)}
          </div>
          <p className="text-xs text-slate-500">
            {kpis.todayOrdersCount} orders placed today
          </p>
        </div>

        {/* Today's Collections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Collections</span>
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {formatINR(kpis.todayCollections)}
          </div>
          <p className="text-xs text-slate-500">
            Cash & UPI down payments + repayments
          </p>
        </div>

        {/* Today's Credit Generated */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Credit Generated</span>
            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {formatINR(kpis.todayCreditGenerated)}
          </div>
          <p className="text-xs text-slate-500">
            Deferred to customer ledgers today
          </p>
        </div>
      </div>

      {/* Two Column Grid: Village Position & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Village-Wise Credit Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" /> Village-Wise Credit Position
              </h2>
              <p className="text-xs text-slate-500">Geographic credit exposure distribution</p>
            </div>
            <Link
              href="/dashboard/villages"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              Villages <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {villages.map((v: any) => {
              const pct = kpis.totalOutstanding > 0 ? (v.totalOutstanding / kpis.totalOutstanding) * 100 : 0;
              return (
                <div key={v.villageId} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-slate-900">{v.villageName}</span>
                      <span className="text-xs text-slate-500 ml-2">({v.customerCount} customers)</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{formatINR(v.totalOutstanding)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>Share of total shop debt</span>
                    <span className="font-semibold text-slate-700">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}

            {villages.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl p-4">
                No villages registered yet. Click &quot;Add Village&quot; to begin.
              </div>
            )}
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Top Customer Debts
              </h2>
              <p className="text-xs text-slate-500">Highest outstanding customer credit accounts</p>
            </div>
            <Link
              href="/dashboard/customers"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Directory <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {topDebtors.map((d: any) => (
              <div key={d.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{d.fullName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{d.phone}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-600" /> {d.villageName}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3 sm:gap-4">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{formatINR(d.currentOutstanding)}</div>
                    <div className="text-[11px] text-slate-400">Limit: {formatINR(d.creditLimit)}</div>
                  </div>
                  <Link
                    href={`/dashboard/customers/${d.id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                  >
                    360°
                  </Link>
                </div>
              </div>
            ))}

            {topDebtors.length === 0 && !loading && (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl p-4">
                No active credit accounts yet. Use POS Checkout or Paper-Book Migration to register transactions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
