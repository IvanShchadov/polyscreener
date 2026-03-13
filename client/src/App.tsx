import { Header } from './components/Header';
import { AnomalyFeed } from './components/AnomalyFeed';
import { Sidebar } from './components/Sidebar';
import { useAnomalies } from './hooks/useAnomalies';
import { useStats } from './hooks/useStats';
import { useMarkets } from './hooks/useMarkets';

export default function App() {
  const { anomalies, allAnomalies, isConnected } = useAnomalies();
  const { stats, scanner } = useStats();
  const { markets } = useMarkets();

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-[#f1f3f9]">
      <Header stats={stats} scanner={scanner} isConnected={isConnected} />

      <main className="mx-auto max-w-[1600px] gap-6 p-6 lg:grid lg:grid-cols-[1fr_380px]">
        <AnomalyFeed anomalies={anomalies} allAnomalies={allAnomalies} />
        <Sidebar stats={stats} scanner={scanner} markets={markets} />
      </main>
    </div>
  );
}
