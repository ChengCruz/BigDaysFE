// src/components/templates/AuthTemplate.tsx
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

export default function AuthTemplate({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-text">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-background rounded-2xl shadow-lg">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}
