import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  Radio,
  Map,
  FileText,
  Cpu,
  ArrowLeft,
  ShieldAlert,
  Menu,
  X,
  RefreshCw,
  HeartHandshake,
} from 'lucide-react';
import { AppRoute, GatewayHealth } from '../types';
import { api } from '../services/api';

interface RescueLayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  route: AppRoute;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    route: '/rescue/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'incidents',
    label: 'Live Incidents',
    route: '/rescue/incidents',
    icon: Radio,
  },
  {
    id: 'map',
    label: 'Live Map',
    route: '/rescue/map',
    icon: Map,
  },
  {
    id: 'communications',
    label: 'Communication Log',
    route: '/rescue/communications',
    icon: FileText,
  },
  {
    id: 'devices',
    label: 'Gateway & Device Status',
    route: '/rescue/devices',
    icon: Cpu,
  },
  {
    id: 'relief',
    label: 'Relief Coordination',
    route: '/rescue/relief',
    icon: HeartHandshake,
  },
  {
    id: 'platform',
    label: 'Back to Platform',
    route: '/dashboard',
    icon: ArrowLeft,
  },
];

export const RescueLayout: React.FC<RescueLayoutProps> = ({
  currentRoute,
  onNavigate,
  title,
  subtitle,
  children,
  onRefresh,
  isRefreshing = false,
}) => {
  const isRelief = currentRoute === '/rescue/relief' || currentRoute === '/relief';
  const visibleNavItems: NavItem[] = useMemo(() => {
    return NAV_ITEMS.filter((item: NavItem) => {
      if (isRelief && item.id === 'devices') {
        return false;
      }
      return true;
    });
  }, [isRelief]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const shouldReduceMotion = useReducedMotion();

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Gateway health check
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        if (isMounted) setHealth(data);
      } catch {
        if (isMounted) setHealth(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F7FC] text-[#17243A] flex flex-col md:flex-row selection:bg-[#65C7FF] selection:text-[#111827]">
      {/* Mobile Top Header (Deep Graphite + Blue-grey surface) */}
      <div className="md:hidden bg-[#111827] text-[#F8FAFC] px-4 py-3.5 border-b border-[#1F2E44] flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="group flex items-center gap-2.5 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] rounded-lg p-1 -m-1"
            title="Back to Platform Launchpad"
          >
            <div className="w-8 h-8 rounded-lg bg-[#182638] border border-[#24374E] flex items-center justify-center text-[#65C7FF] shadow-xs shrink-0 transition-colors duration-200 group-hover:border-[#65C7FF]/40">
              <ShieldAlert className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-[15px] tracking-wider uppercase text-[#F8FAFC] leading-none">
                {isRelief ? 'ReliefCoord' : 'ReQNet'}
              </span>
              <span className="text-[11px] text-[#94A3B8] font-medium leading-tight mt-0.5">
                {isRelief ? 'Nagpur Relief' : 'Rescue Comms'}
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isRelief && (
            health?.status === 'ok' ? (
              <span
                className="w-2.5 h-2.5 rounded-full bg-[#34D399] ring-2 ring-[#34D399]/25 transition-colors"
                title="Gateway Online"
              />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full bg-[#EF4444] transition-colors"
                title="Gateway Offline"
              />
            )
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#182638] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E2F46] border border-[#1F2E44] transition-all duration-200 ease-out active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Deep Graphite Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#111827] text-[#F8FAFC] border-r border-[#1F2E44] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand & Module Header */}
        <div className="p-5 border-b border-[#1F2E44] flex flex-col gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="group flex items-center gap-3 text-left w-full rounded-xl p-1.5 -m-1.5 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] cursor-pointer"
            title="Back to Platform Launchpad"
          >
            <div className="w-9 h-9 rounded-xl bg-[#182638] border border-[#24374E] flex items-center justify-center text-[#65C7FF] shadow-xs shrink-0 transition-colors duration-200 group-hover:border-[#65C7FF]/40">
              <ShieldAlert className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] font-black tracking-wider uppercase text-[#F8FAFC] leading-none">
                {isRelief ? 'ReliefCoord' : 'ReQNet'}
              </span>
              <span className="text-[12px] font-semibold text-[#65C7FF] mt-1 tracking-wide">
                {isRelief ? 'Relief Coordination' : 'Rescue Communication'}
              </span>
            </div>
          </button>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] pt-2 border-t border-[#1F2E44]">
            {isRelief ? (
              <>
                <span>CIVILIAN RELIEF GRID</span>
                <span className="text-emerald-400 font-bold tracking-wider">ACTIVE</span>
              </>
            ) : (
              <>
                <span>OFFLINE MESH GATEWAY</span>
                <span className="text-[#34D399] font-bold tracking-wider">READY</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            const isPlatformBack = item.id === 'platform';

            return (
              <React.Fragment key={item.id}>
                {isPlatformBack && <div className="my-2 border-t border-[#1F2E44]" />}
                <button
                  onClick={() => onNavigate(item.route)}
                  className={`w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium tracking-normal transition-colors duration-200 ease-out cursor-pointer relative outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] active:scale-[0.98] select-none ${
                    isActive
                      ? 'text-[#F8FAFC] font-semibold'
                      : isPlatformBack
                      ? 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                  }`}
                >
                  {/* Active selection background with smooth spring transition */}
                  {isActive && (
                    <motion.span
                      layoutId="rescueNavBg"
                      className="absolute inset-0 bg-[#233750] rounded-xl shadow-xs"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 30 }
                      }
                    />
                  )}

                  {/* Narrow arctic-blue indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="rescueNavIndicator"
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#65C7FF] rounded-full shadow-[0_0_8px_rgba(101,199,255,0.45)]"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 30 }
                      }
                    />
                  )}

                  {/* Icon with subtle upward hover motion */}
                  <Icon
                    className={`w-4 h-4 shrink-0 relative z-10 transition-all duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none ${
                      isActive
                        ? 'text-[#65C7FF]'
                        : isPlatformBack
                        ? 'text-[#A5B4FC] group-hover:text-[#C7D2FE]'
                        : 'text-[#64748B] group-hover:text-[#65C7FF]'
                    }`}
                  />

                  {/* Label */}
                  <span className="truncate relative z-10 transition-colors duration-200">
                    {item.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer: Gateway State or Relief State & Field Unit ID */}
        <div className="p-4 border-t border-[#1F2E44] bg-[#0E1522] flex flex-col gap-2">
          {isRelief ? (
            <div className="flex items-center justify-between text-[12px] font-mono">
              <span className="text-[#94A3B8]">Relief Operations:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-2 ring-emerald-400/25" />
                </span>
                COORDINATING
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[12px] font-mono">
              <span className="text-[#94A3B8]">Gateway Status:</span>
              {health?.status === 'ok' ? (
                <span className="text-[#34D399] font-bold flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399] ring-2 ring-[#34D399]/25" />
                  </span>
                  ONLINE
                </span>
              ) : (
                <span className="text-[#F87171] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  OFFLINE
                </span>
              )}
            </div>
          )}
          <div className="text-[11px] font-mono text-[#64748B] flex items-center justify-between">
            <span>{isRelief ? 'Nagpur Field Depot' : 'Field Console #1'}</span>
            <span>{currentTime}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (When Open) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden fixed inset-0 z-40 bg-[#0F172A]/70 backdrop-blur-xs flex"
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 28, stiffness: 300 }
              }
              className="w-72 bg-[#111827] text-[#F8FAFC] h-full flex flex-col p-4 shadow-2xl border-r border-[#1F2E44]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#1F2E44]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#182638] border border-[#24374E] flex items-center justify-center text-[#65C7FF]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-[14px] uppercase tracking-wider text-[#F8FAFC]">
                    {isRelief ? 'Relief Navigation' : 'Rescue Navigation'}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638] transition-colors duration-150"
                  aria-label="Close Navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow py-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.route;
                  const isPlatformBack = item.id === 'platform';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate(item.route);
                      }}
                      className={`w-full group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors duration-200 active:scale-[0.98] ${
                        isActive
                          ? 'bg-[#233750] text-[#F8FAFC] font-semibold border-l-2 border-[#65C7FF]'
                          : isPlatformBack
                          ? 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#182638]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                          isActive
                            ? 'text-[#65C7FF]'
                            : isPlatformBack
                            ? 'text-[#A5B4FC]'
                            : 'text-[#64748B] group-hover:text-[#65C7FF]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#1F2E44] text-[13px]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/');
                  }}
                  className="text-[#94A3B8] hover:text-[#F8FAFC] block py-1.5 font-medium transition-colors duration-150"
                >
                  Exit to Public Portal
                </button>
              </div>
            </motion.div>
            <div className="flex-grow" onClick={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Bar */}
        <header className="bg-white border-b border-[#DCE6F1] px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#5D6F89] mb-1">
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-[#17243A] hover:underline transition-colors duration-150 cursor-pointer"
                >
                  Platform
                </button>
                <span>/</span>
                <span className="text-[#0284C7] font-semibold">
                  {isRelief ? 'Relief Coordination' : 'Rescue Communication'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#17243A] tracking-tight leading-snug">
                {title}
              </h1>
              <p className="text-[14px] text-[#5D6F89] mt-0.5 max-w-2xl">
                {subtitle}
              </p>
            </div>

            {/* Quick Actions & Gateway Status */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Calm Verified Gateway Badge (Hidden on Relief Coordination) */}
              {!isRelief && (
                health?.status === 'ok' ? (
                  <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[12px] font-semibold text-[#0B9B73]">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399] ring-2 ring-[#34D399]/20" />
                    </span>
                    <span>Gateway Active</span>
                  </div>
                ) : (
                  <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[12px] font-semibold text-[#EF4444]">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span>Gateway Offline</span>
                  </div>
                )
              )}

              {/* Primary Action Button: Sync Data with polished animations */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-[0_1px_2px_0_rgba(23,36,58,0.05)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.98] outline-hidden focus-visible:ring-2 focus-visible:ring-[#65C7FF] focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                  title="Synchronize with local backend"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#5D6F89] transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Sync Data</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
