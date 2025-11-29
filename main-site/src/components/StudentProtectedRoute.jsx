import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { apiFetch } from "../config";
import { Sparkles } from "lucide-react";

export default function StudentProtectedRoute() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in, now verify session
        const sessionId = localStorage.getItem(`session_${currentUser.uid}`);
        
        if (!sessionId) {
           // No session ID found locally, but user is logged in. 
           // This shouldn't happen if they logged in via our LoginPage.
           // Force logout.
           console.warn("No local session found, forcing logout");
           await handleLogout("No session found. Please log in again.");
           return;
        }

        try {
          const res = await apiFetch('/api/auth/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: currentUser.uid, sessionId })
          });
          const data = await res.json();

          if (data.ok && data.valid) {
            setUser(currentUser);
          } else {
            console.warn("Session invalid:", data.message);
            await handleLogout("You have been logged out because you logged in on another device.");
            return;
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          // If server is down, maybe allow? Or block?
          // Let's block to be safe.
          await handleLogout("Session verification failed. Please try again.");
          return;
        }

      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async (message) => {
    await signOut(auth);
    if (message) alert(message);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#0d9c06] mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0d9c06] animate-pulse" size={32} />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Verifying session...</p>
        </div>
      </div>
    );
  }

  return <Outlet context={{ user }} />;
}
