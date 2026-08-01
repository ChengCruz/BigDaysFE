// src/components/organisms/PlannerShell.tsx
//
// The planner-facing chrome — today's fourteen-item sidebar and navbar, moved
// into a wrapper without behavioural change. This is the default for every role
// except Member, so anyone running other people's events sees exactly what they
// saw before couple mode existed.
//
// If you are changing markup here, you are changing what admins and vendors see.
// Keep it identical to the pre-couple-mode AppLayout unless that is the intent.

import React from "react";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function PlannerShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background dark:bg-slate-950 text-text">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
