import { createContext, useContext, useEffect, useState } from 'react';

const ConnectionContext = createContext({ online: true });

export function ConnectionProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ online }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
