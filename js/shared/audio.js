/**
 * X-29 Module: shared/audio.js
 * Web Audio completion chimes and acoustic feedback effects
 */

/**
 * Plays a pleasant two-tone completion chime (D5 -> A5) via Web Audio API.
 */
export function playCompletionChime() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioCtx = new AudioContextClass();

        // First beep: D5 (587.33 Hz)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);

        // Second beep: A5 (880 Hz)
        setTimeout(() => {
            try {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                gain2.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.5);
            } catch (e) {
                console.warn("Second chime tone failed:", e);
            }
        }, 150);
    } catch (e) {
        console.warn("Audio Context failed to play chime:", e);
    }
}

// Global window compatibility bridge
if (typeof window !== 'undefined') {
    window.playCompletionChime = playCompletionChime;
}
