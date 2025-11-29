// API Configuration with automatic port detection and fallback
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Try multiple ports in order of preference
const POSSIBLE_PORTS = [4001, 4000, 3001, 3000, 5000];

// Cache the working API URL
let cachedApiUrl = null;

/**
 * Automatically detect which port the backend server is running on
 * This solves the port mismatch issue permanently
 */
async function detectApiUrl() {
  // Return cached URL if already detected
  if (cachedApiUrl) {
    return cachedApiUrl;
  }

  // Check localStorage for previously working URL
  const storedUrl = localStorage.getItem('api_url');
  if (storedUrl) {
    try {
      const response = await fetch(`${storedUrl}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      if (response.ok) {
        cachedApiUrl = storedUrl;
        console.log('✅ Using cached API URL:', storedUrl);
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
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (response.ok) {
        cachedApiUrl = url;
        localStorage.setItem('api_url', url);
        console.log(`✅ Server found at ${url}`);
        return url;
      }
    } catch (e) {
      console.log(`❌ Port ${port} not responding`);
      continue;
    }
  }

  // If no port works, default to 4001 and show error
  console.error('❌ Could not detect API server on any port!');
  console.error('Make sure the server is running with: npm run dev');
  cachedApiUrl = 'http://localhost:4001';
  return cachedApiUrl;
}

// Get API URL synchronously (uses cached value or default)
export function getApiUrl() {
  return cachedApiUrl || 'http://localhost:4001';
}

// Initialize API URL detection
export const API_URL_PROMISE = isDevelopment ? detectApiUrl() : Promise.resolve('');

// Export synchronous API_URL for immediate use (will be updated after detection)
// Export synchronous API_URL for immediate use (will be updated after detection)
export let API_URL = isDevelopment ? 'http://localhost:4001' : ''; // Relative path for production (same domain)

// Update API_URL after detection
if (isDevelopment) {
  API_URL_PROMISE.then(url => {
    API_URL = url;
  });
}

/**
 * Enhanced fetch wrapper with automatic retry and better error handling
 */
export async function apiFetch(endpoint, options = {}) {
  // Ensure API URL is detected
  const baseUrl = await API_URL_PROMISE;
  
  const url = `${baseUrl}${endpoint}`;
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 API Request (attempt ${attempt}/${maxRetries}):`, url);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      // Log response status
      console.log(`📥 API Response:`, response.status, response.statusText);

      return response;
    } catch (error) {
      lastError = error;
      console.error(`❌ API Request failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        
        // Try to re-detect API URL on failure
        cachedApiUrl = null;
        localStorage.removeItem('api_url');
        await detectApiUrl();
      }
    }
  }

  // All retries failed
  throw new Error(`API request failed after ${maxRetries} attempts: ${lastError.message}`);
}

export const config = {
  get apiUrl() {
    return getApiUrl();
  },
  isDevelopment,
  apiFetch
};
