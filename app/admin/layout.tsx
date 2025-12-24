'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon?: string;
  group: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Admin Home', href: '/home', group: 'Admin', icon: '⌂' },
  { key: 'branding', label: 'Branding', href: '/admin/brand', group: 'Branding', icon: '🎨' },
  { key: 'finance', label: 'Financial Suite', href: '/admin/finance', group: 'Financial Suite', icon: '📊' },
  { key: 'crm', label: 'CRM & Guest', href: '/crm', group: 'CRM & Guest', icon: '💬' },
  { key: 'gym-setup', label: 'Gym / Studio Setup', href: '/admin/workouts', group: 'Gym / Studio', icon: '💪' },
  { key: 'kitchen', label: 'Kitchen & Meals', href: '/kitchen/orders', group: 'Kitchen & Meals', icon: '🍽️' },
  { key: 'pos', label: 'POS / Retail', href: '/pos', group: 'POS / Retail', icon: '🛒' },
  { key: 'retreats', label: 'Retreat Services & Add-ons', href: '/services', group: 'Retreats', icon: '🌴' },
  { key: 'analytics', label: 'Analytics HQ', href: '/analytics', group: 'Analytics HQ', icon: '📈' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const activeKey = useMemo(() => {
    return (
      NAV_ITEMS.find((item) => pathname?.startsWith(item.href))?.key ??
      NAV_ITEMS.find((item) => item.href === '/admin/brand')?.key ??
      ''
    );
  }, [pathname]);

  const groupedNav = useMemo(() => {
    return NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
      acc[item.group] = acc[item.group] ? [...acc[item.group], item] : [item];
      return acc;
    }, {});
  }, []);

  return (
    <div
      className="min-h-screen w-full text-slate-100 flex"
      style={{
        fontFamily: 'var(--font-inter, Inter), system-ui, sans-serif',
        background:
          'radial-gradient(1200px 800px at 50% 8%, rgba(56,189,248,0.14), transparent), radial-gradient(1400px 1000px at 20% 30%, rgba(20,184,166,0.09), transparent), linear-gradient(180deg,#040b14,#071423 50%,#050c18)',
      }}
    >
      <aside className="w-72 bg-[#0b1c2d]/95 border-r border-white/10 flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-900 flex items-center justify-center font-semibold shadow-[0_15px_40px_rgba(34,211,238,0.35)]">
              HF
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/80">HotelFit</p>
              <p className="font-semibold text-lg">Admin Suite</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full rounded-lg border border-white/10 bg-[#0f2436] px-3 py-2 text-sm text-slate-100 shadow-inner">
              Eleguria Sanctuary
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-auto px-3 py-4 space-y-6">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                {group}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = item.key === activeKey;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-white shadow-[0_10px_40px_rgba(34,211,238,0.25)] border-cyan-400/40'
                          : 'text-slate-300 hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <span className="text-lg leading-none">{item.icon ?? '•'}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="px-8 py-6">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-white/5 via-white/3 to-white/5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur">
            <div>
              <p className="text-sm text-cyan-200/80">Admin Workspace</p>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-poppins, Inter)' }}>
                {NAV_ITEMS.find((i) => i.key === activeKey)?.label ?? 'Dashboard'}
              </h1>
            </div>
            <div className="rounded-full bg-cyan-500/20 text-cyan-100 text-sm font-semibold px-4 py-2 border border-cyan-400/50 shadow-[0_10px_40px_rgba(34,211,238,0.25)]">
              Nexus Theme
            </div>
          </div>

          <div className="rounded-3xl bg-[#0c1826]/90 border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.5)] p-6 backdrop-blur">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
