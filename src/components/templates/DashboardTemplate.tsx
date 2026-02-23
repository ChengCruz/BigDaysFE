// src/components/templates/DashboardTemplate.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../organisms/Navbar";
import { Sidebar } from "../organisms/Sidebar";
import { EventSelectorModal } from "../molecules/EventSelectorModal";
import { useEventContext } from "../../context/EventContext";

export default function DashboardTemplate() {
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
