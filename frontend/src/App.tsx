import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HowItWorks } from './components/HowItWorks';
import { WhyReQNet } from './components/WhySternkraft';
import { EmergencyInstructions } from './components/EmergencyInstructions';
import { Footer } from './components/Footer';
import { PlaceholderPage } from './components/PlaceholderPage';
import { PlatformDashboardPage } from './pages/PlatformDashboardPage';
import { FloodDashboardPage } from './pages/FloodDashboardPage';
import { SosPage } from './pages/SosPage';
import { RescueLayout } from './components/RescueLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MapPage } from './pages/MapPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { DeviceStatusPage } from './pages/DeviceStatusPage';
import {
  TopographicLinesLeft,
  TopographicLinesRight,
} from './components/TopographicLines';

export const App: React.FC = () => {
  // Sync route state with browser pathname
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const path = window.location.pathname;
    if (path === '/sos') return '/sos';
    if (path === '/dashboard') return '/dashboard';
    if (path === '/flood/dashboard' || path === '/flood') return '/flood/dashboard';
    if (path === '/rescue/dashboard') return '/rescue/dashboard';
    if (path === '/rescue/incidents' || path === '/incidents') return '/rescue/incidents';
    if (path === '/rescue/map' || path === '/map') return '/rescue/map';
    if (path === '/rescue/communications') return '/rescue/communications';
    if (path === '/rescue/devices') return '/rescue/devices';
    return '/';
  });

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
      else if (path === '/dashboard') setCurrentRoute('/dashboard');
      else if (path === '/flood/dashboard' || path === '/flood') setCurrentRoute('/flood/dashboard');
      else if (path === '/rescue/dashboard') setCurrentRoute('/rescue/dashboard');
      else if (path === '/rescue/incidents' || path === '/incidents') setCurrentRoute('/rescue/incidents');
      else if (path === '/rescue/map' || path === '/map') setCurrentRoute('/rescue/map');
      else if (path === '/rescue/communications') setCurrentRoute('/rescue/communications');
      else if (path === '/rescue/devices') setCurrentRoute('/rescue/devices');
      else setCurrentRoute('/');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 1. Main Platform Launchpad Dashboard (`/dashboard`)
  if (currentRoute === '/dashboard') {
    return <PlatformDashboardPage onNavigate={handleNavigate} />;
  }

  // 2. Separate Flood Monitoring Module Workspace (`/flood/dashboard`)
  if (currentRoute === '/flood/dashboard' || currentRoute === '/flood') {
    return <FloodDashboardPage onNavigate={handleNavigate} />;
  }

  // 2. Rescue Communication Workspace Routes (`/rescue/*`)
  const isRescueWorkspace =
    currentRoute === '/rescue/dashboard' ||
    currentRoute === '/rescue/incidents' ||
    currentRoute === '/rescue/map' ||
    currentRoute === '/rescue/communications' ||
    currentRoute === '/rescue/devices' ||
    currentRoute === '/map' ||
    currentRoute === '/incidents';

  if (isRescueWorkspace) {
    // Determine active workspace route for sidebar highlighting
    const activeWorkspaceRoute: AppRoute =
      currentRoute === '/incidents'
        ? '/rescue/incidents'
        : currentRoute === '/map'
        ? '/rescue/map'
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
          <IncidentsPage />
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
      </RescueLayout>
    );
  }

  // 3. Public Civilian Portal (`/` landing page and `/sos`)
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

              {/* 2. Smoothly blended "From SOS to Rescue" section */}
              <HowItWorks />

              {/* 3. "Designed for Disaster Connectivity" benefits */}
              <WhyReQNet />

              {/* 4. "Quick Emergency Instructions" */}
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
