// src/components/molecules/PasswordInput.tsx
import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@heroicons/react/outline";
import {
  PASSWORD_REQUIREMENTS,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../../utils/passwordValidation";

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showValidation?: boolean;
  showStrength?: boolean;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordInput({
  label,
  value,
  onChange,
  showValidation = false,
  showStrength = false,
  required = false,
  placeholder = "",
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(value);
  const strengthLabel = getPasswordStrengthLabel(strength);
  const strengthColor = getPasswordStrengthColor(strength);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-slate-800 text-text dark:text-white
                     focus:ring-2 focus:ring-primary focus:border-primary
                     disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text/50 hover:text-text dark:text-white/50 dark:hover:text-white transition"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  strength === 0
                    ? "bg-red-500 w-1/5"
                    : strength === 1
                    ? "bg-orange-500 w-2/5"
                    : strength === 2
                    ? "bg-yellow-500 w-3/5"
                    : strength === 3
                    ? "bg-blue-500 w-4/5"
                    : "bg-green-500 w-full"
                }`}
              />
            </div>
            <span className={`text-xs font-medium ${strengthColor}`}>
              {strengthLabel}
            </span>
          </div>
        </div>
      )}

      {showValidation && value && (
        <div className="space-y-1.5 mt-2">
          {PASSWORD_REQUIREMENTS.map((req) => {
            const isValid = req.validator(value);
            return (
              <div key={req.id} className="flex items-center gap-2 text-xs">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center ${
                    isValid
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {isValid ? "✓" : "○"}
                </div>
                <span
                  className={
                    isValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-text/60 dark:text-white/60"
                  }
                >
                  {req.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
