// src/components/templates/DashboardTemplate.tsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Navbar } from "../organisms/Navbar";
import { Sidebar } from "../organisms/Sidebar";
import { EventSelectorModal } from "../molecules/EventSelectorModal";
import { EventProvider, useEventContext } from "../../context/EventContext";
import { AuthContext } from "../../context/AuthProvider";

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isSelectorOpen, mustChooseEvent } = useEventContext();

  return (
    <div className="flex h-screen bg-background dark:bg-slate-950 text-text">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      {(mustChooseEvent || isSelectorOpen) && <EventSelectorModal />}
    </div>
  );
}

export default function DashboardTemplate() {
  const { user, loading } = useContext(AuthContext);

  // Wait for auth session restore before rendering anything
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background dark:bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated after loading → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated → mount EventProvider (which needs the access token) then render dashboard
  return (
    <EventProvider>
      <DashboardContent />
    </EventProvider>
  );
}
