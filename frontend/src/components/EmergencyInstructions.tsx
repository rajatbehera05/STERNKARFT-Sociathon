import React from 'react';
import { Wifi, Globe, Send, ShieldAlert } from 'lucide-react';

interface InstructionStep {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: InstructionStep[] = [
  {
    number: '01',
    title: 'Connect to Local Wi-Fi',
    description: 'Join the configured ESP32 emergency hotspot.',
    icon: Wifi,
  },
  {
    number: '02',
    title: 'Open the SOS Page',
    description: 'Access the locally hosted reporting page.',
    icon: Globe,
  },
  {
    number: '03',
    title: 'Submit Incident Details',
    description: 'Provide the available information and location description.',
    icon: Send,
  },
  {
    number: '04',
    title: 'Coordinate the Response',
    description:
      'Rescue operators review received incidents through the dashboard.',
    icon: ShieldAlert,
  },
];

export const EmergencyInstructions: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-4 h-[2px] bg-red-600 rounded-full" />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">
            FIELD PROCEDURE
          </p>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
          Quick Emergency Instructions
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
          Operational sequence for submitting and coordinating reports during field outages.
        </p>
      </div>

      {/* Single Lightly Tinted Panel with Subtle Separators (gap: 24-32px below header) */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 lg:p-9 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-200/80">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.number}
                className={`flex flex-col items-start text-left ${
                  index > 0 ? 'lg:pl-7' : ''
                } ${index < steps.length - 1 ? 'lg:pr-7' : ''}`}
              >
                {/* Top Badge & Icon */}
                <div className="w-full flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.number}
                  </span>
                </div>

                {/* Step Title */}
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {item.title}
                </h3>

                {/* Step Description */}
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
