// src/utils/passwordValidation.ts

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "minLength",
    label: "At least 8 characters",
    validator: (password: string) => password.length >= 8,
  },
  {
    id: "hasUppercase",
    label: "At least 1 uppercase letter (A-Z)",
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "hasLowercase",
    label: "At least 1 lowercase letter (a-z)",
    validator: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "hasNumber",
    label: "At least 1 number (0-9)",
    validator: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "hasSymbol",
    label: "At least 1 symbol (!@#$%^&* etc.)",
    validator: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
];

/**
 * Validates password against all requirements
 * @param password - Password string to validate
 * @returns PasswordValidationResult with validation status
 */
export function validatePassword(password: string): PasswordValidationResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  const errors: string[] = [];

  if (!checks.minLength) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!checks.hasUppercase) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!checks.hasLowercase) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!checks.hasNumber) {
    errors.push("Password must contain at least one number");
  }
  if (!checks.hasSymbol) {
    errors.push("Password must contain at least one symbol");
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
}

/**
 * Get password strength level (0-4)
 * @param password - Password string to evaluate
 * @returns Strength level: 0 (very weak) to 4 (strong)
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(strength, 4);
}

/**
 * Get password strength label
 * @param strength - Strength level (0-4)
 * @returns Human-readable label
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  return labels[strength] || "Very Weak";
}

/**
 * Get password strength color for UI
 * @param strength - Strength level (0-4)
 * @returns Tailwind color class
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-blue-500",
    "text-green-500",
  ];
  return colors[strength] || "text-gray-500";
}
