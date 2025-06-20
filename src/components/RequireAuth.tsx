// src/components/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../api/hooks/useAuth";

export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }
  if (!user) {
    // redirect to login, save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
