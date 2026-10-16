import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update local clock every second
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Format 12-hour time with seconds and AM/PM
  const timeString = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Format date: e.g. "Friday, 16 October"
  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/85 border border-slate-200/80 shadow-xs backdrop-blur-xs text-xs text-slate-700 select-none"
      aria-label={`Current local time: ${timeString}, ${dateString}`}
    >
      <div className="flex items-center gap-1.5 text-slate-500">
        <Clock className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
        <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500">
          LOCAL TIME
        </span>
      </div>

      <span className="text-slate-300 font-light" aria-hidden="true">|</span>

      <span className="font-bold text-slate-900 tabular-nums tracking-tight">
        {timeString}
      </span>

      {/* Restrained live pulsing dot + Live label */}
      <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 pl-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span>Live</span>
      </div>

      <span className="hidden sm:inline text-slate-300 font-light" aria-hidden="true">|</span>

      <span className="hidden sm:inline text-slate-600 font-medium">
        {dateString}
      </span>
    </motion.div>
  );
};
