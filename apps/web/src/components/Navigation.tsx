'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Users,
  ShoppingCart,
  Receipt,
  CalendarCheck,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  UserCheck,
  LogOut,
  Package,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/pos', label: 'POS & Billing', icon: ShoppingCart },
  { href: '/dashboard/villages', label: 'Village Directory', icon: MapPin },
  { href: '/dashboard/customers', label: 'Customer Directory', icon: Users },
  { href: '/dashboard/products', label: 'Product Catalog', icon: Package },
  { href: '/dashboard/collections', label: 'Collection Cycles', icon: CalendarCheck },
  { href: '/dashboard/ledger', label: 'Financial Ledger & Audit', icon: Receipt },
  { href: '/dashboard/migration', label: 'Paper-Book Migration', icon: BookOpen },
  { href: '/dashboard/ai-assistant', label: 'AI Business Intelligence', icon: Sparkles },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header (Visible on < md screens) */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-950 font-black text-lg">
            ₹
          </div>
          <span className="font-bold text-base tracking-tight">CreditShop</span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop Fixed + Mobile Slide-out Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between p-4 border-r border-slate-800 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="flex items-center justify-between px-2 py-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
                ₹
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white leading-tight">CreditShop</h1>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Authoritative Ledger
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Card */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/portal"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs text-blue-400 font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Customer Portal
            </span>
            <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">Live</span>
          </Link>

          <div className="px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
            <span className="truncate">Shop Owner</span>
            <Link href="/login" className="text-slate-400 hover:text-rose-400 p-1" title="Switch Account">
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
