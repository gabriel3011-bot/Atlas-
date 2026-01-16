import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary'; // Certifique-se que criou este arquivo
//import './index.css'; // Importante para o Tailwind carregar

const rootElement = document.getElementById('root');

if (!rootElement) {
  // Se não achar a div 'root', cria uma mensagem de erro na tela para você ver
  document.body.innerHTML = '<div style="color:white; padding:20px;">ERRO CRÍTICO: Div "root" não encontrada no index.html</div>';
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// O ErrorBoundary aqui impede que erros no App deixem a tela preta
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);