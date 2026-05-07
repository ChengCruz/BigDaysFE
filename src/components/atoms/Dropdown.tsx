// src/components/atoms/Dropdown.tsx
import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 224; // w-56
    // Align right edge of menu to right edge of trigger; flip left if it would clip
    let left = rect.right - menuWidth;
    if (left < 8) left = rect.left;
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left,
      width: menuWidth,
      zIndex: 9999,
    });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // Close on scroll so the menu doesn't drift from its trigger
    const handleScroll = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  // Clone children and inject close-on-click
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement<DropdownItemProps>(child) && child.type === DropdownItem) {
      return React.cloneElement(child, {
        onClick: () => {
          child.props.onClick();
          setIsOpen(false);
        },
      });
    }
    return child;
  });

  return (
    <div className={`relative inline-block ${className}`} ref={triggerRef}>
      <div onClick={() => (isOpen ? setIsOpen(false) : openDropdown())} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="rounded-xl shadow-lg bg-white dark:bg-accent border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="py-1">{childrenWithProps}</div>
          </div>,
          document.body
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
