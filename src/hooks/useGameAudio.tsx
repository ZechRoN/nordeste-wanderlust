import { useRef, useCallback, useEffect } from 'react';

// Procedural audio using Web Audio API — no external files needed
const audioCtxRef = { current: null as AudioContext | null };

function getCtx(): AudioContext {
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
  if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  return audioCtxRef.current;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.12) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain).connect(ctx.destination);
  source.start();
}

// Sound effect library
export const SFX = {
  menuClick: () => playTone(800, 0.08, 'square', 0.06),
  menuHover: () => playTone(600, 0.05, 'sine', 0.03),
  attack: () => {
    playNoise(0.15, 0.1);
    playTone(200, 0.12, 'sawtooth', 0.08);
  },
  hit: () => {
    playNoise(0.1, 0.12);
    playTone(150, 0.15, 'square', 0.06);
  },
  critical: () => {
    playTone(400, 0.08, 'square', 0.1);
    setTimeout(() => playTone(600, 0.1, 'square', 0.1), 80);
    setTimeout(() => playTone(800, 0.15, 'sawtooth', 0.08), 160);
  },
  miss: () => playTone(200, 0.2, 'sine', 0.04),
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.3, 'square', 0.08), i * 120)
    );
  },
  defeat: () => {
    [400, 350, 300, 200].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.4, 'sawtooth', 0.06), i * 200)
    );
  },
  levelUp: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.25, 'square', 0.07), i * 100)
    );
  },
  itemPickup: () => {
    playTone(1200, 0.06, 'square', 0.05);
    setTimeout(() => playTone(1600, 0.08, 'square', 0.05), 60);
  },
  gold: () => {
    playTone(1400, 0.05, 'sine', 0.06);
    setTimeout(() => playTone(1800, 0.08, 'sine', 0.06), 50);
  },
  error: () => playTone(150, 0.3, 'sawtooth', 0.06),
  heal: () => {
    [400, 500, 600, 800].forEach((f, i) =>
      setTimeout(() => playTone(f, 0.15, 'sine', 0.05), i * 80)
    );
  },
  openPanel: () => {
    playTone(300, 0.05, 'square', 0.04);
    setTimeout(() => playTone(500, 0.08, 'square', 0.04), 40);
  },
  closePanel: () => {
    playTone(500, 0.05, 'square', 0.04);
    setTimeout(() => playTone(300, 0.08, 'square', 0.04), 40);
  },
  chatMessage: () => playTone(1000, 0.06, 'sine', 0.04),
};

// Biome ambient music
const BIOME_MUSIC: Record<string, { notes: number[]; tempo: number; type: OscillatorType }> = {
  caatinga: { notes: [262, 294, 330, 294, 262, 220, 262, 294], tempo: 600, type: 'sine' },
  agreste: { notes: [330, 370, 415, 370, 330, 294, 262, 294], tempo: 500, type: 'triangle' },
  litoral: { notes: [392, 440, 494, 523, 494, 440, 392, 349], tempo: 700, type: 'sine' },
  santa_cruz: { notes: [262, 311, 370, 311, 262, 233, 262, 311], tempo: 550, type: 'triangle' },
};

export function useBackgroundMusic(biome: string, enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIdxRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const music = BIOME_MUSIC[biome] || BIOME_MUSIC.caatinga;
    noteIdxRef.current = 0;

    intervalRef.current = setInterval(() => {
      const note = music.notes[noteIdxRef.current % music.notes.length];
      playTone(note, 0.4, music.type, 0.02);
      noteIdxRef.current++;
    }, music.tempo);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [biome, enabled]);
}

export function useGameAudio() {
  return SFX;
}
