import React from 'react';
import { WireframeCube } from './WireframeCube';

interface HeadingCubeGridProps {
  className?: string;
  size?: number;
  accent?: 'pink' | 'red' | 'sky' | 'navy';
  animated?: boolean;
}

export const HeadingCubeGrid: React.FC<HeadingCubeGridProps> = ({
  className = '',
  size = 38,
  accent = 'pink',
  animated = true,
}) => {
  // Vibrant pink from user reference image is default; fallback to accent if customized
  const color =
    accent === 'pink'
      ? '#FF2A85'
      : accent === 'red'
      ? '#E11D48'
      : accent === 'sky'
      ? '#0EA5E9'
      : '#334155';

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
