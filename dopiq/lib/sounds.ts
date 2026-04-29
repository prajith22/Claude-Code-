// Tiny Web Audio "ding" used at success moments throughout the app.
// No external assets, no libraries — a 1kHz sine with an exponential
// gain decay over 300ms. Implemented to be safe on iPhone Safari:
//
//  - Lazy AudioContext (created on first call) so we don't violate
//    autoplay policies; the first user-interaction-driven call
//    constructs and unlocks it, every subsequent call reuses it.
//  - webkitAudioContext fallback for older iOS Safari builds.
//  - Wrapped in try/catch and a no-op on the server / when audio is
//    blocked, so the app never throws because of a sound.

type AudioContextCtor = typeof AudioContext;

let _ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const w = window as Window & { webkitAudioContext?: AudioContextCtor };
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
    return _ctx;
  } catch {
    return null;
  }
}

export function playDing(): void {
  if (typeof window === "undefined") return;
  // 10ms delay so the audio doesn't fight a UI animation kicking off
  // on the same frame.
  window.setTimeout(() => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      // iOS Safari leaves the context suspended until a user gesture
      // unlocks it — playDing is always called from a click / tap
      // handler chain, so resume() is safe here.
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, now);

      const gain = ctx.createGain();
      // Exponential ramps can't end at 0, so we land at a tiny floor
      // — inaudible, no clip, smooth bell-like decay.
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch {
      // Audio blocked / unsupported — fail silently.
    }
  }, 10);
}
