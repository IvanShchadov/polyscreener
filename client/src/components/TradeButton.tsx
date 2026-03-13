import { ExternalLink } from 'lucide-react';
import { useBuilderCode } from '../contexts/BuilderCodeContext';
import { buildPolymarketUrl } from '../lib/polymarket';

interface TradeButtonProps {
  eventSlug: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function TradeButton({
  eventSlug,
  variant = 'primary',
  size = 'sm',
  label = 'Trade',
  className = '',
}: TradeButtonProps) {
  const builderCode = useBuilderCode();
  const url = buildPolymarketUrl(eventSlug, builderCode);

  const base = 'inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]';

  const variants = {
    primary: 'bg-[#007AFF] text-white hover:bg-[#0071f0] shadow-sm shadow-[#007AFF]/20',
    secondary: 'bg-white/[0.08] text-[#007AFF] ring-1 ring-[#007AFF]/30 hover:bg-[#007AFF]/10',
    ghost: 'text-[#007AFF] hover:bg-[#007AFF]/10',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[13px]',
    lg: 'px-5 py-2.5 text-[14px]',
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
    </a>
  );
}
