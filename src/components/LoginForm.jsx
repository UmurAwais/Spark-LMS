import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig.js';
import { Link } from 'react-router-dom';
import { apiFetch } from '../config';

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate session ID
      const sessionId = Date.now().toString() + Math.random().toString(36).substring(2);
      
      // Save to server
      await apiFetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, sessionId })
      });

      // Save to local storage
      localStorage.setItem(`session_${user.uid}`, sessionId);

      navigate('/student/dashboard');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-md p-10 border border-gray-200">

        <h2 className="text-3xl font-bold text-center text-gray-900">Welcome Back</h2>
        <p className="text-center text-gray-500 mt-2">
          Sign in to continue to your Spark dashboard.
        </p>
        
        {error && <div className="text-red-500 text-center mt-4">{error}</div>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">

          {/* Email Input */}
          <div className="spark-input-group">
            <input
              type="email"
              placeholder=" "
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail className="spark-input-icon" />
            <label className="floating-label">Email Address</label>
          </div>

          {/* Password Input */}
          <div className="spark-input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className="spark-input-icon" />
            <label className="floating-label">Password</label>

            {/* Show / Hide Password */}
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 z-20 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" />
              Remember me
            </label>

            <button
              type="button"
              className="text-green-600 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="spark-submit-btn cursor-pointer"
          >
            Log In
          </button>

          <p className="text-center text-gray-600">
            Don’t have an account?{" "}
            <Link to="/register" className="text-green-600 font-semibold hover:underline cursor-pointer">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;