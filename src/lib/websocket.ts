import { loadConfig } from "@/config";

export type QueueEvent = {
  kind: "kyc.new" | "alert.new" | "review.new";
  id: string;
  payload: Record<string, unknown>;
};

type Listener = (e: QueueEvent) => void;

class WsClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private mockTimer: ReturnType<typeof setInterval> | null = null;

  connect(): void {
    const config = loadConfig();
    if (config.mockMode || !config.websocketUrl) {
      this.startMock();
      return;
    }
    try {
      this.socket = new WebSocket(config.websocketUrl);
      this.socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as QueueEvent;
          this.emit(data);
        } catch {
          /* ignore */
        }
      };
      this.socket.onclose = () => {
        this.timer = setTimeout(() => this.connect(), 5000);
      };
    } catch {
      this.startMock();
    }
  }

  private startMock(): void {
    if (this.mockTimer) return;
    this.mockTimer = setInterval(() => {
      if (Math.random() > 0.75) {
        const kinds: QueueEvent["kind"][] = ["kyc.new", "alert.new"];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        const id = `evt-${Date.now()}`;
        this.emit({ kind, id, payload: { id, ts: Date.now() } });
      }
    }, 12000);
  }

  private emit(e: QueueEvent): void {
    this.listeners.forEach((l) => l(e));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  disconnect(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.mockTimer) clearInterval(this.mockTimer);
    this.socket?.close();
    this.socket = null;
  }
}

export const wsClient = new WsClient();