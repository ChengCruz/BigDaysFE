import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { PublicNavbar } from "../organisms/PublicNavbar";
import { Footer } from "../organisms/Footer";

export default function PublicTemplate({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 w-full">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
