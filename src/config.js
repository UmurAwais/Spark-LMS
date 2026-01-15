// API Configuration with automatic port detection and fallback
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Get production API URL from env or use default
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://spark-lms-backend-production.up.railway.app';

// Try multiple ports in order of preference (for local dev)
const POSSIBLE_PORTS = [4001, 4000, 3001, 3000, 5000];

// Export synchronous API_URL for immediate use
export let API_URL = isDevelopment ? 'http://localhost:4001' : PRODUCTION_API_URL;

/**
 * Automatically detect which port the backend server is running on (Local Dev Only)
 */
async function detectApiUrl() {
  // If production, just return the production URL
  if (!isDevelopment) {
    return PRODUCTION_API_URL;
  }

  // Check localStorage for previously working URL
  const storedUrl = localStorage.getItem('api_url');
  if (storedUrl) {
    try {
      const response = await fetch(`${storedUrl}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        console.log('✅ Using cached API URL:', storedUrl);
        API_URL = storedUrl;
        return storedUrl;
      }
    } catch (e) {
      console.warn('⚠️ Cached API URL not responding, trying alternatives...');
      localStorage.removeItem('api_url');
    }
  }

  // Try each port until we find one that works
  for (const port of POSSIBLE_PORTS) {
    const url = `http://localhost:${port}`;
    try {
      console.log(`🔍 Trying ${url}...`);
      const response = await fetch(`${url}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        localStorage.setItem('api_url', url);
        console.log(`✅ Server found at ${url}`);
        API_URL = url;
        return url;
      }
    } catch (e) {
      continue; // Try next port
    }
  }

  // If no port works, default to 4001
  console.error('❌ Could not detect API server on any port!');
  API_URL = 'http://localhost:4001';
  return API_URL;
}

// Initialize API URL detection
export const API_URL_PROMISE = detectApiUrl();

// Update API_URL export after detection completes
API_URL_PROMISE.then(url => {
  API_URL = url;
});

// Helper getter
export function getApiUrl() {
  return API_URL;
}

/**
 * Enhanced fetch wrapper
 */
export async function apiFetch(endpoint, options = {}) {
  // Wait for detection to complete (mostly for dev, instant for prod)
  const baseUrl = await API_URL_PROMISE;
  
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error(`❌ API Request failed:`, error.message);
    throw error;
  }
}

export const config = {
  get apiUrl() {
    return API_URL;
  },
  isDevelopment,
  apiFetch
};
