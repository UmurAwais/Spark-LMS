import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Video, Play, StopCircle, Settings, Shield, Info, Link as LinkIcon, Users } from 'lucide-react';
import { apiFetch } from '../config';

export default function AdminLiveClass() {
  const [liveInfo, setLiveInfo] = useState({
    isActive: false,
    meetingId: '',
    passcode: '',
    topic: 'Live Learning Session'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchLiveStatus();
  }, []);

  async function fetchLiveStatus() {
    try {
      const res = await apiFetch('/api/live/status', { credentials: 'include' });
      const data = await res.json();
      if (data.ok && data.liveClass) {
        setLiveInfo({
          isActive: data.liveClass.isActive,
          meetingId: data.liveClass.meetingId || '',
          passcode: data.liveClass.passcode || '',
          topic: data.liveClass.topic || 'Live Learning Session'
        });
      }
    } catch (err) {
      console.error("Error fetching live status:", err);
      // If we get the JSON error here, it means the server doesn't even have the routes yet
      if (err.message.includes('JSON')) {
         console.warn("⚠️ Backend routes not detected. Make sure you restarted your backend server.");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleToggleLive = async (newState) => {
    if (newState && (!liveInfo.meetingId || !liveInfo.passcode)) {
      setMessage({ type: 'error', text: 'Please enter Meeting ID and Passcode' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('admin_token');
      console.log("📤 Sending Live Toggle Request. Token:", token ? (token.substring(0, 5) + "...") : "MISSING");
      
      const res = await apiFetch('/api/admin/live/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        credentials: 'include',
        body: JSON.stringify({
          isActive: newState,
          meetingId: liveInfo.meetingId,
          passcode: liveInfo.passcode,
          topic: liveInfo.topic
        })
      });

      const data = await res.json();
      if (data.ok) {
        setLiveInfo(prev => ({ ...prev, isActive: newState }));
        setMessage({ 
          type: 'success', 
          text: newState ? '🔴 Live Session Started! Students have been notified.' : 'Session Ended successfully.' 
        });
      } else {
        throw new Error(data.message || data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error("Handle toggle error:", err);
      // If it's the JSON.parse error, show something more helpful
      if (err.message.includes('JSON')) {
        setMessage({ type: 'error', text: 'Server Error: Unexpected response format. Check if backend is running correctly.' });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#0d9c06] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${liveInfo.isActive ? 'bg-rose-500 animate-pulse' : 'bg-[#0d9c06]'} text-white`}>
                <Video size={24} />
              </div>
              Live Class Management
            </h1>
            <p className="text-gray-500 mt-1">Setup and broadcast your Zoom meetings directly to students.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {liveInfo.isActive ? (
              <button
                onClick={() => handleToggleLive(false)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200 cursor-pointer disabled:opacity-50"
              >
                <StopCircle size={20} />
                Stop Broadcast
              </button>
            ) : (
              <button
                onClick={() => handleToggleLive(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#0d9c06] hover:bg-[#0b7e05] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#0d9c06]/20 cursor-pointer disabled:opacity-50"
              >
                <Play size={20} />
                Go Live Now
              </button>
            )}
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <Info size={18} />
            <span className="font-bold text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Config */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings size={20} className="text-[#0d9c06]" />
                Meeting Configuration
              </h3>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Class Topic / Title</label>
                  <input 
                    type="text"
                    value={liveInfo.topic}
                    onChange={(e) => setLiveInfo({...liveInfo, topic: e.target.value})}
                    placeholder="e.g. Advanced JavaScript Masterclass"
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#0d9c06] outline-none transition-all font-bold text-gray-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Shield size={14} className="text-[#0d9c06]" /> Zoom Meeting ID
                    </label>
                    <input 
                      type="text"
                      value={liveInfo.meetingId}
                      onChange={(e) => setLiveInfo({...liveInfo, meetingId: e.target.value})}
                      placeholder="123 4567 8901"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#0d9c06] outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <LinkIcon size={14} className="text-[#0d9c06]" /> Meeting Passcode
                    </label>
                    <input 
                      type="text"
                      value={liveInfo.passcode}
                      onChange={(e) => setLiveInfo({...liveInfo, passcode: e.target.value})}
                      placeholder="Passcode123"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#0d9c06] outline-none transition-all font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview / Status Info */}
            <div className="bg-[#1c1d1f] rounded-3xl p-8 text-white relative overflow-hidden group">
               <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${liveInfo.isActive ? 'bg-rose-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Status System</span>
                    </div>
                    <h4 className="text-xl font-bold italic">{liveInfo.isActive ? 'Broadcasting to Students' : 'System Currently Offline'}</h4>
                    <p className="text-xs text-gray-500 max-w-sm">When active, all logged-in students will see a "Join Live" button on their dashboards instantly.</p>
                  </div>
                  <div className="hidden sm:block">
                     <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                        <Users size={24} className="mx-auto text-[#0d9c06] mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Sync</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm border-l-4 border-l-[#0d9c06]">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={16} className="text-[#0d9c06]" />
                How to start?
              </h4>
              <ul className="space-y-4 text-xs font-bold text-gray-500">
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-[#0d9c06]/10 text-[#0d9c06] rounded-full flex items-center justify-center shrink-0">1</span>
                  Create a meeting in your Zoom App as usual.
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-[#0d9c06]/10 text-[#0d9c06] rounded-full flex items-center justify-center shrink-0">2</span>
                  Copy the Meeting ID and Passcode here.
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-[#0d9c06]/10 text-[#0d9c06] rounded-full flex items-center justify-center shrink-0">3</span>
                  Click "Go Live Now" to broadcast.
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-[#0d9c06]/10 text-[#0d9c06] rounded-full flex items-center justify-center shrink-0">4</span>
                  Students will join your meeting built-in to Spark LMS.
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Technical Note</p>
               <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                 We use the Zoom Meeting SDK for a seamless built-in experience. No redirecting to Zoom.com is required.
               </p>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
