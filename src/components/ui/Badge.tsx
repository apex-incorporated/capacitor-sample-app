import { type ReactNode } from "react";
import { cn } from "./utils";

interface BadgeProps {
  variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  neutral: "bg-surface-sunken text-fg-muted border-border",
  primary: "bg-primary-soft text-primary border-primary/30",
  success: "bg-primary-soft text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-info/10 text-info border-info/30",
} as const;

const sizeStyles = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-[11px] px-2 py-0.5",
} as const;

export function Badge({ variant = "neutral", size = "sm", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
