// src/pages/RegisterForm.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/firebaseConfig.js";

import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";

function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(user, {
        displayName: fullName,
      });

      navigate("/"); 
    } catch (err) {
      let msg = "Registration failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f9fa] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl border border-[#e4e5e7] p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#1c1d1f]">
            Create your account
          </h1>
          <p className="text-sm text-[#6a6f73] mt-1 flex items-center justify-center gap-1">
            Feel the spark in you!<Zap size={16} className="fill-amber-400 text-amber-400" />
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            role="alert"
          >
            <span className="block text-sm">{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="floating-group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder=" "
              className="floating-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <label className="floating-label">Full Name</label>
          </div>

          {/* Phone */}
          <div className="floating-group">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              placeholder=" "
              className="floating-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <label className="floating-label">Phone Number</label>
          </div>

          {/* Email */}
          <div className="floating-group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder=" "
              className="floating-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="floating-label">Email Address</label>
          </div>

          {/* Password */}
          <div className="floating-group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              className="floating-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="floating-label">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="floating-group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder=" "
              className="floating-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label className="floating-label">Confirm Password</label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d9c06] hover:bg-[#0b7e05] disabled:opacity-70 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-[#6a6f73]">
          By clicking Sign Up, you agree to our <Link to="/termsandconditions" className="font-semibold text-[#0d9c06] hover:underline">Terms</Link>, <Link to="/privacypolicy" className="font-semibold text-[#0d9c06] hover:underline">Privacy Policy</Link> and <Link to="/cookiespolicy" className="font-semibold text-[#0d9c06] hover:underline">Cookies Policy</Link>.
        </p>
      </div>
    </main>
  );
}

export default RegisterForm;