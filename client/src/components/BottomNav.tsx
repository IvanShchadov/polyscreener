import { NavLink } from 'react-router-dom';
import { BarChart2, Layers, GitCompare, Wallet } from 'lucide-react';

const NAV = [
  { to: '/',          label: 'Feed',      Icon: BarChart2  },
  { to: '/markets',   label: 'Markets',   Icon: Layers     },
  { to: '/arb',       label: 'Arb',       Icon: GitCompare },
  { to: '/portfolio', label: 'Portfolio', Icon: Wallet     },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#111113]/95 backdrop-blur-xl sm:hidden">
      <div className="flex">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? 'text-[#007AFF]' : 'text-white/35'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
