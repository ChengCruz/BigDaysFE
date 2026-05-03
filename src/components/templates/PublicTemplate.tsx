import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { PublicNavbar } from "../organisms/PublicNavbar";
import { Footer } from "../organisms/Footer";

export default function PublicTemplate({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAF6EF', color: '#2A221E' }}>
      <PublicNavbar />
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
