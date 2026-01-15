import React, { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  if (!token) {
    return null; // or a loading spinner
  }

  return <Outlet />;
}
