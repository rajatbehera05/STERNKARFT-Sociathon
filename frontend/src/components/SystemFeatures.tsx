import React from 'react';
import { Target, Sparkles, Bookmark, Radio, Activity, Cpu } from 'lucide-react';

interface FeatureCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: Target,
    title: 'Real-time SOS Ingestion',
    description:
      'Sub-second localized packet capture over autonomous ESP32 Wi-Fi continuously detects incoming distress transmissions.',
  },
  {
    icon: Sparkles,
    title: 'Automated Triage Assignment',
    description:
      'Instantly evaluates medical hazards, rising water levels, and vulnerable demographics to prioritize critical incidents.',
  },
  {
    icon: Bookmark,
    title: 'Offline Record Persistence',
    description:
      'Maintains tamper-proof local PostgreSQL and queue synchronization with zero cloud dependency during total power or cell loss.',
  },
  {
    icon: Radio,
    title: 'Autonomous Gateway Control',
    description:
      'Operates an isolated emergency wireless access point with direct hardware serial bridging to the field rescue workstation.',
  },
  {
    icon: Activity,
    title: 'Live Operational Dispatch',
    description:
      'Real-time field responder tracking, incident lifecycle state transitions, and dynamic situational awareness metrics.',
  },
  {
    icon: Cpu,
    title: 'ESP32 + Sensor Integration',
    description:
      'Direct hardware telemetry with stable debounce filtering, ultrasonic flood depth calculation, and fail-safe recovery.',
  },
];

export const SystemFeatures: React.FC = () => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 overflow-hidden">
      {/* Background Circuit / Network Connection Lines with Nodes */}
      <div
        className="absolute inset-0 pointer-events-none select-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 600"
        >
          {/* Subtle curved network traces */}
          <path
            d="M -50 120 C 150 180, 280 80, 420 220 S 750 320, 950 180 S 1180 260, 1250 240"
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 50 380 C 220 320, 360 440, 580 340 S 840 240, 1060 380 S 1180 420, 1250 390"
            fill="none"
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <path
            d="M 280 60 C 340 140, 320 310, 410 390 S 680 460, 820 480"
            fill="none"
            stroke="#dbeafe"
            strokeWidth="1.2"
          />

          {/* Network Node 1: Left-center connection */}
          <g transform="translate(190, 150)">
            <circle r="9" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <circle r="4" fill="#2563eb" />
          </g>

          {/* Network Node 2: Between top cards */}
          <g transform="translate(390, 205)">
            <circle r="10" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <circle r="4.5" fill="#2563eb" />
          </g>

          {/* Network Node 3: Center junction */}
          <g transform="translate(740, 290)">
            <circle r="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <circle r="3.5" fill="#2563eb" />
          </g>

          {/* Network Node 4: Right branch */}
          <g transform="translate(1010, 200)">
            <circle r="9" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <circle r="4" fill="#2563eb" />
          </g>

          {/* Network Node 5: Bottom interconnect */}
          <g transform="translate(560, 345)">
            <circle r="9" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
            <circle r="4" fill="#2563eb" />
          </g>
        </svg>
      </div>

      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <p className="text-[12px] font-bold tracking-[0.22em] uppercase text-blue-600 mb-2.5">
          CORE CAPABILITIES
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0f172a] tracking-tight">
          System Features
        </h2>
      </div>

      {/* 6 Feature Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-slate-100 shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_36px_rgba(37,99,235,0.08)] hover:border-blue-100 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-start"
            >
              {/* Top Icon Badge in Light Blue Squircle */}
              <div className="w-12 h-12 rounded-2xl bg-blue-50/90 border border-blue-100/60 flex items-center justify-center text-blue-600 mb-6 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                <Icon className="w-5 h-5 stroke-[1.9]" />
              </div>

              {/* Feature Title */}
              <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-2.5 group-hover:text-blue-900 transition-colors">
                {feature.title}
              </h3>

              {/* Feature Description */}
              <p className="text-sm text-slate-500 leading-relaxed font-normal">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
