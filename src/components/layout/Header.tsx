import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { lightHaptic } from "@/brand/motion";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: ReactNode;
  large?: boolean;
  className?: string;
}

/**
 * Page header — title left, optional subtitle, optional back button,
 * optional action slot right. `large` is the iOS large-title style
 * (used on top-level tabs like Home).
 */
export function Header({ title, subtitle, showBack, actions, large, className }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header
      className={cn(
        "flex items-center gap-3",
        // `pt-4` clears the safe-area + dynamic-island visual mass on
        // top-level tab screens. `pb-5` gives the title room to breathe
        // before the first content card.
        large ? "px-5 pb-5 pt-4" : "px-5 py-3",
        className,
      )}
    >
      {showBack && (
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          onClick={() => {
            void lightHaptic();
            navigate(-1);
          }}
          className="-ml-2 flex size-9 items-center justify-center rounded-full text-fg hover:bg-surface-sunken"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </motion.button>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <h1
            className={cn(
              "tracking-tight text-fg",
              large ? "text-3xl font-bold" : "text-lg font-semibold",
            )}
          >
            {title}
          </h1>
        )}
        {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {actions}
    </header>
  );
}
