import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ExifErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('EXIF panel error:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-6 bg-app-gray">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-app-accent mx-auto mb-3" />
            <h3 className="text-lg font-medium text-app-white mb-2">EXIF panel error</h3>
            <p className="text-sm text-app-accent-dim mb-4">
              Something went wrong while showing metadata for this item.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-app-accent text-app-white rounded-lg hover:bg-app-accent/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
