import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useTheme } from '@/src/lib/ThemeContext';
import { Capacitor } from '@capacitor/core';

export function Layout() {
  const { meta } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Android hardware back button ──────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          // If on a sub-page (store, create-plugin), go back
          if (location.pathname.startsWith('/settings/')) {
            navigate('/settings');
          } else if (location.pathname !== '/') {
            navigate('/');
          } else {
            // On home, minimize the app (don't exit)
            App.minimizeApp();
          }
        });
        cleanup = () => listener.remove();
      } catch (e) {
        console.warn('Back button handler not available:', e);
      }
    };

    setupBackButton();
    return () => { cleanup?.(); };
  }, [location.pathname, navigate]);

  return (
    <div className="flex flex-col h-screen bg-surface-base text-text-primary font-sans overflow-hidden pt-safe">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      <nav
        className="theme-nav fixed bottom-0 left-0 right-0 bg-nav-bg backdrop-blur-md border-t border-border-muted flex justify-around items-center h-16 z-50 th-nav-border theme-transition no-select"
        style={{ borderRadius: `var(--th-radius-nav) var(--th-radius-nav) 0 0` }}
      >
        <NavItem to="/" icon={<Briefcase size={20}/>} label={meta.brandName === 'COMMAND' ? 'ASSETS' : 'Portfolio'} />
        <NavItem to="/dashboard" icon={<BarChart2 size={20}/>} label={meta.brandName === 'COMMAND' ? 'ANALYTICS' : 'Dashboard'} />
        <NavItem to="/settings" icon={<Settings size={20}/>} label={meta.brandName === 'COMMAND' ? 'CONFIG' : 'Settings'} />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => 
        cn("flex flex-col items-center py-2 px-4 transition-all rounded-xl no-select",
          isActive ? "text-accent" : "text-text-muted"
        )
      }
    >
      {icon}
      <span className="text-[9px] uppercase tracking-[0.15em] font-medium mt-1">{label}</span>
    </NavLink>
  );
}
