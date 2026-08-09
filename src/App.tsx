import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppRoutes } from "@/routes";
import { initTracing } from "@/lib/otel";
import { wsClient, type QueueEvent } from "@/lib/websocket";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

initTracing();

function RealtimeToaster() {
  const { toast } = useToast();
  useEffect(() => {
    const unsub = wsClient.subscribe((e: QueueEvent) => {
      if (e.kind === "kyc.new") toast("New KYC application submitted", "info");
      if (e.kind === "alert.new") toast("New AML alert received", "warning");
      if (e.kind === "review.new") toast("New manual review item", "info");
    });
    return unsub;
  }, [toast]);
  return null;
}

export default function App() {
  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <RealtimeToaster />
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}