import { useCallback, useEffect, useState } from "react";
import { Apex } from "@/apex";

/**
 * Reads + updates the plugin-managed visitor ID. The ID is set once at
 * initialise time and persists across relaunches; the sample app
 * exposes a `setVisitorId` button on Settings so you can simulate a
 * login flow.
 */
export function useVisitorId(): {
  visitorId: string | null;
  refresh: () => Promise<void>;
  setVisitorId: (id: string) => Promise<void>;
} {
  const [visitorId, setVid] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await Apex.getVisitorId();
      setVid(res.visitorId);
    } catch {
      setVid(null);
    }
  }, []);

  const setVisitorId = useCallback(
    async (id: string) => {
      await Apex.setVisitorId({ visitorId: id });
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { visitorId, refresh, setVisitorId };
}
