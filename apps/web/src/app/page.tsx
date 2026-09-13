import Link from 'next/link';
import { Store, Users, MapPin, Receipt, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-4">
          <ShieldCheck className="w-4 h-4" />
          Zero Silent Financial Inconsistency Verified
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Credit-First Shop Management <br />
          <span className="text-emerald-600">& Business Intelligence Platform</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Replacing physical notebook ledgers with village-first credit tracking, automated collection cycles, immutable accounting, and customer self-service.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Owner / Staff Access Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-6">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Shop Owner & Staff Backoffice</h2>
          <p className="text-slate-600 mb-6">
            Access village-wise customer ledgers, POS order creation, payment recording, month-end collection sheets, and executive business analytics.
          </p>
          <ul className="space-y-2 mb-8 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Village-First Customer & Credit Tracking
            </li>
            <li className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> POS Split Payments (Cash/UPI + Credit)
            </li>
            <li className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" /> Paper-Book Migration & Reconciled Ledgers
            </li>
          </ul>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors gap-2"
          >
            Launch Owner Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Customer Self-Service Portal Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-6">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Customer Self-Service Portal</h2>
          <p className="text-slate-600 mb-6">
            Lightweight, mobile-first portal for customers to check outstanding balances, view purchase invoices, download payment receipts, and pay online.
          </p>
          <ul className="space-y-2 mb-8 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Phone OTP Secure Login
            </li>
            <li className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" /> Live Statement & Purchase History
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600" /> Direct UPI / Online Payment Gateway
            </li>
          </ul>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors gap-2"
          >
            Open Customer Portal <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
