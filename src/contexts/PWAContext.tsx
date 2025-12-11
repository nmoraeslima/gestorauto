import React, { createContext, useContext, ReactNode } from 'react';
import { usePWA } from '@/hooks/usePWA';

interface PWAContextType {
    updateAvailable: boolean;
    needRefresh: boolean; // Legacy alias
    handleUpdate: () => Promise<void>;
    updateServiceWorker: () => Promise<void>; // Legacy alias
    releaseNote: any;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const pwaState = usePWA();

    return (
        <PWAContext.Provider value={pwaState}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWAContext = () => {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWAContext must be used within a PWAProvider');
    }
    return context;
};
