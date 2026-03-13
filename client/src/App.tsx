import { useState } from 'react';
import { Header } from './components/Header';
import { AnomalyFeed } from './components/AnomalyFeed';
import { Sidebar } from './components/Sidebar';
import { Portfolio } from './components/Portfolio';
import { useAnomalies } from './hooks/useAnomalies';
import { useStats } from './hooks/useStats';
import { useMarkets } from './hooks/useMarkets';

export default function App() {
  const { anomalies, isConnected } = useAnomalies();
  const { stats, scanner } = useStats();
  const { markets } = useMarkets();
  const [page, setPage] = useState<'feed' | 'portfolio'>('feed');

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-[#f1f3f9]">
      <Header
        stats={stats}
        scanner={scanner}
        isConnected={isConnected}
        page={page}
        onPageChange={setPage}
      />

      <main className="mx-auto max-w-[1600px] p-6">
        {page === 'feed' ? (
          <div className="gap-6 lg:grid lg:grid-cols-[1fr_380px]">
            <AnomalyFeed anomalies={anomalies} />
            <Sidebar stats={stats} scanner={scanner} markets={markets} />
          </div>
        ) : (
          <Portfolio />
        )}
      </main>
    </div>
  );
}
