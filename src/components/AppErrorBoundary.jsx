import { Component } from "react";

/**
 * Catches render/lifecycle errors in the main signed-in tree so a single throw
 * does not blank the entire document (white screen).
 */
export class AppErrorBoundary extends Component {
  /** @type {{ error: Error | null, componentStack: string | null }} */
  state = { error: null, componentStack: null };

  /** @param {Error} error */
  static getDerivedStateFromError(error) {
    return { error, componentStack: null };
  }

  /** @param {Error} error @param {import("react").ErrorInfo} errorInfo */
  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("[AppErrorBoundary]", error, errorInfo);
    }
    const stack = typeof errorInfo?.componentStack === "string" ? errorInfo.componentStack : null;
    this.setState({ componentStack: stack });
  }

  render() {
    if (this.state.error) {
      const err = this.state.error;
      const msg = typeof err?.message === "string" && err.message.trim() ? err.message.trim() : null;
      const stackRaw = typeof this.state.componentStack === "string" ? this.state.componentStack : "";
      const stackLines = stackRaw.split(/\r?\n/).filter((l) => l.trim());
      const stackPreview = stackLines.length ? stackLines.slice(0, 4).join("\n") : null;

      return (
        <div
          className="mono"
          style={{
            minHeight: "100vh",
            boxSizing: "border-box",
            padding: 24,
            background: "#07090e",
            color: "#8fa5bf",
            fontSize: 13,
            lineHeight: 1.55,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div style={{ color: "#f59e0b", marginBottom: 12, letterSpacing: "0.06em" }}>Something went wrong</div>
          {msg ? (
            <div
              style={{
                fontSize: 12,
                color: "#fb923c",
                marginBottom: 10,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg}
            </div>
          ) : null}
          {stackPreview ? (
            <div
              style={{
                fontSize: 11,
                color: "#6b7c8f",
                marginBottom: 16,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.45,
              }}
            >
              {stackPreview}
            </div>
          ) : null}
          <div style={{ marginBottom: 16 }}>
            The app hit an unexpected error. Try refreshing the page. If this keeps happening, contact support with
            your account email.
          </div>
          <button
            type="button"
            className="btn-teal"
            style={{ fontSize: 13, padding: "8px 14px" }}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
