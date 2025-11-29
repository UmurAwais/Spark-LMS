import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "../config";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch('/api/admin/login', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      // attempt to parse JSON safely
      let data = null;
      try {
        data = await res.json();
      } catch {
        // if response isn't JSON, read text for debugging
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
      navigate("/admin");
    } catch (err) {
      console.error('Admin login fetch error:', err);
      setError("Could not connect to server. Make sure the backend is running.");
    }
  }

  return (
    <div className="max-w-xl mx-auto py-20">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm mb-2">Password</label>
          <input
            className="input-field w-full mb-3"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button className="bg-[#0d9c06] text-white px-4 py-2 rounded">Sign in</button>
        </form>
      </div>
    </div>
  );
}
