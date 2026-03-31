/**
 * Audio Feedback Utility
 * Generates simple but pleasant audio feedback for quiz interactions
 * Using Web Audio API to avoid external dependencies
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (audioContext) {
    return audioContext;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("AudioContext not supported in this browser");
  }
  
  audioContext = new AudioContextClass() as AudioContext;
  return audioContext as AudioContext;
}

/**
 * Play a success/correct answer sound
 * Rising tone (2-note progression) to convey positive feedback
 */
export function playCorrect() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Rising arpeggio: C5 (523.25 Hz) then E5 (659.25 Hz)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Silently fail on audio context errors (some browsers restrict audio)
  }
}

/**
 * Play an error/incorrect answer sound
 * Descending tone to convey negative feedback
 */
export function playError() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Descending: A4 (440 Hz) then F4 (349.23 Hz)
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(349.23, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Silently fail on audio context errors
  }
}

/**
 * Play session completion sound
 * Ascending major chord to convey achievement
 */
export function playCompletion() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play C-E-G chord (major chord)
    const notes = [261.63, 329.63, 392.0]; // C4, E4, G4

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.start(now + idx * 0.05);
      osc.stop(now + 0.6);
    });
  } catch {
    // Silently fail on audio context errors
  }
}

/**
 * Play a brief skip/cancel sound
 * Short, neutral tone
 */
export function playSkip() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Silently fail on audio context errors
  }
}
