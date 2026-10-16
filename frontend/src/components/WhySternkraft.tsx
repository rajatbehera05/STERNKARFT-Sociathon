import React from 'react';
import { WifiOff, ClipboardList, ShieldCheck } from 'lucide-react';

interface BenefitItem {
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  description: string;
  accentBar: string;
}

const benefits: BenefitItem[] = [
  {
    icon: WifiOff,
    tag: 'OFFLINE ARCHITECTURE',
    title: 'Works Locally',
    description:
      'Designed for communication without depending on public internet access.',
    accentBar: 'bg-sky-500',
  },
  {
    icon: ClipboardList,
    tag: 'INCIDENT LOGGING',
    title: 'Clear Incident Tracking',
    description:
      'Keep emergency reports organized for rescue operators.',
    accentBar: 'bg-slate-700',
  },
  {
    icon: ShieldCheck,
    tag: 'FIELD RESILIENCE',
    title: 'Built for Resilience',
    description:
      'A local-first approach designed for disrupted connectivity.',
    accentBar: 'bg-red-500',
  },
];

export const WhySternkraft: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-4 h-[2px] bg-red-600 rounded-full" />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">
            CORE CAPABILITIES
          </p>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
          Designed for Disaster Connectivity
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
          Resilient local architecture tailored for emergency operations during network outages.
        </p>
      </div>

      {/* 3 Polished Benefit Cards directly below the subtitle (gap: 24-32px) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                {/* Top Header: Icon and Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs group-hover:text-slate-900 group-hover:bg-slate-100/70 transition-colors">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    {benefit.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              {/* Subtle bottom accent line */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${benefit.accentBar}`} />
                <span className="text-xs font-medium text-slate-400">
                  Local operational standard
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
