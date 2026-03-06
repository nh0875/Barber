"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Scissors, LogOut, BarChart3, Wallet } from 'lucide-react';
import { useAuthStore } from '../lib/store/useAuthStore';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, pathname, router]);

  if (!mounted || !user || pathname === '/login') return null;

  // Solo ADMIN puede ver Estadísticas y cargar datos. Tablero es para todos.
  const links = [
    { href: '/board', label: 'Tablero', icon: LayoutDashboard, show: true },
    { href: '/dashboard', label: 'Estadísticas', icon: BarChart3, show: user.role === 'ADMIN' },
    { href: '/data', label: 'Cargar Datos', icon: Wallet, show: user.role === 'ADMIN' },
  ].filter(l => l.show);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-full md:w-64 bg-zinc-900 border-t md:border-t-0 md:border-r border-zinc-800 flex flex-row md:flex-col h-[72px] md:h-screen transition-all select-none shrink-0 z-50 order-last md:order-first">
      {/* Brand & info - Desktop only or collapsed on mobile */}
      <div className="hidden md:flex h-16 flex-col items-center justify-center md:items-start md:justify-center md:px-6 border-b border-zinc-800">
        <div className="flex items-center">
          <Scissors className="w-8 h-8 text-emerald-500" />
          <span className="ml-3 font-bold text-lg hidden md:block tracking-tight text-white">
            Coco<span className="text-emerald-500">Rapado</span>
          </span>
        </div>
        <div className="hidden md:block mt-1 text-xs text-zinc-500 font-mono">
          {user.name} ({user.role})
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start gap-1 py-1 md:py-6 px-2 md:px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);

          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 px-2 py-2 md:px-3 md:py-3 rounded-lg md:rounded-xl transition-all font-medium flex-1 md:flex-none ${
                isActive 
                  ? 'text-emerald-400 bg-emerald-500/10' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-5 h-5 md:w-5 md:h-5 shrink-0" />
              <span className="text-[10px] md:text-base md:block">{link.label}</span>
            </Link>
          );
        })}

        {/* Mobile logout btn inline in bottom bar */}
        <button onClick={handleLogout} className="md:hidden flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-rose-500 hover:bg-rose-500/10 flex-1">
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="text-[10px]">Salir</span>
        </button>
      </nav>

      {/* Desktop logout btn */}
      <div className="hidden md:block p-4 border-t border-zinc-800">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-rose-400 hover:bg-rose-500/10">
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="hidden md:block">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
