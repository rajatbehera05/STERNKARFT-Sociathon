import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update local clock every second
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Format 12-hour time with middle dot and seconds: e.g. "12·18:35 am"
  const hours = time.getHours();
  const h12 = hours % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const formattedTime = `${h12}·${minutes}:${seconds} ${ampm}`;

  // Format weekday: e.g. "SATURDAY"
  const weekday = time
    .toLocaleDateString(undefined, { weekday: 'long' })
    .toUpperCase();

  // Format day and month: e.g. "17 October"
  const day = time.getDate();
  const month = time.toLocaleDateString(undefined, { month: 'long' });
  const formattedDate = `${day} ${month}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative inline-flex items-center gap-3 sm:gap-4.5 p-2 sm:p-2.5 pr-6 sm:pr-8 rounded-full bg-white/95 border border-slate-100 shadow-[0_10px_32px_-6px_rgba(15,23,42,0.08)] backdrop-blur-md select-none overflow-hidden"
      aria-label={`Current local time: ${formattedTime}, ${weekday} ${formattedDate}`}
    >
      {/* 1. LEFT BLOCK: Local Time */}
      <div className="flex items-center gap-2.5 sm:gap-3 pl-1">
        {/* Purple/Indigo gradient circle with Clock icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
          <Clock className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        </div>

        {/* Local time labels */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-slate-400 leading-tight mb-0.5">
            LOCAL TIME
          </span>
          <span className="text-lg sm:text-[21px] font-extrabold text-slate-900 tracking-tight leading-none tabular-nums">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* 2. REFINED COMPACT MIDDLE DIVIDER (Reduced middle gap without the Live badge) */}
      <div
        className="w-[1px] h-8 sm:h-9 bg-slate-200/80 shrink-0 mx-1 sm:mx-1.5"
        aria-hidden="true"
      />

      {/* 3. RIGHT BLOCK: Date & Weekday */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Soft lavender/indigo circle with Calendar icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-50/90 border border-indigo-100/70 flex items-center justify-center text-indigo-500 shrink-0 shadow-2xs">
          <Calendar className="w-5 h-5 stroke-[2]" aria-hidden="true" />
        </div>

        {/* Date labels */}
        <div className="flex flex-col text-left">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-slate-400 leading-tight mb-0.5">
            {weekday}
          </span>
          <span className="text-lg sm:text-[21px] font-extrabold text-slate-900 tracking-tight leading-none">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Right corner subtle glassy sheen overlay matching reference */}
      <div
        className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-indigo-100/35 via-white/10 to-transparent pointer-events-none rounded-r-full"
        aria-hidden="true"
      />
      <div
        className="absolute -right-2 -top-2 w-10 h-10 bg-indigo-200/25 rounded-full blur-md pointer-events-none"
        aria-hidden="true"
      />
    </motion.div>
  );
};
