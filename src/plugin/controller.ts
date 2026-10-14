import type { Profile } from "../shared/config";
export type Device = { id: string; name: string; type: number; size: { columns: number; rows: number }; isConnected: boolean };
export type Intent = { focused: boolean; target: string | null; keep: boolean; paused: boolean; deviceIds: string[] };
export type Result = { deviceId: string; profile: string | null; state: string };
export class Controller {
  private intent: Intent = { focused: false, target: null, keep: false, paused: false, deviceIds: [] };
  private active = new Map<string, string>();
  private pending = false;
  private running?: Promise<void>;
  private paused = false;
  results: Result[] = [];
  constructor(private profiles: Profile[], private devices: () => Device[], private send: (id: string, profile?: string) => Promise<void>) {}
  get isPaused() { return this.paused; }
  async setPaused(value: boolean) { this.paused = value; await this.reconcile(); }
  async update(intent: Intent) { this.intent = intent; await this.reconcile(); }
  disconnect(id: string) { this.active.delete(id); }
  async expire() { await this.update({ ...this.intent, focused: false }); }
  async reconcile(): Promise<void> {
    this.pending = true;
    if (!this.running) this.running = this.drain().finally(() => { this.running = undefined; });
    await this.running;
  }
  private async drain() {
    while (this.pending) {
      this.pending = false;
      const snapshot = this.intent;
      const results: Result[] = [];
      for (const d of this.devices()) {
        if (!d.isConnected) continue;
        if (snapshot !== this.intent || this.pending) { this.pending = true; break; }
        const enabled = snapshot.focused && !snapshot.paused && !this.paused && (!snapshot.deviceIds.length || snapshot.deviceIds.includes(d.id));
        let profile: Profile | undefined;
        if (enabled && snapshot.target) profile = this.profiles.find(p => p.key === snapshot.target && p.deviceType === d.type);
        const current = this.active.get(d.id);
        const desired = enabled && snapshot.keep ? current : profile?.name;
        if (desired === current) {
          results.push({ deviceId: d.id, profile: desired ?? null, state: enabled && snapshot.target && !profile ? "profile-missing" : desired ? "command-sent" : "released" }); continue;
        }
        try {
          // Never nest managed overrides: close the old one before opening a new one.
          if (current) { await this.send(d.id); this.active.delete(d.id); }
          if (snapshot !== this.intent || this.pending || this.paused) { this.pending = true; break; }
          if (desired) { await this.send(d.id, desired); this.active.set(d.id, desired); }
          results.push({ deviceId: d.id, profile: desired ?? null, state: desired ? "command-sent" : enabled && snapshot.target && !profile ? "profile-missing" : "released" });
        } catch { results.push({ deviceId: d.id, profile: this.active.get(d.id) ?? null, state: "sdk-error" }); }
      }
      this.results = results;
    }
  }
}
