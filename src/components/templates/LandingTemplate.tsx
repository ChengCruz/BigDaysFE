import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

export default function LandingTemplate({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <header className="p-6 text-center">
        <h1 className="text-4xl font-bold text-primary">My Big Day</h1>
      </header>
      <main className="flex-1 container mx-auto px-4">
        {children ?? <Outlet />}
      </main>
      <footer className="p-4 text-center text-sm text-gray-500">
        © 2025 My Big Day
      </footer>
    </div>
  );
}
