import React from 'react';

interface WireframeCubeProps {
  className?: string;
  size?: number;
  color?: string; // Default to vibrant hot pink / neon magenta from screenshot (#FF2A85)
  animated?: boolean;
}

export const WireframeCube: React.FC<WireframeCubeProps> = ({
  className = '',
  size = 38,
  color = '#FF2A85',
  animated = true,
}) => {
  const half = size / 2;

  // Face definition: 6 transparent faces with 3x3 internal grid lines and solid wireframe borders
  const renderFace = (transform: string, key: string) => (
    <div
      key={key}
      className="absolute inset-0 pointer-events-none select-none"
      style={{
        transform,
        width: `${size}px`,
        height: `${size}px`,
        border: `1.5px solid ${color}`,
        backgroundColor: 'rgba(255, 42, 133, 0.02)',
        backfaceVisibility: 'visible',
        WebkitBackfaceVisibility: 'visible',
        boxSizing: 'border-box',
      }}
    >
      {/* Vertical Grid Line 1 (33.333%) */}
      <div
        style={{
          position: 'absolute',
          left: '33.333%',
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: color,
          opacity: 0.95,
        }}
      />
      {/* Vertical Grid Line 2 (66.666%) */}
      <div
        style={{
          position: 'absolute',
          left: '66.666%',
          top: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: color,
          opacity: 0.95,
        }}
      />
      {/* Horizontal Grid Line 1 (33.333%) */}
      <div
        style={{
          position: 'absolute',
          top: '33.333%',
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: color,
          opacity: 0.95,
        }}
      />
      {/* Horizontal Grid Line 2 (66.666%) */}
      <div
        style={{
          position: 'absolute',
          top: '66.666%',
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: color,
          opacity: 0.95,
        }}
      />
    </div>
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: `${size + 12}px`,
        height: `${size + 12}px`,
        perspective: '600px',
      }}
      aria-hidden="true"
    >
      <div
        className={animated ? 'animate-wireframe-cube' : ''}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: animated ? undefined : 'rotateX(-24deg) rotateY(35deg) rotateZ(4deg)',
          filter: `drop-shadow(0 0 3px ${color}66)`,
        }}
      >
        {/* 6 Subdivided Faces */}
        {renderFace(`translateZ(${half}px)`, 'front')}
        {renderFace(`rotateY(180deg) translateZ(${half}px)`, 'back')}
        {renderFace(`rotateY(90deg) translateZ(${half}px)`, 'right')}
        {renderFace(`rotateY(-90deg) translateZ(${half}px)`, 'left')}
        {renderFace(`rotateX(90deg) translateZ(${half}px)`, 'top')}
        {renderFace(`rotateX(-90deg) translateZ(${half}px)`, 'bottom')}
      </div>
    </div>
  );
};
