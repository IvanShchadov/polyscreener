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
      <span className="w-24 shrink-0 text-xs text-[#b0b8cf]">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#1a1d28]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-xs text-[#6b7394]">
        {value}
      </span>
    </div>
  );
}
