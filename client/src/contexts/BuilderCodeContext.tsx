import { createContext, useContext, useEffect, useState } from 'react';

const BuilderCodeContext = createContext('');

export function BuilderCodeProvider({ children }: { children: React.ReactNode }) {
  const [builderCode, setBuilderCode] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg: { builderCode?: string }) => {
        if (cfg.builderCode) setBuilderCode(cfg.builderCode);
      })
      .catch(() => {});
  }, []);

  return (
    <BuilderCodeContext.Provider value={builderCode}>
      {children}
    </BuilderCodeContext.Provider>
  );
}

export function useBuilderCode(): string {
  return useContext(BuilderCodeContext);
}
