interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white/[0.05] px-4 py-3 shadow-sm">
      <p className="mb-1.5 text-[11px] font-medium text-white/40">{label}</p>
      <p className="text-[18px] font-semibold leading-none" style={{ color: color || 'rgba(255,255,255,0.85)' }}>
        {value}
      </p>
    </div>
  );
}
