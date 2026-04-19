interface StatPillProps {
  label: string;
  value: string;
  sub?: string;
}

export function StatPill({ label, value, sub }: StatPillProps) {
  return (
    <div className="apex-card flex-1">
      <div className="apex-label">{label}</div>
      <div className="mt-1 font-mono text-lg font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-apex-muted">{sub}</div>}
    </div>
  );
}
