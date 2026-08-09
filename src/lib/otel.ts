import { loadConfig } from "@/config";

type SpanEndFn = () => void;
type Tracer = {
  startSpan: (name: string, attrs?: Record<string, unknown>) => SpanEndFn;
};

const noopTracer: Tracer = {
  startSpan: () => () => {
    /* noop */
  },
};

export let tracer: Tracer = noopTracer;

export function initTracing(): void {
  const config = loadConfig();
  if (!config.otelEndpoint) {
    tracer = noopTracer;
    return;
  }
  tracer = {
    startSpan(name, attrs) {
      const start = performance.now();
      return () => {
        const dur = performance.now() - start;
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const payload = JSON.stringify({ name, attrs, dur, ts: Date.now() });
          try {
            navigator.sendBeacon(`${config.otelEndpoint}/v1/traces`, payload);
          } catch {
            /* ignore */
          }
        }
      };
    },
  };
}

export function trace<T>(name: string, attrs: Record<string, unknown> | undefined, fn: () => T): T {
  const end = tracer.startSpan(name, attrs);
  try {
    return fn();
  } finally {
    end();
  }
}