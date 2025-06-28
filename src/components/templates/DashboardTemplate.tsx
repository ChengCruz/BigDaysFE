import { Outlet } from "react-router-dom";
import { Navbar } from "../organisms/Navbar";
import { Sidebar } from "../organisms/Sidebar";
import type { ReactNode } from "react";
export default function DashboardTemplate({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-text">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
