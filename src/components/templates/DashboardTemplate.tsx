// src/components/templates/DashboardTemplate.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../organisms/Navbar";
import { Sidebar } from "../organisms/Sidebar";
import { EventSelectorModal } from "../molecules/EventSelectorModal";
import { useEventContext } from "../../context/EventContext";

export default function DashboardTemplate() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { isSelectorOpen } = useEventContext();

  return (
    <div className="flex h-screen bg-background text-text">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1">
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
     {isSelectorOpen && <EventSelectorModal />}
    </div>
  );
}
