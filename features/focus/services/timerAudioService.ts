/**
 * X-29 Timer Audio Service (features/focus/services/timerAudioService.ts)
 * 
 * Provides completion chime feedback via Web Audio API.
 * Synthesizes two-tone harmonic bell (D5 -> A5) without requiring external MP3/WAV assets.
 * Respects browser autoplay policies and handles context suspension safely.
 */

let audioCtx: AudioContext | null = null;
let lastChimePlayedAt = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      audioCtx = new AudioContextClass();
    } catch (e) {
      console.warn('[TimerAudio] Failed to initialize AudioContext:', e);
      return null;
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch((err) => {
      console.warn('[TimerAudio] AudioContext resume was blocked by browser policy:', err);
    });
  }

  return audioCtx;
}

/**
 * Plays a pleasant two-tone completion chime (D5: 587.33 Hz -> A5: 880 Hz).
 * Guaranteed non-throwing, idempotent with 1.5s cooldown.
 */
export function playCompletionChime(): void {
  const now = Date.now();
  if (now - lastChimePlayedAt < 1500) {
    return; // Prevent duplicate rapid plays
  }
  lastChimePlayedAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // First tone: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);

    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.45);

    // Second tone: A5 (880 Hz) after 150ms
    setTimeout(() => {
      try {
        if (!audioCtx || audioCtx.state === 'closed') return;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);

        gain2.gain.setValueAtTime(0, audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);

        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.55);
      } catch (err) {
        console.warn('[TimerAudio] Second tone play failed:', err);
      }
    }, 150);
  } catch (err) {
    console.warn('[TimerAudio] Play chime failed:', err);
  }
}
