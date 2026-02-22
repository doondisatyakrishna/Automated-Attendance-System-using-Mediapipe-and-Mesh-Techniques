import React, { createContext, useState, useContext, useMemo } from 'react';

interface SettingsContextType {
  isSettingsOpen: boolean;
  toggleSettingsModal: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleSettingsModal = () => {
    setIsSettingsOpen(prev => !prev);
  };

  const value = useMemo(() => ({ isSettingsOpen, toggleSettingsModal }), [isSettingsOpen]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};