import { useCallback, useEffect, useState } from "react";
import { Apex } from "@/apex";
import type { QueueStatus } from "@apex-inc/capacitor-plugin";

/**
 * Polls `Apex.getQueueSize()` every second so the Home screen can show
 * a live offline-queue count. Cheap — the native call reads a local
 * counter, no network activity.
 */
export function useQueueStatus(pollMs = 1000): {
  status: QueueStatus | null;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<QueueStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await Apex.getQueueSize();
      setStatus(res);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { status, refresh };
}
