import { Spinner } from "./Spinner";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  children,
  className = "",
  ...props
}) => {
  const base =
    "px-4 py-2 rounded-2xl shadow-lg font-medium inline-flex items-center justify-center";
  const color =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary/90"
      : "bg-secondary text-white hover:bg-secondary/90";

  return (
    <button
      className={`${base} ${color} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
