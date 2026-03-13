interface DistroBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

export function DistroBar({ label, value, max, color }: DistroBarProps) {
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[12px] text-white/50">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono text-[12px] text-white/40">
        {value}
      </span>
    </div>
  );
}
