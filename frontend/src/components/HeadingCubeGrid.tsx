import React from 'react';
import { WireframeCube } from './WireframeCube';

interface HeadingCubeGridProps {
  className?: string;
  size?: number;
  accent?: 'red' | 'blue' | 'sky' | 'navy' | 'pink';
  animated?: boolean;
}

export const HeadingCubeGrid: React.FC<HeadingCubeGridProps> = ({
  className = '',
  size = 42,
  accent = 'red',
  animated = true,
}) => {
  // Sophisticated curated color palette matching the STERN-X design system
  const color =
    accent === 'red'
      ? '#E11D48' // Modern Emergency Crimson
      : accent === 'blue'
      ? '#2563EB' // High-Tech Cobalt Blue
      : accent === 'sky'
      ? '#0284C7' // Refined Sky Blue
      : accent === 'navy'
      ? '#1E293B' // Deep Slate Navy
      : '#F43F5E'; // Vibrant Rose (replaces harsh neon pink)

  return (
    <WireframeCube
      size={size}
      color={color}
      className={className}
      animated={animated}
    />
  );
};

export { WireframeCube };
