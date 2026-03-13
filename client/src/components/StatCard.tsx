interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#12141c] p-3">
      <p className="mb-1 text-[11px] text-[#6b7394] uppercase tracking-wider">
        {label}
      </p>
      <p
        className="font-mono text-lg font-bold"
        style={{ color: color || '#f1f3f9' }}
      >
        {value}
      </p>
    </div>
  );
}
