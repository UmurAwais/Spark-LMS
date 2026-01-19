import React, { useState } from 'react';
import { useImageUrl } from '../hooks/useImageUrl';

/**
 * A safe image component that handles async API URL resolution
 * and provides a fallback for broken images.
 */
export default function SafeImage({ src, alt, className, fallback, ...props }) {
  const imageUrl = useImageUrl(src);
  const [error, setError] = useState(false);

  if (!imageUrl || error) {
    return fallback || (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}>
        <span>N/A</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || ""}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
}
