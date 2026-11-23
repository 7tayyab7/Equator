/** Wheel momentum is suppressed for one transition, never until pointer movement. */
export class CampaignWheelGesture {
  private lastTime = -Infinity;
  private lastDelta = 0;
  private total = 0;
  private acceptedAt = -Infinity;
  private direction = 0;

  reset() { this.lastTime = -Infinity; this.lastDelta = 0; this.total = 0; this.acceptedAt = -Infinity; this.direction = 0; }

  accept(delta: number, now: number, animating: boolean): boolean {
    if (!Number.isFinite(delta) || delta === 0) return false;
    const direction = Math.sign(delta);
    const quiet = now - this.lastTime > 160;
    const reversed = direction !== this.direction;
    const magnitude = Math.abs(delta);
    const renewedImpulse = magnitude >= 12 && magnitude >= this.lastDelta * .9;
    const sinceAccepted = now - this.acceptedAt;
    this.lastTime = now;
    this.lastDelta = magnitude;
    this.direction = direction;
    if (animating) { this.total = 0; return false; }
    // Descending momentum cannot open another slide. Steady wheel ticks and a
    // reversal can start a new transition once the previous animation settles.
    if (!quiet && !reversed && sinceAccepted < 1040) return false;
    if (!quiet && !reversed && !renewedImpulse && sinceAccepted < 2000) return false;
    if (quiet || reversed) this.total = 0;
    this.total += delta;
    if (Math.abs(this.total) < 12) return false;
    this.acceptedAt = now;
    this.total = 0;
    return true;
  }
}
