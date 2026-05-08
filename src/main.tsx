import React, {StrictMode, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './lib/ThemeContext.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      let msg = 'Unknown error';
      if (this.state.error) {
        msg = this.state.error.message || String(this.state.error);
      }
      
      // Ignore benign WebSocket/HMR errors and fallback to rendering
      if (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('HMR')) {
         return this.props.children;
      }
      
      return (
        <div className="bg-surface-base text-text-primary h-screen w-screen p-8 font-sans flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
            <span className="text-red-500 text-2xl font-serif">!</span>
          </div>
          <h1 className="text-2xl font-serif italic mb-4">Application Error</h1>
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-6 max-w-sm leading-relaxed">{msg}</p>
          <button onClick={() => { localStorage.clear(); indexedDB.deleteDatabase('PortfolioDB'); window.location.reload(); }} className="bg-red-900/20 text-red-400 border border-red-500/20 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-red-900/40 transition-colors mb-6 outline-none">
             Reset All App Data
          </button>
          {msg.includes('SecurityError') || msg.includes('IDBDatabase') || msg.includes('indexedDB') || msg.includes('Object') ? (
             <div className="bg-red-900/20 border border-red-500/20 p-6 max-w-md">
               <p className="text-red-400 text-[10px] uppercase tracking-widest leading-relaxed mb-4">IndexedDB Access Blocked</p>
               <p className="text-sm opacity-80 mb-6">Your browser is blocking access to local storage in this frame. This application requires local storage to function as a private tracking container.</p>
               <a href={window.location.href} target="_blank" rel="noreferrer" className="inline-block bg-btn-bg text-btn-text px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-accent transition-colors">Open in New Tab</a>
             </div>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
