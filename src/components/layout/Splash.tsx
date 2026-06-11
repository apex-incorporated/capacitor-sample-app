import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import appIcon from "@/brand/assets/app-icon.svg";

interface SplashProps {
  /** Min visible time so the splash doesn't flash. */
  minMs?: number;
  /** Fires when the splash completes its animation. */
  onComplete?: () => void;
}

/**
 * Branded splash — icon + wordmark on the brand black background.
 * Lives for at least `minMs` then fades out via the consumer's
 * `onComplete` handler. Designed to mirror the iOS launch-screen
 * feeling, with a subtle scale-in for the icon.
 */
export function Splash({ minMs = 800, onComplete }: SplashProps) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  useEffect(() => {
    if (done) onComplete?.();
  }, [done, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#0A0F14" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="size-28 overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(0,158,95,0.35)]"
      >
        <img src={appIcon} alt="" className="size-full" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="mt-6 text-center"
      >
        <div className="text-xl font-semibold tracking-tight text-white">Apex Outfitters</div>
        <div className="mt-1 text-xs text-white/50">
          Built on Apex. Every event you see here is real.
        </div>
      </motion.div>
    </div>
  );
}
