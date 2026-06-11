import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "./utils";
import { spring, duration, easing } from "@/brand/motion";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** When true, the sheet snaps to nearly full-screen — useful for forms. */
  fullHeight?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Apex Outfitters Sheet — iOS-style bottom sheet.
 *
 * Slides up from the bottom with a spring presentation, includes a
 * drag-handle visual cue at the top, and dismisses via the backdrop
 * or the explicit close button. Backdrop drops scrim opacity on
 * open/close for cinematic effect.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  fullHeight,
  children,
  className,
}: SheetProps) {
  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: easing.out }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden
          />
          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring.gentle}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-surface shadow-elevated",
              fullHeight ? "top-[10vh]" : "max-h-[85vh]",
              "flex flex-col",
              className,
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1.5">
              <div className="h-1 w-9 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3 border-b border-border-subtle">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 className="text-base font-semibold tracking-tight text-fg">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg-muted hover:bg-border"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
