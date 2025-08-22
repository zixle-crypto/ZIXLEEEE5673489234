import { useRef, useCallback } from 'react';

export function useBackgroundMusic() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number>();

  const start = useCallback(() => {
    if (audioCtxRef.current) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.05;
    master.connect(ctx.destination);

    const tempo = 120;
    const beat = 60 / tempo;
    const pattern = [261.63, 329.63, 392.0, 523.25]; // C major arpeggio

    const schedule = (startTime: number) => {
      pattern.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, startTime + i * beat);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * beat + beat * 0.9);

        osc.connect(gain);
        gain.connect(master);

        osc.start(startTime + i * beat);
        osc.stop(startTime + i * beat + beat);
      });

      timeoutRef.current = window.setTimeout(() => {
        schedule(ctx.currentTime);
      }, pattern.length * beat * 1000);
    };

    schedule(ctx.currentTime);
  }, []);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  return { start, stop };
}
