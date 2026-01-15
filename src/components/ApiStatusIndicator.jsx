import React, { useEffect, useState } from 'react';
import { API_URL_PROMISE, getApiUrl } from '../config';

/**
 * API Status Indicator Component
 * Shows the current API connection status in the corner of the screen
 */
export default function ApiStatusIndicator() {
  const [apiUrl, setApiUrl] = useState('Detecting...');
  const [status, setStatus] = useState('loading'); // loading, connected, error

  useEffect(() => {
    async function checkApi() {
      try {
        const url = await API_URL_PROMISE;
        setApiUrl(url);
        setStatus('connected');
      } catch (error) {
        setApiUrl('Not connected');
        setStatus('error');
      }
    }
    
    checkApi();
  }, []);

  // Don't show in production
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return null;
  }

  const statusColors = {
    loading: 'bg-yellow-500',
    connected: 'bg-green-500',
    error: 'bg-red-500'
  };

  const statusText = {
    loading: 'Detecting API...',
    connected: `Connected: ${apiUrl}`,
    error: 'API Not Connected'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border-2 border-gray-200 rounded-md shadow-lg px-4 py-2 flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} ${status === 'loading' ? 'animate-pulse' : ''}`}></div>
        <div>
          <p className="text-xs font-semibold text-gray-700">{statusText[status]}</p>
          {status === 'error' && (
            <p className="text-xs text-red-600 mt-1">Check if server is running</p>
          )}
        </div>
      </div>
    </div>
  );
}
