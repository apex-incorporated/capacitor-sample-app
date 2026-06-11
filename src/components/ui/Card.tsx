import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle";
  /** Render a thin colored stripe across the top — useful for status cards. */
  accent?: "primary" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: "bg-surface border border-border",
  elevated: "bg-surface-elevated border border-border shadow-card",
  subtle: "bg-surface-sunken border border-border-subtle",
} as const;

const accentColors = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", accent, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-2xl", variantStyles[variant], className)}
      {...rest}
    >
      {accent && (
        <div className={cn("absolute inset-x-0 top-0 h-0.5", accentColors[accent])} />
      )}
      {children}
    </div>
  );
});

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-base font-semibold tracking-tight text-fg", className)}>{children}</h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("mt-0.5 text-sm text-fg-muted", className)}>{children}</p>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-border-subtle px-5 py-3", className)}>{children}</div>
  );
}
