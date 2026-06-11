import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "./utils";
import { lightHaptic, mediumHaptic } from "@/brand/motion";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Disables the haptic. Defaults to `light` for ghost/secondary, `medium` for primary/destructive. */
  haptic?: "none" | "light" | "medium";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-on-accent hover:bg-primary-hover active:bg-primary-active disabled:bg-fg-subtle disabled:cursor-not-allowed",
  secondary:
    "bg-surface text-fg border border-border hover:bg-surface-sunken active:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-fg hover:bg-surface-sunken active:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed",
  destructive:
    "bg-danger text-on-accent hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
};

/**
 * Apex Outfitters Button — the system's primary tap target.
 *
 * - Springs slightly on press via Framer Motion's `whileTap`.
 * - Fires a haptic on tap (light/medium depending on variant).
 * - Loading state replaces children with a spinner.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    loading,
    iconLeft,
    iconRight,
    haptic,
    onClick,
    children,
    className,
    disabled,
    type,
    ...rest
  },
  ref,
) {
  const hapticMode =
    haptic ?? (variant === "primary" || variant === "destructive" ? "medium" : "light");

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    if (hapticMode === "medium") void mediumHaptic();
    else if (hapticMode === "light") void lightHaptic();
    await onClick?.(e);
  };

  return (
    <motion.button
      ref={ref}
      type={type ?? "button"}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...(rest as Omit<typeof rest, "onAnimationStart" | "onAnimationEnd" | "onDragStart" | "onDragEnd" | "onDrag">)}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </motion.button>
  );
});
