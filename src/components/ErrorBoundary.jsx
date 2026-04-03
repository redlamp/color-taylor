import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background p-8">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">{this.state.error?.message}</p>
            <button
              className="px-4 py-2 text-sm rounded-md bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#/';
              }}
            >
              Return to app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
