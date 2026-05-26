import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "SENTRY_DSN_HERE",
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
  });
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<p>An unexpected error occurred. Please refresh the page.</p>}>
    <App />
    <Analytics />
    <SpeedInsights />
  </Sentry.ErrorBoundary>
);
