// src/components/atoms/StatsCard.tsx
import React from "react";

export interface StatsCardProps {
  label: string;
  value: number | string;
  variant?: "primary" | "secondary" | "accent" | "success" | "warning";
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  variant = "primary",
  icon,
}) => {
  // Map variant to color classes using project's color system
  const colorClasses = {
    primary: "text-primary bg-primary/5 border-primary/20",
    secondary: "text-secondary bg-secondary/5 border-secondary/20",
    accent: "text-button bg-button/5 border-button/20",
    success: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-700/30",
    warning: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-700/30",
  };

  const valueColorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-button",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      className={`p-4 rounded-xl border ${colorClasses[variant]} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-2xl font-bold ${valueColorClasses[variant]}`}>
            {value}
          </p>
        </div>
        {icon && (
          <div className={`ml-3 ${valueColorClasses[variant]} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
