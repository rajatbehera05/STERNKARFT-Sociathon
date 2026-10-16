import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/90 bg-white/90 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Brand Name & Short Mission Line */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="text-sm font-extrabold tracking-wider text-slate-900 uppercase">
            STERNKRAFT
          </span>
          <span className="hidden sm:inline text-slate-300 font-light">•</span>
          <span className="text-xs text-slate-600 font-medium">
            Connecting people to help when it matters most.
          </span>
        </div>

        {/* Small Disclaimer */}
        <p className="text-[11px] text-slate-500 leading-normal max-w-md sm:text-right">
          Prototype for emergency-response coordination; not a replacement for
          official emergency services.
        </p>
      </div>
    </footer>
  );
};
