"use client";

// Web Audio API synthesized sounds (Works offline on all mobile & desktop browsers)
export function playCustomerSuccessSound() {
  try {
    if (typeof window === "undefined") return;

    // Mobile haptic vibration feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Melodic 4-note celebration chime (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },
      { freq: 659.25, time: 0.12, duration: 0.15 },
      { freq: 783.99, time: 0.24, duration: 0.2 },
      { freq: 1046.50, time: 0.38, duration: 0.5 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch (e) {
    console.warn("Customer sound warning:", e);
  }
}

export function playKitchenAlertBell() {
  try {
    if (typeof window === "undefined") return;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 250]);
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Double Ding-Dong Counter Bell
    const notes = [
      { freq: 880, time: 0, duration: 0.35 },
      { freq: 1174.66, time: 0.22, duration: 0.6 },
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    });
  } catch (e) {
    console.warn("Kitchen bell warning:", e);
  }
}
