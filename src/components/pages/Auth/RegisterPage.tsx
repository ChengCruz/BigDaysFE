// src/components/pages/Auth/RegisterPage.tsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "../../molecules/FormField";
import { PasswordInput } from "../../molecules/PasswordInput";
import { Button } from "../../atoms/Button";
import { validatePassword } from "../../../utils/passwordValidation";
import { useAuthApi } from "../../../api/hooks/useAuthApi";
import { AuthContext } from "../../../context/AuthProvider";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthApi();
  const { login, loading: authLoading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);

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

    try {
      await register.mutateAsync({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
      });
      await login({
        email: formData.email,
        password: formData.password,
      });
      toast.success("Welcome to MyBigDays! Let's set up your first event.");
      navigate("/app/events");
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("email_taken");
      } else {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      }
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
        label="Name"
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
          {error === "email_taken" ? (
            <p className="text-red-600 dark:text-red-400 text-sm">
              An account with this email already exists.{" "}
              <Link to="/login" className="underline font-medium">
                Sign in instead?
              </Link>
            </p>
          ) : (
            <p className="text-red-600 dark:text-red-400 text-sm whitespace-pre-line">
              {error}
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={register.isPending || authLoading}
        className="w-full"
      >
        {authLoading ? "Signing in…" : register.isPending ? "Creating Account…" : "Create Account"}
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
