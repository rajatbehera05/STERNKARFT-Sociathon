import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RefreshCw
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

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
    <div className="min-h-screen bg-[#F3F7FC] text-[#17243A] flex flex-col md:flex-row selection:bg-[#1685D1] selection:text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#17243A] text-white px-4 py-3.5 border-b border-[#24344D] flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-2.5 focus:outline-none"
            title="Back to Platform Launchpad"
          >
            <div className="w-8 h-8 rounded-lg bg-[#20314A] border border-[#2E415E] flex items-center justify-center text-[#1685D1]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-[15px] tracking-wider uppercase text-white leading-none">
                STERNKRAFT
              </span>
              <span className="text-[11px] text-[#A0B3CC] font-medium leading-tight">
                Rescue Comms
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {health?.status === 'ok' ? (
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B9B73] animate-pulse" title="Gateway Online" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53945]" title="Gateway Offline" />
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-[#20314A] text-[#A0B3CC] hover:text-white transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Navy Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#17243A] text-white border-r border-[#24344D] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand & Module Header */}
        <div className="p-5 border-b border-[#24344D] flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#20314A] border border-[#2E415E] flex items-center justify-center text-[#1685D1] shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-black tracking-wider uppercase text-white leading-none">
                STERNKRAFT
              </span>
              <span className="text-[12px] font-semibold text-[#1685D1] mt-1 tracking-wide">
                Rescue Communication
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#A0B3CC] pt-2 border-t border-[#24344D]/80">
            <span>OFFLINE MESH GATEWAY</span>
            <span className="text-[#0B9B73] font-bold">READY</span>
          </div>
        </div>

        {/* Navigation Items (All 6 destinations) */}
        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            const isPlatformBack = item.id === 'platform';

            return (
              <React.Fragment key={item.id}>
                {isPlatformBack && <div className="my-2 border-t border-[#24344D]" />}
                <button
                  onClick={() => onNavigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium tracking-normal transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#20314A] text-white shadow-xs font-semibold'
                      : isPlatformBack
                      ? 'text-[#A0B3CC] hover:text-white hover:bg-[#20314A]/60'
                      : 'text-[#A0B3CC] hover:text-white hover:bg-[#20314A]/40'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-[#1685D1] rounded-full" />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1685D1]' : isPlatformBack ? 'text-[#D98A00]' : 'text-[#7A90AF]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer: Gateway State & Field Unit ID */}
        <div className="p-4 border-t border-[#24344D] bg-[#121D30] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12px] font-mono">
            <span className="text-[#A0B3CC]">Gateway Status:</span>
            {health?.status === 'ok' ? (
              <span className="text-[#0B9B73] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0B9B73] animate-pulse" />
                ONLINE
              </span>
            ) : (
              <span className="text-[#E53945] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E53945]" />
                OFFLINE
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#7A90AF] flex items-center justify-between">
            <span>Field Console #1</span>
            <span>{currentTime}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (When Open) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-[#17243A]/80 backdrop-blur-xs flex"
          >
            <div className="w-72 bg-[#17243A] text-white h-full flex flex-col p-4 shadow-2xl border-r border-[#24344D]">
              <div className="flex items-center justify-between pb-4 border-b border-[#24344D]">
                <span className="font-bold text-[15px] uppercase tracking-wider text-white">
                  Rescue Navigation
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#A0B3CC] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-grow py-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.route;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate(item.route);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${
                        isActive
                          ? 'bg-[#20314A] text-white font-semibold'
                          : 'text-[#A0B3CC] hover:text-white hover:bg-[#20314A]/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#1685D1]' : 'text-[#7A90AF]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#24344D] text-[13px] text-[#A0B3CC]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/');
                  }}
                  className="text-[#A0B3CC] hover:text-white block py-1.5 font-medium"
                >
                  Exit to Public Portal
                </button>
              </div>
            </div>
            <div className="flex-grow" onClick={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Body */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Bar */}
        <header className="bg-white border-b border-[#DCE6F1] px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(23,36,58,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#5D6F89] mb-1">
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-[#17243A] hover:underline cursor-pointer"
                >
                  Platform
                </button>
                <span>/</span>
                <span className="text-[#1685D1] font-semibold">Rescue Communication</span>
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
              {/* Verified Gateway Badge */}
              {health?.status === 'ok' ? (
                <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[12px] font-semibold text-[#0B9B73]">
                  <span className="w-2 h-2 rounded-full bg-[#0B9B73] animate-pulse" />
                  <span>Gateway Active</span>
                </div>
              ) : (
                <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FDF2F2] border border-[#FCD8D9] text-[12px] font-semibold text-[#E53945]">
                  <span className="w-2 h-2 rounded-full bg-[#E53945]" />
                  <span>Gateway Offline</span>
                </div>
              )}

              {/* Refresh Button */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F3F7FC] text-[#17243A] font-semibold text-[13px] border border-[#DCE6F1] shadow-[0_1px_2px_0_rgba(23,36,58,0.05)] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  title="Synchronize with local backend"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#5D6F89] ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Sync Data</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
