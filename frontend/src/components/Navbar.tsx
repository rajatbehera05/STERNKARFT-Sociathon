import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const [isGatewayActive, setIsGatewayActive] = useState(false);

  // Truthful check: Only show status indicator if real status is verified available
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const res = await fetch('http://localhost:5000/api/health', {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok && isMounted) {
          setIsGatewayActive(true);
        }
      } catch {
        // Backend not reachable: keep false, do not display fake status
      }
    };
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-3">
      <nav
        className="flex items-center justify-between gap-3 sm:gap-6"
        aria-label="Main Navigation"
      >
        {/* Brand Logo & Wordmark */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 sm:gap-3 group text-left focus:outline-none cursor-pointer select-none shrink-0"
          aria-label="STERNKRAFT Home"
        >
          {/* Logo Emblem: Stylized geometric origami A/S chevron */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full transform transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              {/* Upper & Right dark navy facet */}
              <path
                d="M18 3L32 29H20L18 16L12 25H6L18 3Z"
                fill="#0f172a"
              />
              {/* Lower left red emergency facet */}
              <path
                d="M6 25L12 25L9 31L4 31L6 25Z"
                fill="#dc2626"
              />
              {/* Center fold accent */}
              <path
                d="M12 25L18 16L20 29L12 25Z"
                fill="#1e293b"
              />
            </svg>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-base sm:text-lg font-extrabold tracking-[0.06em] text-slate-900 uppercase leading-none">
              STERNKRAFT
            </span>
            <span className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.24em] text-slate-500 uppercase mt-1 leading-none">
              EMERGENCY COMMUNICATION
            </span>
          </div>
        </button>

        {/* Right Area: Navigation Links & Optional Verified Status */}
        <div className="flex items-center gap-4 sm:gap-7">
          {/* Subtle truthful gateway indicator: ONLY rendered if real gateway connection verified */}
          {isGatewayActive && (
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/90 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gateway Active</span>
            </div>
          )}

          {/* Navigation Links with refined red active indicator */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-600">
            <button
              onClick={() => onNavigate('/')}
              className={`relative py-1 transition-colors hover:text-slate-900 cursor-pointer ${
                currentRoute === '/' ? 'text-slate-900 font-bold' : ''
              }`}
            >
              Home
              {currentRoute === '/' && (
                <span className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-5 sm:w-6 h-[2px] bg-red-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('/sos')}
              className={`relative py-1 transition-colors hover:text-slate-900 cursor-pointer ${
                currentRoute === '/sos' ? 'text-slate-900 font-bold' : ''
              }`}
            >
              SOS
              {currentRoute === '/sos' && (
                <span className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-5 sm:w-6 h-[2px] bg-red-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => onNavigate('/dashboard')}
              className={`relative py-1 transition-colors hover:text-slate-900 cursor-pointer ${
                currentRoute === '/dashboard' ? 'text-slate-900 font-bold' : ''
              }`}
            >
              Dashboard
              {currentRoute === '/dashboard' && (
                <span className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-5 sm:w-6 h-[2px] bg-red-600 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
