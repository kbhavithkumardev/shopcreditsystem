'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Users,
} from 'lucide-react';
import { apiFetch, formatINR } from '@/lib/api';

export default function PaperBookMigrationPage() {
  const [villages, setVillages] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    villageId: '',
    openingBalance: 10000,
    effectiveDate: '2026-08-31',
    sourceReference: 'PHYSICAL_NOTEBOOK_PAGE_',
    creditLimit: 25000,
  });

  const [migratedList, setMigratedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadVillages();
  }, []);

  async function loadVillages() {
    try {
      const data = await apiFetch<any[]>('/villages');
      setVillages(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, villageId: data[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleMigrate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiFetch<any>('/customers/migrate-paper-book', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setMigratedList([res, ...migratedList]);
      setSuccessMsg(`Successfully migrated ${res.fullName} with opening balance ₹${res.currentOutstanding}`);

      // Reset for next entry
      setFormData({
        ...formData,
        fullName: '',
        phone: '',
        openingBalance: 5000,
      });
    } catch (err: any) {
      alert(err.message || 'Migration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
          <BookOpen className="w-4 h-4" /> Zero Historical Data Loss
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Paper-Book Migration Wizard</h1>
        <p className="text-sm text-slate-500">
          Transfer existing handwritten notebook debts into authoritative digital ledger accounts with opening balances.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Migration Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleMigrate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name (as in notebook) *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Ramesh Chandra"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+919876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Village *</label>
              <select
                required
                value={formData.villageId}
                onChange={(e) => setFormData({ ...formData, villageId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Debt Balance (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Notebook Page / Book Ref</label>
              <input
                type="text"
                value={formData.sourceReference}
                onChange={(e) => setFormData({ ...formData, sourceReference: e.target.value })}
                placeholder="e.g. RED_REGISTER_PAGE_45"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Effective As-Of Date</label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Migrate & Post Opening Ledger Entry
            </button>
          </div>
        </form>
      </div>

      {/* Migrated Session Customers */}
      {migratedList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3">Migrated In This Session</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {migratedList.map((c) => (
              <div key={c.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900">{c.fullName}</span>
                  <span className="text-slate-500 ml-2">({c.village?.name || 'Village'})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900">{formatINR(c.currentOutstanding)}</span>
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="text-emerald-600 hover:underline font-semibold"
                  >
                    View 360°
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
