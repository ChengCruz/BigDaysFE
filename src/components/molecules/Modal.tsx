import React, { type ReactNode } from "react";
import { Button } from "../atoms/Button";

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
  onClose,
  children,
  className = "",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-100">
      <div
        className={
          "bg-background text-text rounded-lg shadow-lg max-w-lg w-full p-6 " +
          className
        }
      >
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
