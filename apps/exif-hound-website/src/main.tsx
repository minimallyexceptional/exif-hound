import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('*** SIMPLIFIED MAIN.TSX RUNNING ***');

// Render the app directly without any providers for testing
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 