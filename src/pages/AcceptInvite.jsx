import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiFetch } from "../config";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  async function verifyToken() {
    try {
      const res = await apiFetch(`/api/admin/roles/verify-token/${token}`);
      const data = await res.json();

      if (res.ok && data.ok) {
        setInviteData(data);
      } else {
        setError(data.message || "Invalid or expired invitation");
      }
    } catch (err) {
      console.error("Error verifying token:", err);
      setError("Failed to verify invitation");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch('/api/admin/roles/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        // Show success and redirect to login
        setTimeout(() => {
          navigate('/admin/login?activated=true&email=' + encodeURIComponent(data.email));
        }, 2000);
      } else {
        setError(data.message || "Failed to activate account");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("Failed to activate account");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0d9c06] to-[#0b7e05] flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-[#0d9c06] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/login')}
            className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (submitting && !error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Activated!</h1>
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0d9c06] to-[#0b7e05] flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0d9c06] to-[#0b7e05] p-8 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome to Spark Trainings!</h1>
          <p className="text-green-100">You've been invited as {inviteData?.roleDisplay}</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Email:</strong> {inviteData?.email}
            </p>
            <p className="text-sm text-green-800 mt-1">
              <strong>Role:</strong> {inviteData?.roleDisplay}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {inviteData?.roleDescription}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <span className="block text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0d9c06] text-white py-3 rounded-md hover:bg-[#0b7e05] font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? "Activating..." : "Activate Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <a href="/admin/login" className="text-[#0d9c06] hover:underline font-medium cursor-pointer">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
