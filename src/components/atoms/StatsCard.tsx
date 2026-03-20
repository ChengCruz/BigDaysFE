// src/components/atoms/StatsCard.tsx
import React from "react";

export interface StatsCardProps {
  label: string;
  value: number | string;
  variant?: "primary" | "secondary" | "accent" | "success" | "warning";
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  variant = "primary",
  icon,
  size = "md",
}) => {
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

  const padding = size === "sm" ? "p-2.5" : "p-4";
  const valueSize = size === "sm" ? "text-lg font-bold" : "text-2xl font-bold";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className={`${padding} rounded-xl border ${colorClasses[variant]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between gap-2">
        {/* Left: icon + label */}
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <div className={`${iconSize} ${valueColorClasses[variant]} opacity-80 flex-shrink-0`}>
              {icon}
            </div>
          )}
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
            {label}
          </p>
        </div>
        {/* Right: value */}
        <p className={`${valueSize} ${valueColorClasses[variant]} flex-shrink-0`}>
          {value}
        </p>
      </div>
    </div>
  );
};
