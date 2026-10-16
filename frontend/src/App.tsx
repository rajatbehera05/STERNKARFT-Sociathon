import React, { useState, useEffect } from 'react';
import { AppRoute } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { HowItWorks } from './components/HowItWorks';
import { WhySternkraft } from './components/WhySternkraft';
import { EmergencyInstructions } from './components/EmergencyInstructions';
import { Footer } from './components/Footer';
import { PlaceholderPage } from './components/PlaceholderPage';
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
      else setCurrentRoute('/');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
              <WhySternkraft />

              {/* 4. "Quick Emergency Instructions" */}
              <EmergencyInstructions />
            </>
          ) : (
            <PlaceholderPage
              route={currentRoute}
              onNavigate={handleNavigate}
            />
          )}
        </main>

        {/* 4. Compact Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default App;
