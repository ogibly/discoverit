import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import UnifiedApp from './UnifiedApp.jsx';
import './index.css';

// Cache bust: 2024-01-15-v3 - Unified Design System
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UnifiedApp />
    </BrowserRouter>
  </React.StrictMode>
);
