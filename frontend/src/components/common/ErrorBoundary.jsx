/**
 * Enterprise Error Boundary
 * Comprehensive error handling with user-friendly fallbacks
 */

import React, { Component, Suspense } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../../design-system/ComponentLibrary';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: Date.now(),
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Implement error tracking service integration
    // Example: Sentry, LogRocket, etc.
    try {
      // const errorData = {
      //   message: error.message,
      //   stack: error.stack,
      //   componentStack: errorInfo.componentStack,
      //   errorId: this.state.errorId,
      //   timestamp: new Date().toISOString(),
      //   userAgent: navigator.userAgent,
      //   url: window.location.href,
      // };
      // errorTrackingService.captureException(errorData);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const { fallback: Fallback, showDetails = false } = this.props;

      if (Fallback) {
        return <Fallback error={error} retry={this.handleRetry} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-error-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-error-500" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-white mb-4">
                Oops! Something went wrong
              </h1>

              {/* Error Description */}
              <p className="text-slate-400 text-lg mb-6">
                We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
              </p>

              {/* Error ID for Support */}
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400 mb-2">Error ID for Support:</p>
                <code className="text-slate-300 font-mono text-sm">{errorId}</code>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  icon={<Home className="w-4 h-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="ghost"
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Reload Page
                </Button>
              </div>

              {/* Technical Details (Development Only) */}
              {showDetails && process.env.NODE_ENV === 'development' && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-slate-400 hover:text-white mb-4">
                    <Bug className="w-4 h-4 inline mr-2" />
                    Technical Details (Development)
                  </summary>
                  <div className="bg-slate-900/50 rounded-lg p-4 overflow-auto max-h-64">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {error?.stack}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for error boundaries
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Error Fallback Component
export const ErrorFallback = ({ error, retry }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 text-center">
        <div className="w-16 h-16 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-error-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-400 mb-6">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <Button
          onClick={retry}
          variant="primary"
          icon={<RefreshCw className="w-4 h-4" />}
          fullWidth
        >
          Try Again
        </Button>
      </div>
    </div>
  </div>
);

export default ErrorBoundary;