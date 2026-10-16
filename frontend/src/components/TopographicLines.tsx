import React from 'react';

export const TopographicLinesLeft: React.FC = () => {
  return (
    <svg
      className="absolute top-0 left-0 w-80 h-[480px] pointer-events-none text-sky-400/20 select-none opacity-40 mix-blend-multiply"
      viewBox="0 0 320 480"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      aria-hidden="true"
    >
      <path d="M-50 50 C 30 65, 100 150, 50 250 C 0 350, 90 420, 15 480" />
      <path d="M-25 15 C 65 30, 135 110, 95 225 C 50 340, 140 400, 55 470" />
      <path d="M0 -20 C 90 0, 170 85, 140 195 C 100 310, 185 375, 100 460" />
      <path d="M35 -55 C 125 -20, 205 60, 180 170 C 145 285, 230 350, 145 450" />
      <path d="M70 -80 C 160 -45, 240 35, 220 145 C 195 255, 275 320, 195 440" />
    </svg>
  );
};

export const TopographicLinesRight: React.FC = () => {
  return (
    <svg
      className="absolute bottom-16 right-0 w-80 h-[480px] pointer-events-none text-sky-400/20 select-none opacity-40 mix-blend-multiply"
      viewBox="0 0 320 480"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.85"
      aria-hidden="true"
    >
      <path d="M370 50 C 290 65, 220 150, 270 250 C 320 350, 230 420, 305 480" />
      <path d="M345 15 C 255 30, 185 110, 225 225 C 270 340, 180 400, 265 470" />
      <path d="M320 -20 C 230 0, 150 85, 180 195 C 220 310, 135 375, 220 460" />
      <path d="M285 -55 C 195 -20, 115 60, 140 170 C 175 285, 90 350, 175 450" />
      <path d="M250 -80 C 160 -45, 80 35, 100 145 C 125 255, 45 320, 125 440" />
    </svg>
  );
};
