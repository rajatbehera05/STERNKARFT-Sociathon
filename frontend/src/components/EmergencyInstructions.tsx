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

      {/* Single Lightly Tinted Panel with Subtle Separators */}
      <div className="w-full bg-white border border-slate-100 rounded-3xl p-7 sm:p-9 lg:p-10 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-slate-100">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.number}
                className={`group flex flex-col items-start text-left ${
                  index > 0 ? 'lg:pl-8' : ''
                } ${index < steps.length - 1 ? 'lg:pr-8' : ''}`}
              >
                {/* Top Badge & Icon */}
                <div className="w-full flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50/90 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                    <Icon className="w-5 h-5 stroke-[1.9]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold tracking-wider text-blue-600 bg-blue-50/80 border border-blue-100/50 px-2.5 py-1 rounded-lg">
                    {item.number}
                  </span>
                </div>

                {/* Step Title */}
                <h3 className="text-[17px] font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-900 transition-colors">
                  {item.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm text-slate-500 leading-relaxed font-normal">
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
