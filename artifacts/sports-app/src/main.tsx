import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message + "\n" + e.stack };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: "#1a1a2e", color: "#ff6b6b", fontFamily: "monospace", minHeight: "100vh" }}>
          <h2 style={{ color: "#ff6b6b" }}>App Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
