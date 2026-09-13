'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, Plus, Search, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiFetch, formatINR } from '@/lib/api';

function CustomersContent() {
  const searchParams = useSearchParams();
  const initialVillageId = searchParams.get('villageId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedVillage, setSelectedVillage] = useState(initialVillageId);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Customer Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    villageId: '',
    creditLimit: 20000,
    address: '',
    notes: '',
  });
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  useEffect(() => {
    loadVillages();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [selectedVillage, search]);

  async function loadVillages() {
    try {
      const data = await apiFetch<any[]>('/villages');
      setVillages(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadCustomers() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedVillage) query.set('villageId', selectedVillage);
      if (search) query.set('search', search);

      const data = await apiFetch<any[]>(`/customers?${query.toString()}`);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function checkDuplicates() {
    if (!formData.fullName || !formData.phone) return;
    try {
      const res = await apiFetch<any>('/customers/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ fullName: formData.fullName, phone: formData.phone }),
      });
      if (res.isDuplicate) {
        setDuplicateWarning(res);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ fullName: '', phone: '', villageId: '', creditLimit: 20000, address: '', notes: '' });
      setDuplicateWarning(null);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Directory</h1>
          <p className="text-sm text-slate-500">Village-wise customer credit accounts and profiles.</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/migration"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors shadow-sm"
          >
            Import Paper Book
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, phone, or customer code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedVillage}
          onChange={(e) => setSelectedVillage(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="">All Villages</option>
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.customerCount} customers)
            </option>
          ))}
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Village</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Outstanding Debt</th>
                <th className="px-6 py-4">Credit Limit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{c.fullName}</div>
                    <div className="text-xs text-slate-400 font-mono">{c.customerCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {c.villageName}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{c.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${c.currentOutstanding > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                      {formatINR(c.currentOutstanding)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{formatINR(c.creditLimit)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                    >
                      360° Profile <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal with Duplicate Detection */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Register New Customer</h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-time duplicate detection protects against duplicate customer creation.
            </p>

            {duplicateWarning && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Possible Duplicate Customer Detected!</div>
                  {duplicateWarning.exactPhoneMatch && (
                    <div>Phone number already used by: <strong>{duplicateWarning.exactPhoneMatch.fullName}</strong> ({duplicateWarning.exactPhoneMatch.villageName})</div>
                  )}
                  {duplicateWarning.similarNameMatches?.length > 0 && (
                    <div>Similar names found: {duplicateWarning.similarNameMatches.map((m: any) => m.fullName).join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onBlur={checkDuplicates}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Ramesh Chandra"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onBlur={checkDuplicates}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="+919876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Village *</label>
                  <select
                    required
                    value={formData.villageId}
                    onChange={(e) => setFormData({ ...formData, villageId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Village</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Near Post Office, House #23"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading customer directory...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
