import React from "react";

interface Props {
  icon: string;
  message: string;
}

export const FloorToast: React.FC<Props> = ({ icon, message }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-800 dark:bg-slate-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slide-up text-sm">
      <span className="text-base">{icon}</span>
      <span>{message}</span>
    </div>
  );
};
