import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';

// Define the available theme names
type Theme = 'light' | 'ocean' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create the provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check local storage for a saved theme, otherwise default to 'light'
    return (localStorage.getItem('app-theme') as Theme) || 'light';
  });

  // This effect runs whenever the theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the old theme class and add the new one to the <html> element
    root.classList.remove('light', 'ocean', 'dark');
    root.classList.add(theme);

    // Save the user's preference in local storage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to easily use the theme context in any component
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};