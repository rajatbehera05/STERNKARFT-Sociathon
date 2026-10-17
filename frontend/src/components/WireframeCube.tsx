import React from 'react';

interface WireframeCubeProps {
  className?: string;
  size?: number;
  color?: string; // Default to sleek emergency red (#E11D48)
  animated?: boolean;
}

/**
 * True 3D Rotating Isometric Wireframe Cube.
 * Perfectly cubic geometry (width = height = depth = size) with 6 square faces,
 * internal 3x3 grid lattice, semi-transparent faces, and smooth 3D rotation
 * around both X and Y axes without flattening or distortion.
 */
export const WireframeCube: React.FC<WireframeCubeProps> = ({
  className = '',
  size = 52,
  color = '#E11D48',
  animated = true,
}) => {
  const half = size / 2;

  // Helper to render one 3x3 subdivided face of the 3D cube
  const renderFace = (transform: string, key: string, isTop = false) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${size}px`,
        height: `${size}px`,
        transform,
        transformOrigin: 'center center',
        border: `2px solid ${color}`,
        backgroundColor: isTop ? `${color}28` : `${color}14`,
        backfaceVisibility: 'visible',
        WebkitBackfaceVisibility: 'visible',
        boxSizing: 'border-box',
        boxShadow: `inset 0 0 ${Math.round(size / 3)}px ${color}22`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* 3x3 Internal Grid Line: Vertical 1 (33.333%) */}
      <div
        style={{
          position: 'absolute',
          left: '33.333%',
          top: 0,
          bottom: 0,
          width: '1.5px',
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
      {/* 3x3 Internal Grid Line: Vertical 2 (66.666%) */}
      <div
        style={{
          position: 'absolute',
          left: '66.666%',
          top: 0,
          bottom: 0,
          width: '1.5px',
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
      {/* 3x3 Internal Grid Line: Horizontal 1 (33.333%) */}
      <div
        style={{
          position: 'absolute',
          top: '33.333%',
          left: 0,
          right: 0,
          height: '1.5px',
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
      {/* 3x3 Internal Grid Line: Horizontal 2 (66.666%) */}
      <div
        style={{
          position: 'absolute',
          top: '66.666%',
          left: 0,
          right: 0,
          height: '1.5px',
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
    </div>
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: `${size + 16}px`,
        height: `${size + 16}px`,
        perspective: '1000px',
        WebkitPerspective: '1000px',
        perspectiveOrigin: 'center center',
        WebkitPerspectiveOrigin: 'center center',
        filter: `drop-shadow(0 6px 14px ${color}33)`,
      }}
      aria-hidden="true"
    >
      <div
        className={animated ? 'animate-spin-3d-cube' : ''}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transformOrigin: 'center center',
          transform: animated ? undefined : 'rotateX(-24deg) rotateY(35deg)',
          willChange: 'transform',
        }}
      >
        {/* 6 3D Faces forming a rigid, non-flattened cube */}
        {renderFace(`translateZ(${half}px)`, 'front')}
        {renderFace(`rotateY(180deg) translateZ(${half}px)`, 'back')}
        {renderFace(`rotateY(90deg) translateZ(${half}px)`, 'right')}
        {renderFace(`rotateY(-90deg) translateZ(${half}px)`, 'left')}
        {renderFace(`rotateX(90deg) translateZ(${half}px)`, 'top', true)}
        {renderFace(`rotateX(-90deg) translateZ(${half}px)`, 'bottom')}
      </div>
    </div>
  );
};
