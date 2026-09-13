'use client';

import { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Plus,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Banknote,
  Search,
} from 'lucide-react';
import { apiFetch, formatINR, formatDate } from '@/lib/api';

export default function CollectionsPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [villageSheet, setVillageSheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Cycle Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [cycleNotes, setCycleNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycleId && selectedVillageId) {
      loadVillageSheet(selectedCycleId, selectedVillageId);
    }
  }, [selectedCycleId, selectedVillageId]);

  async function loadData() {
    try {
      setLoading(true);
      const [cList, vList] = await Promise.all([
        apiFetch<any[]>('/collections/cycles'),
        apiFetch<any[]>('/villages'),
      ]);
      setCycles(cList);
      setVillages(vList);
      if (cList.length > 0) {
        setSelectedCycleId(cList[0].id);
        if (cList[0].villages?.length > 0) {
          setSelectedVillageId(cList[0].villages[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadVillageSheet(cycleId: string, villageId: string) {
    try {
      const data = await apiFetch<any>(`/collections/cycles/${cycleId}/villages/${villageId}`);
      setVillageSheet(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function updateStatus(entryId: string, status: string, promiseDate?: string) {
    try {
      await apiFetch(`/collections/entries/${entryId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, promiseDate }),
      });
      loadVillageSheet(selectedCycleId, selectedVillageId);
    } catch (err: any) {
      alert(err.message || 'Failed to update entry');
    }
  }

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    if (selectedVillages.length === 0) {
      alert('Select at least one village for the collection cycle');
      return;
    }
    try {
      await apiFetch('/collections/cycles', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          startDate,
          endDate,
          villageIds: selectedVillages,
          notes: cycleNotes,
        }),
      });
      setShowModal(false);
      setNewTitle('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create collection cycle');
    }
  }

  const activeCycle = cycles.find((c) => c.id === selectedCycleId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Month-End Collection Management</h1>
          <p className="text-sm text-slate-500">
            Eliminate manual book checks. Auto-generate village collection sheets and track door-to-door repayments.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Start Collection Cycle
        </button>
      </div>

      {/* Cycle Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cycles.map((c) => {
          const isSelected = c.id === selectedCycleId;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCycleId(c.id);
                if (c.villages?.length > 0) setSelectedVillageId(c.villages[0].id);
              }}
              className={`p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {c.status}
                </span>
                <span className="text-xs text-slate-400">{formatDate(c.startDate)} - {formatDate(c.endDate)}</span>
              </div>
              <h2 className="font-bold text-slate-900 text-sm mb-3">{c.title}</h2>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-bold text-slate-900">{formatINR(c.totalTarget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Collected:</span>
                  <span className="font-bold text-emerald-700">{formatINR(c.totalCollected)} ({c.collectionPercentage}%)</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, c.collectionPercentage))}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Village Collection Sheet View */}
      {activeCycle && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Field Collection Sheet</div>
              <h2 className="text-xl font-bold text-slate-900">{activeCycle.title}</h2>
            </div>

            {/* Village Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {activeCycle.villages?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVillageId(v.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedVillageId === v.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1" /> {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Village Aggregate Summary */}
          {villageSheet && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Village Debtors</div>
                <div className="text-lg font-bold text-slate-900">{villageSheet.totalCustomers}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Expected Target</div>
                <div className="text-lg font-bold text-slate-900">{formatINR(villageSheet.totalExpected)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Collected</div>
                <div className="text-lg font-bold text-emerald-700">{formatINR(villageSheet.totalCollected)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Remaining Target</div>
                <div className="text-lg font-bold text-amber-700">{formatINR(villageSheet.remainingDue)}</div>
              </div>
            </div>
          )}

          {/* Debtor Entries Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Opening Outstanding</th>
                  <th className="px-4 py-3 text-right">Target (₹)</th>
                  <th className="px-4 py-3 text-right">Collected (₹)</th>
                  <th className="px-4 py-3">Collection Status</th>
                  <th className="px-4 py-3">Promise Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {villageSheet?.entries?.map((entry: any) => (
                  <tr key={entry.entryId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {entry.customerName}
                      <div className="text-[11px] text-slate-400 font-mono">{entry.customerCode}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{entry.customerPhone}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatINR(entry.openingOutstanding)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatINR(entry.expectedTarget)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatINR(entry.collectedAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={entry.status}
                        onChange={(e) => updateStatus(entry.entryId, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          entry.status === 'COLLECTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : entry.status === 'PROMISED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROMISED">PROMISED</option>
                        <option value="COLLECTED">COLLECTED</option>
                        <option value="SKIPPED">SKIPPED</option>
                        <option value="UNREACHABLE">UNREACHABLE</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={entry.promiseDate ? entry.promiseDate.split('T')[0] : ''}
                        onChange={(e) => updateStatus(entry.entryId, entry.status, e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Cycle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Start Month-End Collection Cycle</h2>
            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cycle Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. October 2026 Pension & Festival Collection"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Villages to Include *</label>
                <div className="space-y-2 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2.5">
                  {villages.map((v) => (
                    <label key={v.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedVillages.includes(v.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVillages([...selectedVillages, v.id]);
                          } else {
                            setSelectedVillages(selectedVillages.filter((id) => id !== v.id));
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      <span>{v.name} ({v.customerCount} customers)</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                >
                  Generate Collection Sheets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
