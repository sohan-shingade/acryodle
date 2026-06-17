import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { validatePuzzles } from "./data/puzzles";
import "./index.css";

if (import.meta.env.DEV) {
  const errors = validatePuzzles();
  if (errors.length) console.error("[tickerdle] puzzle data problems:\n" + errors.join("\n"));
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
