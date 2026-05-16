import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Chunk load errors happen when a new deployment changes filenames and the
    // user still has the old version loaded. Reload silently to get the new build.
    const isChunkError =
      error?.name === "ChunkLoadError" ||
      /loading chunk \d+ failed/i.test(error?.message) ||
      /failed to fetch dynamically imported module/i.test(error?.message) ||
      /importing a module script failed/i.test(error?.message);

    if (isChunkError) {
      window.location.reload();
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-md text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-300 mb-6">
              An unexpected error occurred. Don't worry, we're on it!
            </p>
            <details className="mb-6 text-left bg-gray-700 p-3 rounded text-sm text-gray-300">
              <summary className="cursor-pointer font-semibold text-gray-200">
                Error Details
              </summary>
              <pre className="mt-2 overflow-auto text-xs">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
