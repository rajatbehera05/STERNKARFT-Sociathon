import React from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import {
  Radio,
  ArrowRight,
  Shield,
  Layers,
  ArrowDown,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { AppRoute } from '../types';

interface EverySecondMattersProps {
  onNavigate?: (route: AppRoute) => void;
}

export const EverySecondMatters: React.FC<EverySecondMattersProps> = ({
  onNavigate,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 36 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: 'easeOut' },
    },
  };

  return (
    <section className="relative w-full bg-[#f4f9fd] py-16 sm:py-24 border-t border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Full-Width Editorial Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          className="max-w-3xl mb-16 sm:mb-24"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-[2.5px] bg-red-600 rounded-full" />
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.22em] uppercase text-slate-500">
              WHEN EVERY SECOND COUNTS
            </p>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-[1.12]">
            Every Second Matters. <br />
            <span className="text-red-600">Every Signal Matters.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
            When disaster disrupts ordinary communication, getting an emergency message through can make a critical difference. From SOS to Rescue is designed to provide a local communication path and help responders coordinate their next steps.
          </p>

          <div className="mt-6 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              01 THE ALERT
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              02 THE CONNECTION
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              03 THE COORDINATION
            </span>
            <span>→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              04 THE RESPONSE
            </span>
          </div>
        </motion.div>

        {/* 2. Sequential Rescue-Story Experience (4 Large Photographic Scenes) */}
        <div className="relative space-y-20 sm:space-y-32">
          {/* Subtle Vertical Connecting Line (Desktop) */}
          <div
            className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-[2px] bg-gradient-to-b from-red-300 via-sky-300 to-emerald-400 -translate-x-1/2 pointer-events-none opacity-40"
            aria-hidden="true"
          />

          {/* SCENE 01: The Alert */}
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Image (Left on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-1">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.12)] bg-slate-100 group">
                <img
                  src="/images/scene-01-sos.jpg"
                  alt="Civilian stranded in flood zone using smartphone to send emergency SOS alert"
                  loading="lazy"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                    DISASTER PERIMETER • CIVILIAN REPORT
                  </span>
                  <span className="bg-red-600/90 font-bold px-2.5 py-1 rounded-md">
                    ZERO TELECOM REQUIRED
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative Content (Right on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-2 lg:pl-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-50 text-red-700 border border-red-200/90 text-xs font-mono font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>01 / THE ALERT</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                “It begins with a call for help.”
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                An individual submits an SOS alert with the incident details available to them.
              </p>

              {/* Visual Accent: Small red SOS indicator & telemetry detail */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Rapid Distress Dispatch
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                    SOS BEACON
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Captures crucial survivor telemetry: headcount, urgent medical status, infant or elderly presence, and manual landmark descriptions without relying on active cellular towers.
                </p>
              </div>
            </div>
          </motion.article>

          {/* SCENE 02: The Local Signal (Alternated: Text Left, Image Right) */}
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Narrative Content (Left on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-2 lg:order-1 lg:pr-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200/90 text-xs font-mono font-bold tracking-wider">
                <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                <span>02 / THE CONNECTION</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                “A signal that doesn't depend on public internet.”
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                The local gateway receives and forwards alerts through the communication path implemented by the system.
              </p>

              {/* Visual Accent: Restrained signal-line graphic & radio-wave animation */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-800">
                    Local Mesh Relay Link
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    STANDALONE SOFTAP
                  </span>
                </div>

                <div className="flex items-center gap-3 py-1 text-slate-600 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-2.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4.5 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-6 bg-sky-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 h-4.5 bg-sky-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                    <span className="w-1 h-2.5 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ESP32 broadcasts captive local network (SSID: ReQNet-RESCUE-AP)
                  </span>
                </div>
              </div>
            </div>

            {/* Image (Right on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.12)] bg-slate-100 group">
                <img
                  src="/images/scene-02-signal.jpg"
                  alt="Field responder operating emergency radio equipment in disaster command tent"
                  loading="lazy"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                    FIELD GATEWAY DEPLOYED
                  </span>
                  <span className="bg-sky-600/90 font-bold px-2.5 py-1 rounded-md">
                    AUTONOMOUS PROTOCOL
                  </span>
                </div>
              </div>
            </div>
          </motion.article>

          {/* SCENE 03: The Rescue Dashboard (Image Left, Text Right) */}
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Image (Left on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-1">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.12)] bg-slate-100 group">
                <img
                  src="/images/scene-03-dashboard.jpg"
                  alt="Emergency operations coordinator reviewing live incident map and dispatch status on rugged laptop in command tent"
                  loading="lazy"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                    OPERATIONS CONSOLE • DISPATCH LOG
                  </span>
                  <span className="bg-amber-600/90 font-bold px-2.5 py-1 rounded-md">
                    REAL-TIME TRIAGE
                  </span>
                </div>
              </div>
            </div>

            {/* Narrative Content (Right on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-2 lg:pl-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/90 text-xs font-mono font-bold tracking-wider">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>03 / THE COORDINATION</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                “Every report. Clearer coordination.”
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                The dashboard helps operators review incoming reports and track incident status.
              </p>

              {/* Visual Accent: Live Dashboard Incident Preview using genuine system schemas */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-bold text-sky-400">INC-0001</span>
                    <span className="text-[10px] text-slate-400">TRAPPED_FLOOD</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-800 font-bold">
                    CRITICAL PRIORITY
                  </span>
                </div>

                <div className="text-slate-300 text-[11.5px] font-sans leading-snug">
                  Rooftop of 2-storey house near St. Jude Church • Family of 4 stranded with infant
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>STATUS: <strong className="text-emerald-400">RESPONDING</strong></span>
                  <span className="text-slate-500">GPS: 21.1458° N, 79.0882° E</span>
                </div>
              </div>
            </div>
          </motion.article>

          {/* SCENE 04: Coordinated Response (Alternated: Text Left, Image Right) */}
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Narrative Content (Left on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-2 lg:order-1 lg:pr-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-mono font-bold tracking-wider">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>04 / THE RESPONSE</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                “From SOS to coordinated action.”
              </h3>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Responders can use organized incident information to coordinate follow-up and monitor progress.
              </p>

              {/* Visual Accent: Closing Narrative Punchline Callout */}
              <div className="p-4 rounded-xl bg-white border-l-4 border-slate-900 border-y border-r border-slate-200/90 shadow-2xs">
                <p className="text-sm sm:text-base font-bold text-slate-900 italic leading-snug">
                  “From SOS to Rescue. Because every call for help deserves a path forward.”
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Incident Statuses
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Truthful Triage Delivery
                </span>
              </div>
            </div>

            {/* Image (Right on Desktop, 6 cols) */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.12)] bg-slate-100 group">
                <img
                  src="/images/rescue-hero.jpg"
                  alt="Search and rescue team operating boat in floodwaters evacuating stranded survivors"
                  loading="lazy"
                  className="w-full h-[320px] sm:h-[400px] lg:h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-[11px] font-mono">
                  <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/20">
                    FIELD EVACUATION TEAM
                  </span>
                  <span className="bg-emerald-600/90 font-bold px-2.5 py-1 rounded-md">
                    COORDINATION VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        </div>

        {/* 3. Closing Call to Action Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeInUp}
          className="mt-20 sm:mt-32 p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-5 shadow-sm">
            <Activity className="w-6 h-6 text-red-500" />
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
            When communication matters most, build another path.
          </h3>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
            Explore how our local-first emergency communication prototype connects SOS reporting, an ESP32 gateway, and a rescue dashboard.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleScrollToHowItWorks}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Explore How It Works</span>
              <ArrowDown className="w-4 h-4 text-red-400 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('/dashboard')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F3F7FC] hover:bg-slate-200/70 text-[#17243A] text-sm font-bold border border-slate-300/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Rescue Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#1685D1]" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
