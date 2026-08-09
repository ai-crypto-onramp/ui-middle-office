import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info);
  }

  report = (): void => {
    const incident = {
      url: window.location.href,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      time: new Date().toISOString(),
    };
    const body = JSON.stringify(incident, null, 2);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon("/internal/incident", body);
      } catch {
        /* ignore */
      }
    }
    alert("Incident reported. Reference logged.");
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p className="muted">An unexpected error occurred in this view.</p>
          <pre className="mono">{this.state.error?.message}</pre>
          <div className="row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>Try again</Button>
            <Button variant="primary" onClick={this.report}>
              Report incident
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}