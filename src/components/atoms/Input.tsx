
import React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    ref={ref}
    className="
      w-full
      border
      rounded
      px-3
      py-2
      bg-white dark:bg-gray-700
      text-text dark:text-white
      placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-primary
    "
    {...props}
  />
));

Input.displayName = "Input";
