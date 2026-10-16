import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { AppRoute } from '../types';

interface PlaceholderPageProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  route,
  onNavigate,
}) => {
  const isSos = route === '/sos';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xl"
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xs">
          {isSos ? (
            <div className="w-full h-full rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <LayoutDashboard className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled Implementation Scope</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isSos
            ? 'Civilian Mobile SOS Interface'
            : 'Rescue Coordination Dashboard'}
        </h2>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          {isSos
            ? 'The mobile-optimized emergency report form (with optional location, headcount, and rapid triage tags) will be implemented in the next phase per the STERNKRAFT PRD.'
            : 'The real-time incident queue, triage priority matrix, and operational lifecycle controls (NEW → ACKNOWLEDGED → RESPONDING → RESOLVED) will be implemented in the next phase per the STERNKRAFT PRD.'}
        </p>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => onNavigate('/')}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
