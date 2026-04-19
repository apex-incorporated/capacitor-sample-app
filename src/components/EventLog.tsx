import { useEffect, useState } from "react";
import { subscribeLog, type LogEntry } from "@/apex";

/**
 * Tails the in-app log so you can see, on the device itself, every
 * Apex call the sample made. Useful when you don't have Safari Web
 * Inspector / Chrome DevTools handy — or when you want to screen-record
 * a demo without cutting to DevTools.
 */
export function EventLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeLog(setEntries);
    return () => {
      unsubscribe();
    };
  }, []);

  if (entries.length === 0) {
    return (
      <div className="apex-card text-[11px] text-apex-muted">
        No events yet — interact with the sample and they&apos;ll show up
        here.
      </div>
    );
  }

  return (
    <div className="apex-card p-0">
      <ul className="divide-y divide-black/5">
        {entries.map((e) => (
          <li key={e.id} className="px-4 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={[
                  "font-mono text-[10px] uppercase tracking-wide",
                  e.kind === "event"
                    ? "text-emerald-600"
                    : e.kind === "error"
                      ? "text-red-600"
                      : "text-apex-muted",
                ].join(" ")}
              >
                {e.kind}
              </span>
              <span className="text-[10px] text-apex-muted">
                {new Date(e.at).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-0.5 text-sm">{e.message}</div>
            {e.data && (
              <pre className="mt-1 overflow-x-auto rounded bg-black/5 px-2 py-1 text-[10px] text-apex-ink">
                {JSON.stringify(e.data, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
