// src/components/atoms/Dropdown.tsx
import React, { useState, useRef, useEffect, ReactNode } from "react";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export interface DropdownItemProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown when an item is clicked
  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  // Clone children and inject the close handler
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === DropdownItem) {
      return React.cloneElement(child as React.ReactElement<DropdownItemProps>, {
        onClick: () => handleItemClick(child.props.onClick),
      });
    }
    return child;
  });

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white dark:bg-accent border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">{childrenWithProps}</div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem: React.FC<DropdownItemProps> = ({
  onClick,
  children,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary/10 dark:hover:bg-white/10 transition-colors ${className}`}
    >
      {children}
    </button>
  );
};
