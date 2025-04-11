import React from 'react';

interface ImageContainerProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | '3/2' | '16/9';
  overlay?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ImageContainer: React.FC<ImageContainerProps> = ({
  src,
  alt,
  aspectRatio = 'square',
  overlay,
  className = '',
  onClick
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    '3/2': 'aspect-[3/2]',
    '16/9': 'aspect-[16/9]'
  };

  return (
    <div 
      className={`relative ${aspectRatioClasses[aspectRatio]} rounded-lg overflow-hidden ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {overlay}
    </div>
  );
}; 