import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BuilderCodeProvider } from './contexts/BuilderCodeContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { MarketsPage } from './pages/MarketsPage';
import { MarketDetailPage } from './pages/MarketDetailPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { ArbitragePage } from './pages/ArbitragePage';
import { useAnomalies } from './hooks/useAnomalies';
import { useStats } from './hooks/useStats';
import { useMarkets } from './hooks/useMarkets';

function AppLayout() {
  const { anomalies, isConnected } = useAnomalies();
  const { stats, scanner } = useStats();
  const { markets } = useMarkets();

  return (
    <div className="min-h-screen bg-[#111113] text-white">
      <Header stats={stats} scanner={scanner} isConnected={isConnected} />

      <main className="mx-auto max-w-[1600px] px-4 py-6 pb-24 sm:px-6 sm:pb-6">
        <Routes>
          <Route path="/" element={
            <DashboardPage
              anomalies={anomalies}
              isConnected={isConnected}
              stats={stats}
              scanner={scanner}
              markets={markets}
            />
          } />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/markets/:conditionId" element={<MarketDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/arb" element={<ArbitragePage />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BuilderCodeProvider>
        <AppLayout />
      </BuilderCodeProvider>
    </BrowserRouter>
  );
}
