import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Map Error:', error);
    console.error('Error Info:', errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex items-center justify-center bg-app-background">
          <div className="glass-panel rounded-lg p-8 max-w-md mx-auto text-center">
            <AlertTriangle className="w-12 h-12 text-app-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-app-white mb-3">
              Map Display Error
            </h3>
            <p className="text-app-accent-dim mb-6">
              There was an error displaying the map. Please try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-app-accent text-app-white rounded-lg hover:bg-app-accent/90 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 