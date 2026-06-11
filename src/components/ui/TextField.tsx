import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  monospace?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, iconLeft, iconRight, monospace, className, id, ...rest },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-fg-muted"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">
            {iconLeft}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-xl border bg-surface text-sm text-fg",
            "placeholder:text-fg-subtle",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors",
            error ? "border-danger" : "border-border",
            iconLeft ? "pl-9" : "pl-3.5",
            iconRight ? "pr-9" : "pr-3.5",
            "h-11", // 44px iOS-friendly tap target
            monospace && "font-mono",
            className,
          )}
          {...rest}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle">{iconRight}</div>
        )}
      </div>
      {error ? (
        <p className="text-[11px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
});
