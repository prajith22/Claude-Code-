// Apple-Pay-style success chime synthesized in Web Audio. Two sine
// notes a perfect fifth apart (A5 → E6), with the second voice coming
// in 70ms after the first so the two ring together for that bright
// "ding-DING" feel. Each note has a quick attack + smooth exponential
// tail; together they read as a single satisfying confirmation.
//
// No assets, no libraries. Safe on iPhone Safari:
//
//  - Lazy AudioContext (created on first call) so we don't violate
//    autoplay policies; the first user-interaction-driven call
//    constructs and unlocks it, every subsequent call reuses it.
//  - webkitAudioContext fallback for older Safari builds.
//  - Resumes a suspended context on each call (iOS keeps it
//    suspended until a user gesture).
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

// Schedule one sine note with a quick 8ms attack and an exponential
// decay to a near-zero floor (exponential ramps can't end at 0).
function scheduleNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  durationSec: number,
  peakGain: number,
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

  osc.connect(gain).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);
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

      // Note 1 — A5 (880 Hz). Hits first, sets the bell tone.
      scheduleNote(ctx, 880, now, 0.45, 0.22);

      // Note 2 — E6 (1318.5 Hz). A perfect fifth above A5, 70ms later
      // so the two voices overlap. The interval is the same one used
      // in Apple Pay's success chime — bright, resolved, friendly.
      scheduleNote(ctx, 1318.5, now + 0.07, 0.5, 0.2);
    } catch {
      // Audio blocked / unsupported — fail silently.
    }
  }, 10);
}
