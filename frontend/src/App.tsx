import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HowItWorks } from './components/HowItWorks';
import { SystemFeatures } from './components/SystemFeatures';
import { EverySecondMatters } from './components/EverySecondMatters';
import { EmergencyInstructions } from './components/EmergencyInstructions';
import { Footer } from './components/Footer';
import { PlaceholderPage } from './components/PlaceholderPage';
import { PlatformDashboardPage } from './pages/PlatformDashboardPage';
import { FloodDashboardPage } from './pages/FloodDashboardPage';
import { SosPage } from './pages/SosPage';
import { PublicReliefRequestPage } from './pages/PublicReliefRequestPage';
import { TrackReliefPage } from './pages/TrackReliefPage';
import { RescueLayout } from './components/RescueLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MapPage } from './pages/MapPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { DeviceStatusPage } from './pages/DeviceStatusPage';
import { ReliefCoordinationPage } from './pages/ReliefCoordinationPage';
import { OperatorLoginModal } from './components/OperatorLoginModal';
import { authStorage } from './services/reliefApi';
import { ShieldAlert, Lock, ArrowLeft, HeartHandshake } from 'lucide-react';
import {
  TopographicLinesLeft,
  TopographicLinesRight,
} from './components/TopographicLines';

export const App: React.FC = () => {
  // Sync route state with browser pathname
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const path = window.location.pathname;
    if (path === '/sos') return '/sos';
    if (path === '/request-relief') return '/request-relief';
    if (path === '/track-relief') return '/track-relief';
    if (path === '/dashboard') return '/dashboard';
    if (path === '/flood/dashboard' || path === '/flood') return '/flood/dashboard';
    if (path === '/rescue/dashboard') return '/rescue/dashboard';
    if (path === '/rescue/incidents' || path === '/incidents') return '/rescue/incidents';
    if (path === '/rescue/map' || path === '/map') return '/rescue/map';
    if (path === '/rescue/communications') return '/rescue/communications';
    if (path === '/rescue/devices') return '/rescue/devices';
    if (path === '/rescue/relief' || path === '/relief') return '/rescue/relief';
    return '/';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authStorage.hasToken());

  // Handle route navigation
  const handleNavigate = (route: AppRoute) => {
    if (route !== currentRoute) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Listen to browser forward/back buttons
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === '/sos') setCurrentRoute('/sos');
      else if (path === '/request-relief') setCurrentRoute('/request-relief');
      else if (path === '/track-relief') setCurrentRoute('/track-relief');
      else if (path === '/dashboard') setCurrentRoute('/dashboard');
      else if (path === '/flood/dashboard' || path === '/flood') setCurrentRoute('/flood/dashboard');
      else if (path === '/rescue/dashboard') setCurrentRoute('/rescue/dashboard');
      else if (path === '/rescue/incidents' || path === '/incidents') setCurrentRoute('/rescue/incidents');
      else if (path === '/rescue/map' || path === '/map') setCurrentRoute('/rescue/map');
      else if (path === '/rescue/communications') setCurrentRoute('/rescue/communications');
      else if (path === '/rescue/devices') setCurrentRoute('/rescue/devices');
      else if (path === '/rescue/relief' || path === '/relief') setCurrentRoute('/rescue/relief');
      else setCurrentRoute('/');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Check authentication on route change
  useEffect(() => {
    setIsAuthenticated(authStorage.hasToken());
  }, [currentRoute]);

  // Dedicated Public Emergency Relief Request Page
  if (currentRoute === '/request-relief') {
    return <PublicReliefRequestPage onNavigate={handleNavigate} />;
  }

  // Dedicated Public Relief Tracker Page
  if (currentRoute === '/track-relief') {
    return <TrackReliefPage onNavigate={handleNavigate} />;
  }

  // --- ACCESS CONTROL GATE FOR PRIVATE RESCUE DASHBOARDS ---
  const isProtectedOperatorRoute =
    currentRoute === '/dashboard' ||
    currentRoute === '/flood/dashboard' ||
    currentRoute === '/flood' ||
    currentRoute === '/rescue/dashboard' ||
    currentRoute === '/rescue/incidents' ||
    currentRoute === '/rescue/map' ||
    currentRoute === '/rescue/communications' ||
    currentRoute === '/rescue/devices' ||
    currentRoute === '/rescue/relief' ||
    currentRoute === '/relief' ||
    currentRoute === '/map' ||
    currentRoute === '/incidents';

  if (isProtectedOperatorRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
        <div className="max-w-md mx-auto my-auto px-4 py-12 text-center">
          <div className="w-16 h-16 bg-red-950/80 border-2 border-red-700/80 rounded-2xl mx-auto flex items-center justify-center text-red-400 mb-6 shadow-lg shadow-red-900/30">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800 text-red-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Authorized Personnel Only</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Restricted Rescue Workspace
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Internal rescue coordination, flood gauge telemetry, and relief inventory dispatch
            require authenticated operator clearance to protect civilian privacy.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In as Field Operator</span>
            </button>

            <button
              onClick={() => handleNavigate('/request-relief')}
              className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-blue-400" />
              <span>Public: Request Emergency Relief</span>
            </button>

            <button
              onClick={() => handleNavigate('/')}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Homepage</span>
            </button>
          </div>
        </div>

        <OperatorLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            setIsAuthenticated(true);
          }}
        />
      </div>
    );
  }

  // 1. Main Platform Launchpad Dashboard (`/dashboard`)
  if (currentRoute === '/dashboard') {
    return <PlatformDashboardPage onNavigate={handleNavigate} />;
  }

  // 2. Separate Flood Monitoring Module Workspace (`/flood/dashboard`)
  if (currentRoute === '/flood/dashboard' || currentRoute === '/flood') {
    return <FloodDashboardPage onNavigate={handleNavigate} />;
  }

  // 3. Rescue Communication Workspace Routes (`/rescue/*` and `/relief`)
  const isRescueWorkspace =
    currentRoute === '/rescue/dashboard' ||
    currentRoute === '/rescue/incidents' ||
    currentRoute === '/rescue/map' ||
    currentRoute === '/rescue/communications' ||
    currentRoute === '/rescue/devices' ||
    currentRoute === '/rescue/relief' ||
    currentRoute === '/relief' ||
    currentRoute === '/map' ||
    currentRoute === '/incidents';

  if (isRescueWorkspace) {
    const activeWorkspaceRoute: AppRoute =
      currentRoute === '/incidents'
        ? '/rescue/incidents'
        : currentRoute === '/map'
        ? '/rescue/map'
        : currentRoute === '/relief'
        ? '/rescue/relief'
        : currentRoute;

    let pageTitle = 'Rescue Operations Overview';
    let pageSubtitle = 'Situational awareness, incoming distress queue, and verified gateway status.';

    if (activeWorkspaceRoute === '/rescue/incidents') {
      pageTitle = 'Live Incidents & Dispatch';
      pageSubtitle = 'Searchable incident triage, priority queues, and operator lifecycle controls.';
    } else if (activeWorkspaceRoute === '/rescue/map') {
      pageTitle = 'Live Map & Incident Locations';
      pageSubtitle = 'Tactical coordinate plotting, valid GPS positioning, and manual landmark triage.';
    } else if (activeWorkspaceRoute === '/rescue/communications') {
      pageTitle = 'Communication & Audit Log';
      pageSubtitle = 'Chronological event records of gateway receptions, SSD commits, and operator dispatch.';
    } else if (activeWorkspaceRoute === '/rescue/devices') {
      pageTitle = 'Gateway & Device Status';
      pageSubtitle = 'Diagnostic health telemetry for local backend, ESP32 gateway link, and hardware storage.';
    } else if (activeWorkspaceRoute === '/rescue/relief') {
      pageTitle = 'Relief Request & Coordination Dashboard';
      pageSubtitle = 'Real-time Nagpur map triage, verified emergency intake, and request-to-resource matching.';
    }

    return (
      <RescueLayout
        currentRoute={activeWorkspaceRoute}
        onNavigate={handleNavigate}
        title={pageTitle}
        subtitle={pageSubtitle}
      >
        {activeWorkspaceRoute === '/rescue/dashboard' && (
          <DashboardPage onNavigate={handleNavigate} />
        )}
        {activeWorkspaceRoute === '/rescue/incidents' && (
          <IncidentsPage onNavigate={handleNavigate} />
        )}
        {activeWorkspaceRoute === '/rescue/map' && (
          <MapPage onNavigate={handleNavigate} />
        )}
        {activeWorkspaceRoute === '/rescue/communications' && (
          <CommunicationsPage onNavigate={handleNavigate} />
        )}
        {activeWorkspaceRoute === '/rescue/devices' && (
          <DeviceStatusPage onNavigate={handleNavigate} />
        )}
        {activeWorkspaceRoute === '/rescue/relief' && (
          <ReliefCoordinationPage onNavigate={handleNavigate} />
        )}
      </RescueLayout>
    );
  }

  // 4. Public Civilian Portal (`/` landing page and `/sos`)
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f4f9fd] via-[#eef6fc] to-[#f8fafc] text-slate-800 flex flex-col justify-between overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Background Layer: Atmospheric daylight ambient fields */}
      <div
        className="absolute top-0 right-0 w-[55%] h-[540px] bg-gradient-to-bl from-amber-50/30 via-sky-100/25 to-transparent pointer-events-none -z-20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-0 w-[45%] h-[450px] bg-gradient-to-br from-sky-100/40 via-blue-50/25 to-transparent pointer-events-none -z-20 blur-2xl"
        aria-hidden="true"
      />

      {/* Subtle flowing contour accents */}
      <TopographicLinesLeft />
      <TopographicLinesRight />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col flex-grow">
        {/* Navigation Bar */}
        <Navbar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />

        {/* View Routing */}
        <main className="flex-grow">
          {currentRoute === '/' ? (
            <>
              {/* 1. Rescue Hero */}
              <HeroSection onNavigate={handleNavigate} />

              {/* 2. System Features & Core Capabilities */}
              <SystemFeatures />

              {/* 3. Smoothly blended "From SOS to Rescue" section */}
              <HowItWorks />

              {/* 4. Sequential Cinematic Storytelling: Every Second Matters */}
              <EverySecondMatters onNavigate={handleNavigate} />

              {/* 5. "Quick Emergency Instructions" */}
              <EmergencyInstructions />
            </>
          ) : currentRoute === '/sos' ? (
            <SosPage onNavigate={handleNavigate} />
          ) : (
            <PlaceholderPage
              route={currentRoute}
              onNavigate={handleNavigate}
            />
          )}
        </main>

        {/* Compact Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default App;
