import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribe, getOnlineStatus } from '@/lib/networkStatus';

type NetworkContextType = {
  isOnline: boolean;
};

const NetworkContext = createContext<NetworkContextType>({ isOnline: true });

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(getOnlineStatus);

  useEffect(() => subscribe(setIsOnline), []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
