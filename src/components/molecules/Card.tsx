import type { ReactNode } from "react";
export interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
    {children}
  </div>
);
