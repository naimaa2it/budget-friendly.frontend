"use client";

import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8 text-center">
          <p className="text-gray-500 text-sm">Something went wrong. Please refresh the page.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-rose-600 underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
