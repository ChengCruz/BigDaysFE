// src/components/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../api/hooks/useAuth";
import { PageLoader } from "./atoms/PageLoader";

export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }
  if (!user) {
    // redirect to login, save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
