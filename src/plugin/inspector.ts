type Payload = Record<string, unknown>;
export function inspectorMessages(o: {
  isVisible: (context: string) => boolean;
  send: (payload: Payload) => Promise<void>;
  status: () => Payload;
  beginPairing: () => { code: string; expires: number };
  isServerReady: () => boolean;
  log: (code: string) => void;
}) {
  const waiting = new Map<string, { payload: Payload; until: number }>();
  async function deliver(context: string, payload: Payload) {
    if (!o.isVisible(context)) {
      if (waiting.size >= 16) waiting.delete(waiting.keys().next().value!);
      waiting.set(context, { payload, until: Date.now() + 10000 });
      o.log("PI_REPLY_DEFERRED");
      return;
    }
    waiting.delete(context);
    await o.send(payload); o.log("PI_REPLY_SENT");
  }
  return {
    async receive(context: string, value: unknown) {
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      const p = value as Payload;
      if (p.command !== "pair" && p.command !== "status") return;
      const requestId = typeof p.requestId === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(p.requestId) ? p.requestId : undefined;
      o.log(p.command === "pair" ? "PI_PAIR_REQUEST" : "PI_STATUS_REQUEST");
      try {
        if (p.command === "pair") {
          if (!o.isServerReady()) {
            await deliver(context, { requestId, error: "Der lokale PageDeck-Endpunkt ist noch nicht verfügbar. Port 29381 prüfen und Status erneut abrufen." });
            return;
          }
          const result = o.beginPairing();
          await deliver(context, { requestId, pairingCode: result.code, expires: result.expires, ...o.status() });
        } else await deliver(context, { requestId, ...o.status() });
      } catch {
        o.log("PI_COMMAND_FAILED");
        await deliver(context, { requestId, error: "PageDeck konnte die Anfrage nicht verarbeiten. Stream Deck vollständig neu starten und die lokalen Ereigniscodes prüfen." }).catch(() => {});
      }
    },
    async didAppear(context: string) {
      const pending = waiting.get(context); waiting.delete(context);
      await deliver(context, pending && pending.until > Date.now() ? pending.payload : o.status());
    }
  };
}
