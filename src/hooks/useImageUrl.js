import { useState, useEffect } from 'react';
import { API_URL_PROMISE } from '../config';

/**
 * Hook to construct proper image URLs with async API URL resolution
 * @param {string} imagePath - The image path from the database (e.g., "/uploads/profile.jpg")
 * @returns {string} - The full image URL
 */
export function useImageUrl(imagePath) {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    async function constructUrl() {
      if (!imagePath) {
        setImageUrl('');
        return;
      }

      // If it's already a full URL or blob, use as is
      if (imagePath.startsWith('http://') || 
          imagePath.startsWith('https://') || 
          imagePath.startsWith('blob:') ||
          imagePath.startsWith('data:')) {
        setImageUrl(imagePath);
        return;
      }

      // Wait for API URL to be resolved
      const apiUrl = await API_URL_PROMISE;

      // Construct the full URL
      let fullUrl;
      if (imagePath.startsWith('/')) {
        fullUrl = `${apiUrl}${imagePath}`;
      } else {
        fullUrl = `${apiUrl}/${imagePath}`;
      }

      setImageUrl(fullUrl);
    }

    constructUrl();
  }, [imagePath]);

  return imageUrl;
}
