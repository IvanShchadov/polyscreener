interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.07]">
      <p className="mb-1.5 text-[11px] font-medium text-white/40">{label}</p>
      <p className="font-mono text-[18px] font-semibold leading-none" style={{ color: color || 'white' }}>
        {value}
      </p>
    </div>
  );
}
