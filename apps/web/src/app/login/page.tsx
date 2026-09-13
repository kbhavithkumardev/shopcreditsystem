'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowRight, Store } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneOrEmail, password }),
      });

      if (res.accessToken) {
        localStorage.setItem('auth_token', res.accessToken);
        localStorage.setItem('user_info', JSON.stringify(res.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex justify-between items-center max-w-md mx-auto w-full pt-4">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
            ₹
          </div>
          CreditShop
        </div>

        <Link
          href="/portal"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
        >
          Customer Portal <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="max-w-md mx-auto w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Staff & Owner Backoffice
          </div>
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your credentials to access shop ledgers, POS billing, and village collections.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email or Mobile Number</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="owner@creditshop.in or +919876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700 text-center text-xs text-slate-400">
          Default Owner: <span className="text-slate-200 font-mono">owner@creditshop.in</span> (Password: <span className="text-slate-200 font-mono">Admin@CreditShop2026</span>)
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pb-4">
        Protected with Strict RBAC, Immutable Ledger Entries & Zero Silent Inconsistency.
      </div>
    </div>
  );
}
