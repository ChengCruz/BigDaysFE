// src/components/templates/DashboardTemplate.tsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../organisms/Navbar";
import { Sidebar } from "../organisms/Sidebar";

export default function DashboardTemplate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-text">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
