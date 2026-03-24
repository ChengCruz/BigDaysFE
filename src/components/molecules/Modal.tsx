import React, { type ReactNode } from "react";

export interface ModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  /** optional extra Tailwind classes on the inner panel */
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose: _onClose,
  children,
  className = "",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-100 p-4">
      <div
        className={
          "bg-background text-text rounded-xl shadow-xl max-w-lg w-full max-h-[95vh] flex flex-col overflow-hidden " +
          className
        }
      >
        {title && (
          <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/10">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
