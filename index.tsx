import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary'; // Importe aqui

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary> {/* Envolva o App aqui */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);