"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class BrandErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Brand screen error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <p className="text-xl font-semibold">Something went wrong.</p>
            <p className="text-sm text-zinc-400">Please refresh to reload the brand experience.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
