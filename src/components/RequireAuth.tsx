// src/components/RequireAuth.tsx
import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../api/hooks/useAuth";
import { PageLoader } from "./atoms/PageLoader";
import { isDemoActive } from "../demo";

export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }
  // Demo mode lets a signed-out visitor reach these routes with a sample event.
  // isDemoActive() is false whenever a real token exists, so this can never
  // weaken the guard for an actual user. See src/demo/README.md.
  if (!user && !isDemoActive()) {
    // redirect to login, save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
