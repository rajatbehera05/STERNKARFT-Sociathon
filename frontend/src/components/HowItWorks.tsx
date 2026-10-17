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
    <section id="how-it-works" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 scroll-mt-6">
      {/* Section Header with rotating 3D cube with grid directly in front of the topic */}
      <div className="mb-8 sm:mb-10 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-5 h-[2.5px] bg-red-600 rounded-full" />
          <p className="text-[11px] sm:text-xs font-bold tracking-[0.24em] uppercase text-slate-500">
            HOW IT WORKS
          </p>
        </div>

        {/* Heading with 3D Rotating Cube directly IN FRONT OF "From SOS to Rescue" */}
        <div className="flex items-center gap-4 sm:gap-5">
          <HeadingCubeGrid accent="red" size={52} animated={true} />
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 tracking-[-0.03em] leading-tight">
            From SOS to Rescue
          </h2>
        </div>

        <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl font-normal leading-relaxed">
          A simple, local system that connects you to help — step by step.
        </p>
      </div>

      {/* Connected 3-Column Process Layout - Styled as Modern Rounded Cards */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.number}
              className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-slate-100 shadow-[0_4px_24px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_36px_rgba(37,99,235,0.08)] hover:border-blue-100 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Icon Container and Step Number */}
                <div className="w-full flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50/90 border border-blue-100/60 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-2xs">
                    <Icon className="w-5 h-5 stroke-[1.9]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold tracking-wider text-blue-600 bg-blue-50/80 border border-blue-100/50 px-2.5 py-1 rounded-lg">
                    STEP {step.number}
                  </span>
                </div>

                {/* Step Title */}
                <h3 className="text-[19px] font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-900 transition-colors">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm text-slate-500 leading-relaxed font-normal">
                  {step.description}
                </p>
              </div>

              {/* Step indicator arrow for desktop */}
              {!isLast && (
                <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-blue-600/80 mt-6 pt-4 border-t border-slate-50">
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
