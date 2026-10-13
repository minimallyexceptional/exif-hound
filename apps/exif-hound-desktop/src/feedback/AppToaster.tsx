import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export const AppToaster: React.FC = () => {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      visibleToasts={4}
      closeButton
      toastOptions={{ closeButton: true }}
    />
  );
};
