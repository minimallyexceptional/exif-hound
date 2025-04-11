import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Force the default theme to be dark from the very beginning
// This ensures it's set before any React code runs
if (typeof document !== 'undefined') {
  // Only set if there's no existing theme preference
  if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
  }
  
  // Apply the theme to document
  const savedTheme = localStorage.getItem('theme') as Theme;
  document.documentElement.setAttribute('data-theme', savedTheme || 'dark');
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we have a saved theme in localStorage
    const savedTheme = localStorage.getItem('theme');
    // If there's no saved theme, always default to dark
    if (!savedTheme) {
      // Ensure we set localStorage right away
      localStorage.setItem('theme', 'dark');
      // And apply to document
      document.documentElement.setAttribute('data-theme', 'dark');
      return 'dark';
    }
    return savedTheme as Theme;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}