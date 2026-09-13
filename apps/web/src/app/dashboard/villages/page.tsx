'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Users, CreditCard, Search, ArrowRight } from 'lucide-react';
import { apiFetch, formatINR } from '@/lib/api';

export default function VillagesPage() {
  const [villages, setVillages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    taluk: '',
    district: '',
    pincode: '',
    notes: '',
  });

  useEffect(() => {
    loadVillages();
  }, []);

  async function loadVillages() {
    try {
      setLoading(true);
      const data = await apiFetch<any[]>('/villages');
      setVillages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/villages', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ name: '', code: '', taluk: '', district: '', pincode: '', notes: '' });
      loadVillages();
    } catch (err: any) {
      alert(err.message || 'Failed to create village');
    }
  }

  const filtered = villages.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.taluk && v.taluk.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Village Management</h1>
          <p className="text-sm text-slate-500">First-class geographic credit aggregation and customer groupings.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Village
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search village by name or taluk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {/* Villages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((v) => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                {v.code && (
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                    {v.code}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900">{v.name}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {v.taluk ? `${v.taluk}, ` : ''}{v.district || 'Main Region'} {v.pincode ? `(${v.pincode})` : ''}
              </p>

              {v.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mb-4">
                  {v.notes}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 py-3 border-t border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Customers</div>
                  <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Users className="w-4 h-4 text-slate-500" /> {v.customerCount}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Debt</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {formatINR(v.totalOutstanding)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href={`/dashboard/customers?villageId=${v.id}`}
                className="inline-flex items-center justify-center w-full gap-2 py-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                View Customers in {v.name} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Village Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Village</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Village Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Rampur"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Village Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="VIL-RAM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Taluk / Block</label>
                  <input
                    type="text"
                    value={formData.taluk}
                    onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="East Taluk"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="Central"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="560001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  rows={2}
                  placeholder="Collection cycle timing, agricultural season, etc."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                >
                  Create Village
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
