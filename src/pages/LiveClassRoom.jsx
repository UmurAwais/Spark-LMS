import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../config';
import { Video, Mic, Share, MessageSquare, LogOut, Shield, Info, X } from 'lucide-react';

export default function LiveClassRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const meetingId = searchParams.get('id');
  const passcode = searchParams.get('pwd');
  const role = parseInt(searchParams.get('role') || '0'); // 0 for student, 1 for host
  const userName = searchParams.get('name') || 'Student';
  const meetingTopic = searchParams.get('topic') || 'Live Class';

  const [sdkLoading, setSdkLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    console.log("🎬 LiveClassRoom: Component Mounting...");

    if (!meetingId || !passcode) {
      console.error("❌ LiveClassRoom: Missing Meeting ID or Passcode");
      setError('Invalid meeting details. Please return to the dashboard.');
      setSdkLoading(false);
      return;
    }

    const loadZoomAssets = async () => {
      try {
        console.log("📦 LiveClassRoom: Loading Zoom Assets...");
        const sdkVersion = '5.1.2';
        const cssUrls = [
          `https://source.zoom.us/${sdkVersion}/css/bootstrap.css`,
          `https://source.zoom.us/${sdkVersion}/css/react-select.css`
        ];
        
        cssUrls.forEach(url => {
          if (!document.querySelector(`link[href="${url}"]`)) {
            const link = document.createElement('link');
            link.href = url;
            link.type = 'text/css';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
        });

        if (window.ZoomMtg) {
          console.log("✅ LiveClassRoom: ZoomMtg already loaded");
          initZoom();
          return;
        }

        const scripts = [
          `https://source.zoom.us/${sdkVersion}/lib/vendor/lodash.min.js`,
          `https://source.zoom.us/${sdkVersion}/lib/vendor/redux.min.js`,
          `https://source.zoom.us/${sdkVersion}/lib/vendor/redux-thunk.min.js`,
          `https://source.zoom.us/zoom-meeting-${sdkVersion}.min.js`
        ];

        // Skip React/ReactDOM since we are already in a React app
        // But some SDK versions strictly need them on window
        if (!window.React) {
           scripts.unshift(`https://source.zoom.us/${sdkVersion}/lib/vendor/react-dom.min.js`);
           scripts.unshift(`https://source.zoom.us/${sdkVersion}/lib/vendor/react.min.js`);
        }

        for (const src of scripts) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Synchronous loading
            script.onload = () => {
               if (src.includes('lodash')) window._ = window.lodash || window._;
               resolve();
            };
            script.onerror = () => {
               console.error(`Failed to load ${src}`);
               resolve(); // Continue anyway 
            };
            document.head.appendChild(script);
          });
        }
        console.log("✅ LiveClassRoom: All scripts loaded");
        setTimeout(() => {
           if (isMounted.current) initZoom();
        }, 1000); // 1 second buffer for scripts to execute their side effects
      } catch (err) {
        console.error('❌ LiveClassRoom: Asset loading error:', err);
        if (isMounted.current) {
          setError('Failed to load live session components. Please refresh.');
          setSdkLoading(false);
        }
      }
    };

    const initZoom = async () => {
      try {
        if (!isMounted.current) return;
        const { ZoomMtg } = window;
        const sdkVersion = '5.1.2';
        
        console.log("⚙️ LiveClassRoom: Initializing Zoom SDK...");
        let zoomRoot = document.getElementById('zmmtg-root');
        if (!zoomRoot) {
          zoomRoot = document.createElement('div');
          zoomRoot.id = 'zmmtg-root';
          document.body.appendChild(zoomRoot);
        }
        zoomRoot.style.display = 'block';

        if (!ZoomMtg.v1) {
           ZoomMtg.setZoomJSLib(`https://source.zoom.us/${sdkVersion}/lib`, '/av');
        }
        
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        console.log("🔑 LiveClassRoom: Fetching Auth Signature...");
        const res = await apiFetch('/api/live/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingNumber: meetingId.toString().replace(/\s|-/g, ''), role })
        });
        const data = await res.json();

        if (!data.ok) throw new Error(data.message || 'Signature failed');
        console.log("✅ LiveClassRoom: Signature Received");

        const leaveUrl = window.location.origin + (role === 1 ? '/admin/live' : '/student/dashboard');
        
        console.log("🛠️ LiveClassRoom: Config for Init:", { leaveUrl });
        
        console.log("🛠️ LiveClassRoom: Config for Init:", { leaveUrl, sdkKey: data.sdkKey });
        
        ZoomMtg.init({
          leaveUrl: leaveUrl,
          sdkKey: data.sdkKey,
          success: (success) => {
            console.log("🚀 LiveClassRoom: SDK Init Success.");
            
            ZoomMtg.i18n.load('en-US');
            ZoomMtg.i18n.reload('en-US');

            const cleanMeetingId = meetingId.toString().replace(/\s|-/g, '');

            const joinConfig = {
              signature: data.signature,
              meetingNumber: cleanMeetingId,
              passWord: passcode,
              userName: userName,
              userEmail: '',
              tk: '',
              success: (res) => {
                console.log("💎 LiveClassRoom: Meeting Joined Successfully!", res);
                if (isMounted.current) {
                  setIsJoined(true);
                  setSdkLoading(false);
                }
              },
              error: (err) => {
                console.error("❌ LiveClassRoom: Join Error:", err);
                if (isMounted.current) {
                   setError(`Join Failed (${err.errorCode}): ${err.errorMessage || 'Access Denied'}`);
                   setSdkLoading(false);
                }
              }
            };
            
            console.log(`📞 LiveClassRoom: Calling Join for ${cleanMeetingId}`);
            if (isMounted.current) setSdkLoading(false);
            ZoomMtg.join(joinConfig);
          },
          error: (err) => {
            console.error("❌ LiveClassRoom: Init Error:", err);
            if (isMounted.current) {
              setError(`Init Failed: ${err.errorMessage || 'Browser unsupported'}`);
              setSdkLoading(false);
            }
          }
        });
      } catch (err) {
        console.error("❌ LiveClassRoom: Catch Error:", err);
        if (isMounted.current) {
          setError(err.message);
          setSdkLoading(false);
        }
      }
    };

    loadZoomAssets();

    return () => {
      isMounted.current = false;
      console.log("🧹 LiveClassRoom: Cleaning up...");
      const zoomRoot = document.getElementById('zmmtg-root');
      if (zoomRoot) {
        zoomRoot.style.display = 'none';
        zoomRoot.innerHTML = ''; 
      }
      document.body.style.overflow = 'auto';
    };
  }, [meetingId, passcode, role, userName]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 z-[9999]">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Live Session Error</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Try Reconnecting
            </button>
            <button 
              onClick={() => navigate(role === 1 ? '/admin/live' : '/student/dashboard')}
              className="w-full py-4 px-6 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all underline"
            >
              Go Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black flex items-center justify-center transition-opacity duration-500 ${isJoined ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ zIndex: 999 }}>
      {sdkLoading && (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Connecting to Live Class</h3>
            <p className="text-slate-400 text-sm animate-pulse">Initializing Zoom Video Engine...</p>
          </div>
        </div>
      )}
      {!isJoined && !sdkLoading && (
         <div className="text-indigo-400 animate-pulse font-medium">
            Starting video session...
         </div>
      )}
      <style>{`
        #zmmtg-root {
          width: 100% !important;
          height: 100% !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 99999999 !important;
          background-color: #000 !important;
          display: block !important;
          overflow: auto !important;
        }
        body {
          overflow: hidden !important;
        }
        .meeting-client {
            height: 100vh;
            width: 100vw;
        }
        #zmmtg-root div {
            z-index: inherit;
        }
      `}</style>
      
      {/* Custom Exit Button Overlay */}
      {isJoined && (
        <div className="fixed top-4 right-4 z-[100000000] opacity-20 hover:opacity-100 transition-opacity">
           <button 
             onClick={() => {
               if (window.confirm("Are you sure you want to leave the live class?")) {
                 window.location.reload();
               }
             }}
             className="p-3 bg-rose-500 text-white rounded-full shadow-xl hover:scale-110 transition-transform"
             title="Leave Class"
           >
             <LogOut size={20} />
           </button>
        </div>
      )}
    </div>
  );
};
