import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Map, Radio, ArrowLeft, ShieldAlert } from 'lucide-react';
import { AppRoute, GatewayHealth } from '../types';
import { api } from '../services/api';

interface RescueNavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const RescueNavbar: React.FC<RescueNavbarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        if (isMounted) {
          setHealth(data);
          setIsBackendHealthy(true);
        }
      } catch {
        if (isMounted) {
          setIsBackendHealthy(false);
          setHealth(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="w-full bg-[#0f172a] text-white border-b border-slate-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Brand and Operations Title */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
              title="Return to Public Landing Page"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-red-500 shadow-inner group-hover:border-red-500 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-wider uppercase text-white leading-none">
                    STERNKRAFT
                  </span>
                  <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/80">
                    RESCUE OPS
                  </span>
                </div>
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
                  STANDALONE FIELD UNIT
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links: Dashboard, Live Map, Incident Management */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('/dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === '/dashboard'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('/map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === '/map'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Map className="w-4 h-4 text-amber-400" />
              <span>Live Map</span>
            </button>

            <button
              onClick={() => onNavigate('/incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentRoute === '/incidents'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>Incidents</span>
            </button>
          </nav>

          {/* Right Area: Truthful Gateway Status & Return Link */}
          <div className="flex items-center gap-3">
            {/* Real Gateway Status Badge */}
            {isBackendHealthy ? (
              <div 
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/80 text-[11px] font-mono text-emerald-300"
                title={`Gateway Mode: ${health?.mode || 'OFFLINE_LOCAL'} (${health?.service || 'sternkraft-backend'})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LOCAL GATEWAY: ACTIVE</span>
              </div>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 border border-red-700/80 text-[11px] font-mono text-red-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>LOCAL SERVER OFFLINE</span>
              </div>
            )}

            {/* Back to Public Home */}
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
              title="Return to Public Civilian Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Public Portal</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
