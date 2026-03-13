import { useEffect } from 'react';
import { Portfolio } from '../components/Portfolio';
import { usePortfolio } from '../hooks/usePortfolio';

const STORAGE_KEY = 'polyscreener_portfolio_address';

export function PortfolioPage() {
  const { address, setAddress, data, loading, error, load } = usePortfolio();

  // Restore address from localStorage and auto-load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && !address) {
      setAddress(saved);
      const addrs = saved.split(',').map((s) => s.trim()).filter(Boolean);
      const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/i;
      const valid = addrs.filter((a) => ADDRESS_RE.test(a));
      if (valid.length > 0) load(valid);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save address to localStorage on change
  useEffect(() => {
    if (address.trim()) {
      localStorage.setItem(STORAGE_KEY, address.trim());
    }
  }, [address]);

  return (
    <Portfolio
      address={address}
      setAddress={setAddress}
      data={data}
      loading={loading}
      error={error}
      load={load}
    />
  );
}
