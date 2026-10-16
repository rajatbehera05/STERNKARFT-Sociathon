import React from 'react';

interface HeadingCubeGridProps {
  className?: string;
  size?: number;
  accent?: 'red' | 'sky' | 'navy';
}

export const HeadingCubeGrid: React.FC<HeadingCubeGridProps> = ({
  className = '',
  size = 34,
  accent = 'red',
}) => {
  const half = size / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none pointer-events-none opacity-85 hover:opacity-100 transition-opacity ${className}`}
      style={{ width: `${size + 14}px`, height: `${size + 14}px` }}
      aria-hidden="true"
    >
      {/* Subtle Coordinate Grid Floor Disk */}
      <div className="absolute inset-0 rounded-xl border border-sky-200/50 bg-gradient-to-br from-sky-50/50 to-transparent flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.22) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.22) 1px, transparent 1px)
            `,
            backgroundSize: '8px 8px',
          }}
        />
        {/* Subtle corner crosshairs */}
        <span className="absolute top-1 left-1 text-[8px] font-mono text-sky-400/80 leading-none">
          +
        </span>
        <span className="absolute bottom-1 right-1 text-[8px] font-mono text-sky-400/80 leading-none">
          +
        </span>
      </div>

      {/* 3D Rotating Wireframe Cube with Fine Grid Lines */}
      <div
        className="relative z-10 animate-cube-heading"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front Face with Fine Grid Lines */}
        <div
          className="absolute inset-0 border border-sky-400/60 bg-sky-500/10 backdrop-blur-[0.5px] rounded-2xs"
          style={{
            transform: `translateZ(${half}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.35) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.35) 1px, transparent 1px)
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Back Face */}
        <div
          className="absolute inset-0 border border-sky-400/40 bg-sky-500/5 rounded-2xs"
          style={{
            transform: `rotateY(180deg) translateZ(${half}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Right Face */}
        <div
          className="absolute inset-0 border border-sky-500/50 bg-slate-900/10 rounded-2xs"
          style={{
            transform: `rotateY(90deg) translateZ(${half}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Left Face */}
        <div
          className="absolute inset-0 border border-sky-400/40 bg-sky-500/5 rounded-2xs"
          style={{
            transform: `rotateY(-90deg) translateZ(${half}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Top Face */}
        <div
          className="absolute inset-0 border border-sky-300/60 bg-sky-400/15 rounded-2xs"
          style={{
            transform: `rotateX(90deg) translateZ(${half}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.35) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.35) 1px, transparent 1px)
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Bottom Face */}
        <div
          className="absolute inset-0 border border-slate-700/50 bg-slate-900/15 rounded-2xs"
          style={{
            transform: `rotateX(-90deg) translateZ(${half}px)`,
            backgroundImage: `
              linear-gradient(to right, rgba(14, 165, 233, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(14, 165, 233, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '6px 6px',
          }}
        />

        {/* Emergency Node Core Accent */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: 'translateZ(0px)' }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              accent === 'red'
                ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.85)] animate-pulse'
                : accent === 'navy'
                ? 'bg-slate-700 shadow-[0_0_6px_rgba(51,65,85,0.6)]'
                : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.85)] animate-pulse'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
