import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-navy-900 border border-white/5 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-4">An unexpected error occurred while rendering this page.</p>
            <details className="text-xs text-gray-400 whitespace-pre-wrap mb-4">
              {this.state.error && this.state.error.toString()}
              {this.state.info && this.state.info.componentStack}
            </details>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
              <button onClick={() => this.setState({ hasError: false, error: null, info: null })} className="btn-outline">Dismiss</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
