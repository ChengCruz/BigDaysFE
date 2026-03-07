// src/components/pages/Auth/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FormField } from "../../molecules/FormField";
import { PasswordInput } from "../../molecules/PasswordInput";
import { Button } from "../../atoms/Button";
import { validatePassword } from "../../../utils/passwordValidation";

export default function RegisterPage() {
  const nav = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePassword(formData.password);
    if (!validation.isValid) {
      setError("Password does not meet security requirements:\n" + validation.errors.join("\n"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement registration API call when backend is ready
      // Example:
      // await registerUser({
      //   name: formData.name,
      //   email: formData.email,
      //   password: formData.password,
      // });

      // For now, show a message
      alert("Registration is not yet implemented. Backend API required.");

      // After successful registration, redirect to login
      // nav("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-background text-text space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Create Account</h2>
        <p className="text-sm text-muted">
          Sign up to start planning your big day
        </p>
      </div>

      <FormField
        label="Full Name"
        type="text"
        value={formData.name}
        onChange={handleChange("name")}
        placeholder="John Doe"
        required
        autoComplete="name"
      />

      <FormField
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange("email")}
        placeholder="you@example.com"
        required
        autoComplete="email"
      />

      <PasswordInput
        label="Password"
        value={formData.password}
        onChange={handleChange("password")}
        showValidation={true}
        showStrength={true}
        required
        placeholder="Create a strong password"
        autoComplete="new-password"
      />

      <PasswordInput
        label="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleChange("confirmPassword")}
        showValidation={false}
        showStrength={false}
        required
        placeholder="Re-enter your password"
        autoComplete="new-password"
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
            {error}
          </p>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Creating Account…" : "Create Account"}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted">Already have an account? </span>
        <Link
          to="/login"
          className="text-primary hover:underline font-medium"
        >
          Sign In
        </Link>
      </div>
    </form>
  );
}
