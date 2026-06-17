import React from "react";

// Last-resort guard so a render-time crash shows a recoverable message instead
// of a blank white page in production. Most state lives in localStorage, so
// "Reset & reload" clears a poisoned key and almost always recovers the app.
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error("[tickerdle] render crash:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ fontFamily: "Helvetica, Arial, sans-serif", maxWidth: 420, margin: "60px auto", padding: 24, textAlign: "center", color: "#1a1a1b" }}>
        <h1 style={{ fontSize: 22, letterSpacing: "0.06em" }}>TICKERDLE</h1>
        <p style={{ color: "#787c7e", fontSize: 14 }}>Something went wrong loading the game.</p>
        <button
          onClick={() => {
            try {
              Object.keys(localStorage).filter((k) => k.startsWith("tickerdle:")).forEach((k) => localStorage.removeItem(k));
            } catch { /* ignore */ }
            location.reload();
          }}
          style={{ marginTop: 12, padding: "10px 18px", borderRadius: 6, border: "none", background: "#6aaa64", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Reset &amp; reload
        </button>
      </div>
    );
  }
}
