import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: ""
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro Crítico Capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-white p-6">
          <div className="bg-[#121212] border border-red-900/50 p-8 rounded-2xl max-w-md text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-serif italic mb-2">Algo deu errado</h2>
            <p className="text-gray-500 text-sm mb-6">O sistema encontrou um erro inesperado.</p>
            <div className="bg-black/50 p-3 rounded text-[10px] font-mono text-red-300 text-left mb-6 overflow-auto max-h-24">
               {this.state.error}
            </div>
            <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition flex items-center gap-2 mx-auto">
              <RefreshCw size={14} /> Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;