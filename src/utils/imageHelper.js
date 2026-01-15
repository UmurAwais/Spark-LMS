// Helper function to get full image URL
export function getImageUrl(imagePath) {
  if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  
  // Only prefix API URL for backend-uploaded images (starting with /uploads)
  if (imagePath.startsWith('/uploads')) {
    const API_URL = import.meta.env.VITE_API_URL || 'https://spark-lms-backend-production.up.railway.app';
    return `${API_URL}${imagePath}`;
  }
  
  // Return as-is for locally imported images (Vite handles these)
  return imagePath;
}
