import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { apiFetch } from "../config";
import { Lock, Mail, Eye, EyeOff, Shield } from "lucide-react";

export default function AdminLogin() {
  const [searchParams] = useSearchParams();
  const [loginMode, setLoginMode] = useState("super"); // "super" or "role"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Check if redirected from activation
    if (searchParams.get('activated') === 'true') {
      const activatedEmail = searchParams.get('email');
      if (activatedEmail) {
        setEmail(decodeURIComponent(activatedEmail));
        setLoginMode("role");
      }
      addNotification({
        type: 'success',
        title: 'Account Activated',
        message: 'Your account has been activated. Please login.'
      });
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (loginMode === "super") {
        // Super admin login (password only)
        const res = await apiFetch('/api/admin/login', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        let data = null;
        try {
          data = await res.json();
        } catch {
          const txt = await res.text().catch(() => "");
          const msg = txt || `Server returned status ${res.status}`;
          return setError(msg);
        }

        if (!res.ok) {
          return setError(data?.error || data?.message || `Login failed (${res.status})`);
        }

        if (!data || !data.token) {
          return setError("Login succeeded but server did not return a token");
        }

        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_role", data.role || "super_admin");
        localStorage.setItem("admin_email", data.email || "admin");
        
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome back, Super Admin!'
        });
        
        navigate("/admin");
      } else {
        // Role-based login (email + password)
        if (!email) {
          return setError("Email is required");
        }

        const res = await apiFetch('/api/admin/role-login', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          return setError(data?.error || data?.message || "Login failed");
        }

        if (!data || !data.token) {
          return setError("Login succeeded but server did not return a token");
        }

        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_role", data.role);
        localStorage.setItem("admin_email", data.email);
        localStorage.setItem("admin_permissions", JSON.stringify(data.permissions || []));
        
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back!`
        });
        
        navigate("/admin");
      }
    } catch (err) {
      console.error('Admin login fetch error:', err);
      setError("Could not connect to server. Make sure the backend is running.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d9c06] to-[#0b7e05] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d9c06] to-[#0b7e05] p-8 text-white text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
          <p className="text-green-100">Spark Trainings LMS</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginMode("super")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${
                loginMode === "super"
                  ? "bg-white text-[#0d9c06] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("role")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors cursor-pointer ${
                loginMode === "role"
                  ? "bg-white text-[#0d9c06] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Team Member
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <span className="block text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMode === "role" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={loginMode === "role"}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9c06]"
                  placeholder="Enter your password"
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

            <button
              type="submit"
              className="w-full bg-[#0d9c06] text-white py-3 rounded-lg hover:bg-[#0b7e05] font-medium shadow-sm transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>

          {loginMode === "super" && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Team member?{" "}
              <button
                type="button"
                onClick={() => setLoginMode("role")}
                className="text-[#0d9c06] hover:underline font-medium"
              >
                Click here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
