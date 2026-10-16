import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { AppRoute } from '../types';
import { LiveClock } from './LiveClock';

interface HeroSectionProps {
  onNavigate: (route: AppRoute) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Full-Width Background Rescue Photograph Covering the Entire Hero Section */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        {/* Full Edge-to-Edge Hero Background Photo */}
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-[position:center_right] md:bg-[position:center_right] lg:bg-center"
          style={{
            backgroundImage: "url('/images/rescue-hero.jpg')",
          }}
          role="img"
          aria-label="Search and rescue helicopter and responder in boat conducting flood evacuation operations"
        />

        {/* Restrained, Non-Blurry Left Daylight Gradient for Crystal-Clear Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#f4f9fd] via-[#f4f9fd]/85 via-35% sm:via-[#f4f9fd]/65 sm:via-50% md:via-[#f4f9fd]/30 md:via-62% to-transparent to-80%" />

        {/* Deep, Seamless Bottom Transition Fading Naturally into the Next Section */}
        <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#f4f9fd] via-[#f4f9fd]/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pt-6 sm:pb-16 lg:pt-8 lg:pb-20">
        <div className="max-w-xl lg:max-w-2xl flex flex-col items-start">
          {/* Live Device Local Clock */}
          <div className="mb-4">
            <LiveClock />
          </div>

          {/* Eyebrow Line */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-[2.5px] bg-red-600 rounded-full" />
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase text-slate-600">
              DISASTER HAPPENS. PEOPLE STILL NEED HELP.
            </p>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-[70px] font-extrabold tracking-[-0.035em] text-[#0f172a] leading-[1.04]">
            Real People.
            <span className="block text-red-600 mt-1">Real Help.</span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl font-normal drop-shadow-2xs">
            Emergency communication when ordinary networks may not be
            available. Send an SOS and help rescue teams coordinate a response.
          </p>

          {/* CTA Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
            {/* Primary Action: Send SOS (Restrained Emergency-Red Style) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('/sos')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-base shadow-md shadow-red-600/20 flex items-center justify-center gap-3 transition-colors group cursor-pointer"
              aria-label="Send Emergency SOS alert"
            >
              {/* Emergency Beacon Icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 shrink-0 animate-pulse"
                aria-hidden="true"
              >
                <path d="M12 2v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="M12 22v-4" />
                <path d="m19.07 19.07-2.83-2.83" />
                <path d="M22 12h-4" />
                <path d="m19.07 4.93-2.83 2.83" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
              <span>Send SOS</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Secondary Action: Open Dashboard (Clean Outlined Style) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('/dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border-2 border-slate-300 hover:border-slate-400 shadow-xs flex items-center justify-center gap-3 transition-colors group cursor-pointer"
              aria-label="Open Rescue Coordination Dashboard"
            >
              <LayoutDashboard className="w-5 h-5 text-slate-700 shrink-0" />
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};
