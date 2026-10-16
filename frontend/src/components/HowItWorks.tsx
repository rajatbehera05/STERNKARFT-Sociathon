import React from 'react';
import { Smartphone, Radio, Laptop, ArrowRight } from 'lucide-react';
import { HeadingCubeGrid } from './HeadingCubeGrid';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const steps: ProcessStep[] = [
  {
    number: '01',
    title: 'Send SOS',
    description:
      'A person submits an emergency alert with available incident details.',
    icon: Smartphone,
    accentColor: 'text-red-600',
  },
  {
    number: '02',
    title: 'Local Gateway',
    description:
      'The ESP32 receives the alert and forwards it to the nearby rescue laptop.',
    icon: Radio,
    accentColor: 'text-sky-700',
  },
  {
    number: '03',
    title: 'Coordinate Response',
    description:
      'The dashboard records incidents locally and lets operators track its status.',
    icon: Laptop,
    accentColor: 'text-slate-800',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Section Header with rotating 3D cube with grid directly in front of the topic */}
      <div className="mb-6 sm:mb-8 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-4 h-[2px] bg-red-600 rounded-full" />
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">
            HOW IT WORKS
          </p>
        </div>

        {/* Heading with 3D Rotating Cube with Grid directly IN FRONT OF "From SOS to Rescue" */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <HeadingCubeGrid accent="red" size={34} />
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            From SOS to Rescue
          </h2>
        </div>

        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-xl">
          A simple, local system that connects you to help — step by step.
        </p>
      </div>

      {/* Connected 3-Column Process Layout - immediately below the subtitle */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.number}
              className="relative flex flex-col items-start text-left"
            >
              {/* Top Row: Icon Container and Step Number */}
              <div className="w-full flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${step.accentColor} stroke-[2]`} />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    STEP {step.number}
                  </span>
                </div>

                {/* Desktop Thin Directional Connector Arrow */}
                {!isLast && (
                  <div
                    className="hidden md:flex items-center pr-2 text-slate-300"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-4 h-4 stroke-[1.8]" />
                  </div>
                )}
              </div>

              {/* Step Title */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {step.title}
              </h3>

              {/* Step Description */}
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
