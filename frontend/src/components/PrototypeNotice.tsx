import React from 'react';
import { Info } from 'lucide-react';

export const PrototypeNotice: React.FC = () => {
  return (
    <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="w-full rounded-2xl bg-sky-50/70 border border-sky-100/90 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Info Icon & Prototype Disclaimer */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <p className="text-xs text-slate-600 leading-normal">
            This is a prototype for the Sociathon hackathon. Live connectivity
            and delivery status will depend on the actual device and backend
            state.
          </p>
        </div>

        {/* Right Side: Together For A Safer Tomorrow slogan & Mountain glyph */}
        <div className="flex items-center gap-3 text-slate-500 shrink-0 self-end md:self-auto pl-9 md:pl-0">
          <span className="hidden lg:block w-px h-4 bg-slate-300" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
            TOGETHER FOR A SAFER TOMORROW
          </span>
          <span className="w-3 h-[2px] bg-red-600 rounded-full" />
          {/* Mountain / Ridge contour glyph */}
          <svg
            className="w-8 h-4 text-sky-600/70"
            viewBox="0 0 36 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 16L12 4L18 11L26 2L34 16" />
            <path d="M12 16L18 8L22 13" />
          </svg>
        </div>
      </div>
    </footer>
  );
};
