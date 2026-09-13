'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Phone, ArrowRight, Store, Lock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<any>('/auth/customer/login', {
        method: 'POST',
        body: JSON.stringify({ phone, pinOrOtp: otp }),
      });

      if (res.accessToken) {
        localStorage.setItem('customer_token', res.accessToken);
        localStorage.setItem('customer_info', JSON.stringify(res.customer));
        router.push('/portal/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your phone number.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-slate-950 font-black">
            ₹
          </div>
          CreditShop Customer Portal
        </div>
        <Link
          href="/login"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
        >
          <Store className="w-3.5 h-3.5" /> Owner Backoffice
        </Link>
      </div>

      <div className="max-w-md mx-auto w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Customer Self-Service
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In to Your Account</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your live credit balance, itemized bills, payment receipts, and pay outstanding dues online.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Mobile Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-base font-mono focus:outline-none focus:border-blue-500"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">4-Digit Security PIN or OTP</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-base font-mono tracking-widest focus:outline-none focus:border-blue-500"
                placeholder="••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Verifying...' : 'Access My Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-400 leading-relaxed">
          🔒 Secure authentication. Only your personal purchase records, payment receipts, and ledger statements are accessible from your device.
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pb-4">
        Protected with Strict Tenant Data Scoping & Immutable Ledger Verification.
      </div>
    </div>
  );
}
